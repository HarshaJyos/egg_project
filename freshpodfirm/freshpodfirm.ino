#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// ==========================================
// CONFIGURATION
// ==========================================
#define WIFI_SSID     "Freshpod"
#define WIFI_PASSWORD "passw0rd"

// API Endpoint
#define API_URL "https://www.hanish.coreblock.in/api/payment-status"

// Relay Configuration (5 relays, pin 19 removed)
#define RELAY1  13
#define RELAY2  12
#define RELAY3   2
#define RELAY4   4
#define RELAY5  18

#define NUM_RELAYS       5
#define RELAY_ON_TIME_MS 15000  // 15 seconds active state (unlocked)

const int relayPins[NUM_RELAYS] = { RELAY1, RELAY2, RELAY3, RELAY4, RELAY5 };

WiFiClientSecure secureClient;
Preferences preferences;
int currentRelayIndex = 0;  // Tracks which relay to trigger next (0-4)

void connectWiFi();
void resetPaymentStatus();
void loadRelayIndex();
void saveRelayIndex();

void setup() {
  Serial.begin(115200);
  delay(10);
  Serial.println("\n--- Freshpod ESP32 Firmware Starting ---");

  // Configure all relay pins as OUTPUT and set LOW
  for (int i = 0; i < NUM_RELAYS; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], LOW);
  }
  Serial.println("All 5 relay pins configured and OFF.");

  // Load last used relay index from flash memory
  loadRelayIndex();
  Serial.print("Next relay to trigger: Relay ");
  Serial.print(currentRelayIndex + 1);
  Serial.print(" (Pin ");
  Serial.print(relayPins[currentRelayIndex]);
  Serial.println(")");

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
    if (retryCount > 60) {
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
          int pin = relayPins[currentRelayIndex];

          Serial.print("[ALERT] Payment Success! Activating Relay ");
          Serial.print(currentRelayIndex + 1);
          Serial.print(" (Pin ");
          Serial.print(pin);
          Serial.println(")");

          // 1. Turn the current relay ON
          digitalWrite(pin, HIGH);

          // 2. Instantly reset API status to completed so it doesn't trigger multiple times
          resetPaymentStatus();

          // 3. Keep the relay on for 15 seconds, then turn off
          delay(RELAY_ON_TIME_MS);
          digitalWrite(pin, LOW);

          Serial.print("Relay ");
          Serial.print(currentRelayIndex + 1);
          Serial.println(" deactivated. Lock closed.");

          // 4. Advance to the next relay (round-robin: 0→1→2→3→4→0→...)
          currentRelayIndex = (currentRelayIndex + 1) % NUM_RELAYS;
          saveRelayIndex();

          Serial.print("Next payment will trigger Relay ");
          Serial.print(currentRelayIndex + 1);
          Serial.print(" (Pin ");
          Serial.print(relayPins[currentRelayIndex]);
          Serial.println(")");
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
  String resetUrl = String(API_URL) + "?action=set&status=completed";
  Serial.print("Resetting status to completed: ");
  Serial.println(resetUrl);

  if (http.begin(secureClient, resetUrl)) {
    int httpResponseCode = http.GET();
    if (httpResponseCode == 200) {
      Serial.println("Payment status reset to completed successfully.");
    } else {
      Serial.print("Failed to reset payment status, response code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("HTTP connection failed during status reset.");
  }
}

// ==========================================
// PERSISTENT RELAY INDEX (survives reboot)
// Uses ESP32 Preferences (NVS flash storage)
// ==========================================
void loadRelayIndex() {
  preferences.begin("freshpod", true);  // read-only
  currentRelayIndex = preferences.getInt("relayIdx", 0);
  preferences.end();

  // Safety: clamp to valid range
  if (currentRelayIndex < 0 || currentRelayIndex >= NUM_RELAYS) {
    currentRelayIndex = 0;
  }
}

void saveRelayIndex() {
  preferences.begin("freshpod", false);  // read-write
  preferences.putInt("relayIdx", currentRelayIndex);
  preferences.end();
}
