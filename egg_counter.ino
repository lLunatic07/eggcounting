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

// Pengaturan Sensor — HYSTERESIS
const float enterThreshold = 3.0;  // objek terdeteksi kalau < 3cm
const float exitThreshold = 4.5;   // objek dianggap pergi kalau > 4.5cm

// Edge detection
const int presentConfirm = 1;   // 1: LANGSUNG deteksi seperti kode lama
const int absentConfirm = 10;   // 10: butuh ~200ms tidak ada objek untuk reset (cegah double count karena noise)

int presentCount = 0;
int absentCount = 0;
bool confirmedPresent = false;

// Penghitung
volatile unsigned long eggCount = 0;
volatile unsigned long lastSentCount = 0;

// Timer Serial Monitor
unsigned long lastPrintTime = 0;
const long printInterval = 500;

// Mutex
portMUX_TYPE mux = portMUX_INITIALIZER_UNLOCKED;

// --- Fungsi ---

// Pembacaan jarak langsung (cepat, seperti kode lama)
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
    return -1.0;  // timeout
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

  // ✅ Kirim totalCount absolut — retry-safe
  String requestBody = "{\"totalCount\":" + String(currentEgg) + "}";
  Serial.printf("[HTTP] Mengirim totalCount: %lu (belum terkirim: %lu)\n", currentEgg, diff);

  int httpResponseCode = http.POST(requestBody);
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Sukses (%d): %s\n", httpResponseCode, response.c_str());
    http.end();

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
        delay(2000);
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

  // Abaikan pembacaan timeout
  if (distance < 0) {
    delay(20);
    return;
  }

  // ✅ HYSTERESIS + MEDIAN FILTER Edge Detection
  //
  // 1. Median filter sudah menghilangkan spike noise dari sensor
  //    [2.1, 2.0, 12.5, 2.2, 2.0] → median = 2.1 (bukan 12.5)
  //
  // 2. Hysteresis mencegah bouncing di batas threshold
  //    MASUK: < 3cm | KELUAR: > 4.5cm | Zona mati: 3-4.5cm
  //
  // 3. Edge detection: hanya hitung saat transisi absent → present
  //
  // Kombinasi ketiganya:
  //   Objek diam 2cm → median selalu ~2cm → tidak pernah > 4.5cm → 1 hitungan ✅
  //   2 telur dekat → celah nyata terlihat di median → > 4.5cm → reset → 2 hitungan ✅

  bool isPresent = (distance < enterThreshold);
  bool isAbsent = (distance > exitThreshold);

  if (isPresent) {
    presentCount++;
    absentCount = 0;
  } else if (isAbsent) {
    absentCount++;
    presentCount = 0;
  }
  // zona mati (3-4.5cm): tidak mengubah state

  bool wasConfirmedPresent = confirmedPresent;

  if (presentCount >= presentConfirm) {
    confirmedPresent = true;
  }
  if (absentCount >= absentConfirm) {
    confirmedPresent = false;
  }

  // Hitung hanya saat TRANSISI: false → true
  if (confirmedPresent && !wasConfirmedPresent) {
    eggCount++;
    Serial.printf("\n>>> Telur Terdeteksi! Total: %lu\n", eggCount);

    if (eggCount % 60 == 0) {
      buzzerAlert();
    }
  }

  delay(20);
}
