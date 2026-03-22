import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function UnlockPage() {
  const navigate = useNavigate()
  const { unlockWallet } = useWallet()
  const { login, savedEmail } = useAuth()

  const [email, setEmail]       = useState(savedEmail)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleUnlock = async () => {
    if (!password) return toast.error('Enter your password')
    setLoading(true)
    try {
      // Decrypt local wallet
      unlockWallet(password)

      // Re-authenticate with backend (if email available)
      if (email) {
        try {
          await login(email, password)
        } catch {
          // Wallet unlocked fine — backend auth optional, don't block user
        }
      }

      navigate('/dashboard')
    } catch {
      toast.error('Wrong password. Try again.')
    } finally {
      setLoading(false)
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

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black text-white"
              style={{ background: 'linear-gradient(135deg, #9945FF, #00F0FF)', boxShadow: '0 0 25px rgba(153,69,255,0.5)' }}>
              ◈
            </div>
            <h1 className="text-3xl font-display font-extrabold text-white">
              Sui<span className="gradient-text">Vault</span>
            </h1>
          </div>
          <p className="text-brand-muted text-sm">Welcome back. Enter your password to unlock.</p>
        </div>

        <div className="card p-8 space-y-5">

          {/* Email — pre-filled but editable */}
          <div>
            <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Your wallet password"
                value={password}
                autoFocus
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white text-sm"
                onClick={() => setShowPw(p => !p)}
              >{showPw ? '🙈' : '👁'}</button>
            </div>
          </div>

          <button className="btn-primary w-full py-3.5" onClick={handleUnlock} disabled={loading}>
            {loading ? 'Unlocking…' : '🔓 Unlock Wallet'}
          </button>

          <div className="border-t border-brand-border pt-4 space-y-2">
            <p className="text-brand-muted text-xs text-center">Forgot your password?</p>
            <Link to="/import"
              className="block text-center text-brand-cyan text-sm hover:underline">
              Restore with secret phrase →
            </Link>
          </div>
        </div>

        <p className="text-center text-brand-muted text-xs mt-6">
          Different device?{' '}
          <Link to="/create" className="text-brand-purple hover:underline">Create a new wallet</Link>
        </p>
      </div>
    </div>
  )
}
