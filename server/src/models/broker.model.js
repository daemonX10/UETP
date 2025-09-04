const mongoose = require('mongoose');

const BrokerCredentialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brokerId: {
    type: String,
    enum: ['angelOne', 'dhan', 'upstox'],
    required: true
  },
  encryptedData: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

BrokerCredentialSchema.index({ userId: 1, brokerId: 1 }, { unique: true });

const Broker = mongoose.model('BrokerCredential', BrokerCredentialSchema);

module.exports = { Broker };