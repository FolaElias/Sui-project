const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  suiAddress:   { type: String, default: null },
  mnemonicHash: { type: String, default: null, unique: true, sparse: true },
  resetOtp:        { type: String,  default: null },
  resetOtpExpires: { type: Date,    default: null },
  avatar:   { type: String, default: null },
  bio:      { type: String, default: '' },
  keystoreBackup: { type: String, default: null },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}

module.exports = mongoose.model('User', userSchema)
