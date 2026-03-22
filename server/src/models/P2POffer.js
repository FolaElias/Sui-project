const mongoose = require('mongoose')

const p2pOfferSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromAddress: { type: String, required: true },
  toAddress: { type: String, required: true },     // recipient Sui address
  offerObjects: [{ type: String }],                // Sui object IDs being offered
  requestObjects: [{ type: String }],              // Sui object IDs being requested
  offerSui: { type: String, default: '0' },        // extra SUI offered (MIST)
  requestSui: { type: String, default: '0' },      // extra SUI requested (MIST)
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled', 'completed'],
    default: 'pending'
  },
  txDigest: { type: String, default: null },       // filled when completed on-chain
}, { timestamps: true })

module.exports = mongoose.model('P2POffer', p2pOfferSchema)
