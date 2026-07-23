const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const Gateway = require('../models/Gateway');
const SensorNode = require('../models/SensorNode');
const TelemetryLog = require('../models/TelemetryLog');
const { processTelemetryPayload, publishMqttMessage } = require('../services/mqttService');
const envPath = path.join(__dirname, '../../.env');

// ==========================================
// GATEWAY ROUTES
// ==========================================

// Get all gateways
router.get('/gateways', async (req, res) => {
  try {
    const gateways = await Gateway.find();
    res.json({ success: true, count: gateways.length, data: gateways });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch single gateway status using hardware chipId
router.get('/gateways/:chipId', async (req, res) => {
  try {
    const gateway = await Gateway.findById(req.params.chipId);
    if (!gateway) {
      return res.status(404).json({ success: false, error: `Gateway with chipId '${req.params.chipId}' not found` });
    }
    res.json({ success: true, data: gateway });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manually register or create a Gateway
router.post('/gateways', async (req, res) => {
  try {
    const { chipId, connectionStatus, homeId } = req.body;
    if (!chipId) {
      return res.status(400).json({ success: false, error: 'chipId is required' });
    }
    const gateway = await Gateway.create({
      _id: chipId,
      chipId,
      connectionStatus: connectionStatus || 'online',
      homeId: homeId || null,
      lastSeen: new Date()
    });
    res.status(201).json({ success: true, data: gateway });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Manually update or override status of any Gateway using chipId
router.put('/gateways/:chipId', async (req, res) => {
  try {
    const { connectionStatus, homeId } = req.body;
    const updateData = { lastSeen: new Date() };

    if (connectionStatus !== undefined) updateData.connectionStatus = connectionStatus;
    if (homeId !== undefined) updateData.homeId = homeId;

    const gateway = await Gateway.findByIdAndUpdate(
      req.params.chipId,
      { $set: updateData },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    res.json({ success: true, message: 'Gateway status updated/overridden successfully', data: gateway });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Bulk assign gateways to a Home ID
router.post('/gateways/batch-assign', async (req, res) => {
  try {
    const { gatewayChipIds, homeId } = req.body;
    if (!Array.isArray(gatewayChipIds) || !homeId) {
      return res.status(400).json({ success: false, error: 'gatewayChipIds (array) and homeId (string) are required' });
    }

    const result = await Gateway.updateMany(
      { chipId: { $in: gatewayChipIds } },
      { $set: { homeId, lastSeen: new Date() } }
    );

    res.json({
      success: true,
      message: `Successfully assigned ${result.modifiedCount} gateway(s) to home '${homeId}'`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Bulk override connection status of gateways
router.post('/gateways/batch-status', async (req, res) => {
  try {
    const { gatewayChipIds, connectionStatus } = req.body;
    if (!Array.isArray(gatewayChipIds) || !['online', 'offline'].includes(connectionStatus)) {
      return res.status(400).json({ success: false, error: "gatewayChipIds (array) and connectionStatus ('online'|'offline') are required" });
    }

    const result = await Gateway.updateMany(
      { chipId: { $in: gatewayChipIds } },
      { $set: { connectionStatus, lastSeen: new Date() } }
    );

    res.json({
      success: true,
      message: `Successfully updated connection status to '${connectionStatus}' for ${result.modifiedCount} gateway(s)`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete a gateway by chipId
router.delete('/gateways/:chipId', async (req, res) => {
  try {
    const gateway = await Gateway.findByIdAndDelete(req.params.chipId);
    if (!gateway) {
      return res.status(404).json({ success: false, error: `Gateway with chipId '${req.params.chipId}' not found` });
    }
    res.json({ success: true, message: `Gateway '${req.params.chipId}' deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// SENSOR NODE ROUTES
// ==========================================

// Get all sensors (optionally filter by gateway)
router.get('/sensors', async (req, res) => {
  try {
    const filter = {};
    if (req.query.gatewayChipId) {
      filter.lastGatewayChipId = req.query.gatewayChipId;
    }
    const sensors = await SensorNode.find(filter);
    res.json({ success: true, count: sensors.length, data: sensors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch single sensor status using hardware chipId
router.get('/sensors/:chipId', async (req, res) => {
  try {
    const sensor = await SensorNode.findById(req.params.chipId);
    if (!sensor) {
      return res.status(404).json({ success: false, error: `Sensor with chipId '${req.params.chipId}' not found` });
    }
    res.json({ success: true, data: sensor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manually register/create a sensor
router.post('/sensors', async (req, res) => {
  try {
    const { chipId, sensorState, battery, rssi, gatewayTimestamp, lastGatewayChipId } = req.body;
    if (!chipId) {
      return res.status(400).json({ success: false, error: 'chipId is required' });
    }
    const sensor = await SensorNode.create({
      _id: chipId,
      chipId,
      sensorState: sensorState || 'UNKNOWN',
      battery: battery !== undefined ? battery : null,
      rssi: rssi !== undefined ? rssi : null,
      gatewayTimestamp: gatewayTimestamp ? new Date(gatewayTimestamp) : new Date(),
      lastGatewayChipId: lastGatewayChipId || null,
      lastSeen: new Date()
    });
    res.status(201).json({ success: true, data: sensor });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Manually update or override status/state/battery/rssi/gatewayTimestamp of any Sensor using chipId
router.put('/sensors/:chipId', async (req, res) => {
  try {
    const { sensorState, battery, rssi, gatewayTimestamp, lastGatewayChipId, telemetryData } = req.body;
    const updateData = { lastSeen: new Date() };

    if (sensorState !== undefined) updateData.sensorState = sensorState;
    if (battery !== undefined) updateData.battery = battery;
    if (rssi !== undefined) updateData.rssi = rssi;
    if (gatewayTimestamp !== undefined) updateData.gatewayTimestamp = new Date(gatewayTimestamp);
    if (lastGatewayChipId !== undefined) updateData.lastGatewayChipId = lastGatewayChipId;
    if (telemetryData !== undefined) updateData.telemetryData = telemetryData;

    const sensor = await SensorNode.findByIdAndUpdate(
      req.params.chipId,
      { $set: updateData },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    res.json({ success: true, message: 'Sensor status updated/overridden successfully', data: sensor });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete a sensor by chipId
router.delete('/sensors/:chipId', async (req, res) => {
  try {
    const sensor = await SensorNode.findByIdAndDelete(req.params.chipId);
    if (!sensor) {
      return res.status(404).json({ success: false, error: `Sensor with chipId '${req.params.chipId}' not found` });
    }
    res.json({ success: true, message: `Sensor '${req.params.chipId}' deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// DASHBOARD & ANALYTICS ROUTES
// ==========================================

// GET /api/admin/dashboard/summary - System overview statistics & health metrics
router.get('/dashboard/summary', async (req, res) => {
  try {
    const totalGateways = await Gateway.countDocuments();
    const onlineGateways = await Gateway.countDocuments({ connectionStatus: 'online' });
    const offlineGateways = await Gateway.countDocuments({ connectionStatus: 'offline' });
    const distinctHomes = await Gateway.distinct('homeId', { homeId: { $ne: null } });

    const totalSensors = await SensorNode.countDocuments();
    const lowBatteryThreshold = parseFloat(req.query.batteryThreshold) || 3.3;
    const lowBatterySensors = await SensorNode.countDocuments({ battery: { $ne: null, $lte: lowBatteryThreshold } });

    // Aggregate sensor states breakdown
    const stateAggregation = await SensorNode.aggregate([
      { $group: { _id: '$sensorState', count: { $sum: 1 } } }
    ]);
    const sensorStatesBreakdown = {};
    stateAggregation.forEach((item) => {
      sensorStatesBreakdown[item._id] = item.count;
    });

    // Stale device threshold (default: 30 minutes)
    const minutesStale = parseInt(req.query.staleMinutes, 10) || 30;
    const staleCutoff = new Date(Date.now() - minutesStale * 60 * 1000);
    const staleGateways = await Gateway.countDocuments({ lastSeen: { $lt: staleCutoff } });
    const staleSensors = await SensorNode.countDocuments({ lastSeen: { $lt: staleCutoff } });

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const telemetryEvents24h = await TelemetryLog.countDocuments({ timestamp: { $gte: last24h } });

    res.json({
      success: true,
      data: {
        gateways: {
          total: totalGateways,
          online: onlineGateways,
          offline: offlineGateways,
          distinctHomesCount: distinctHomes.length,
          staleCount: staleGateways
        },
        sensors: {
          total: totalSensors,
          lowBatteryCount: lowBatterySensors,
          lowBatteryThreshold,
          statesBreakdown: sensorStatesBreakdown,
          staleCount: staleSensors
        },
        telemetry24hCount: telemetryEvents24h
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/dashboard/alerts/low-battery - Get list of low-battery sensors
router.get('/dashboard/alerts/low-battery', async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 3.3;
    const sensors = await SensorNode.find({ battery: { $ne: null, $lte: threshold } }).sort({ battery: 1 });
    res.json({ success: true, threshold, count: sensors.length, data: sensors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/dashboard/alerts/stale-devices - Get inactive gateways or sensors
router.get('/dashboard/alerts/stale-devices', async (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes, 10) || 30;
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);

    const staleGateways = await Gateway.find({ lastSeen: { $lt: cutoff } });
    const staleSensors = await SensorNode.find({ lastSeen: { $lt: cutoff } });

    res.json({
      success: true,
      inactivityThresholdMinutes: minutes,
      staleGatewaysCount: staleGateways.length,
      staleSensorsCount: staleSensors.length,
      data: {
        gateways: staleGateways,
        sensors: staleSensors
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/dashboard/homes/:homeId - Get device topology by Home ID
router.get('/dashboard/homes/:homeId', async (req, res) => {
  try {
    const { homeId } = req.params;
    const gateways = await Gateway.find({ homeId });
    const gatewayChipIds = gateways.map((g) => g.chipId);

    const sensors = await SensorNode.find({
      lastGatewayChipId: { $in: gatewayChipIds }
    });

    res.json({
      success: true,
      homeId,
      gatewaysCount: gateways.length,
      sensorsCount: sensors.length,
      data: {
        gateways,
        sensors
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/dashboard/telemetry/history - Paginated historical telemetry audit log
router.get('/dashboard/telemetry/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.sensorChipId) filter.sensorChipId = req.query.sensorChipId;
    if (req.query.gatewayChipId) filter.gatewayChipId = req.query.gatewayChipId;

    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) filter.timestamp.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.timestamp.$lte = new Date(req.query.endDate);
    }

    const total = await TelemetryLog.countDocuments(filter);
    const logs = await TelemetryLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to simulate telemetry injection over HTTP
router.post('/telemetry/simulate', async (req, res) => {
  try {
    const result = await processTelemetryPayload(req.body);
    res.json({ success: true, message: 'Telemetry processed successfully', data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE a single device (Gateway or SensorNode) by chipId
router.delete('/devices/:chipId', async (req, res) => {
  try {
    const { chipId } = req.params;
    let deletedCategory = null;

    // Check Gateway
    const gwResult = await Gateway.findByIdAndDelete(chipId);
    if (gwResult) {
      deletedCategory = 'Gateway';
    }

    // Check Sensor
    const snResult = await SensorNode.findByIdAndDelete(chipId);
    if (snResult) {
      deletedCategory = 'SensorNode';
    }

    if (!deletedCategory) {
      return res.status(404).json({ success: false, error: `Device '${chipId}' not found in registry.` });
    }

    // Delete associated telemetry logs
    const logDeleteResult = await TelemetryLog.deleteMany({
      $or: [{ gatewayChipId: chipId }, { sensorChipId: chipId }]
    });

    console.log(`🗑️  [Device Deleted] ${deletedCategory} [${chipId}] and ${logDeleteResult.deletedCount} associated telemetry log(s) removed.`);

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCategory} '${chipId}' and ${logDeleteResult.deletedCount} associated telemetry log(s).`,
      data: { chipId, category: deletedCategory, deletedLogsCount: logDeleteResult.deletedCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/admin/system/purge-all -> Clear all database collections
router.delete('/system/purge-all', async (req, res) => {
  try {
    const gwDel = await Gateway.deleteMany({});
    const snDel = await SensorNode.deleteMany({});
    const logDel = await TelemetryLog.deleteMany({});

    console.log(`🔥 [System Purged] Removed ${gwDel.deletedCount} Gateways, ${snDel.deletedCount} Sensors, and ${logDel.deletedCount} Telemetry Logs.`);

    res.json({
      success: true,
      message: 'System database collections cleared successfully.',
      data: {
        gatewaysDeleted: gwDel.deletedCount,
        sensorsDeleted: snDel.deletedCount,
        telemetryLogsDeleted: logDel.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// GET /api/admin/settings -> Fetch active environment parameters (excluding ports)
router.get('/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sentry-home',
      mqttBrokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883',
      mqttTelemetryTopic: process.env.MQTT_TELEMETRY_TOPIC || 'sentry-home/telemetry',
      port: process.env.PORT || '3000'
    }
  });
});

// PUT /api/admin/settings -> Update environment parameters on disk & runtime (excluding ports)
router.put('/settings', (req, res) => {
  try {
    const { mongodbUri, mqttBrokerUrl, mqttTelemetryTopic } = req.body;

    if (mongodbUri) process.env.MONGODB_URI = mongodbUri;
    if (mqttBrokerUrl) process.env.MQTT_BROKER_URL = mqttBrokerUrl;
    if (mqttTelemetryTopic) process.env.MQTT_TELEMETRY_TOPIC = mqttTelemetryTopic;

    // Safely update root .env file on disk while keeping PORT intact
    const currentPort = process.env.PORT || '3000';
    const newEnvContent = `PORT=${currentPort}
MONGODB_URI=${process.env.MONGODB_URI}
MQTT_BROKER_URL=${process.env.MQTT_BROKER_URL}
MQTT_TELEMETRY_TOPIC=${process.env.MQTT_TELEMETRY_TOPIC}
`;

    fs.writeFileSync(envPath, newEnvContent, 'utf8');

    console.log(`⚙️  [Settings Updated] MongoDB: ${process.env.MONGODB_URI} | MQTT Broker: ${process.env.MQTT_BROKER_URL} | Topic: ${process.env.MQTT_TELEMETRY_TOPIC}`);

    res.json({
      success: true,
      message: 'Environment parameters updated successfully on disk & in runtime memory.',
      data: {
        mongodbUri: process.env.MONGODB_URI,
        mqttBrokerUrl: process.env.MQTT_BROKER_URL,
        mqttTelemetryTopic: process.env.MQTT_TELEMETRY_TOPIC,
        port: currentPort
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
