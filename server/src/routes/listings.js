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
