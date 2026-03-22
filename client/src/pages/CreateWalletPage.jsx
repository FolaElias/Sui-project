import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STEPS = ['Account', 'Password', 'Backup', 'Verify', 'Done']

function StrengthBar({ password }) {
  const levels = [
    { min: 1,  color: '#FF2EF7', label: 'Weak' },
    { min: 8,  color: '#FFD600', label: 'Fair' },
    { min: 10, color: '#FF9500', label: 'Good' },
    { min: 12, color: '#14F195', label: 'Strong' },
  ]
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
        <p className="text-xs" style={{ color: active?.color || '#6B7280' }}>{active?.label || 'Too short'}</p>
      )}
    </div>
  )
}

export default function CreateWalletPage() {
  const navigate = useNavigate()
  const { createWallet } = useWallet()
  const { register, linkAddress } = useAuth()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Step 0 — account
  const [username, setUsername]   = useState('')
  const [email, setEmail]         = useState('')

  // Step 1 — password
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)

  // Step 2 — backup
  const [mnemonic, setMnemonic]   = useState('')
  const [words, setWords]         = useState([])
  const [copied, setCopied]       = useState(false)
  const [backedUp, setBackedUp]   = useState(false)

  // Step 3 — verify
  const [quizWords, setQuizWords] = useState([])

  // Step 4 — wallet address (set after wallet is created)
  const [walletAddress, setWalletAddress] = useState('')

  // ── Step 0: Validate account fields, move to password step ─────────────
  const handleAccountNext = () => {
    if (username.trim().length < 3) return toast.error('Username must be at least 3 characters')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Enter a valid email address')
    setStep(1)
  }

  // ── Step 1: Register account + generate wallet ───────────────────────────
  const handlePasswordNext = async () => {
    if (password.length < 8)  return toast.error('Password must be at least 8 characters')
    if (password !== confirm)  return toast.error('Passwords do not match')
    setLoading(true)
    try {
      // 1. Register account on backend
      await register(username.trim(), email.trim().toLowerCase(), password)
    } catch (err) {
      setLoading(false)
      return toast.error(err?.response?.data?.message || 'Registration failed. Try again.')
    }

    try {
      // 2. Generate wallet locally (separate try so register errors don't mix)
      const { mnemonic: m, address: addr } = createWallet(password)
      const wordList = m.split(' ')
      setMnemonic(m)
      setWords(wordList)
      setWalletAddress(addr)

      // Pick 3 random quiz positions
      const positions = []
      while (positions.length < 3) {
        const i = Math.floor(Math.random() * 12)
        if (!positions.includes(i)) positions.push(i)
      }
      setQuizWords(
        positions.sort((a, b) => a - b).map(i => ({ index: i, answer: wordList[i], input: '' }))
      )

      setStep(2)
    } catch (err) {
      console.error('createWallet error:', err)
      toast.error('Failed to generate wallet: ' + (err?.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Copy mnemonic ────────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Step 3: Verify quiz ──────────────────────────────────────────────────
  const updateQuizInput = (i, val) =>
    setQuizWords(prev => prev.map((q, idx) => idx === i ? { ...q, input: val } : q))

  const handleVerify = async () => {
    const allCorrect = quizWords.every(q => q.input.trim().toLowerCase() === q.answer.toLowerCase())
    if (!allCorrect) return toast.error('Some words are wrong — double check your phrase.')

    setLoading(true)
    try {
      // Link Sui address to user profile on backend
      await linkAddress(walletAddress)
      setStep(4)
    } catch {
      toast.error('Failed to link address. You can link it later in Settings.')
      setStep(4)  // still proceed — wallet is created
    } finally {
      setLoading(false)
    }
  }

  // ── Step 4: Enter app ────────────────────────────────────────────────────
  const handleEnter = () => navigate('/dashboard')

  // ── Shared UI ────────────────────────────────────────────────────────────
  const stepProgress = (step / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background */}
      <div className="orb w-96 h-96 bg-brand-purple -top-32 -left-32" />
      <div className="orb w-80 h-80 bg-brand-cyan bottom-0 -right-24" />
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(153,69,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(153,69,255,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      <div className="w-full max-w-md relative z-10">

        {/* Logo / back */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-brand-muted group-hover:text-white transition-colors text-sm">←</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-white"
                style={{ background: 'linear-gradient(135deg, #9945FF, #00F0FF)' }}>◈</div>
              <span className="font-display font-extrabold text-white">
                Sui<span className="gradient-text">Vault</span>
              </span>
            </div>
          </Link>
          <span className="text-brand-muted text-xs font-mono">{step + 1} / {STEPS.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-brand-border mb-8 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${stepProgress}%`,
              background: 'linear-gradient(90deg, #9945FF, #00F0FF)',
              boxShadow: '0 0 8px rgba(153,69,255,0.6)',
            }} />
        </div>

        {/* ── STEP 0: Account ─────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="card p-8 space-y-6">
            <div>
              <span className="badge-purple mb-3 inline-flex">Step 1 · Account</span>
              <h2 className="text-2xl font-display font-bold text-white mb-1">Create your account</h2>
              <p className="text-brand-muted text-sm">Your profile on the SuiVault platform.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Username</label>
                <input
                  className="input"
                  placeholder="e.g. suimaster"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAccountNext()}
                />
              </div>
            </div>

            <button className="btn-primary w-full py-3.5" onClick={handleAccountNext}>
              Continue →
            </button>

            <p className="text-center text-brand-muted text-xs">
              Already have a wallet?{' '}
              <Link to="/import" className="text-brand-cyan hover:underline">Import it</Link>
            </p>
          </div>
        )}

        {/* ── STEP 1: Password ────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="card p-8 space-y-6">
            <div>
              <span className="badge-cyan mb-3 inline-flex">Step 2 · Security</span>
              <h2 className="text-2xl font-display font-bold text-white mb-1">Set your password</h2>
              <p className="text-brand-muted text-sm">Encrypts your wallet locally. Used to lock &amp; unlock this device.</p>
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
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white text-sm"
                    onClick={() => setShowPw(p => !p)}
                  >{showPw ? '🙈' : '👁'}</button>
                </div>
                <StrengthBar password={password} />
              </div>

              <div>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Confirm Password</label>
                <input
                  type="password"
                  className="input"
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

            <div className="p-3 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 text-xs text-brand-cyan leading-relaxed">
              💡 Your secret phrase can recover your wallet if you forget this password.
            </div>

            <div className="flex gap-3">
              <button className="btn-ghost py-3 px-5" onClick={() => setStep(0)}>← Back</button>
              <button className="btn-primary flex-1 py-3" onClick={handlePasswordNext} disabled={loading}>
                {loading ? 'Creating account…' : 'Generate Wallet →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Backup mnemonic ──────────────────────────────────────── */}
        {step === 2 && (
          <div className="card p-8 space-y-6">
            <div>
              <span className="badge-pink mb-3 inline-flex">Step 3 · Backup</span>
              <h2 className="text-2xl font-display font-bold text-white mb-1">Your secret phrase</h2>
              <p className="text-brand-muted text-sm">Write these 12 words down in order and store them somewhere safe.</p>
            </div>

            {/* Word grid */}
            <div className="grid grid-cols-3 gap-2">
              {words.map((word, i) => (
                <div key={i}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-brand-border"
                  style={{ background: 'rgba(153,69,255,0.06)' }}
                >
                  <span className="text-brand-purple text-xs font-mono w-4 shrink-0">{i + 1}</span>
                  <span className="text-white text-sm font-mono font-medium">{word}</span>
                </div>
              ))}
            </div>

            <button className="btn-ghost w-full py-2.5 text-sm" onClick={handleCopy}>
              {copied ? '✓ Copied!' : '📋 Copy all 12 words'}
            </button>

            <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 leading-relaxed">
              🚨 Never share this phrase. Anyone with these words controls your wallet forever.
            </div>

            <label className="flex items-start gap-3 cursor-pointer" onClick={() => setBackedUp(p => !p)}>
              <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                backedUp ? 'bg-brand-green border-brand-green' : 'border-brand-border'
              }`}>
                {backedUp && <span className="text-brand-bg text-xs font-bold">✓</span>}
              </div>
              <span className="text-brand-muted text-sm">I've written down my secret phrase and stored it safely</span>
            </label>

            <button className="btn-primary w-full py-3.5" disabled={!backedUp} onClick={() => setStep(3)}>
              Verify Backup →
            </button>
          </div>
        )}

        {/* ── STEP 3: Verify quiz ──────────────────────────────────────────── */}
        {step === 3 && (
          <div className="card p-8 space-y-6">
            <div>
              <span className="badge-green mb-3 inline-flex">Step 4 · Verify</span>
              <h2 className="text-2xl font-display font-bold text-white mb-1">Confirm your backup</h2>
              <p className="text-brand-muted text-sm">Enter the 3 words below to prove you've saved your phrase.</p>
            </div>

            <div className="space-y-4">
              {quizWords.map((q, i) => {
                const correct = q.input.trim().toLowerCase() === q.answer.toLowerCase()
                const dirty = q.input.length > 0
                return (
                  <div key={i}>
                    <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">
                      Word #{q.index + 1}
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      spellCheck="false"
                      className={`input transition-all duration-200 ${dirty ? (correct ? 'border-brand-green' : 'border-red-500/60') : ''}`}
                      placeholder={`Enter word #${q.index + 1}`}
                      value={q.input}
                      onChange={e => updateQuizInput(i, e.target.value)}
                    />
                    {dirty && (
                      <p className={`text-xs mt-1 ${correct ? 'text-brand-green' : 'text-red-400'}`}>
                        {correct ? '✓ Correct' : '✗ Incorrect'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button className="btn-ghost py-3 px-5" onClick={() => setStep(2)}>← Back</button>
              <button
                className="btn-primary flex-1 py-3"
                onClick={handleVerify}
                disabled={loading || quizWords.some(q => q.input.trim() === '')}
              >
                {loading ? 'Finishing…' : 'Confirm & Finish →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Done ────────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="card p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl animate-float"
                style={{
                  background: 'linear-gradient(135deg, rgba(20,241,149,0.12), rgba(0,240,255,0.12))',
                  border: '2px solid rgba(20,241,149,0.4)',
                  boxShadow: '0 0 50px rgba(20,241,149,0.2)',
                }}>
                🎉
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">You're all set!</h2>
              <p className="text-brand-muted text-sm leading-relaxed">
                Your account and Sui wallet are ready. Welcome to SuiVault.
              </p>
            </div>

            {/* Summary */}
            <div className="text-left space-y-3 p-4 rounded-xl border border-brand-border"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-3 text-sm">
                <span className="badge-green">✓</span>
                <span className="text-brand-text">Account created — <span className="text-white font-semibold">@{username}</span></span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="badge-purple">✓</span>
                <span className="text-brand-text">Wallet generated &amp; encrypted</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="badge-cyan">✓</span>
                <span className="text-brand-text">Secret phrase backed up</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="badge-pink">✓</span>
                <span className="text-brand-text font-mono text-xs truncate">
                  {walletAddress.slice(0, 10)}…{walletAddress.slice(-6)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-brand-yellow/20 bg-brand-yellow/5 text-xs text-brand-yellow leading-relaxed">
              🔑 You're on Testnet. Get free SUI from the Sui faucet to start testing.
            </div>

            <button className="btn-primary w-full py-4 text-base" onClick={handleEnter}>
              Enter SuiVault ✨
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
