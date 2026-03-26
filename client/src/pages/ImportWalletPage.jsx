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

const STEPS = ['Login', 'Secret Phrase', 'Done']

export default function ImportWalletPage() {
  const navigate  = useNavigate()
  const { importWallet } = useWallet()
  const { login, linkAddress } = useAuth()

  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)

  // Step 0 — credentials
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)

  // Step 1 — phrase
  const [words, setWords]         = useState(Array(12).fill(''))
  const [phraseValid, setPhraseValid] = useState(true)
  const inputRefs = useRef([])

  // kept in memory to re-import after phrase verified
  const [storedPassword, setStoredPassword] = useState('')
  const [token, setToken] = useState('')

  // ── Step 0: Login ─────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim()) return toast.error('Enter your email')
    if (!password)     return toast.error('Enter your password')
    setLoading(true)
    try {
      const { data } = await axios.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      })
      localStorage.setItem('token', data.token)
      localStorage.setItem('sui_email', email.trim().toLowerCase())
      setToken(data.token)
      setStoredPassword(password)
      toast.success(`Welcome back, ${data.user.username}!`)
      setStep(1)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1: Verify phrase → import wallet ─────────────────────────────────
  const handlePhraseImport = async () => {
    const phrase = words.join(' ').trim()
    if (words.filter(w => w).length < 12) return toast.error('Enter all 12 words')
    if (!bip39.validateMnemonic(phrase)) {
      setPhraseValid(false)
      return toast.error('Invalid secret phrase — check your words.')
    }
    setPhraseValid(true)
    setLoading(true)

    try {
      const mnemonicHash = CryptoJS.SHA256(phrase).toString()

      // Verify phrase belongs to this account
      await axios.post('/api/user/verify-mnemonic', { mnemonicHash }, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Import wallet locally with their password
      const { address } = importWallet(phrase, storedPassword)
      await linkAddress(address).catch(() => {})
      setStep(2)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Phrase verification failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Word input helpers ────────────────────────────────────────────────────
  const handleWordChange = (i, val) => {
    if (val.includes(' ')) {
      const parts = val.trim().toLowerCase().split(/\s+/).slice(0, 12)
      const updated = [...words]
      parts.forEach((p, j) => { updated[j] = p })
      setWords(updated)
      setTimeout(() => inputRefs.current[Math.min(parts.length, 11)]?.focus(), 0)
      return
    }
    const updated = [...words]
    updated[i] = val.toLowerCase()
    setWords(updated)
    setPhraseValid(true)
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
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ boxShadow: '0 0 25px rgba(153,69,255,0.5)' }}>
              <SuiLogo size={40} />
            </div>
            <h1 className="text-3xl font-display font-extrabold text-white">
              Sui<span className="gradient-text">Vault</span>
            </h1>
          </div>
          <p className="text-brand-muted text-sm">Restore your existing wallet</p>
        </div>

        {/* Step indicator */}
        {step < 2 && (
          <div className="flex items-center gap-2 mb-6 justify-center">
            {STEPS.slice(0, 2).map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                  i < step ? 'bg-brand-green text-black' : i === step ? 'bg-brand-purple text-white' : 'bg-brand-border text-brand-muted'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-white' : 'text-brand-muted'}`}>{label}</span>
                {i < 1 && <div className={`w-10 h-px ${i < step ? 'bg-brand-green' : 'bg-brand-border'}`} />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Step 0: Login ──────────────────────────────────────────────── */}
          {step === 0 && (
            <motion.div key="login" className="card p-5 sm:p-8 space-y-5"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>

              <div>
                <h2 className="text-lg font-display font-bold text-white mb-1">Sign in to your account</h2>
                <p className="text-brand-muted text-sm">Use the email and password you registered with.</p>
              </div>

              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Email</label>
                <input type="email" className="input" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoFocus />
              </div>

              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input pr-10"
                    placeholder="Your wallet password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                  <button type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white text-sm"
                    onClick={() => setShowPw(p => !p)}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-3.5 font-semibold disabled:opacity-50"
                onClick={handleLogin} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </motion.button>

              <div className="text-center space-y-2 pt-1 border-t border-brand-border">
                <p className="text-brand-muted text-xs pt-2">Don't have an account?</p>
                <Link to="/create" className="text-brand-cyan text-sm hover:underline block">
                  Create a new wallet →
                </Link>
                <Link to="/unlock" className="text-brand-muted text-xs hover:text-white block transition-colors">
                  ← Back to unlock
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── Step 1: Secret phrase ──────────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="phrase" className="card p-5 sm:p-8 space-y-5"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>

              <div>
                <h2 className="text-lg font-display font-bold text-white mb-1">Enter your secret phrase</h2>
                <p className="text-brand-muted text-sm">
                  Enter the 12 words linked to <span className="text-brand-cyan font-medium">{email}</span>.
                  Wrong phrase will be rejected.
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
                      autoCorrect="off"
                      autoCapitalize="none"
                      value={w}
                      onChange={e => handleWordChange(i, e.target.value)}
                      onKeyDown={e => handleWordKey(i, e)}
                      className={`w-full pl-7 pr-2 py-2.5 rounded-xl text-sm font-mono text-white border transition-all outline-none bg-transparent ${
                        w ? 'border-brand-purple/50 bg-brand-purple/10' : 'border-brand-border bg-white/[0.03]'
                      } focus:border-brand-purple`}
                    />
                  </div>
                ))}
              </div>

              <p className="text-brand-muted text-xs text-center">
                Tip: paste all 12 words into the first box at once
              </p>

              <div className="flex gap-3">
                <button className="btn-ghost flex-1 py-3 text-sm"
                  onClick={() => { setStep(0); setWords(Array(12).fill('')) }}>
                  ← Back
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="btn-primary flex-1 py-3 font-semibold disabled:opacity-50"
                  onClick={handlePhraseImport} disabled={loading}>
                  {loading ? 'Verifying…' : 'Import Wallet →'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Done ──────────────────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="done" className="card p-5 sm:p-8 text-center space-y-6"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>

              <motion.div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl"
                style={{ background: 'linear-gradient(135deg,rgba(20,241,149,0.15),rgba(0,240,255,0.08))', border: '1px solid rgba(20,241,149,0.3)' }}
                animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 0.5 }}>
                ✅
              </motion.div>

              <div>
                <h2 className="text-xl font-display font-bold text-white mb-2">Wallet Restored!</h2>
                <p className="text-brand-muted text-sm leading-relaxed">
                  Your wallet has been imported successfully and is ready to use.
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
