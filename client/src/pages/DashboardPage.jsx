import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '../context/WalletContext'
import Layout from '../components/shared/Layout'

const quickActions = [
  { href: '/send',        icon: '↑', label: 'Send',       desc: 'Transfer assets',  color: '#FF2EF7', bg: 'rgba(255,46,247,0.08)',  border: 'rgba(255,46,247,0.25)' },
  { href: '/receive',     icon: '↓', label: 'Receive',    desc: 'Get paid',         color: '#14F195', bg: 'rgba(20,241,149,0.08)',   border: 'rgba(20,241,149,0.25)' },
  { href: '/p2p',         icon: '⇄', label: 'P2P Swap',   desc: 'Trade directly',  color: '#00F0FF', bg: 'rgba(0,240,255,0.08)',    border: 'rgba(0,240,255,0.25)'  },
  { href: '/marketplace', icon: '⊕', label: 'Marketplace',desc: 'Buy & sell NFTs', color: '#9945FF', bg: 'rgba(153,69,255,0.08)',   border: 'rgba(153,69,255,0.25)' },
  { href: '/nfts',        icon: '◈', label: 'My NFTs',    desc: 'View collection', color: '#FFD600', bg: 'rgba(255,214,0,0.08)',    border: 'rgba(255,214,0,0.25)'  },
  { href: '/history',     icon: '◷', label: 'History',    desc: 'Past transactions',color: '#8B949E', bg: 'rgba(139,148,158,0.08)', border: 'rgba(139,148,158,0.25)'},
]

// Animated number counter
function AnimatedBalance({ value }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const target = parseFloat(value) || 0
    const duration = 1200
    const start = performance.now()
    const animate = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplay((target * eased).toFixed(4))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(ref.current)
  }, [value])

  return <>{display}</>
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } }
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.4 } }
}

