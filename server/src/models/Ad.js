const mongoose = require('mongoose')

const adSchema = new mongoose.Schema({
  maker:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  makerAddress:  { type: String, required: true },

  // 'sell' = maker is selling SUI | 'buy' = maker wants to buy SUI
  type:          { type: String, enum: ['buy', 'sell'], required: true },
  asset:         { type: String, default: 'SUI' },

  price:         { type: Number, required: true },  // price per SUI in USDT equivalent (display only)
  totalAmount:   { type: Number, required: true },  // total SUI available (in SUI, not MIST)
  minOrder:      { type: Number, required: true },  // min SUI per trade
  maxOrder:      { type: Number, required: true },  // max SUI per trade

  paymentMethod: { type: String, default: 'Sui Transfer' },
  terms:         { type: String, default: '' },

  completedTrades: { type: Number, default: 0 },
  status:        { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
}, { timestamps: true })

module.exports = mongoose.model('Ad', adSchema)
