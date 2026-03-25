import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { useWallet } from '../context/WalletContext'
import Layout from '../components/shared/Layout'

const testnetClient = new SuiClient({ url: getFullnodeUrl('testnet') })
const MIST = 1_000_000_000

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

function RecentTxs({ address }) {
  const [txs, setTxs]         = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return
    setLoading(true)
    Promise.all([
      testnetClient.queryTransactionBlocks({
        filter: { ToAddress: address },
        options: { showEffects: true, showBalanceChanges: true },
        limit: 5, order: 'descending',
      }),
      testnetClient.queryTransactionBlocks({
        filter: { FromAddress: address },
        options: { showEffects: true, showBalanceChanges: true },
        limit: 5, order: 'descending',
      }),
    ]).then(([received, sent]) => {
      const seen = new Set()
      const merged = [...received.data, ...sent.data]
        .filter(tx => { if (seen.has(tx.digest)) return false; seen.add(tx.digest); return true })
        .sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs))
        .slice(0, 5)
      setTxs(merged)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [address])

  const getChange = (tx) => {
    const changes = tx?.balanceChanges || []
    const mine = changes.find(c => c.owner?.AddressOwner?.toLowerCase() === address?.toLowerCase())
    if (!mine) return null
    const val = Number(mine.amount)
    return {
      positive: val > 0,
      amount: `${val > 0 ? '+' : ''}${(val / MIST).toFixed(4)} SUI`,
      color: val > 0 ? '#4ade80' : '#f472b6',
      icon: val > 0 ? '↓' : '↑',
      label: val > 0 ? 'Received' : 'Sent',
    }
  }

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-brand-muted text-xs font-semibold uppercase tracking-widest">Recent Transactions</p>
        <Link to="/history" className="text-brand-cyan text-xs hover:underline">View all →</Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl h-14 animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      ) : txs.length === 0 ? (
        <div className="rounded-2xl flex flex-col items-center justify-center py-12 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(153,69,255,0.2)' }}>
          <span className="text-3xl mb-3 opacity-50">◷</span>
          <p className="text-brand-muted text-sm">No transactions yet</p>
          <Link to="/receive" className="text-brand-cyan text-xs mt-2 hover:underline">Get SUI from faucet →</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {txs.map(tx => {
            const ch = getChange(tx)
            const date = new Date(Number(tx.timestampMs))
            const status = tx?.effects?.status?.status
            return (
              <motion.div key={tx.digest}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: ch ? ch.color : '#8B949E',
                  }}>
                  {ch ? ch.icon : '⇄'}
                </div>

                {/* Label + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{ch ? ch.label : 'Interaction'}</p>
                  <p className="text-brand-muted text-xs font-mono">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}
                    {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Amount + status */}
                <div className="text-right shrink-0">
                  {ch && (
                    <p className="text-sm font-bold font-mono" style={{ color: ch.color }}>{ch.amount}</p>
                  )}
                  <span className={`text-xs ${status === 'success' ? 'text-brand-green' : 'text-red-400'}`}>
                    {status === 'success' ? '✓' : '✗'} {status}
                  </span>
                </div>

                {/* Explorer link */}
                <a href={`https://suiscan.xyz/testnet/tx/${tx.digest}`}
                  target="_blank" rel="noreferrer"
                  className="text-brand-muted hover:text-brand-cyan text-xs shrink-0 transition-colors">
                  ↗
                </a>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
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
              <motion.div
                key={href}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 600, damping: 22 }}
              >
              <Link
                to={href}
                className="relative rounded-2xl p-3 sm:p-4 text-center cursor-pointer overflow-hidden group block"
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
              </Link>
              </motion.div>
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

        {/* ── Recent Transactions ───────────────────────────────────────── */}
        <RecentTxs address={address} />

      </motion.div>
    </Layout>
  )
}