export default function DashboardPage() {
  const { address, balance, fetchBalance, fetchObjects, objects, loading } = useWallet()
  const [suiPrice, setSuiPrice] = useState(null)

  useEffect(() => {
    if (!address) return
    fetchBalance().catch(() => {})
    fetchObjects().catch(() => {})
  }, [address]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd')
      .then(r => r.json())
      .then(d => setSuiPrice(d?.sui?.usd ?? null))
      .catch(() => {})
  }, [])

  const suiBalance = (Number(balance) / 1_000_000_000).toFixed(4)
  const usdValue = suiPrice != null ? (parseFloat(suiBalance) * suiPrice).toFixed(2) : null

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

        {/* ── Hero balance card ──────────────────────────────────────────── */}
        <motion.div variants={item} className="relative rounded-3xl overflow-hidden"
          style={{ minHeight: 200 }}>

          {/* Animated gradient background */}
          <div className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #0D0A1E 0%, #0A1628 50%, #0A0A0F 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 8s ease infinite',
            }} />

          {/* Floating orbs inside card */}
          <div className="absolute w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: '#9945FF', top: '-40%', right: '-5%', animation: 'floatY 6s ease-in-out infinite' }} />
          <div className="absolute w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ background: '#00F0FF', bottom: '-30%', left: '5%', animation: 'floatY 8s ease-in-out infinite reverse' }} />

          {/* Animated border */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(153,69,255,0.3), rgba(0,240,255,0.15), rgba(255,46,247,0.1))',
              padding: 1,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }} />

          <div className="relative z-10 p-5 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-green text-xs">● Live · Testnet</span>
                <span className="text-brand-muted text-xs font-mono">
                  {address?.slice(0, 10)}…{address?.slice(-6)}
                </span>
              </div>

              <p className="text-brand-muted text-sm font-medium mb-1 uppercase tracking-widest">Total Balance</p>

              <div className="flex items-end gap-3">
                <motion.h1
                  className="font-display font-extrabold text-white leading-none"
                  style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: 'backOut' }}
                >
                  <AnimatedBalance value={suiBalance} />
                </motion.h1>
                <span className="text-3xl font-bold gradient-text mb-1">SUI</span>
              </div>

              <p className="text-brand-muted text-sm mt-2">
                {usdValue != null ? `≈ $${usdValue} USD` : '≈ — USD'}
              </p>
            </div>

            {/* Rotating Sui logo decoration */}
            <div className="relative w-32 h-32 shrink-0 hidden md:block">
              <div className="absolute inset-0 rounded-full opacity-20"
                style={{ background: 'conic-gradient(from 0deg, #9945FF, #00F0FF, #FF2EF7, #14F195, #9945FF)',
                         animation: 'rotateSlow 8s linear infinite' }} />
              <div className="absolute inset-2 rounded-full flex items-center justify-center text-5xl"
                style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(10px)' }}>
                ◈
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Quick Actions ──────────────────────────────────────────────── */}
        <motion.div variants={item}>
          <p className="text-brand-muted text-xs font-semibold uppercase tracking-widest mb-4">Quick Actions</p>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {quickActions.map(({ href, icon, label, desc, color, bg, border }, i) => (
              <motion.a
                key={href} href={href}
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="relative rounded-2xl p-3 sm:p-4 text-center cursor-pointer overflow-hidden group"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                {/* Hover glow sweep */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${color}20, transparent 70%)` }} />

                <div className="text-2xl sm:text-3xl mb-1.5 sm:mb-2.5 relative z-10 transition-all duration-300 group-hover:scale-110"
                  style={{ color, filter: `drop-shadow(0 0 8px ${color})` }}>
                  {icon}
                </div>
                <p className="text-white text-xs sm:text-sm font-semibold relative z-10 leading-tight">{label}</p>
                <p className="text-brand-muted text-xs mt-0.5 relative z-10 hidden sm:block">{desc}</p>

                {/* Bottom neon line */}
                <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <motion.div variants={item} className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Network', value: 'Sui Testnet', color: '#00F0FF', icon: '🌐' },
            { label: 'Assets',  value: `${objects.length} items`,  color: '#9945FF', icon: '◈' },
            { label: 'Status',  value: 'Active',      color: '#14F195', icon: '●' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="card py-4 text-center">
              <div className="text-xl mb-1" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>{icon}</div>
              <p className="font-bold text-white text-sm">{value}</p>
              <p className="text-brand-muted text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Assets ────────────────────────────────────────────────────── */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-brand-muted text-xs font-semibold uppercase tracking-widest">
              Assets
              <motion.span
                className="ml-2 text-brand-purple"
                key={objects.length}
                initial={{ scale: 1.5 }} animate={{ scale: 1 }}
              >
                {objects.length}
              </motion.span>
            </p>
            {objects.length > 0 && (
              <a href="/nfts" className="text-brand-cyan text-xs hover:underline">View all →</a>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card h-32 animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
          ) : objects.length === 0 ? (
            <motion.div
              className="relative rounded-3xl overflow-hidden flex flex-col items-center justify-center py-24"
              style={{
                background: 'linear-gradient(135deg, rgba(153,69,255,0.06), rgba(0,240,255,0.03))',
                border: '1px dashed rgba(153,69,255,0.25)',
              }}
            >
              {/* Animated rings */}
              <div className="relative mb-6">
                <motion.div
                  className="w-24 h-24 rounded-full border border-brand-purple/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-3 rounded-full border border-brand-cyan/30"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                />
                <div className="absolute inset-6 rounded-full flex items-center justify-center text-3xl"
                  style={{ background: 'rgba(153,69,255,0.1)', border: '1px solid rgba(153,69,255,0.2)' }}>
                  🌌
                </div>
              </div>
              <p className="text-white font-semibold text-lg mb-1">No assets yet</p>
              <p className="text-brand-muted text-sm mb-6">Receive SUI or NFTs to get started</p>
              <motion.a href="/receive" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="btn-primary px-8 py-3">
                Get SUI →
              </motion.a>
            </motion.div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {objects.slice(0, 8).map((obj, i) => (
                <motion.div key={obj.data?.objectId} variants={item}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="card cursor-pointer group"
                >
                  <div className="w-full aspect-square rounded-xl mb-3 overflow-hidden flex items-center justify-center"
                    style={{ background: 'rgba(153,69,255,0.08)', border: '1px solid rgba(153,69,255,0.15)' }}>
                    {obj.data?.display?.data?.image_url
                      ? <img src={obj.data.display.data.image_url} className="w-full h-full object-cover" />
                      : <span className="text-4xl opacity-60">◈</span>
                    }
                  </div>
                  <p className="text-white text-sm font-medium truncate">
                    {obj.data?.display?.data?.name || 'Object'}
                  </p>
                  <p className="text-brand-muted text-xs font-mono truncate mt-0.5">
                    {obj.data?.objectId?.slice(0, 12)}…
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

      </motion.div>
    </Layout>
  )
}
