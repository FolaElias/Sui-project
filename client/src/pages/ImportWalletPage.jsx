import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../context/WalletContext'
import { useAuth } from '../context/AuthContext'
import SuiLogo from '../components/shared/SuiLogo'
import toast from 'react-hot-toast'
import * as bip39 from 'bip39'
import CryptoJS from 'crypto-js'
import axios from 'axios'

const STEPS = ['Phrase', 'Account', 'Password', 'Done']

function StrengthBar({ password }) {
  const levels = [
    { min: 1,  color: '#FF2EF7' },
    { min: 8,  color: '#FFD600' },
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

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.35 } }
}

export default function ImportWalletPage() {
  const navigate = useNavigate()
  const { importWallet } = useWallet()
  const { register, login, linkAddress } = useAuth()

  const [step, setStep]           = useState(0)
  const [loading, setLoading]     = useState(false)
  const [authMode, setAuthMode]   = useState('register') // 'register' | 'login'

  // Step 0 — phrase
  const [words, setWords]         = useState(Array(12).fill(''))
  const [phraseValid, setPhraseValid] = useState(null)  // null | true | false
  const inputRefs                 = useRef([])

  // Step 1 — account
  const [username, setUsername]   = useState('')
  const [email, setEmail]         = useState('')

  // Step 2 — password
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)

  // Step 3 — result
  const [walletAddress, setWalletAddress] = useState('')

  // ── Phrase input helpers ──────────────────────────────────────────────────
  const updateWord = (i, val) => {
    // Handle paste of full phrase into first input
    const trimmed = val.trim()
    if (trimmed.includes(' ') && i === 0) {
      const pasted = trimmed.split(/\s+/).slice(0, 12)
      const next = [...words]
      pasted.forEach((w, idx) => { next[idx] = w })
      setWords(next)
      setPhraseValid(null)
      inputRefs.current[Math.min(pasted.length - 1, 11)]?.focus()
      return
    }
    const next = [...words]
    next[i] = val.toLowerCase().trim()
    setWords(next)
    setPhraseValid(null)
    // Auto-advance on space or when word is typed
    if (val.endsWith(' ') && i < 11) {
      next[i] = val.trim()
      setWords(next)
      inputRefs.current[i + 1]?.focus()
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && words[i] === '' && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && i < 11) inputRefs.current[i + 1]?.focus()
    if (e.key === 'ArrowLeft'  && i > 0)  inputRefs.current[i - 1]?.focus()
  }

  const clearPhrase = () => {
    setWords(Array(12).fill(''))
    setPhraseValid(null)
    inputRefs.current[0]?.focus()
  }

  // ── Step 0: Validate phrase + check server ownership ─────────────────────
  const handlePhraseNext = async () => {
    const phrase = words.join(' ').trim()
    const filled = words.filter(w => w !== '').length
    if (filled < 12) return toast.error('Enter all 12 words')
    if (!bip39.validateMnemonic(phrase)) {
      setPhraseValid(false)
      return toast.error('Invalid secret phrase. Check your words and try again.')
    }

    setLoading(true)
    try {
      const mnemonicHash = CryptoJS.SHA256(phrase).toString()
      const { data } = await axios.post('/api/user/check-mnemonic', { mnemonicHash })

      if (data.claimed) {
        // Phrase is registered — force login mode with the owning account
        setPhraseValid(false)
        setLoading(false)
        toast.error(`This phrase is already registered to ${data.maskedEmail}. Sign in with that account.`, { duration: 6000 })
        // Pre-switch to login mode and advance so they can sign in with the right account
        setAuthMode('login')
        setPhraseValid(true)
        setStep(1)
        return
      }

      // Not claimed — fresh import
      setPhraseValid(true)
      setStep(1)
    } catch {
      // If server is unreachable, allow locally but warn
      toast('Could not verify phrase ownership — proceeding offline.', { icon: '⚠️' })
      setPhraseValid(true)
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1: Account ───────────────────────────────────────────────────────
  const handleAccountNext = () => {
    if (authMode === 'register') {
      if (username.trim().length < 3) return toast.error('Username must be at least 3 characters')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Enter a valid email')
    } else {
      if (!email) return toast.error('Enter your email')
    }
    setStep(2)
  }

  // ── Step 2: Password → register/login + import ────────────────────────────
  const handlePasswordNext = async () => {
    if (password.length < 8)   return toast.error('Password must be at least 8 characters')
    if (password !== confirm)   return toast.error('Passwords do not match')
    setLoading(true)

    // Authenticate
    try {
      if (authMode === 'register') {
        await register(username.trim(), email.trim().toLowerCase(), password)
      } else {
        await login(email.trim().toLowerCase(), password)
      }
    } catch (err) {
      setLoading(false)
      return toast.error(err?.response?.data?.message || 'Authentication failed')
    }

    // Import wallet
    try {
      const phrase = words.join(' ').trim()
      const mnemonicHash = CryptoJS.SHA256(phrase).toString()
      const { address } = importWallet(phrase, password)
      setWalletAddress(address)

      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      // Bind mnemonic hash to this account — blocks anyone else from using this phrase
      const bindRes = await axios.patch('/api/user/bind-mnemonic', { mnemonicHash }, { headers })
        .catch(err => {
          if (err?.response?.status === 409) {
            throw new Error(err.response.data.message)
          }
        })

      await linkAddress(address).catch(() => {})
      setStep(3)
    } catch (err) {
      console.warn('[importWallet]', err?.message)
      toast.error(err?.message || 'Failed to import wallet')
    } finally {
      setLoading(false)
    }
  }

  const filledCount = words.filter(w => w !== '').length

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute rounded-full blur-3xl opacity-15"
          style={{ width: 700, height: 700, background: '#00F0FF', top: '-20%', right: '-10%' }}
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div className="absolute rounded-full blur-3xl opacity-10"
          style={{ width: 600, height: 600, background: '#9945FF', bottom: '-15%', left: '-10%' }}
          animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} />
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
      </div>

      <div className="w-full max-w-lg relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-brand-muted group-hover:text-white transition-colors text-sm">←</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center"
                style={{ boxShadow: '0 0 12px rgba(109,40,217,0.5)' }}><SuiLogo size={28} /></div>
              <span className="font-display font-extrabold text-white">
                Sui<span className="gradient-text">Vault</span>
              </span>
            </div>
          </Link>
          <span className="text-brand-muted text-xs font-mono">{step + 1} / {STEPS.length}</span>
        </motion.div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-brand-border mb-8 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${((step) / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              background: 'linear-gradient(90deg, #00F0FF, #9945FF)',
              boxShadow: '0 0 10px rgba(0,240,255,0.6)',
            }}
          />
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 0: Enter phrase ─────────────────────────────────────── */}
          {step === 0 && (
            <motion.div key="step0"
              variants={itemVariant} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }}
              className="card p-5 sm:p-8 space-y-6"
            >
              <div>
                <span className="badge-cyan mb-3 inline-flex">Step 1 · Secret Phrase</span>
                <h2 className="text-2xl font-display font-bold text-white mb-1">Enter your secret phrase</h2>
                <p className="text-brand-muted text-sm">Type each word in order, or paste your full phrase into the first box.</p>
              </div>

              {/* Word grid */}
              <div className="grid grid-cols-3 gap-2">
                {words.map((word, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-purple text-xs font-mono w-4 pointer-events-none">
                      {i + 1}
                    </div>
                    <input
                      ref={el => inputRefs.current[i] = el}
                      type="text"
                      autoComplete="off"
                      spellCheck="false"
                      autoCorrect="off"
                      autoCapitalize="none"
                      className={`w-full pl-7 pr-2 py-2.5 rounded-xl text-sm font-mono border transition-all duration-200 focus:outline-none text-white bg-transparent placeholder-brand-border ${
                        word
                          ? 'border-brand-purple/40 bg-brand-purple/5'
                          : 'border-brand-border hover:border-brand-border/60'
                      } focus:border-brand-cyan focus:shadow-[0_0_0_2px_rgba(0,240,255,0.1)]`}
                      placeholder={`word ${i + 1}`}
                      value={word}
                      onChange={e => updateWord(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                    />
                  </div>
                ))}
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-muted">
                  <span style={{ color: filledCount === 12 ? '#14F195' : '#9945FF' }}>{filledCount}</span>
                  /12 words entered
                </span>
                {filledCount > 0 && (
                  <button onClick={clearPhrase} className="text-brand-muted hover:text-red-400 transition-colors">
                    Clear all
                  </button>
                )}
              </div>

              {/* Validation feedback */}
              <AnimatePresence>
                {phraseValid === false && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl border border-red-500/30 bg-red-500/8 text-xs text-red-400"
                  >
                    ✗ Invalid phrase. Each word must be from the BIP39 wordlist. Check spelling carefully.
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-3 rounded-xl border border-brand-yellow/20 bg-brand-yellow/5 text-xs text-brand-yellow leading-relaxed">
                ⚠ Only enter your phrase on trusted devices. SuiVault staff will never ask for your phrase.
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn-cyan w-full py-3.5 font-semibold disabled:opacity-50"
                onClick={handlePhraseNext}
                disabled={loading}
              >
                {loading ? 'Checking phrase…' : 'Verify Phrase →'}
              </motion.button>

              <p className="text-center text-brand-muted text-xs">
                Don't have a wallet?{' '}
                <Link to="/create" className="text-brand-purple hover:underline">Create one instead</Link>
              </p>
            </motion.div>
          )}

          {/* ── STEP 1: Account ──────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="step1"
              variants={itemVariant} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }}
              className="card p-5 sm:p-8 space-y-6"
            >
              <div>
                <span className="badge-purple mb-3 inline-flex">Step 2 · Account</span>
                <h2 className="text-2xl font-display font-bold text-white mb-1">Link your account</h2>
                <p className="text-brand-muted text-sm">Connect a SuiVault account for marketplace and P2P features.</p>
              </div>

              {/* Toggle */}
              <div className="flex rounded-xl border border-brand-border overflow-hidden">
                {['register', 'login'].map(mode => (
                  <button key={mode}
                    onClick={() => setAuthMode(mode)}
                    className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-all duration-200 ${
                      authMode === mode
                        ? 'text-white'
                        : 'text-brand-muted hover:text-white'
                    }`}
                    style={authMode === mode ? {
                      background: 'linear-gradient(135deg, rgba(153,69,255,0.2), rgba(0,240,255,0.1))',
                      boxShadow: '0 0 15px rgba(153,69,255,0.15)',
                    } : {}}
                  >
                    {mode === 'register' ? '✨ New Account' : '🔑 Sign In'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {authMode === 'register' ? (
                  <motion.div key="reg" variants={itemVariant} initial="hidden" animate="show" exit={{ opacity: 0 }}
                    className="space-y-4">
                    <div>
                      <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Username</label>
                      <input className="input" placeholder="e.g. suimaster" value={username}
                        onChange={e => setUsername(e.target.value)} autoFocus />
                    </div>
                    <div>
                      <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Email</label>
                      <input type="email" className="input" placeholder="you@example.com" value={email}
                        onChange={e => setEmail(e.target.value)} />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="login" variants={itemVariant} initial="hidden" animate="show" exit={{ opacity: 0 }}
                    className="space-y-4">
                    <div>
                      <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Email</label>
                      <input type="email" className="input" placeholder="your@email.com" value={email}
                        onChange={e => setEmail(e.target.value)} autoFocus />
                    </div>
                    <div className="p-3 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 text-xs text-brand-cyan">
                      💡 Your account password will be used to re-encrypt your wallet on this device.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="btn-ghost py-3 px-5" onClick={() => setStep(0)}>← Back</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="btn-primary flex-1 py-3" onClick={handleAccountNext}>Continue →</motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Password ─────────────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="step2"
              variants={itemVariant} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }}
              className="card p-5 sm:p-8 space-y-6"
            >
              <div>
                <span className="badge-pink mb-3 inline-flex">Step 3 · Password</span>
                <h2 className="text-2xl font-display font-bold text-white mb-1">
                  {authMode === 'login' ? 'Enter your password' : 'Set a password'}
                </h2>
                <p className="text-brand-muted text-sm">
                  {authMode === 'login'
                    ? 'Used to authenticate your account and encrypt your wallet locally.'
                    : 'This encrypts your wallet on this device and secures your account.'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoFocus
                    />
                    <button type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white text-sm"
                      onClick={() => setShowPw(p => !p)}>
                      {showPw ? '🙈' : '👁'}
                    </button>
                  </div>
                  {authMode === 'register' && <StrengthBar password={password} />}
                </div>

                <div>
                  <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Confirm Password</label>
                  <input
                    type="password" className="input"
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePasswordNext()}
                  />
                  {confirm.length > 0 && (
                    <p className={`text-xs mt-1.5 ${confirm === password ? 'text-brand-green' : 'text-red-400'}`}>
                      {confirm === password ? '✓ Passwords match' : '✗ Does not match'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="btn-ghost py-3 px-5" onClick={() => setStep(1)}>← Back</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="btn-primary flex-1 py-3" onClick={handlePasswordNext} disabled={loading}>
                  {loading ? 'Importing…' : 'Import Wallet →'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Done ─────────────────────────────────────────────── */}
          {step === 3 && (
            <motion.div key="step3"
              variants={itemVariant} initial="hidden" animate="show"
              className="card p-5 sm:p-8 text-center space-y-6"
            >
              {/* Success animation */}
              <div className="flex justify-center">
                <div className="relative">
                  <motion.div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,240,255,0.12), rgba(20,241,149,0.12))',
                      border: '2px solid rgba(0,240,255,0.4)',
                      boxShadow: '0 0 50px rgba(0,240,255,0.25)',
                    }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    🔑
                  </motion.div>
                  {/* Pulse rings */}
                  {[1, 2].map(i => (
                    <motion.div key={i}
                      className="absolute inset-0 rounded-full border border-brand-cyan/20"
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">Wallet Restored!</h2>
                <p className="text-brand-muted text-sm">Your Sui wallet has been successfully imported and encrypted.</p>
              </div>

              {/* Summary */}
              <div className="text-left space-y-3 p-4 rounded-2xl border border-brand-border"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                {[
                  { badge: 'badge-cyan',   text: 'Secret phrase verified' },
                  { badge: 'badge-purple', text: authMode === 'register' ? 'Account created' : 'Account signed in' },
                  { badge: 'badge-green',  text: 'Wallet encrypted locally' },
                  { badge: 'badge-pink',   text: walletAddress ? `${walletAddress.slice(0,10)}…${walletAddress.slice(-6)}` : 'Address linked' },
                ].map(({ badge, text }) => (
                  <motion.div key={text}
                    className="flex items-center gap-3 text-sm"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}>
                    <span className={badge}>✓</span>
                    <span className="text-brand-text font-mono text-xs">{text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="btn-cyan w-full py-4 text-base font-bold"
                onClick={() => navigate('/dashboard')}
              >
                Enter SuiVault ✨
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
