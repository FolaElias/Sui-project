const router = require('express').Router()
const protect = require('../middleware/auth')
const User = require('../models/User')

// GET /api/user/me
router.get('/me', protect, (req, res) => res.json(req.user))

// POST /api/user/check-mnemonic — public: check if a mnemonic hash is already registered
// Client sends SHA256(mnemonic) — never the raw mnemonic
router.post('/check-mnemonic', async (req, res) => {
  try {
    const { mnemonicHash } = req.body
    if (!mnemonicHash) return res.status(400).json({ message: 'mnemonicHash required' })

    const existing = await User.findOne({ mnemonicHash }).select('email')
    if (!existing) return res.json({ claimed: false })

    // Mask email: show first 2 chars + domain, e.g. fo***@gmail.com
    const [name, domain] = existing.email.split('@')
    const masked = name.slice(0, 2) + '***@' + domain
    return res.json({ claimed: true, maskedEmail: masked })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/user/bind-mnemonic — protected: bind mnemonic hash to logged-in user
router.patch('/bind-mnemonic', protect, async (req, res) => {
  try {
    const { mnemonicHash } = req.body
    if (!mnemonicHash) return res.status(400).json({ message: 'mnemonicHash required' })

    // Check not already claimed by a DIFFERENT user
    const conflict = await User.findOne({ mnemonicHash, _id: { $ne: req.user._id } })
    if (conflict) return res.status(409).json({ message: 'This phrase is already registered to another account.' })

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { mnemonicHash },
      { new: true }
    ).select('-password')

    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

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
