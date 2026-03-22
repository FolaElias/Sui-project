const mongoose = require('mongoose')

const listingSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerAddress: { type: String, required: true },
  objectId: { type: String, required: true },       // Sui object ID
  objectType: { type: String, required: true },     // e.g. "0x2::coin::Coin<0x2::sui::SUI>"
  name: { type: String, required: true },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: null },
  price: { type: String, required: true },          // in MIST (smallest SUI unit)
  status: {
    type: String,
    enum: ['active', 'sold', 'cancelled'],
    default: 'active'
  },
}, { timestamps: true })

module.exports = mongoose.model('Listing', listingSchema)
