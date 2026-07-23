/*
 * ======================================================================================
 * SENTRY HOME SECURITY SYSTEM - ESP32 CENTRAL GATEWAY (ESP-NOW ➔ MQTT BRIDGE)
 * ======================================================================================
 * Hardware Requirements:
 * - ESP32 Development Board
 * - WiFi Access Point with Internet Access
 * - MQTT Broker (Default: broker.hivemq.com:1883)
 *
 * Required Libraries (Arduino Library Manager):
 * - PubSubClient by Nick O'Leary
 * - ArduinoJson by Benoit Blanchon (v6 or v7)
 *
 * Description:
 * Receives ESP-NOW packets from local sensor nodes, measures RSSI signal strength,
 * constructs JSON telemetry payload, and publishes to MQTT topic 'sentry-home/telemetry'.
 * ======================================================================================
 */

#include <WiFi.h>
#include <esp_now.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WIFI & MQTT CREDENTIALS
const char* WIFI_SSID           = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD       = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER         = "broker.hivemq.com";
const int   MQTT_PORT           = 1883;
const char* MQTT_TELEMETRY_TOPIC = "sentry-home/telemetry";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// TELEMETRY PACKET STRUCT MATCHING SENSOR NODES
typedef struct __attribute__((packed)) {
  char sensorChipId[24];   // Unique Sensor Chip ID
  char sensorState[16];    // "OPEN", "CLOSED", "MOTION_ALERT", "ALARM"
  float battery;           // Measured Battery Voltage (Volts)
  uint32_t messageId;      // Packet Counter
} TelemetryPacket;

// Unique Gateway Chip ID
String getGatewayChipId() {
  uint64_t chipid = ESP.getEfuseMac();
  char idStr[24];
  snprintf(idStr, sizeof(idStr), "GW_%04X%08X", (uint16_t)(chipid >> 32), (uint32_t)chipid);
  return String(idStr);
}

// Connect to WiFi Access Point
void setupWiFi() {
  delay(10);
  Serial.printf("\n📡 [WiFi] Connecting to %s...", WIFI_SSID);
  WiFi.mode(WIFI_AP_STA); // AP_STA mode enables ESP-NOW and WiFi concurrently
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ [WiFi] Connected! IP Address: " + WiFi.localIP().toString());
}

// Reconnect to MQTT Broker
void reconnectMQTT() {
  while (!mqttClient.connected()) {
    String clientId = "SentryGateway-" + getGatewayChipId();
    Serial.printf("📡 [MQTT] Connecting to broker %s:%d as %s...\n", MQTT_BROKER, MQTT_PORT, clientId.c_str());

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("✅ [MQTT] Connected successfully!");
    } else {
      Serial.printf("❌ [MQTT] Connection failed (rc=%d). Retrying in 5 seconds...\n", mqttClient.state());
      delay(5000);
    }
  }
}

// ESP-NOW Receive Callback Handler
void OnDataRecv(const uint8_t * mac_addr, const uint8_t *incomingData, int len) {
  TelemetryPacket packet;
  memcpy(&packet, incomingData, sizeof(packet));

  int8_t rssi = WiFi.RSSI(); // Estimate RSSI signal strength
  Serial.printf("📩 [ESP-NOW Recv] From Sensor [%s] | State: %s | Battery: %.2fV | RSSI: %ddBm\n",
                packet.sensorChipId, packet.sensorState, packet.battery, rssi);

  // Construct JSON Telemetry Payload using ArduinoJson
  StaticJsonDocument<256> doc;
  doc["gatewayChipId"]    = getGatewayChipId();
  doc["sensorChipId"]     = String(packet.sensorChipId);
  doc["sensorState text"] = String(packet.sensorState);
  doc["sensorState"]      = String(packet.sensorState);
  doc["battery"]          = packet.battery;
  doc["rssi"]             = rssi;

  char jsonBuffer[300];
  serializeJson(doc, jsonBuffer);

  Serial.printf("📤 [MQTT Publish] Topic '%s' -> %s\n", MQTT_TELEMETRY_TOPIC, jsonBuffer);

  if (mqttClient.connected()) {
    mqttClient.publish(MQTT_TELEMETRY_TOPIC, jsonBuffer);
  } else {
    Serial.println("⚠️ [MQTT Warning] Client disconnected; dropping packet!");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("==================================================");
  Serial.println("🚀 SENTRY HOME - ESP32 CENTRAL GATEWAY BRIDGING ONLINE");
  Serial.println("==================================================");

  setupWiFi();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

  // Initialize ESP-NOW Protocol
  if (esp_now_init() != ESP_OK) {
    Serial.println("❌ Error initializing ESP-NOW");
    return;
  }

  // Register Receive Callback
  esp_now_register_recv_cb(OnDataRecv);
  Serial.println("📥 [ESP-NOW] Listener registered successfully.");
}

void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();
}
