#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// ==========================================
// CONFIGURATION
// ==========================================
#define WIFI_SSID "Freshpod"
#define WIFI_PASSWORD "passw0rd"

// API Endpoint on the frontend domain
#define API_URL "https://www.hanish.coreblock.in/api/payment-status"

// Relay Configuration
#define RELAY_PIN 13           // Pin 13 has to turn on (Door Lock)
#define RELAY_ON_TIME_MS 15000 // 15 seconds active state (unlocked)

WiFiClientSecure secureClient;

void connectWiFi();
void resetPaymentStatus();

void setup() {
  Serial.begin(115200);
  delay(10);
  Serial.println("\n--- Freshpod ESP32 Firmware Starting ---");

  // Configure Relay Pin
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Start with relay off (lock closed)

  // Initialize WiFi connection
  connectWiFi();

  // Allow secure client without certificate validation
  secureClient.setInsecure();
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retryCount = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    retryCount++;
    if (retryCount > 60) { // Retry/reconnect every 30 seconds
      Serial.println("\nConnection timeout, retrying...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      retryCount = 0;
    }
  }
  Serial.println("\nWiFi connected successfully.");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Ensure WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Poll payment status API
  HTTPClient http;
  if (http.begin(secureClient, API_URL)) {
    Serial.println("Polling payment status...");
    int httpResponseCode = http.GET();

    if (httpResponseCode == 200) {
      String response = http.getString();
      Serial.print("Response: ");
      Serial.println(response);

      // Parse JSON response: {"status":"success"}
      StaticJsonDocument<256> doc;
      DeserializationError error = deserializeJson(doc, response);

      if (!error) {
        const char* status = doc["status"];
        if (status && (strcasecmp(status, "success") == 0 || strcasecmp(status, "SUCCESS") == 0)) {
          Serial.println("[ALERT] Payment Success detected! Activating Relay 13...");

          // 1. Turn relay 13 ON (Open the door/lock)
          digitalWrite(RELAY_PIN, HIGH);

          // 2. Instantly reset API status to fail so it doesn't trigger multiple times
          resetPaymentStatus();

          // 3. Keep the relay on for 15 seconds to let the user open it, then turn it off
          delay(RELAY_ON_TIME_MS);
          digitalWrite(RELAY_PIN, LOW);
          Serial.println("Relay 13 deactivated. Lock closed.");
        }
      } else {
        Serial.print("JSON Deserialization failed: ");
        Serial.println(error.c_str());
      }
    } else {
      Serial.print("HTTP GET failed, response code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("HTTP connection failed.");
  }

  // Poll status every 2 seconds
  delay(2000);
}

void resetPaymentStatus() {
  HTTPClient http;
  String resetUrl = String(API_URL) + "?action=set&status=fail";
  Serial.print("Resetting status to fail: ");
  Serial.println(resetUrl);

  if (http.begin(secureClient, resetUrl)) {
    int httpResponseCode = http.GET();
    if (httpResponseCode == 200) {
      Serial.println("Payment status reset to fail successfully.");
    } else {
      Serial.print("Failed to reset payment status, response code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("HTTP connection failed during status reset.");
  }
}
