# Sentry Home Security IoT System Documentation

Complete hardware, firmware, JSON schema, backend API, and Next.js Admin Dashboard technical documentation.

---

## 1. System Architecture Overview

The **Sentry Home Security System** is an end-to-end IoT platform designed for high-reliability perimeter security monitoring:

1. **ESP32 Sensor Nodes (Local Mesh)**:
   * Peripheral battery-powered sensor nodes (door magnetic switches, window contact sensors, motion PIR detectors).
   * Sample battery voltage and transmits telemetry over **ESP-NOW** (2.4GHz local low-latency protocol) directly to the Central Gateway MAC address.
   * Enters Ultra Low Power Deep Sleep between events to preserve battery life.

2. **ESP32 Central Gateway (Bridge Router)**:
   * Operates in dual AP+STA mode.
   * Listens for ESP-NOW packet broadcasts from local sensor nodes and calculates RSSI signal strength.
   * Formats telemetry payloads into validated JSON objects.
   * Publishes JSON payloads over WiFi/MQTT to topic `sentry-home/telemetry`.

3. **Node.js Express IoT Backend Engine**:
   * Subscribes to MQTT broker (`broker.hivemq.com:1883`, topic `sentry-home/telemetry`).
   * Performs atomic Mongoose upserts for Gateways and Sensors using hardware `chipId` as primary key `_id`.
   * Records historical telemetry audit entries in `TelemetryLog`.
   * Exposes a full suite of Admin REST management APIs under `/api/admin`.

4. **Next.js 14 Admin Dashboard**:
   * Real-time dark glassmorphism dashboard UI.
   * Landing splash entrance animation (`LandingSplash.tsx`).
   * Web Audio API sound alert chimes (`sound.ts`).
   * Selective metric plotting charts (`DeviceChart.tsx`).
   * Device Detail Inspector (`/devices/[chipId]`).
   * System settings & parameter controls (`/settings`).

---

## 2. MQTT Telemetry JSON Schema

Every telemetry message published by the ESP32 Gateway to `sentry-home/telemetry` adheres to the following JSON structure:

```json
{
  "gatewayChipId": "GW_LIVING_ROOM_01",
  "sensorChipId": "SN_FRONT_DOOR_A1",
  "sensorState": "OPEN",
  "battery": 3.75,
  "rssi": -68,
  "gatewayTimestamp": "2026-07-23T23:45:00.000Z"
}
```

### JSON Schema Field Reference

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `gatewayChipId` | `String` | Hardware Chip ID of the receiving router Gateway (Primary Key `_id` in MongoDB) |
| `sensorChipId` | `String` | Hardware Chip ID of the emitting ESP32 sensor (Primary Key `_id` in MongoDB) |
| `sensorState` | `String (Enum)` | Sensor state: `OPEN`, `CLOSED`, `MOTION_ALERT`, or `ALARM` |
| `battery` | `Number (Float)` | Sampled LiPo battery voltage in Volts (e.g. `3.75`V; low battery threshold $\le 3.3$V) |
| `rssi` | `Number (Int)` | Received Signal Strength Indicator in dBm (e.g. `-68` dBm) |
| `gatewayTimestamp` | `String (ISO)` | ISO 8601 timestamp recorded upon packet reception |

---

## 3. Arduino C++ Firmware Code

### A. ESP32 Sensor Node Firmware (`docs/esp32_sensor_node.ino`)
```cpp
#include <esp_now.h>
#include <WiFi.h>

uint8_t gatewayMacAddress[] = { 0x24, 0x0A, 0xC4, 0x12, 0x34, 0x56 };

typedef struct __attribute__((packed)) {
  char sensorChipId[24];
  char sensorState[16];
  float battery;
  uint32_t messageId;
} TelemetryPacket;

void setup() {
  WiFi.mode(WIFI_STA);
  esp_now_init();
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, gatewayMacAddress, 6);
  esp_now_add_peer(&peerInfo);

  // Read Sensor GPIO & Sample Battery Voltage
  // Transmit packet via esp_now_send(gatewayMacAddress, ...)
}
```

### B. ESP32 Central Gateway Firmware (`docs/esp32_gateway.ino`)
```cpp
#include <WiFi.h>
#include <esp_now.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

void OnDataRecv(const uint8_t * mac_addr, const uint8_t *incomingData, int len) {
  TelemetryPacket packet;
  memcpy(&packet, incomingData, sizeof(packet));

  StaticJsonDocument<256> doc;
  doc["gatewayChipId"] = getGatewayChipId();
  doc["sensorChipId"]  = String(packet.sensorChipId);
  doc["sensorState"]  = String(packet.sensorState);
  doc["battery"]      = packet.battery;
  doc["rssi"]         = WiFi.RSSI();

  char jsonBuffer[300];
  serializeJson(doc, jsonBuffer);
  mqttClient.publish("sentry-home/telemetry", jsonBuffer);
}
```

---

## 4. PDF Documentation File
The PDF document is compiled and saved at:
[docs/Sentry_Home_IoT_System_Documentation.pdf](file:///Users/kavithudapola/Documents/sentry-home/docs/Sentry_Home_IoT_System_Documentation.pdf)
