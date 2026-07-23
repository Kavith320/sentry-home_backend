const mqtt = require('mqtt');
const Gateway = require('../models/Gateway');
const SensorNode = require('../models/SensorNode');
const TelemetryLog = require('../models/TelemetryLog');

/**
 * Core business logic: Process incoming telemetry JSON payload and perform upsert operations.
 * Upserts Gateway (ABC123X) marking active, and SensorNode (XYZ789Z) with state, battery, and gateway reference.
 * Creates an entry in TelemetryLog for historical tracking and dashboard metrics.
 */
async function processTelemetryPayload(payload) {
  const {
    gatewayChipId,
    sensorChipId,
    sensorState,
    battery,
    rssi,
    signalStrength,
    gatewayTimestamp,
    timestamp,
    date,
    ...additionalTelemetry
  } = payload;

  if (!gatewayChipId || !sensorChipId) {
    throw new Error('Invalid telemetry payload: gatewayChipId and sensorChipId are required');
  }

  const now = new Date();
  const parsedRssi = rssi !== undefined ? rssi : (signalStrength !== undefined ? signalStrength : null);

  let parsedTimestamp = now;
  const rawTime = gatewayTimestamp || timestamp || date;
  if (rawTime) {
    const t = new Date(rawTime);
    if (!isNaN(t.getTime())) {
      parsedTimestamp = t;
    }
  }

  // 1. Upsert Gateway (ABC123X) -> connectionStatus: 'online', lastSeen: now
  const gateway = await Gateway.findOneAndUpdate(
    { _id: gatewayChipId },
    {
      $set: {
        chipId: gatewayChipId,
        connectionStatus: 'online',
        lastSeen: now
      }
    },
    { upsert: true, returnDocument: 'after', runValidators: true }
  );

  // 2. Upsert Sensor Node (XYZ789Z) -> state, battery, rssi, gatewayTimestamp, lastGatewayChipId, lastSeen: now
  const sensorUpdate = {
    chipId: sensorChipId,
    lastGatewayChipId: gatewayChipId,
    lastSeen: now
  };

  if (sensorState !== undefined) sensorUpdate.sensorState = sensorState;
  if (battery !== undefined) sensorUpdate.battery = battery;
  if (parsedRssi !== null) sensorUpdate.rssi = parsedRssi;
  if (parsedTimestamp !== null) sensorUpdate.gatewayTimestamp = parsedTimestamp;

  if (Object.keys(additionalTelemetry).length > 0) {
    sensorUpdate.telemetryData = additionalTelemetry;
  }

  const sensor = await SensorNode.findOneAndUpdate(
    { _id: sensorChipId },
    { $set: sensorUpdate },
    { upsert: true, returnDocument: 'after', runValidators: true }
  );

  // 3. Log historical event for dashboard analytics
  const logEntry = await TelemetryLog.create({
    gatewayChipId,
    sensorChipId,
    sensorState: sensorState || 'UNKNOWN',
    battery: battery !== undefined ? battery : null,
    rssi: parsedRssi,
    gatewayTimestamp: parsedTimestamp,
    telemetryData: additionalTelemetry,
    timestamp: now
  });

  return { gateway, sensor, logEntry };
}

let client = null;

function initMqttService(brokerUrl, topic) {
  const url = brokerUrl || process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
  const targetTopic = topic || process.env.MQTT_TELEMETRY_TOPIC || 'sentry-home/telemetry';

  console.log(`📡 [MQTT] Connecting to broker at ${url}...`);
  client = mqtt.connect(url);

  client.on('connect', () => {
    console.log(`✅ [MQTT] Connected successfully to broker '${url}'`);
    client.subscribe(targetTopic, (err) => {
      if (err) {
        console.error(`❌ [MQTT] Failed to subscribe to topic '${targetTopic}':`, err.message);
      } else {
        console.log(`📥 [MQTT] Subscribed to telemetry topic '${targetTopic}'`);
      }
    });
  });

  client.on('message', async (topicName, message) => {
    try {
      const payloadStr = message.toString();
      console.log(`📩 [MQTT Packet] Received raw payload on topic '${topicName}': ${payloadStr}`);
      const payload = JSON.parse(payloadStr);
      const result = await processTelemetryPayload(payload);
      
      const batStr = result.sensor.battery !== null ? `${result.sensor.battery}V` : 'N/A';
      const rssiStr = result.sensor.rssi !== null ? `${result.sensor.rssi}dBm` : 'N/A';
      console.log(`⚡ [Telemetry Ingested] Gateway [${result.gateway.chipId}] ➔ Sensor [${result.sensor.chipId}] | State: ${result.sensor.sensorState} | Battery: ${batStr} | RSSI: ${rssiStr}`);
    } catch (err) {
      console.error(`⚠️  [MQTT Processing Error] Failed to ingest telemetry payload: ${err.message}`);
    }
  });

  client.on('error', (err) => {
    console.error(`❌ [MQTT Broker Error] ${err.message}`);
  });

  return client;
}

function publishMqttMessage(payload, topicOverride) {
  const targetTopic = topicOverride || process.env.MQTT_TELEMETRY_TOPIC || 'sentry-home/telemetry';
  if (client && client.connected) {
    client.publish(targetTopic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) {
        console.error(`❌ [MQTT Publish Error] ${err.message}`);
      } else {
        console.log(`📤 [MQTT Published] Telemetry packet published to broker topic '${targetTopic}'`);
      }
    });
  }
}

function stopMqttService() {
  if (client) {
    client.end();
  }
}

module.exports = {
  initMqttService,
  stopMqttService,
  processTelemetryPayload,
  publishMqttMessage
};
