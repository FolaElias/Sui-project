const router = require('express').Router()
const protect = require('../middleware/auth')
const User = require('../models/User')

// GET /api/user/me
router.get('/me', protect, (req, res) => res.json(req.user))

// PATCH /api/user/address — link Sui address to profile
router.patch('/address', protect, async (req, res) => {
  try {
    const { suiAddress } = req.body
    const user = await User.findByIdAndUpdate(req.user._id, { suiAddress }, { new: true }).select('-password')
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/user/:address — look up user by Sui address (for P2P)
router.get('/:address', async (req, res) => {
  try {
    const user = await User.findOne({ suiAddress: req.params.address }).select('username avatar suiAddress')
    res.json(user || null)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
