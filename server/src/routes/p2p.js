const router  = require('express').Router()
const protect = require('../middleware/auth')
const Ad      = require('../models/Ad')
const Trade   = require('../models/Trade')

// ── ADS ───────────────────────────────────────────────────────────────────────

// GET /api/p2p/ads  — all active ads (public)
router.get('/ads', async (req, res) => {
  try {
    const { type } = req.query   // 'buy' or 'sell'
    const query = { status: 'active' }
    if (type) query.type = type
    const ads = await Ad.find(query)
      .populate('maker', 'username')
      .sort({ createdAt: -1 })
    res.json(ads)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/p2p/ads  — post a new ad
router.post('/ads', protect, async (req, res) => {
  try {
    const { type, price, totalAmount, minOrder, maxOrder, paymentMethod, terms } = req.body
    if (!type || !price || !totalAmount || !minOrder || !maxOrder)
      return res.status(400).json({ message: 'Missing required fields' })
    if (minOrder > maxOrder)
      return res.status(400).json({ message: 'Min order must be ≤ max order' })
    if (maxOrder > totalAmount)
      return res.status(400).json({ message: 'Max order cannot exceed total amount' })

    const ad = await Ad.create({
      maker:        req.user._id,
      makerAddress: req.user.suiAddress,
      type, price, totalAmount, minOrder, maxOrder,
      paymentMethod: paymentMethod || 'Sui Transfer',
      terms: terms || '',
    })
    await ad.populate('maker', 'username')
    res.status(201).json(ad)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/p2p/ads/:id  — pause / reactivate / delete own ad
router.patch('/ads/:id', protect, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id)
    if (!ad) return res.status(404).json({ message: 'Ad not found' })
    if (String(ad.maker) !== String(req.user._id))
      return res.status(403).json({ message: 'Not your ad' })

    Object.assign(ad, req.body)
    await ad.save()
    res.json(ad)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/p2p/ads/:id  — remove own ad
router.delete('/ads/:id', protect, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id)
    if (!ad) return res.status(404).json({ message: 'Ad not found' })
    if (String(ad.maker) !== String(req.user._id))
      return res.status(403).json({ message: 'Not your ad' })
    await ad.deleteOne()
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── TRADES ────────────────────────────────────────────────────────────────────

// POST /api/p2p/ads/:id/trade  — taker initiates a trade on an ad
router.post('/ads/:id/trade', protect, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id).populate('maker', 'username suiAddress')
    if (!ad || ad.status !== 'active')
      return res.status(400).json({ message: 'Ad not available' })
    if (String(ad.maker._id) === String(req.user._id))
      return res.status(400).json({ message: 'Cannot trade with yourself' })

    const { amount } = req.body
    if (!amount || amount < ad.minOrder || amount > ad.maxOrder)
      return res.status(400).json({ message: `Amount must be between ${ad.minOrder} and ${ad.maxOrder} SUI` })

    // Determine buyer/seller based on ad type
    // If ad.type === 'sell' → maker is selling → taker is buyer
    // If ad.type === 'buy'  → maker is buying  → taker is seller
    const isMakerSeller = ad.type === 'sell'
    const trade = await Trade.create({
      ad:            ad._id,
      buyer:         isMakerSeller ? req.user._id      : ad.maker._id,
      seller:        isMakerSeller ? ad.maker._id      : req.user._id,
      buyerAddress:  isMakerSeller ? req.user.suiAddress : ad.makerAddress,
      sellerAddress: isMakerSeller ? ad.makerAddress   : req.user.suiAddress,
      amount,
      pricePerSui: ad.price,
    })

    await trade.populate([
      { path: 'buyer',  select: 'username' },
      { path: 'seller', select: 'username' },
    ])
    res.status(201).json(trade)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/p2p/trades  — my active trades
router.get('/trades', protect, async (req, res) => {
  try {
    const trades = await Trade.find({
      $or: [{ buyer: req.user._id }, { seller: req.user._id }]
    })
      .populate('ad', 'type asset price')
      .populate('buyer',  'username')
      .populate('seller', 'username')
      .sort({ createdAt: -1 })
    res.json(trades)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/p2p/trades/:id  — single trade (with chat)
router.get('/trades/:id', protect, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id)
      .populate('ad', 'type asset price paymentMethod terms')
      .populate('buyer',  'username')
      .populate('seller', 'username')
      .populate('messages.sender', 'username')
    if (!trade) return res.status(404).json({ message: 'Trade not found' })
    const isMember = [String(trade.buyer._id), String(trade.seller._id)].includes(String(req.user._id))
    if (!isMember) return res.status(403).json({ message: 'Not your trade' })
    res.json(trade)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/p2p/trades/:id/status  — advance trade status
router.patch('/trades/:id/status', protect, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id)
    if (!trade) return res.status(404).json({ message: 'Not found' })

    const uid   = String(req.user._id)
    const isBuyer  = uid === String(trade.buyer)
    const isSeller = uid === String(trade.seller)
    if (!isBuyer && !isSeller) return res.status(403).json({ message: 'Not your trade' })

    const { status, txDigest, disputeReason } = req.body

    // Enforce valid transitions
    const allowed = {
      pending:      isBuyer  ? ['payment_sent', 'cancelled'] : ['cancelled'],
      payment_sent: isSeller ? ['confirming',   'disputed']  : isBuyer ? ['cancelled'] : [],
      confirming:   isSeller ? ['completed']                 : ['disputed'],
      disputed:     [],
    }
    if (!(allowed[trade.status] || []).includes(status))
      return res.status(400).json({ message: `Cannot move from ${trade.status} → ${status}` })

    trade.status = status
    if (status === 'payment_sent') trade.paidAt = new Date()
    if (status === 'completed')    { trade.completedAt = new Date(); trade.txDigest = txDigest || null }
    if (status === 'cancelled')    trade.cancelledAt = new Date()
    if (status === 'disputed')     trade.disputeReason = disputeReason || ''

    await trade.save()

    // Increment completed trades on the ad
    if (status === 'completed') {
      await Ad.findByIdAndUpdate(trade.ad, { $inc: { completedTrades: 1 } })
    }

    await trade.populate([
      { path: 'buyer',  select: 'username' },
      { path: 'seller', select: 'username' },
      { path: 'ad',     select: 'type asset price' },
    ])
    res.json(trade)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/p2p/trades/:id/message  — send chat message
router.post('/trades/:id/message', protect, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id)
    if (!trade) return res.status(404).json({ message: 'Not found' })
    const isMember = [String(trade.buyer), String(trade.seller)].includes(String(req.user._id))
    if (!isMember) return res.status(403).json({ message: 'Not your trade' })

    trade.messages.push({ sender: req.user._id, text: req.body.text })
    await trade.save()
    await trade.populate('messages.sender', 'username')
    res.json(trade.messages[trade.messages.length - 1])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/p2p/my-ads  — ads posted by me
router.get('/my-ads', protect, async (req, res) => {
  try {
    const ads = await Ad.find({ maker: req.user._id }).sort({ createdAt: -1 })
    res.json(ads)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
