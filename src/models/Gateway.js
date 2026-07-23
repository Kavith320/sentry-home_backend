const mongoose = require('mongoose');

const gatewaySchema = new mongoose.Schema(
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
    connectionStatus: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online'
    },
    homeId: {
      type: String,
      default: null
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-validate middleware to assign _id = chipId if not set
gatewaySchema.pre('validate', function () {
  if (this.chipId && !this._id) {
    this._id = this.chipId;
  }
});

const Gateway = mongoose.model('Gateway', gatewaySchema);

module.exports = Gateway;
