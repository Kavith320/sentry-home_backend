require('dotenv').config();
const mqtt = require('mqtt');

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
const topic = process.env.MQTT_TELEMETRY_TOPIC || 'sentry-home/telemetry';

const samplePayload = {
  gatewayChipId: process.argv[2] || 'ABC123X',
  sensorChipId: process.argv[3] || 'XYZ789Z',
  sensorState: process.argv[4] || 'OPEN',
  battery: parseFloat(process.argv[5]) || 3.75,
  rssi: parseInt(process.argv[6], 10) || -68,
  gatewayTimestamp: new Date().toISOString()
};

console.log(`📡 [Mock Publisher] Connecting to ${brokerUrl}...`);
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
  console.log(`🚀 [Mock Publisher] Connected. Publishing telemetry payload to '${topic}':`);
  console.log(JSON.stringify(samplePayload, null, 2));

  client.publish(topic, JSON.stringify(samplePayload), { qos: 1 }, (err) => {
    if (err) {
      console.error(`❌ [Mock Publisher] Publish error: ${err.message}`);
    } else {
      console.log('✅ [Mock Publisher] Telemetry payload published successfully!');
    }
    client.end();
  });
});

client.on('error', (err) => {
  console.error(`❌ [Mock Publisher] Connection error: ${err.message}`);
  client.end();
});
