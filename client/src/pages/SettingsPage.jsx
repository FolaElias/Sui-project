import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CryptoJS from 'crypto-js'
import toast from 'react-hot-toast'
import Layout from '../components/shared/Layout'
import { useWallet } from '../context/WalletContext'
import { useAuth } from '../context/AuthContext'

function Section({ title, icon, color, children }) {
  return (
    <div className="rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg,rgba(18,18,26,0.9),rgba(10,10,15,0.95))',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="h-px w-full"
        style={{ background: `linear-gradient(90deg,transparent,${color}60,transparent)` }} />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xl" style={{ color }}>{icon}</span>
          <h3 className="text-white font-display font-bold text-base">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono, copy }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="flex items-center justify-between py-3 border-b border-brand-border last:border-0 gap-3">
      <span className="text-brand-muted text-sm shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-sm ${mono ? 'font-mono text-brand-cyan' : 'text-white'} max-w-[160px] sm:max-w-[220px] truncate`}>
          {value || '—'}
        </span>
        {copy && value && (
          <button onClick={handleCopy}
            className="text-brand-muted hover:text-white text-xs px-2 py-0.5 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            {copied ? '✓' : '⧉'}
          </button>
        )}
      </div>
    </div>
  )
}

function RevealMnemonicModal({ onClose }) {
  const [password, setPassword] = useState('')
  const [mnemonic, setMnemonic] = useState(null)
  const [error, setError]       = useState('')
  const [revealed, setRevealed] = useState(false)

  const reveal = () => {
    try {
      const stored = localStorage.getItem('sui_keystore')
      if (!stored) throw new Error('No keystore found')
      const dec = CryptoJS.AES.decrypt(stored, password)
      const parsed = JSON.parse(dec.toString(CryptoJS.enc.Utf8))
      setMnemonic(parsed.mnemonic)
      setRevealed(true)
      setError('')
    } catch {
      setError('Incorrect password')
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          background: 'linear-gradient(135deg,rgba(18,18,26,0.99),rgba(10,10,15,1))',
          border: '1px solid rgba(255,214,0,0.2)',
          boxShadow: '0 0 60px rgba(255,214,0,0.1)',
        }}
      >
        <div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg,transparent,#FFD600,transparent)' }} />

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔑</span>
            <div>
              <h3 className="text-white font-bold">Reveal Secret Phrase</h3>
              <p className="text-brand-muted text-xs">Never share this with anyone</p>
            </div>
          </div>

          {!revealed ? (
            <>
              <div className="p-3 rounded-xl border border-yellow-400/20 flex items-start gap-2"
                style={{ background: 'rgba(255,214,0,0.05)' }}>
                <span className="text-yellow-400 text-sm shrink-0">⚠️</span>
                <p className="text-yellow-400/80 text-xs">
                  Your secret phrase gives full access to your wallet. Only reveal it in a safe environment.
                </p>
              </div>

              <div>
                <label className="text-brand-muted text-xs mb-2 block">Enter your password to continue</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && reveal()}
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-brand-border text-white placeholder-brand-muted text-sm outline-none focus:border-brand-purple/50 transition-colors"
                  style={{ caretColor: '#9945FF' }}
                />
                {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
              </div>

              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm text-brand-muted border border-brand-border hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  Cancel
                </button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={reveal}
                  disabled={!password}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-black disabled:opacity-40"
                  style={{ background: '#FFD600' }}>
                  Reveal
                </motion.button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-2xl border border-yellow-400/20"
                style={{ background: 'rgba(255,214,0,0.04)' }}>
                <div className="grid grid-cols-3 gap-2">
                  {mnemonic.split(' ').map((word, i) => (
                    <div key={i} className="flex items-center gap-1.5 p-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <span className="text-brand-muted text-xs w-4 shrink-0">{i + 1}.</span>
                      <span className="text-white text-xs font-mono">{word}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { navigator.clipboard.writeText(mnemonic); toast.success('Copied to clipboard') }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-black"
                  style={{ background: '#FFD600' }}>
                  ⧉ Copy
                </motion.button>
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm text-brand-muted border border-brand-border hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  Done
                </button>
              </div>
            </>
          )}
        </div>

        <div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg,transparent,#FFD600,transparent)' }} />
      </motion.div>
    </motion.div>
  )
}

export default function SettingsPage() {
  const { address, balance } = useWallet()
  const { user, savedEmail, logout } = useAuth()
  const [showReveal, setShowReveal] = useState(false)

  const suiBal = (Number(balance) / 1_000_000_000).toFixed(4)
  const hasKeystore = !!localStorage.getItem('sui_keystore')

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: 'linear-gradient(135deg,rgba(139,148,158,0.15),rgba(139,148,158,0.05))',
              border: '1px solid rgba(139,148,158,0.2)',
            }}>
            ⚙
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Settings</h1>
            <p className="text-brand-muted text-sm">Manage your wallet and account</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Wallet Info */}
          <Section title="Wallet" icon="◈" color="#00F0FF">
            <InfoRow label="Address"    value={address}  mono copy />
            <InfoRow label="Balance"    value={`${suiBal} SUI`} />
            <InfoRow label="Network"    value="Sui Testnet" />
            <InfoRow label="Key type"   value="Ed25519" />

            <div className="mt-4 pt-4 border-t border-brand-border space-y-3">
              {/* Reveal phrase */}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowReveal(true)}
                disabled={!hasKeystore}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition-all disabled:opacity-30"
                style={{
                  background: 'rgba(255,214,0,0.06)',
                  border: '1px solid rgba(255,214,0,0.2)',
                  color: '#FFD600',
                }}
              >
                🔑 Reveal Secret Phrase
              </motion.button>

              {/* Export keystore */}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const stored = localStorage.getItem('sui_keystore')
                  if (!stored) return toast.error('No keystore found')
                  const blob = new Blob([JSON.stringify({ version: 1, keystore: stored }, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url; a.download = 'suivault-keystore.json'; a.click()
                  URL.revokeObjectURL(url)
                  toast.success('Keystore downloaded')
                }}
                disabled={!hasKeystore}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
                style={{
                  background: 'rgba(153,69,255,0.06)',
                  border: '1px solid rgba(153,69,255,0.2)',
                  color: '#9945FF',
                }}
              >
                ⬇ Export Encrypted Keystore
              </motion.button>
            </div>
          </Section>

          {/* Account Info */}
          <Section title="Account" icon="👤" color="#9945FF">
            <InfoRow label="Username" value={user?.username || '—'} />
            <InfoRow label="Email"    value={user?.email || savedEmail || '—'} />
            <InfoRow label="Sui Address" value={user?.suiAddress ? `${user.suiAddress.slice(0,10)}…` : address ? `${address.slice(0,10)}…` : '—'} />
          </Section>

          {/* About */}
          <Section title="About" icon="ℹ" color="#14F195">
            <InfoRow label="App"      value="SuiVault" />
            <InfoRow label="Version"  value="1.0.0" />
            <InfoRow label="Network"  value="Sui Testnet" />
            <InfoRow label="Built on" value="Sui Blockchain" />
          </Section>

          {/* Danger zone */}
          <div className="rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg,rgba(18,18,26,0.9),rgba(10,10,15,0.95))',
              border: '1px solid rgba(255,46,47,0.15)',
            }}
          >
            <div className="h-px w-full"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(255,46,47,0.4),transparent)' }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xl text-red-400">⚠</span>
                <h3 className="text-white font-display font-bold text-base">Danger Zone</h3>
              </div>

              <p className="text-brand-muted text-sm mb-4">
                Removing your wallet from this device will clear all local data. Make sure you have backed up your secret phrase first.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (window.confirm('Are you sure? This will remove your wallet from this device. Back up your secret phrase first!')) {
                    localStorage.removeItem('sui_keystore')
                    handleLogout()
                  }
                }}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: 'rgba(255,46,47,0.08)',
                  border: '1px solid rgba(255,46,47,0.2)',
                  color: '#FF2F2F',
                }}
              >
                🗑 Remove Wallet from Device
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showReveal && <RevealMnemonicModal onClose={() => setShowReveal(false)} />}
      </AnimatePresence>
    </Layout>
  )
}
