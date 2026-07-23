const mongoose = require('mongoose');
const http = require('http');
const connectDB = require('../config/db');
const Gateway = require('../models/Gateway');
const SensorNode = require('../models/SensorNode');
const TelemetryLog = require('../models/TelemetryLog');
const { processTelemetryPayload } = require('../services/mqttService');
const { app } = require('../server');

// Helper to make HTTP requests
function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n==================================================');
  console.log('STARTING SMART HOME SECURITY BACKEND & DASHBOARD API TESTS');
  console.log('==================================================\n');

  let MongoMemoryServer;
  try {
    const mm = require('mongodb-memory-server');
    MongoMemoryServer = mm.MongoMemoryServer;
  } catch (e) {
    console.log('[Info] mongodb-memory-server not available, falling back to process env MONGODB_URI');
  }

  let mongod;
  let mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sentry-home-test';

  if (MongoMemoryServer) {
    mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
  }

  await connectDB(mongoUri);

  // Reset collections for clean test state
  await Gateway.deleteMany({});
  await SensorNode.deleteMany({});
  await TelemetryLog.deleteMany({});

  // Start HTTP server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`[Test Suite] Test HTTP server listening on port ${port}`);

  const defaultOptions = {
    hostname: '127.0.0.1',
    port: port,
    headers: { 'Content-Type': 'application/json' }
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Process incoming MQTT payload & perform Upsert + Telemetry Logging
    // ----------------------------------------------------
    console.log('\n--> [TEST 1] Process Telemetry Payload (Gateway ABC123X & Sensor XYZ789Z)');
    const incomingTelemetry = {
      gatewayChipId: 'ABC123X',
      sensorChipId: 'XYZ789Z',
      sensorState: 'OPEN',
      battery: 3.7
    };

    const upsertResult = await processTelemetryPayload(incomingTelemetry);
    console.log('    Gateway Upserted:', { _id: upsertResult.gateway._id, status: upsertResult.gateway.connectionStatus });
    console.log('    Sensor Upserted:', { _id: upsertResult.sensor._id, state: upsertResult.sensor.sensorState, battery: upsertResult.sensor.battery });
    console.log('    Telemetry Log Recorded:', { id: upsertResult.logEntry._id, timestamp: upsertResult.logEntry.timestamp });

    if (upsertResult.gateway._id !== 'ABC123X' || upsertResult.sensor._id !== 'XYZ789Z') {
      throw new Error('FAILED: Primary key chipId mapping error!');
    }
    if (!upsertResult.logEntry) {
      throw new Error('FAILED: Telemetry log entry was not created!');
    }
    console.log('    ✓ TEST 1 PASSED: Device upserts & Telemetry log entry recorded!');

    // ----------------------------------------------------
    // TEST 2: Seed Additional Devices for Dashboard Metrics
    // ----------------------------------------------------
    console.log('\n--> [TEST 2] Seed additional gateways and low-battery sensors for dashboard testing');
    
    // Gateway 2 & 3
    await Gateway.create({ _id: 'GW_ALPHA', chipId: 'GW_ALPHA', connectionStatus: 'online', homeId: 'HOME_1' });
    await Gateway.create({ _id: 'GW_BETA', chipId: 'GW_BETA', connectionStatus: 'offline', homeId: 'HOME_1' });

    // Low-battery sensors
    await SensorNode.create({ _id: 'SENSOR_LOW_BAT', chipId: 'SENSOR_LOW_BAT', sensorState: 'CLOSED', battery: 3.0, lastGatewayChipId: 'GW_ALPHA' });
    await SensorNode.create({ _id: 'SENSOR_STALE', chipId: 'SENSOR_STALE', sensorState: 'MOTION_ALERT', battery: 3.8, lastGatewayChipId: 'GW_BETA', lastSeen: new Date(Date.now() - 60 * 60 * 1000) });

    // Additional telemetry packets to build history
    await processTelemetryPayload({ gatewayChipId: 'GW_ALPHA', sensorChipId: 'SENSOR_LOW_BAT', sensorState: 'CLOSED', battery: 3.0 });

    console.log('    ✓ TEST 2 PASSED: Seeded test dataset successfully.');

    // ----------------------------------------------------
    // TEST 3: GET /api/admin/dashboard/summary
    // ----------------------------------------------------
    console.log('\n--> [TEST 3] GET /api/admin/dashboard/summary metrics endpoint');
    const resSummary = await httpRequest({
      ...defaultOptions,
      path: '/api/admin/dashboard/summary',
      method: 'GET'
    });
    console.log('    Summary Response:', JSON.stringify(resSummary.body.data, null, 2));

    if (resSummary.statusCode !== 200 || resSummary.body.data.gateways.total !== 3) {
      throw new Error(`FAILED: Summary gateway total expected 3, got ${resSummary.body.data.gateways.total}`);
    }
    if (resSummary.body.data.sensors.total !== 3) {
      throw new Error(`FAILED: Summary sensor total expected 3, got ${resSummary.body.data.sensors.total}`);
    }
    if (resSummary.body.data.sensors.lowBatteryCount !== 1) {
      throw new Error(`FAILED: Low battery count expected 1, got ${resSummary.body.data.sensors.lowBatteryCount}`);
    }
    console.log('    ✓ TEST 3 PASSED: Dashboard summary aggregated metrics verified!');

    // ----------------------------------------------------
    // TEST 4: Health Alerts (Low Battery & Stale Devices)
    // ----------------------------------------------------
    console.log('\n--> [TEST 4] GET Low-Battery & Stale-Device Alert APIs');
    
    const resLowBat = await httpRequest({
      ...defaultOptions,
      path: '/api/admin/dashboard/alerts/low-battery?threshold=3.2',
      method: 'GET'
    });
    console.log('    Low Battery Alert Count:', resLowBat.body.count, 'Devices:', resLowBat.body.data.map(s => ({ chipId: s.chipId, battery: s.battery })));
    if (resLowBat.body.count !== 1 || resLowBat.body.data[0].chipId !== 'SENSOR_LOW_BAT') {
      throw new Error('FAILED: Low battery alert filtering failed!');
    }

    const resStale = await httpRequest({
      ...defaultOptions,
      path: '/api/admin/dashboard/alerts/stale-devices?minutes=45',
      method: 'GET'
    });
    console.log('    Stale Sensors Count:', resStale.body.staleSensorsCount);
    if (resStale.body.staleSensorsCount !== 1 || resStale.body.data.sensors[0].chipId !== 'SENSOR_STALE') {
      throw new Error('FAILED: Stale device alert filtering failed!');
    }
    console.log('    ✓ TEST 4 PASSED: Device health alert endpoints verified!');

    // ----------------------------------------------------
    // TEST 5: Home Device Topology (GET /api/admin/dashboard/homes/HOME_1)
    // ----------------------------------------------------
    console.log('\n--> [TEST 5] GET /api/admin/dashboard/homes/HOME_1 Device Topology');
    const resTopology = await httpRequest({
      ...defaultOptions,
      path: '/api/admin/dashboard/homes/HOME_1',
      method: 'GET'
    });
    console.log(`    Home HOME_1 Topology -> Gateways: ${resTopology.body.gatewaysCount}, Sensors: ${resTopology.body.sensorsCount}`);
    if (resTopology.body.gatewaysCount !== 2 || resTopology.body.sensorsCount !== 2) {
      throw new Error('FAILED: Home device topology hierarchy mismatch!');
    }
    console.log('    ✓ TEST 5 PASSED: Home topology hierarchy returned correctly!');

    // ----------------------------------------------------
    // TEST 6: Historical Telemetry Audit Log (GET /api/admin/dashboard/telemetry/history)
    // ----------------------------------------------------
    console.log('\n--> [TEST 6] GET /api/admin/dashboard/telemetry/history');
    const resHistory = await httpRequest({
      ...defaultOptions,
      path: '/api/admin/dashboard/telemetry/history?page=1&limit=10',
      method: 'GET'
    });
    console.log('    Telemetry History Count:', resHistory.body.pagination.total);
    if (resHistory.body.pagination.total < 2 || resHistory.body.data.length < 2) {
      throw new Error('FAILED: Telemetry history pagination or document count error!');
    }
    console.log('    ✓ TEST 6 PASSED: Telemetry history audit endpoint verified!');

    // ----------------------------------------------------
    // TEST 7: Bulk Gateway Operations (batch-assign & batch-status)
    // ----------------------------------------------------
    console.log('\n--> [TEST 7] Bulk Gateway Operations (batch-assign & batch-status)');
    
    // Batch Assign
    const resBatchAssign = await httpRequest(
      { ...defaultOptions, path: '/api/admin/gateways/batch-assign', method: 'POST' },
      { gatewayChipIds: ['ABC123X', 'GW_ALPHA'], homeId: 'HOME_SECURE_ZONE' }
    );
    console.log('    Batch Assign Response:', resBatchAssign.body.message);
    if (resBatchAssign.body.modifiedCount !== 2) {
      throw new Error('FAILED: Batch assign failed!');
    }

    // Batch Status
    const resBatchStatus = await httpRequest(
      { ...defaultOptions, path: '/api/admin/gateways/batch-status', method: 'POST' },
      { gatewayChipIds: ['GW_ALPHA', 'GW_BETA'], connectionStatus: 'online' }
    );
    console.log('    Batch Status Response:', resBatchStatus.body.message);
    if (resBatchStatus.body.modifiedCount < 1) {
      throw new Error('FAILED: Batch status update failed!');
    }
    console.log('    ✓ TEST 7 PASSED: Bulk gateway operations verified!');

    // ----------------------------------------------------
    // TEST 8: Device Deletion & Total System Database Purge
    // ----------------------------------------------------
    console.log('\n--> [TEST 8] Device Deletion & Total Database Purge');
    
    // Delete single device
    const resDelSingle = await httpRequest({
      ...defaultOptions,
      path: '/api/admin/devices/SENSOR_LOW_BAT',
      method: 'DELETE'
    });
    console.log('    Delete Single Device Response:', resDelSingle.body.message);
    if (!resDelSingle.body.success) {
      throw new Error('FAILED: Single device deletion failed!');
    }

    // Purge all system data
    const resPurge = await httpRequest({
      ...defaultOptions,
      path: '/api/admin/system/purge-all',
      method: 'DELETE'
    });
    console.log('    Purge All Response:', resPurge.body.message);
    if (!resPurge.body.success) {
      throw new Error('FAILED: Total system purge failed!');
    }
    console.log('    ✓ TEST 8 PASSED: Device deletion and total database purge verified!');

    // ----------------------------------------------------
    // TEST 9: System Settings GET & PUT APIs
    // ----------------------------------------------------
    console.log('\n--> [TEST 9] GET & PUT /api/admin/settings APIs');
    
    const resGetSettings = await httpRequest({
      ...defaultOptions,
      path: '/api/admin/settings',
      method: 'GET'
    });
    console.log('    Get Settings Data:', resGetSettings.body.data);
    if (!resGetSettings.body.success || !resGetSettings.body.data.mongodbUri) {
      throw new Error('FAILED: GET /api/admin/settings failed!');
    }

    const resPutSettings = await httpRequest(
      { ...defaultOptions, path: '/api/admin/settings', method: 'PUT' },
      { mqttTelemetryTopic: 'sentry-home/telemetry' }
    );
    console.log('    Put Settings Response:', resPutSettings.body.message);
    if (!resPutSettings.body.success || resPutSettings.body.data.mqttTelemetryTopic !== 'sentry-home/telemetry') {
      throw new Error('FAILED: PUT /api/admin/settings failed!');
    }
    console.log('    ✓ TEST 9 PASSED: System Settings GET and PUT endpoints verified!');

    console.log('\n==================================================');
    console.log('ALL ADMIN DASHBOARD API TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('==================================================\n');
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
  }
}

runTests();
