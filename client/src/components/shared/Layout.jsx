import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../../context/WalletContext'
import { useAuth } from '../../context/AuthContext'
import SuiLogo from './SuiLogo'

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

// Bottom nav shows these 5 primary items on mobile
const bottomNavItems = [
  { to: '/dashboard',   label: 'Home',     icon: '⊡', color: '#9945FF' },
  { to: '/send',        label: 'Send',     icon: '↑', color: '#FF2EF7' },
  { to: '/receive',     label: 'Receive',  icon: '↓', color: '#14F195' },
  { to: '/marketplace', label: 'Market',   icon: '⊕', color: '#FFD600' },
  { to: '/settings',    label: 'More',     icon: '⚙', color: '#8B949E' },
]

// ── Lock confirm modal ─────────────────────────────────────────────────────────
function LockConfirmModal({ onConfirm, onCancel }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />

      <motion.div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.85, opacity: 0, y: 20  }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          background: 'linear-gradient(135deg, rgba(18,18,26,0.98), rgba(10,10,15,0.99))',
          border: '1px solid rgba(255,46,247,0.2)',
          boxShadow: '0 0 60px rgba(255,46,247,0.15), 0 0 120px rgba(153,69,255,0.1)',
        }}
      >
        <div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #FF2EF7, #9945FF, transparent)' }} />

        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <motion.div
            className="absolute rounded-full blur-3xl opacity-10"
            style={{ width: 300, height: 300, background: '#FF2EF7', top: '-50%', left: '-20%' }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>

        <div className="relative z-10 p-8 text-center space-y-6">
          <div className="flex justify-center">
            <motion.div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl relative"
              style={{
                background: 'linear-gradient(135deg, rgba(255,46,247,0.1), rgba(153,69,255,0.08))',
                border: '1px solid rgba(255,46,247,0.25)',
              }}
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              🔒
              <motion.div
                className="absolute inset-0 rounded-2xl border border-brand-pink/20"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </div>

          <div>
            <h3 className="text-xl font-display font-bold text-white mb-2">Lock your wallet?</h3>
            <p className="text-brand-muted text-sm leading-relaxed">
              Your wallet will be locked and cleared from memory.
              You'll need your <span className="text-brand-cyan font-medium">password</span> to unlock it again.
            </p>
          </div>

          <div className="px-4 py-2 rounded-xl border border-brand-border inline-flex items-center gap-2"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="w-2 h-2 rounded-full bg-brand-green inline-block shrink-0" />
            <span className="text-brand-muted text-xs font-mono">Currently active session</span>
          </div>

          <div className="flex gap-3 pt-1">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-brand-muted border border-brand-border transition-all hover:text-white hover:border-brand-border/60"
              style={{ background: 'rgba(255,255,255,0.03)' }}
              onClick={onCancel}
            >
              Cancel
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(255,46,247,0.5)' }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #FF2EF7, #9945FF)',
                boxShadow: '0 0 20px rgba(255,46,247,0.3)',
              }}
              onClick={onConfirm}
            >
              🔒 Lock Wallet
            </motion.button>
          </div>
        </div>

        <div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #9945FF, #00F0FF, transparent)' }} />
      </motion.div>
    </motion.div>
  )
}

export default function Layout({ children }) {
  const { lockWallet, address, balance } = useWallet()
  const { lock } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showLockModal, setShowLockModal] = useState(false)

  const handleLockConfirm = () => {
    setShowLockModal(false)
    lockWallet()
    lock()
    navigate('/')
  }

  const suiBalance = (Number(balance) / 1_000_000_000).toFixed(3)

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Sidebar (desktop only) ────────────────────────────────────────── */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="hidden md:flex w-60 shrink-0 flex-col py-6 px-3 relative z-20"
        style={{
          background: 'linear-gradient(180deg, rgba(18,18,26,0.98) 0%, rgba(10,10,15,1) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(30px)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(153,69,255,0.6), transparent)' }} />

        {/* Logo */}
        <motion.div
          className="flex items-center gap-2.5 px-3 mb-6"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ boxShadow: '0 0 20px rgba(76,163,255,0.5)' }}>
              <SuiLogo size={36} />
            </div>
            <div className="absolute inset-0 rounded-xl pulse-ring"
              style={{ border: '1px solid rgba(76,163,255,0.4)' }} />
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
          onClick={() => setShowLockModal(true)}
          whileHover={{ x: 3 }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-muted hover:text-red-400 transition-colors mt-2 group"
        >
          <span className="group-hover:rotate-90 transition-transform duration-200">⏻</span>
          Lock Wallet
        </motion.button>

        <div className="absolute bottom-0 left-0 w-full h-24 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(153,69,255,0.1), transparent)' }} />
      </motion.aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto scrollable relative flex flex-col">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 shrink-0 relative z-20"
          style={{
            background: 'rgba(10,10,15,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden"
              style={{ boxShadow: '0 0 12px rgba(76,163,255,0.5)' }}>
              <SuiLogo size={28} />
            </div>
            <span className="text-base font-display font-extrabold text-white tracking-tight">
              Sui<span className="gradient-text">Vault</span>
            </span>
          </div>

          {/* Balance + lock */}
          <div className="flex items-center gap-3">
            {address && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-brand-purple/20"
                style={{ background: 'rgba(153,69,255,0.08)' }}>
                <span className="text-white font-bold font-mono text-xs">{suiBalance}</span>
                <span className="text-brand-cyan text-xs">SUI</span>
              </div>
            )}
            <button onClick={() => setShowLockModal(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-brand-muted hover:text-red-400 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              ⏻
            </button>
          </div>
        </div>

        {/* Ambient background */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute w-[700px] h-[700px] rounded-full blur-3xl opacity-40"
            style={{ background: '#6d28d9', top: '-15%', right: '-10%', animation: 'floatY 8s ease-in-out infinite' }} />
          <div className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-30"
            style={{ background: '#1d4ed8', bottom: '-15%', left: '5%', animation: 'floatY 10s ease-in-out infinite reverse' }} />
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(153,69,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(153,69,255,0.03) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }} />
        </div>

        {/* Page content */}
        <div className="relative z-10 p-4 sm:p-6 md:p-8 min-h-full pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Mobile bottom navigation ──────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: 'rgba(10,10,15,0.97)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(30px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map(({ to, label, icon, color }) => {
            const isActive = location.pathname === to ||
              (to === '/settings' && ['/settings', '/p2p', '/history', '/nfts'].includes(location.pathname))
            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all min-w-0"
                style={isActive ? {
                  background: `${color}15`,
                } : {}}
              >
                {({ isActive: navActive }) => {
                  const active = navActive || (to === '/settings' && ['/settings', '/p2p', '/history', '/nfts'].includes(location.pathname))
                  return (
                    <>
                      <motion.span
                        animate={active ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3 }}
                        className="text-lg leading-none"
                        style={{
                          color: active ? color : '#4B5563',
                          filter: active ? `drop-shadow(0 0 6px ${color})` : 'none',
                        }}
                      >
                        {icon}
                      </motion.span>
                      <span className="text-[10px] font-medium truncate"
                        style={{ color: active ? color : '#4B5563' }}>
                        {label}
                      </span>
                      {active && (
                        <motion.div
                          layoutId="mobileActiveBar"
                          className="absolute top-0 w-8 h-0.5 rounded-full"
                          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                        />
                      )}
                    </>
                  )
                }}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* ── Lock confirmation modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showLockModal && (
          <LockConfirmModal
            onConfirm={handleLockConfirm}
            onCancel={() => setShowLockModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
