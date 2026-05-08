const router = require('express').Router()
const protect = require('../middleware/auth')
const Listing = require('../models/Listing')

// GET /api/listings — all active listings
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'active' })
      .populate('seller', 'username avatar')
      .sort({ createdAt: -1 })
    res.json(listings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/listings — create listing
router.post('/', protect, async (req, res) => {
  try {
    const listing = await Listing.create({ ...req.body, seller: req.user._id })
    res.status(201).json(listing)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/listings/:id/buy — record purchase intent, mark listing as pending
router.patch('/:id/buy', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'username')
    if (!listing) return res.status(404).json({ message: 'Listing not found' })
    if (listing.status !== 'active') return res.status(400).json({ message: 'This listing is no longer available' })
    if (listing.seller._id.toString() === req.user._id.toString())
      return res.status(400).json({ message: "You can't buy your own listing" })

    listing.status       = 'pending'
    listing.buyer        = req.user._id
    listing.buyerAddress = req.body.buyerAddress || req.user.suiAddress || null
    await listing.save()

    res.json(listing)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/listings/:id — cancel listing
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) return res.status(404).json({ message: 'Listing not found' })
    if (listing.seller.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Unauthorized' })
    listing.status = 'cancelled'
    await listing.save()
    res.json({ message: 'Listing cancelled' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
