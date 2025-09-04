const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['equity', 'crypto', 'property', 'other'], required: true },
  name: { type: String, required: true },
  symbol: { type: String },
  exchange: { type: String },
  isin: { type: String },
  quantity: { type: Number, default: 0 },
  averagePrice: { type: Number },
  currentValue: { type: Number, required: true },
  
  broker: {
    id: { type: String, enum: ['angelOne', 'dhan', 'upstox', 'manual'] },
    name: { type: String },
  },
  
  stockDetails: {
    product: { type: String },
    pnl: { type: Number },
    pnlPercentage: { type: Number },
  },
  
  purchaseDate: { type: Date },
  description: { type: String },
  
  historicalValues: [
    {
      date: { type: Date, default: Date.now },
      value: { type: Number },
      price: { type: Number }, 
    },
  ],
  
  lastUpdated: { type: Date, default: Date.now },
}, 
{ timestamps: true });

assetSchema.index({ user: 1, type: 1 });
assetSchema.index({ user: 1, "broker.id": 1 });
assetSchema.index({ symbol: 1, exchange: 1 });

const Asset = mongoose.model('Asset', assetSchema);

module.exports = { Asset };