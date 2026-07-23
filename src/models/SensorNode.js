const mongoose = require('mongoose');

const sensorNodeSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },
    chipId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    sensorState: {
      type: String,
      required: true,
      default: 'UNKNOWN'
    },
    battery: {
      type: Number,
      default: null
    },
    lastGatewayChipId: {
      type: String,
      ref: 'Gateway',
      default: null
    },
    // ESP-NOW Signal Strength (RSSI in dBm, e.g. -65)
    rssi: {
      type: Number,
      default: null
    },
    // Timestamp from Gateway packet ingestion
    gatewayTimestamp: {
      type: Date,
      default: null
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    // Dynamic telemetry details
    telemetryData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-validate middleware to assign _id = chipId if not set
sensorNodeSchema.pre('validate', function () {
  if (this.chipId && !this._id) {
    this._id = this.chipId;
  }
});

const SensorNode = mongoose.model('SensorNode', sensorNodeSchema);

module.exports = SensorNode;
