const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

const tradeSchema = new mongoose.Schema({
  ad:            { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true },

  buyer:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerAddress:  { type: String, required: true },
  sellerAddress: { type: String, required: true },

  amount:        { type: Number, required: true },  // SUI amount for this trade
  pricePerSui:   { type: Number, required: true },  // locked-in price at time of trade

  // Status flow: pending → payment_sent → confirming → completed
  //                     └─────────────────────────── disputed → resolved
  //                     └─────────────────────────── cancelled
  status: {
    type: String,
    enum: ['pending', 'payment_sent', 'confirming', 'completed', 'disputed', 'cancelled'],
    default: 'pending',
  },

  txDigest:  { type: String, default: null },  // on-chain tx when completed
  messages:  [messageSchema],
  disputeReason: { type: String, default: '' },

  // Timestamps for each stage
  paidAt:      { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('Trade', tradeSchema)
