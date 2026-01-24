#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- Konfigurasi ---
const char* ssid = "topglobalgatot";
const char* password = "123456789";

// Ganti IP dengan IP Laptop/Server Anda (Port Next.js biasanya 3000, sesuaikan jika perlu)
// Route: src/app/api/eggs/increment/route.ts
const char* server_url = "http://192.168.1.9:3000/api/eggs/increment";
const char* apiKey = "esp32-egg-counter-key";

// Pin Sensor Ultrasonik
#define trigPin 14
#define echoPin 27

// Pengaturan Logika Sensor
const float thresholdDistanceCm = 3.0;
const float resetDistanceCm = 7.0;
bool objectCurrentlyPresent = false;

// Variabel Penghitung (Counter Lokal)
unsigned long eggCount = 0;

// Timer untuk Serial Monitor (Debug)
unsigned long lastPrintTime = 0;
const long printInterval = 500;

// --- Fungsi ---

float getDistance() {
digitalWrite(trigPin, LOW);
delayMicroseconds(2);
digitalWrite(trigPin, HIGH);
delayMicroseconds(10);
digitalWrite(trigPin, LOW);

long duration = pulseIn(echoPin, HIGH, 30000);
if (duration > 0) {
return (duration \* 0.0343) / 2.0;
} else {
return 999.9;
}
}

void sendIncrementRequest() {
if (WiFi.status() == WL_CONNECTED) {
HTTPClient http;

    // Mulai koneksi ke URL API
    http.begin(server_url);

    // Set Header
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", apiKey);

    // Buat data JSON
    String requestBody = "{\"increment\":1}";

    // Kirim POST Request
    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.printf("[HTTP] Sukses (%d): %s\n", httpResponseCode, response.c_str());
    } else {
      Serial.printf("[HTTP] Error: %s\n", http.errorToString(httpResponseCode).c_str());
    }

    http.end(); // Akhiri koneksi

} else {
Serial.println("[HTTP] WiFi Disconnected");
}
}

void setup() {
Serial.begin(115200);
delay(1000);
Serial.println("\n--- Sistem Penghitung Telur (HTTP) Dimulai ---");

pinMode(trigPin, OUTPUT);
pinMode(echoPin, INPUT);

WiFi.begin(ssid, password);
Serial.print("Menghubungkan ke WiFi");
while (WiFi.status() != WL_CONNECTED) {
delay(500);
Serial.print(".");
}
Serial.println("\n[WiFi] Terhubung!");
Serial.print("[WiFi] IP ESP32: ");
Serial.println(WiFi.localIP());

Serial.println("--- Siap Mendeteksi Objek ---");
}

void loop() {
float distance = getDistance();

// --- Tampilkan Status Periodik ---
if (millis() - lastPrintTime >= printInterval) {
Serial.print("Jarak: ");
Serial.print(distance);
Serial.print(" cm | Total Terhitung: ");
Serial.println(eggCount);
lastPrintTime = millis();
}

// --- Logika Hysteresis & Penghitungan ---
if (distance < thresholdDistanceCm && !objectCurrentlyPresent) {
// Objek baru terdeteksi
objectCurrentlyPresent = true;
eggCount++; // Tambah counter lokal

    Serial.println("\n>>> EVENT: Telur Terdeteksi!");
    Serial.printf(">>> Total Saat Ini: %lu\n", eggCount);

    // Kirim data ke server via HTTP
    sendIncrementRequest();

}
else if (distance > resetDistanceCm && objectCurrentlyPresent) {
// Objek sudah lewat
objectCurrentlyPresent = false;
Serial.println(">>> EVENT: Sensor Bebas. Siap hitung lagi.\n");
}

delay(50);
}
