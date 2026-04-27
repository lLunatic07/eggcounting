#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- Konfigurasi ---
const char* ssid = "Waysw";
const char* password = "";
const char* server_url = "http://54.206.87.159:3000/api/eggs/increment";
const char* apiKey = "esp32-egg-counter-key";

// Pin
#define trigPin 14
#define echoPin 27
#define buzzerPin 17

// Pengaturan Sensor
const float thresholdDistanceCm = 3.0;

// ✅ Edge detection dengan debounce terpisah untuk masuk & keluar
// - presentConfirm: berapa pembacaan berturut-turut "ada objek" untuk konfirmasi masuk
// - absentConfirm: berapa pembacaan berturut-turut "tidak ada objek" untuk konfirmasi keluar
// absentConfirm rendah = lebih sensitif mendeteksi celah kecil antara 2 telur
const int presentConfirm = 2;
const int absentConfirm = 2;

int presentCount = 0;       // counter pembacaan "ada objek" berturut-turut
int absentCount = 0;        // counter pembacaan "tidak ada objek" berturut-turut
bool confirmedPresent = false;  // status terkonfirmasi

// Penghitung
volatile unsigned long eggCount = 0;
volatile unsigned long lastSentCount = 0;  // track jumlah yang sudah berhasil dikirim server

// Timer Serial Monitor
unsigned long lastPrintTime = 0;
const long printInterval = 500;

// Mutex
portMUX_TYPE mux = portMUX_INITIALIZER_UNLOCKED;

// --- Fungsi ---
float getDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration > 0) {
    return (duration * 0.0343) / 2.0;
  } else {
    return 999.9;
  }
}

void buzzerAlert() {
  Serial.println(">>> BUZZER: Kelipatan 60 tercapai!");
  for (int i = 0; i < 5; i++) {
    digitalWrite(buzzerPin, HIGH);
    delay(200);
    digitalWrite(buzzerPin, LOW);
    delay(150);
  }
}

bool sendCountUpdate() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi Disconnected, akan retry...");
    return false;
  }

  portENTER_CRITICAL(&mux);
  unsigned long currentEgg = eggCount;
  unsigned long lastSent = lastSentCount;
  portEXIT_CRITICAL(&mux);

  unsigned long diff = currentEgg - lastSent;
  if (diff == 0) return true;

  HTTPClient http;
  http.begin(server_url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);
  http.setTimeout(5000);

  // ✅ Kirim totalCount absolut — server hitung selisih sendiri
  // Retry berapa kali pun, server tidak akan double count
  String requestBody = "{\"totalCount\":" + String(currentEgg) + "}";
  Serial.printf("[HTTP] Mengirim totalCount: %lu (belum terkirim: %lu)\n", currentEgg, diff);

  int httpResponseCode = http.POST(requestBody);
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Sukses (%d): %s\n", httpResponseCode, response.c_str());
    http.end();

    // Update lastSentCount hanya setelah server konfirmasi
    portENTER_CRITICAL(&mux);
    lastSentCount = currentEgg;
    portEXIT_CRITICAL(&mux);

    return true;
  } else {
    Serial.printf("[HTTP] Gagal: %s — akan retry...\n", http.errorToString(httpResponseCode).c_str());
    http.end();
    return false;
  }
}

// HTTP berjalan di Core 0 dengan retry otomatis
void httpTask(void* parameter) {
  for (;;) {
    portENTER_CRITICAL(&mux);
    unsigned long currentEgg = eggCount;
    unsigned long lastSent = lastSentCount;
    portEXIT_CRITICAL(&mux);

    if (currentEgg > lastSent) {
      bool success = sendCountUpdate();
      if (!success) {
        delay(2000); // tunggu lalu retry
      } else {
        delay(100);
      }
    } else {
      delay(100);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- Sistem Penghitung Telur Dimulai ---");

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);

  WiFi.begin(ssid, password);
  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Terhubung!");
  Serial.print("[WiFi] IP ESP32: ");
  Serial.println(WiFi.localIP());

  xTaskCreatePinnedToCore(httpTask, "HTTPTask", 8192, NULL, 1, NULL, 0);
  Serial.println("--- Siap Mendeteksi Telur ---");
}

void loop() {
  float distance = getDistance();
  unsigned long now = millis();

  // Status periodik
  if (now - lastPrintTime >= printInterval) {
    portENTER_CRITICAL(&mux);
    unsigned long lastSent = lastSentCount;
    portEXIT_CRITICAL(&mux);

    Serial.print("Jarak: ");
    Serial.print(distance);
    Serial.print(" cm | Terdeteksi: ");
    Serial.print(eggCount);
    Serial.print(" | Belum terkirim: ");
    Serial.println(eggCount - lastSent);
    lastPrintTime = now;
  }

  // ✅ Edge Detection dengan debounce asimetris
  //
  // CARA KERJA:
  // - Sensor baca jarak setiap 20ms (~50x/detik)
  // - Kalau jarak < 3cm → "ada objek"
  // - Butuh 2 pembacaan berturut-turut "ada" untuk konfirmasi MASUK (cegah noise)
  // - Butuh 2 pembacaan berturut-turut "tidak ada" untuk konfirmasi KELUAR (deteksi celah)
  //
  // SKENARIO 1: Objek DIAM di depan sensor
  //   → Semua pembacaan < 3cm, tidak pernah ada pembacaan "tidak ada"
  //   → confirmedPresent tetap true, tidak pernah reset
  //   → Hanya 1 hitungan ✅
  //
  // SKENARIO 2: 2 telur berdekatan (celah 3cm)
  //   → Telur 1 lewat: pembacaan < 3cm → confirmedPresent = true → hitung 1
  //   → Celah: pembacaan > 3cm selama ~2-15 pembacaan → confirmedPresent = false (reset)
  //   → Telur 2 lewat: pembacaan < 3cm → confirmedPresent = true lagi → hitung 2 ✅

  bool objectNow = (distance < thresholdDistanceCm);

  if (objectNow) {
    presentCount++;
    absentCount = 0;
  } else {
    absentCount++;
    presentCount = 0;
  }

  bool wasConfirmedPresent = confirmedPresent;

  if (presentCount >= presentConfirm) {
    confirmedPresent = true;
  }
  if (absentCount >= absentConfirm) {
    confirmedPresent = false;
  }

  // Hitung hanya saat TRANSISI: false → true (objek baru masuk)
  if (confirmedPresent && !wasConfirmedPresent) {
    eggCount++;
    Serial.printf("\n>>> Telur Terdeteksi! Total: %lu\n", eggCount);

    if (eggCount % 60 == 0) {
      buzzerAlert();
    }
  }

  delay(20);
}
