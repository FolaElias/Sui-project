import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useWallet } from '../context/WalletContext'
import SuiLogo from '../components/shared/SuiLogo'

const features = [
  { icon: '🔐', label: 'Non-custodial', desc: 'Your keys, always', color: '#9945FF' },
  { icon: '⚡', label: 'Instant swaps', desc: 'P2P atomic trades', color: '#00F0FF' },
  { icon: '◈',  label: 'NFT market',   desc: 'Buy, sell, collect', color: '#FF2EF7' },
  { icon: '🌐', label: 'Sui Network',  desc: 'Sub-second finality', color: '#14F195' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { hasWallet } = useWallet()

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden relative bg-brand-bg">

      {/* ── Animated background ─────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grid */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(153,69,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(153,69,255,0.06) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        {/* Orbs */}
        <motion.div className="absolute rounded-full blur-3xl"
          style={{ width: 700, height: 700, background: 'rgba(153,69,255,0.15)', top: '-20%', left: '-10%' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute rounded-full blur-3xl"
          style={{ width: 600, height: 600, background: 'rgba(0,240,255,0.1)', bottom: '-15%', right: '-10%' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
        <motion.div className="absolute rounded-full blur-3xl"
          style={{ width: 400, height: 400, background: 'rgba(255,46,247,0.08)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />

        {/* Spinning ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            className="border rounded-full border-brand-purple/10"
            style={{ width: 900, height: 900 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border rounded-full border-brand-cyan/8"
            style={{ width: 650, height: 650 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>

      {/* ── Left: Hero content ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 md:px-16 py-12 md:py-0 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-purple/30 bg-brand-purple/10 mb-8"
          >
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-brand-green inline-block" />
            <span className="text-brand-muted text-xs font-medium">Live on Sui Testnet</span>
          </motion.div>

          {/* Headline */}
          <h1 className="font-display font-extrabold leading-none mb-6"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)' }}>
            <motion.span
              className="block text-white"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
            >
              Your Sui
            </motion.span>
            <motion.span
              className="block text-shimmer"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
            >
              Superpower.
            </motion.span>
          </h1>

          <motion.p
            className="text-brand-muted text-lg leading-relaxed max-w-md mb-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          >
            A non-custodial wallet, NFT marketplace, and P2P trading platform built for the Sui blockchain.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex gap-3 flex-wrap"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            {hasWallet ? (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="btn-primary px-8 py-4 text-base"
                onClick={() => navigate('/unlock')}>
                🔓 Unlock Wallet
              </motion.button>
            ) : (
              <>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="btn-primary px-8 py-4 text-base"
                  onClick={() => navigate('/create')}>
                  ✨ Create Wallet
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="btn-ghost px-8 py-4 text-base"
                  onClick={() => navigate('/import')}>
                  📥 Import Wallet
                </motion.button>
              </>
            )}
          </motion.div>

          {/* Trust line */}
          <motion.p
            className="text-brand-muted text-xs mt-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          >
            🔑 Keys never leave your device · Open source · Zero custodial risk
          </motion.p>
        </motion.div>
      </div>

      {/* ── Right: Feature cards ─────────────────────────────────────────── */}
      <div className="w-full md:w-96 flex flex-col justify-center gap-4 px-6 sm:px-8 md:px-8 pb-12 md:py-0 relative z-10">

        {/* Big logo card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.6, type: 'spring', stiffness: 120 }}
          className="relative rounded-3xl p-6 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(153,69,255,0.15), rgba(0,240,255,0.08))',
            border: '1px solid rgba(153,69,255,0.3)',
            boxShadow: '0 0 60px rgba(153,69,255,0.2)',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-brand-purple/10"
          />
          <div className="relative z-10">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-3 flex justify-center"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 0 32px rgba(76,163,255,0.5)' }}>
                <SuiLogo size={64} />
              </div>
            </motion.div>
            <h2 className="font-display font-extrabold text-2xl text-white mb-0.5">
              Sui<span className="gradient-text">Vault</span>
            </h2>
            <p className="text-brand-muted text-xs">Web3 · Wallet · Marketplace</p>
          </div>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3">
          {features.map(({ icon, label, desc, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.08, type: 'spring', stiffness: 200 }}
              whileHover={{ y: -4, scale: 1.04 }}
              className="card p-4 cursor-default"
            >
              <div className="text-2xl mb-2" style={{ color, filter: `drop-shadow(0 0 6px ${color})` }}>{icon}</div>
              <p className="text-white text-xs font-semibold">{label}</p>
              <p className="text-brand-muted text-xs mt-0.5">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="flex justify-between px-2"
        >
          {[
            { v: '<1s',    l: 'Finality' },
            { v: '~$0',   l: 'Gas fees' },
            { v: '100%',  l: 'Self-custody' },
          ].map(({ v, l }) => (
            <div key={l} className="text-center">
              <p className="text-white font-bold font-display text-lg gradient-text">{v}</p>
              <p className="text-brand-muted text-xs">{l}</p>
            </div>
          ))}
        </motion.div>
      </div>

    </div>
  )
}
