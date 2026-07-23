#!/usr/bin/env python3
import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def create_pdf():
    pdf_filename = os.path.join(os.path.dirname(__file__), "Sentry_Home_IoT_System_Documentation.pdf")
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette (Slate Dark & Cyan/Emerald Accents)
    PRIMARY_DARK = colors.HexColor("#0f172a")
    ACCENT_CYAN = colors.HexColor("#0284c7")
    ACCENT_EMERALD = colors.HexColor("#059669")
    BG_LIGHT = colors.HexColor("#f8fafc")
    BORDER_COLOR = colors.HexColor("#cbd5e1")
    TEXT_DARK = colors.HexColor("#1e293b")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY_DARK,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=ACCENT_CYAN,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'H1Style',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=PRIMARY_DARK,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=ACCENT_CYAN,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=TEXT_DARK,
        spaceAfter=8
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f1f5f9"),
        borderColor=colors.HexColor("#cbd5e1"),
        borderWidth=1,
        borderPadding=6,
        spaceAfter=8
    )

    story = []

    # Title & Subtitle Header
    story.append(Paragraph("SENTRY HOME SECURITY", title_style))
    story.append(Paragraph("IoT Backend, ESP32 Firmware & Next.js Admin Dashboard Complete Documentation", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=ACCENT_CYAN, spaceAfter=15))

    # SECTION 1: ARCHITECTURE OVERVIEW
    story.append(Paragraph("1. System Architecture Overview", h1_style))
    story.append(Paragraph(
        "The Sentry Home Security platform is a hybrid local-mesh and cloud-connected IoT infrastructure designed for real-time perimeter security monitoring. "
        "Peripheral sensor nodes (e.g. door contact switches, window sensors, PIR motion detectors) communicate via local <b>ESP-NOW</b> low-power protocol to a central ESP32 Gateway node. "
        "The Gateway packages telemetry into structured <b>JSON payloads</b> and publishes them over <b>MQTT</b> to a broker, which feeds the <b>Express / Node.js backend</b> and <b>MongoDB database</b>. "
        "A standalone <b>Next.js Admin Dashboard</b> visualizes live telemetry, device topologies, health alerts, and metrics.",
        body_style
    ))

    # Architecture Summary Table
    arch_data = [
        [Paragraph("<b>Component</b>", body_style), Paragraph("<b>Technology / Protocol</b>", body_style), Paragraph("<b>Role / Function</b>", body_style)],
        [Paragraph("Sensor Nodes", body_style), Paragraph("ESP32 / ESP-NOW (2.4GHz)", body_style), Paragraph("Local low-power sensor sampling & transmission", body_style)],
        [Paragraph("Central Gateway", body_style), Paragraph("ESP32 / WiFi + MQTT", body_style), Paragraph("ESP-NOW receiver & MQTT JSON publisher", body_style)],
        [Paragraph("MQTT Broker", body_style), Paragraph("HiveMQ (Topic: sentry-home/telemetry)", body_style), Paragraph("Pub/Sub telemetry messaging broker", body_style)],
        [Paragraph("IoT Backend API", body_style), Paragraph("Node.js / Express / Mongoose", body_style), Paragraph("Atomic Mongoose upserts, REST API suite", body_style)],
        [Paragraph("Database", body_style), Paragraph("MongoDB ('sentry-home')", body_style), Paragraph("Primary Key mapped collections (_id: chipId)", body_style)],
        [Paragraph("Admin Dashboard", body_style), Paragraph("Next.js 14 / Tailwind / Lucide", body_style), Paragraph("Real-time UI analytics, alerts & control", body_style)]
    ]
    arch_table = Table(arch_data, colWidths=[1.5*inch, 2.2*inch, 3.3*inch])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 12))

    # SECTION 2: JSON SCHEMA EXPLANATION
    story.append(Paragraph("2. Telemetry JSON Payload Specification", h1_style))
    story.append(Paragraph(
        "Every telemetry packet published by the ESP32 Gateway over MQTT to <code>sentry-home/telemetry</code> adheres to a strict, validated JSON schema:",
        body_style
    ))

    json_example = """{
  "gatewayChipId": "GW_LIVING_ROOM_01",
  "sensorChipId": "SN_FRONT_DOOR_A1",
  "sensorState": "OPEN",
  "battery": 3.75,
  "rssi": -68,
  "gatewayTimestamp": "2026-07-23T23:45:00.000Z"
}"""
    story.append(Paragraph(json_example.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))

    json_fields = [
        [Paragraph("<b>Field Name</b>", body_style), Paragraph("<b>Data Type</b>", body_style), Paragraph("<b>Description & Examples</b>", body_style)],
        [Paragraph("<code>gatewayChipId</code>", body_style), Paragraph("String (Primary Key)", body_style), Paragraph("Hardware Chip ID of the receiving router Gateway (e.g. <code>GW_LIVING_ROOM_01</code>)", body_style)],
        [Paragraph("<code>sensorChipId</code>", body_style), Paragraph("String (Primary Key)", body_style), Paragraph("Hardware Chip ID of the emitting ESP32 sensor (e.g. <code>SN_FRONT_DOOR_A1</code>)", body_style)],
        [Paragraph("<code>sensorState</code>", body_style), Paragraph("String (Enum)", body_style), Paragraph("Current state: <code>OPEN</code>, <code>CLOSED</code>, <code>MOTION_ALERT</code>, or <code>ALARM</code>", body_style)],
        [Paragraph("<code>battery</code>", body_style), Paragraph("Number (Float)", body_style), Paragraph("Sampled LiPo battery voltage in Volts (e.g. <code>3.75</code>V; threshold: 3.3V)", body_style)],
        [Paragraph("<code>rssi</code>", body_style), Paragraph("Number (Integer)", body_style), Paragraph("Received Signal Strength Indicator in dBm (e.g. <code>-68</code> dBm)", body_style)],
        [Paragraph("<code>gatewayTimestamp</code>", body_style), Paragraph("String (ISO 8601)", body_style), Paragraph("ISO timestamp recorded upon packet reception at the Gateway node", body_style)]
    ]
    json_table = Table(json_fields, colWidths=[1.8*inch, 1.6*inch, 3.6*inch])
    json_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(json_table)
    story.append(Spacer(1, 14))

    # SECTION 3: ARDUINO C++ CODE EXAMPLES
    story.append(Paragraph("3. ESP32 Sensor Node Arduino C++ Firmware", h1_style))
    story.append(Paragraph(
        "The Sensor Node uses <b>ESP-NOW</b> to broadcast telemetry directly to the Gateway's MAC address without requiring an access point connection. "
        "See full code in <code>docs/esp32_sensor_node.ino</code>.",
        body_style
    ))

    sensor_code_snippet = """#include <esp_now.h>
#include <WiFi.h>

typedef struct __attribute__((packed)) {
  char sensorChipId[24];
  char sensorState[16];
  float battery;
  uint32_t messageId;
} TelemetryPacket;

uint8_t gatewayMacAddress[] = { 0x24, 0x0A, 0xC4, 0x12, 0x34, 0x56 };

void setup() {
  WiFi.mode(WIFI_STA);
  esp_now_init();
  // Read GPIO4 sensor pin & sample ADC GPIO34 battery voltage
  // Send packet via esp_now_send(gatewayMacAddress, ...)
}"""
    story.append(Paragraph(sensor_code_snippet.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))

    story.append(Paragraph("4. ESP32 Central Gateway Arduino C++ Firmware", h1_style))
    story.append(Paragraph(
        "The Central Gateway operates in dual AP+STA mode to receive ESP-NOW packets and publish JSON telemetry over WiFi/MQTT. "
        "See full code in <code>docs/esp32_gateway.ino</code>.",
        body_style
    ))

    gateway_code_snippet = """#include <WiFi.h>
#include <esp_now.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

void OnDataRecv(const uint8_t *mac, const uint8_t *data, int len) {
  TelemetryPacket packet;
  memcpy(&packet, data, sizeof(packet));

  StaticJsonDocument<256> doc;
  doc["gatewayChipId"] = getGatewayChipId();
  doc["sensorChipId"]  = String(packet.sensorChipId);
  doc["sensorState text"] = String(packet.sensorState);
  doc["sensorState"]  = String(packet.sensorState);
  doc["battery"]      = packet.battery;
  doc["rssi"]         = WiFi.RSSI();

  char jsonBuffer[300];
  serializeJson(doc, jsonBuffer);
  mqttClient.publish("sentry-home/telemetry", jsonBuffer);
}"""
    story.append(Paragraph(gateway_code_snippet.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))

    # SECTION 5: REST API & ADMIN DASHBOARD
    story.append(Paragraph("5. Backend REST APIs & Admin Dashboard", h1_style))
    story.append(Paragraph(
        "The Node.js Express backend exposes comprehensive REST API management endpoints under <code>/api/admin</code>:",
        body_style
    ))

    api_rows = [
        [Paragraph("<b>HTTP Method & Endpoint</b>", body_style), Paragraph("<b>Function & Return Value</b>", body_style)],
        [Paragraph("<code>GET /api/admin/dashboard/summary</code>", body_style), Paragraph("Aggregated metrics (Gateways count, Sensor states histogram, low battery count)", body_style)],
        [Paragraph("<code>GET /api/admin/gateways</code>", body_style), Paragraph("Lists all registered central Gateway nodes with connection status and home assignment", body_style)],
        [Paragraph("<code>GET /api/admin/sensors</code>", body_style), Paragraph("Lists all registered ESP-NOW Sensor nodes with battery voltage and RSSI signal", body_style)],
        [Paragraph("<code>GET /api/admin/dashboard/alerts/low-battery</code>", body_style), Paragraph("Filters sensors with battery level below configured threshold (default 3.3V)", body_style)],
        [Paragraph("<code>GET /api/admin/dashboard/alerts/stale-devices</code>", body_style), Paragraph("Inactivity monitor filtering devices with no telemetry for X minutes (1m, 5m, 15m, 30m, 60m)", body_style)],
        [Paragraph("<code>DELETE /api/admin/devices/:chipId</code>", body_style), Paragraph("Removes a specific device and all associated telemetry audit logs from MongoDB", body_style)],
        [Paragraph("<code>DELETE /api/admin/system/purge-all</code>", body_style), Paragraph("Total database purge resetting Gateways, Sensors, and TelemetryLogs", body_style)],
        [Paragraph("<code>GET / PUT /api/admin/settings</code>", body_style), Paragraph("View and update runtime <code>MONGODB_URI</code>, <code>MQTT_BROKER_URL</code>, and <code>MQTT_TELEMETRY_TOPIC</code>", body_style)]
    ]
    api_table = Table(api_rows, colWidths=[2.8*inch, 4.2*inch])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(api_table)

    # Build Document
    doc.build(story)
    print(f"✅ Generated PDF Documentation successfully at: {pdf_filename}")

if __name__ == "__main__":
    create_pdf()
