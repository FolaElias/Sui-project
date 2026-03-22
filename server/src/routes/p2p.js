const router = require('express').Router()
const protect = require('../middleware/auth')
const P2POffer = require('../models/P2POffer')

// GET /api/p2p/inbox — offers sent to my address
router.get('/inbox', protect, async (req, res) => {
  try {
    const offers = await P2POffer.find({
      toAddress: req.user.suiAddress,
      status: 'pending'
    }).populate('from', 'username avatar')
    res.json(offers)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/p2p/sent — offers I've sent
router.get('/sent', protect, async (req, res) => {
  try {
    const offers = await P2POffer.find({ from: req.user._id }).sort({ createdAt: -1 })
    res.json(offers)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/p2p — create offer
router.post('/', protect, async (req, res) => {
  try {
    const offer = await P2POffer.create({
      ...req.body,
      from: req.user._id,
      fromAddress: req.user.suiAddress
    })
    res.status(201).json(offer)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/p2p/:id/status — accept / decline / cancel
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, txDigest } = req.body
    const offer = await P2POffer.findByIdAndUpdate(
      req.params.id,
      { status, ...(txDigest && { txDigest }) },
      { new: true }
    )
    res.json(offer)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
