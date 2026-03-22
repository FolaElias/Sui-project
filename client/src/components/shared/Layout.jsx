import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../../context/WalletContext'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',  icon: '⊡', color: '#9945FF' },
  { to: '/send',        label: 'Send',        icon: '↑', color: '#FF2EF7' },
  { to: '/receive',     label: 'Receive',     icon: '↓', color: '#14F195' },
  { to: '/nfts',        label: 'NFTs',        icon: '◈', color: '#00F0FF' },
  { to: '/marketplace', label: 'Marketplace', icon: '⊕', color: '#FFD600' },
  { to: '/p2p',         label: 'P2P Trade',   icon: '⇄', color: '#FF2EF7' },
  { to: '/history',     label: 'History',     icon: '◷', color: '#9945FF' },
  { to: '/settings',    label: 'Settings',    icon: '⚙', color: '#8B949E' },
]

export default function Layout({ children }) {
  const { lockWallet, address, balance } = useWallet()
  const { lock } = useAuth()
  const handleLock = () => { lockWallet(); lock() }
  const suiBalance = (Number(balance) / 1_000_000_000).toFixed(3)

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-60 shrink-0 flex flex-col py-6 px-3 relative z-20"
        style={{
          background: 'linear-gradient(180deg, rgba(18,18,26,0.98) 0%, rgba(10,10,15,1) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(30px)',
        }}
      >
        {/* Sidebar top glow */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(153,69,255,0.6), transparent)' }} />

        {/* Logo */}
        <motion.div
          className="flex items-center gap-2.5 px-3 mb-6"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black text-white"
              style={{ background: 'linear-gradient(135deg, #9945FF, #00F0FF)', boxShadow: '0 0 20px rgba(153,69,255,0.6)' }}>
              ◈
            </div>
            <div className="absolute inset-0 rounded-xl pulse-ring"
              style={{ border: '1px solid rgba(153,69,255,0.4)' }} />
          </div>
          <span className="text-xl font-display font-extrabold text-white tracking-tight">
            Sui<span className="gradient-text">Vault</span>
          </span>
        </motion.div>

        {/* Balance pill */}
        {address && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="mx-2 mb-5 p-3.5 rounded-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(153,69,255,0.12), rgba(0,240,255,0.06))',
              border: '1px solid rgba(153,69,255,0.2)',
            }}
          >
            {/* Animated shimmer bg */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(153,69,255,0.3) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s linear infinite',
              }} />
            <p className="text-brand-muted text-xs mb-1 font-medium">BALANCE</p>
            <p className="text-white font-bold font-mono text-base leading-tight">
              {suiBalance} <span className="text-brand-cyan">SUI</span>
            </p>
            <p className="text-brand-muted text-xs font-mono mt-1.5 truncate">
              {address?.slice(0, 8)}…{address?.slice(-4)}
            </p>
          </motion.div>
        )}

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto scrollable">
          {navItems.map(({ to, label, icon, color }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.04, ease: 'easeOut' }}
            >
              <NavLink to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive ? 'text-white' : 'text-brand-muted hover:text-white'
                  }`
                }
                style={({ isActive }) => isActive ? {
                  background: `linear-gradient(135deg, ${color}20, ${color}08)`,
                  border: `1px solid ${color}30`,
                  boxShadow: `0 0 16px ${color}20`,
                } : {}}
              >
                {({ isActive }) => (
                  <>
                    <span className="text-base w-5 text-center transition-all duration-200"
                      style={{ color: isActive ? color : undefined,
                               filter: isActive ? `drop-shadow(0 0 6px ${color})` : undefined }}>
                      {icon}
                    </span>
                    <span>{label}</span>
                    {isActive && (
                      <motion.div layoutId="activeIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* Lock */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          onClick={handleLock}
          whileHover={{ x: 3 }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-muted hover:text-red-400 transition-colors mt-2 group"
        >
          <span className="group-hover:rotate-90 transition-transform duration-200">⏻</span>
          Lock Wallet
        </motion.button>

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-0 w-full h-24 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(153,69,255,0.1), transparent)' }} />
      </motion.aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto scrollable relative">
        {/* Ambient background */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
            style={{ background: '#9945FF', top: '-10%', right: '-5%', animation: 'floatY 8s ease-in-out infinite' }} />
          <div className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-8"
            style={{ background: '#00F0FF', bottom: '-10%', left: '10%', animation: 'floatY 10s ease-in-out infinite reverse' }} />
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(153,69,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(153,69,255,0.03) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }} />
        </div>

        <div className="relative z-10 p-8 min-h-full">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
