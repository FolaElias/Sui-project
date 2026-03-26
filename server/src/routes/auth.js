const router = require('express').Router()
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { sendOtpEmail } = require('../utils/mailer')

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    const existing = await User.findOne({ $or: [{ email }, { username }] })
    if (existing) return res.status(400).json({ message: 'Username or email already taken' })

    const user = await User.create({ username, email, password })
    res.status(201).json({ token: signToken(user._id), user: { id: user._id, username, email } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' })

    res.json({ token: signToken(user._id), user: { id: user._id, username: user.username, email } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/forgot-password
// Step 1: Validate mnemonic hash ownership → send OTP to registered email
router.post('/forgot-password', async (req, res) => {
  try {
    const { mnemonicHash } = req.body
    if (!mnemonicHash) return res.status(400).json({ message: 'mnemonicHash required' })

    const user = await User.findOne({ mnemonicHash })
    if (!user) return res.status(404).json({ message: 'No account found for this secret phrase.' })

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString()
    const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store hashed OTP (don't store plain OTP in DB)
    user.resetOtp = await bcrypt.hash(otp, 8)
    user.resetOtpExpires = expires
    await user.save()

    // Send email
    await sendOtpEmail(user.email, otp)

    // Return masked email so client can show "Code sent to fo***@gmail.com"
    const [name, domain] = user.email.split('@')
    const masked = name.slice(0, 2) + '***@' + domain

    res.json({ maskedEmail: masked })
  } catch (err) {
    console.error('[forgot-password]', err.message)
    res.status(500).json({ message: 'Failed to send reset email. Check SMTP settings.' })
  }
})

// POST /api/auth/verify-otp
// Step 2: Verify the OTP the user entered
router.post('/verify-otp', async (req, res) => {
  try {
    const { mnemonicHash, otp } = req.body
    if (!mnemonicHash || !otp) return res.status(400).json({ message: 'mnemonicHash and otp required' })

    const user = await User.findOne({ mnemonicHash })
    if (!user || !user.resetOtp) return res.status(400).json({ message: 'No reset in progress.' })

    if (new Date() > user.resetOtpExpires) {
      user.resetOtp = null; user.resetOtpExpires = null
      await user.save()
      return res.status(400).json({ message: 'Code expired. Start over.' })
    }

    const valid = await bcrypt.compare(otp, user.resetOtp)
    if (!valid) return res.status(400).json({ message: 'Incorrect code.' })

    res.json({ valid: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/reset-password
// Step 3: Set new password (re-verifies OTP for safety)
router.post('/reset-password', async (req, res) => {
  try {
    const { mnemonicHash, otp, newPassword } = req.body
    if (!mnemonicHash || !otp || !newPassword)
      return res.status(400).json({ message: 'All fields required' })
    if (newPassword.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' })

    const user = await User.findOne({ mnemonicHash })
    if (!user || !user.resetOtp) return res.status(400).json({ message: 'No reset in progress.' })

    if (new Date() > user.resetOtpExpires)
      return res.status(400).json({ message: 'Code expired. Start over.' })

    const valid = await bcrypt.compare(otp, user.resetOtp)
    if (!valid) return res.status(400).json({ message: 'Incorrect code.' })

    // Update password + clear OTP
    user.password = newPassword   // pre-save hook hashes it
    user.resetOtp = null
    user.resetOtpExpires = null
    await user.save()

    // Return a fresh JWT so client can auto-login
    const token = signToken(user._id)
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
