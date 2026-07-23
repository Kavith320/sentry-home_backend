/*
 * ======================================================================================
 * SENTRY HOME SECURITY SYSTEM - ESP32 SENSOR NODE (ESP-NOW SENDER)
 * ======================================================================================
 * Hardware Requirements:
 * - ESP32 Development Board
 * - Door/Window Magnetic Reed Switch or PIR Motion Sensor connected to GPIO4
 * - Battery Divider (100k / 100k resistors) connected to GPIO34 (ADC1)
 *
 * Description:
 * Reads sensor state, samples battery voltage, and transmits structured ESP-NOW 
 * packet to the Central Gateway MAC address, then enters Ultra Low Power Deep Sleep.
 * ======================================================================================
 */

#include <esp_now.h>
#include <WiFi.h>

// CENTRAL GATEWAY MAC ADDRESS (Replace with your Gateway's MAC Address)
uint8_t gatewayMacAddress[] = { 0x24, 0x0A, 0xC4, 0x12, 0x34, 0x56 };

// SENSOR HARDWARE CONFIGURATION
#define SENSOR_PIN          4     // Magnetic Switch or Motion Sensor Pin
#define BATTERY_ADC_PIN     34    // Battery Voltage Divider ADC Pin (GPIO34)
#define SENSOR_CHIP_PREFIX  "SN_FRONT_DOOR_"

// TELEMETRY PACKET STRUCT MATCHING ESP-NOW PROTOCOL
typedef struct __attribute__((packed)) {
  char sensorChipId[24];   // Unique Sensor Chip ID
  char sensorState[16];    // "OPEN", "CLOSED", "MOTION_ALERT", "ALARM"
  float battery;           // Measured Battery Voltage (Volts)
  uint32_t messageId;      // Packet Counter
} TelemetryPacket;

TelemetryPacket sensorData;
uint32_t packetCounter = 0;

// Reads Chip ID from ESP32 eFuse MAC Address
String getChipId() {
  uint64_t chipid = ESP.getEfuseMac();
  char idStr[24];
  snprintf(idStr, sizeof(idStr), "SN_%04X%08X", (uint16_t)(chipid >> 32), (uint32_t)chipid);
  return String(idStr);
}

// Samples battery voltage from voltage divider
float readBatteryVoltage() {
  int rawADC = analogRead(BATTERY_ADC_PIN);
  // ADC range 0-4095 mapped to 0-3.3V reference * 2 (100k/100k divider)
  float voltage = (rawADC / 4095.0f) * 3.3f * 2.0f;
  return voltage;
}

// ESP-NOW Send Callback Handler
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("📡 [ESP-NOW] Packet Delivery Status: ");
  if (status == ESP_NOW_SEND_SUCCESS) {
    Serial.println("Success ✅");
  } else {
    Serial.println("Delivery Fail ❌");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_PIN, INPUT_PULLUP);

  // Initialize WiFi in Station Mode for ESP-NOW
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  Serial.println("==================================================");
  Serial.println("🛡️ SENTRY HOME - ESP32 SENSOR NODE INITIALIZED");
  Serial.println("==================================================");

  // Initialize ESP-NOW Protocol
  if (esp_now_init() != ESP_OK) {
    Serial.println("❌ Error initializing ESP-NOW");
    return;
  }

  // Register Send Callback
  esp_now_register_send_cb(OnDataSent);

  // Register Gateway Peer
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, gatewayMacAddress, 6);
  peerInfo.channel = 0;  // Match Gateway WiFi Channel
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("❌ Failed to add Gateway peer");
    return;
  }

  // Populate Telemetry Data
  String chipId = getChipId();
  strncpy(sensorData.sensorChipId, chipId.c_str(), sizeof(sensorData.sensorChipId));
  
  // Read Digital Sensor Pin
  int stateVal = digitalRead(SENSOR_PIN);
  if (stateVal == HIGH) {
    strncpy(sensorData.sensorState, "OPEN", sizeof(sensorData.sensorState));
  } else {
    strncpy(sensorData.sensorState, "CLOSED", sizeof(sensorData.sensorState));
  }

  sensorData.battery = readBatteryVoltage();
  sensorData.messageId = ++packetCounter;

  Serial.printf("⚡ [Sensor] Chip ID: %s | State: %s | Battery: %.2fV\n",
                sensorData.sensorChipId, sensorData.sensorState, sensorData.battery);

  // Transmit Packet over ESP-NOW
  esp_err_t result = esp_now_send(gatewayMacAddress, (uint8_t *) &sensorData, sizeof(sensorData));
  if (result == ESP_OK) {
    Serial.println("📤 [ESP-NOW] Packet transmitted successfully");
  } else {
    Serial.println("❌ Error sending ESP-NOW packet");
  }
}

void loop() {
  // Enter Deep Sleep to save battery power (wakes on GPIO4 state change or timer)
  delay(100);
  esp_sleep_enable_ext0_wakeup((gpio_num_t)SENSOR_PIN, HIGH);
  Serial.println("😴 Entering Ultra Low Power Deep Sleep...");
  esp_deep_sleep_start();
}
