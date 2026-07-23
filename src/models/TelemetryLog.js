const mongoose = require('mongoose');

const telemetryLogSchema = new mongoose.Schema(
  {
    gatewayChipId: {
      type: String,
      required: true,
      index: true
    },
    sensorChipId: {
      type: String,
      required: true,
      index: true
    },
    sensorState: {
      type: String,
      required: true
    },
    battery: {
      type: Number,
      default: null
    },
    rssi: {
      type: Number,
      default: null
    },
    gatewayTimestamp: {
      type: Date,
      default: null
    },
    telemetryData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const TelemetryLog = mongoose.model('TelemetryLog', telemetryLogSchema);

module.exports = TelemetryLog;
