import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../context/WalletContext'
import SuiLogo from '../components/shared/SuiLogo'
import toast from 'react-hot-toast'
import * as bip39 from 'bip39'
import CryptoJS from 'crypto-js'
import axios from 'axios'

// Steps: 0=Phrase, 1=OTP, 2=New Password, 3=Done
const STEPS = ['Verify Phrase', 'Check Email', 'New Password', 'Done']

function StrengthBar({ password }) {
  const levels = [
    { min: 1, color: '#FF2EF7' },
    { min: 8, color: '#FFD600' },
    { min: 10, color: '#FF9500' },
    { min: 12, color: '#14F195' },
  ]
  const labels = { 1: 'Weak', 8: 'Fair', 10: 'Good', 12: 'Strong' }
  const active = [...levels].reverse().find(l => password.length >= l.min) || null
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {levels.map((l, i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: active && password.length >= l.min ? l.color : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
      {password.length > 0 && (
        <p className="text-xs" style={{ color: active?.color || '#6B7280' }}>
          {labels[active?.min] || 'Too short'}
        </p>
      )}
    </div>
  )
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { importWallet } = useWallet()

  const [step, setStep]             = useState(0)
  const [loading, setLoading]       = useState(false)

  // Step 0 — phrase
  const [words, setWords]           = useState(Array(12).fill(''))
  const [phraseValid, setPhraseValid] = useState(true)
  const inputRefs                   = useRef([])

  // Step 1 — OTP
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otp, setOtp]               = useState('')
  const [mnemonicHash, setMnemonicHash] = useState('')

  // Step 2 — new password
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPw, setShowPw]         = useState(false)

  // ── Step 0: validate phrase + check server ownership ────────────────────
  const handlePhraseNext = async () => {
    const phrase = words.join(' ').trim()
    if (words.filter(w => w).length < 12) return toast.error('Enter all 12 words')
    if (!bip39.validateMnemonic(phrase)) {
      setPhraseValid(false)
      return toast.error('Invalid secret phrase. Check your words.')
    }
    setPhraseValid(true)
    setLoading(true)

    const hash = CryptoJS.SHA256(phrase).toString()
    setMnemonicHash(hash)

    try {
      const { data } = await axios.post('/api/auth/forgot-password', { mnemonicHash: hash })
      setMaskedEmail(data.maskedEmail)
      toast.success(`Code sent to ${data.maskedEmail}`)
      setStep(1)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not find an account for this phrase.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1: verify OTP ───────────────────────────────────────────────────
  const handleOtpNext = async () => {
    if (otp.length !== 6) return toast.error('Enter the 6-digit code')
    setLoading(true)
    try {
      await axios.post('/api/auth/verify-otp', { mnemonicHash, otp })
      setStep(2)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Incorrect code')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    try {
      await axios.post('/api/auth/forgot-password', { mnemonicHash })
      toast.success('New code sent!')
    } catch (err) {
      toast.error('Could not resend. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: reset password + re-import wallet ────────────────────────────
  const handleReset = async () => {
    if (password.length < 8) return toast.error('Password must be at least 8 characters')
    if (password !== confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      const { data } = await axios.post('/api/auth/reset-password', {
        mnemonicHash,
        otp,
        newPassword: password,
      })

      // Store new JWT
      localStorage.setItem('token', data.token)

      // Re-import wallet locally with new password
      const phrase = words.join(' ').trim()
      importWallet(phrase, password)

      setStep(3)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Word input helpers ────────────────────────────────────────────────────
  const handleWordChange = (i, val) => {
    // Handle paste of full phrase (contains spaces)
    if (val.includes(' ')) {
      const parts = val.trim().toLowerCase().split(/\s+/).slice(0, 12)
      const updated = [...words]
      parts.forEach((p, j) => { updated[j] = p })
      setWords(updated)
      const focusIdx = Math.min(parts.length, 11)
      setTimeout(() => inputRefs.current[focusIdx]?.focus(), 0)
      return
    }
    const updated = [...words]
    updated[i] = val.toLowerCase()
    setWords(updated)
  }

  const handleWordKey = (i, e) => {
    if ((e.key === ' ' || e.key === 'Tab') && words[i] && i < 11) {
      e.preventDefault()
      inputRefs.current[i + 1]?.focus()
    }
    if (e.key === 'Backspace' && !words[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background */}
      <div className="orb w-96 h-96 bg-brand-purple -top-32 -left-32" />
      <div className="orb w-72 h-72 bg-brand-cyan bottom-10 -right-20" />
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(153,69,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(153,69,255,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ boxShadow: '0 0 25px rgba(153,69,255,0.5)' }}>
              <SuiLogo size={40} />
            </div>
            <h1 className="text-3xl font-display font-extrabold text-white">
              Sui<span className="gradient-text">Vault</span>
            </h1>
          </div>
          <p className="text-brand-muted text-sm">Reset your wallet password</p>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center gap-1.5 mb-6 justify-center">
            {STEPS.slice(0, 3).map((label, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all ${
                  i < step ? 'bg-brand-green text-black' : i === step ? 'bg-brand-purple text-white' : 'bg-brand-border text-brand-muted'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-white' : 'text-brand-muted'}`}>{label}</span>
                {i < 2 && <div className={`w-8 h-px ${i < step ? 'bg-brand-green' : 'bg-brand-border'}`} />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Step 0: Enter secret phrase ─────────────────────────────── */}
          {step === 0 && (
            <motion.div key="phrase" className="card p-5 sm:p-8 space-y-5"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>

              <div>
                <h2 className="text-lg font-display font-bold text-white mb-1">Enter your secret phrase</h2>
                <p className="text-brand-muted text-sm">
                  Your 12-word phrase will be verified against your registered account.
                  Only the account that owns this phrase can reset its password.
                </p>
              </div>

              {!phraseValid && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400 text-sm">
                  Invalid phrase — check spelling and word order.
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {words.map((w, i) => (
                  <div key={i} className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-muted text-xs w-4 text-right select-none">
                      {i + 1}.
                    </span>
                    <input
                      ref={el => inputRefs.current[i] = el}
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={w}
                      onChange={e => handleWordChange(i, e.target.value)}
                      onKeyDown={e => handleWordKey(i, e)}
                      className={`w-full pl-7 pr-2 py-2 rounded-lg text-sm font-mono text-white border transition-all outline-none ${
                        w ? 'border-brand-purple/50 bg-brand-purple/10' : 'border-brand-border bg-white/[0.03]'
                      } focus:border-brand-purple`}
                    />
                  </div>
                ))}
              </div>

              <p className="text-brand-muted text-xs text-center">
                Tip: paste all 12 words into the first box at once
              </p>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-3.5 font-semibold disabled:opacity-50"
                onClick={handlePhraseNext} disabled={loading}>
                {loading ? 'Verifying…' : 'Verify Phrase →'}
              </motion.button>

              <div className="text-center">
                <Link to="/unlock" className="text-brand-muted text-sm hover:text-white transition-colors">
                  ← Back to login
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── Step 1: Enter OTP ────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="otp" className="card p-5 sm:p-8 space-y-5"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl"
                  style={{ background: 'linear-gradient(135deg,rgba(153,69,255,0.15),rgba(0,240,255,0.08))', border: '1px solid rgba(153,69,255,0.3)' }}>
                  📧
                </div>
                <h2 className="text-lg font-display font-bold text-white">Check your email</h2>
                <p className="text-brand-muted text-sm">
                  We sent a 6-digit code to <span className="text-brand-cyan font-semibold">{maskedEmail}</span>
                </p>
              </div>

              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                />
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-3.5 font-semibold disabled:opacity-50"
                onClick={handleOtpNext} disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying…' : 'Confirm Code →'}
              </motion.button>

              <div className="text-center space-y-2">
                <button onClick={handleResend} disabled={loading}
                  className="text-brand-cyan text-sm hover:underline disabled:opacity-40">
                  Resend code
                </button>
                <br />
                <button onClick={() => setStep(0)}
                  className="text-brand-muted text-sm hover:text-white transition-colors">
                  ← Use a different phrase
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: New password ─────────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="newpw" className="card p-5 sm:p-8 space-y-5"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>

              <div>
                <h2 className="text-lg font-display font-bold text-white mb-1">Set new password</h2>
                <p className="text-brand-muted text-sm">
                  Your wallet will be re-imported with this new password.
                </p>
              </div>

              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">New Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input pr-10"
                    placeholder="Min. 8 characters" value={password} autoFocus
                    onChange={e => setPassword(e.target.value)} />
                  <button type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white text-sm"
                    onClick={() => setShowPw(p => !p)}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                <StrengthBar password={password} />
              </div>

              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Confirm Password</label>
                <input type="password" className="input"
                  placeholder="Repeat password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                  style={{ borderColor: confirm && confirm !== password ? '#FF2EF7' : undefined }} />
                {confirm && confirm !== password && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-3.5 font-semibold disabled:opacity-50"
                onClick={handleReset}
                disabled={loading || !password || password !== confirm || password.length < 8}>
                {loading ? 'Resetting…' : '🔐 Reset Password'}
              </motion.button>
            </motion.div>
          )}

          {/* ── Step 3: Done ─────────────────────────────────────────────── */}
          {step === 3 && (
            <motion.div key="done" className="card p-5 sm:p-8 text-center space-y-6"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>

              <motion.div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl"
                style={{ background: 'linear-gradient(135deg,rgba(20,241,149,0.15),rgba(0,240,255,0.08))', border: '1px solid rgba(20,241,149,0.3)' }}
                animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 0.5 }}>
                ✅
              </motion.div>

              <div>
                <h2 className="text-xl font-display font-bold text-white mb-2">Password reset!</h2>
                <p className="text-brand-muted text-sm leading-relaxed">
                  Your wallet has been re-imported with your new password.
                  You're now logged in.
                </p>
              </div>

              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="btn-primary w-full py-3.5 font-semibold"
                onClick={() => navigate('/dashboard')}>
                Go to Dashboard →
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
