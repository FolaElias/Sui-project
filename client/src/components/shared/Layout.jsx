import { NavLink } from 'react-router-dom'
import { useWallet } from '../../context/WalletContext'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',   icon: '⊡', color: 'brand-purple' },
  { to: '/send',        label: 'Send',         icon: '↑', color: 'brand-pink' },
  { to: '/receive',     label: 'Receive',      icon: '↓', color: 'brand-green' },
  { to: '/nfts',        label: 'NFTs',         icon: '◈', color: 'brand-cyan' },
  { to: '/marketplace', label: 'Marketplace',  icon: '⊕', color: 'brand-yellow' },
  { to: '/p2p',         label: 'P2P Trade',    icon: '⇄', color: 'brand-pink' },
  { to: '/history',     label: 'History',      icon: '◷', color: 'brand-purple' },
  { to: '/settings',    label: 'Settings',     icon: '⚙', color: 'brand-muted' },
]

export default function Layout({ children }) {
  const { lockWallet, address, balance } = useWallet()
  const { lock } = useAuth()

  const handleLock = () => { lockWallet(); lock() }
  const suiBalance = (Number(balance) / 1_000_000_000).toFixed(3)

  return (
    <div className="flex min-h-screen">

      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col py-6 px-3 relative"
        style={{
          background: 'linear-gradient(180deg, rgba(18,18,26,0.95) 0%, rgba(10,10,15,0.98) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #9945FF, #00F0FF)', boxShadow: '0 0 15px rgba(153,69,255,0.4)' }}>
            ◈
          </div>
          <span className="text-lg font-display font-extrabold text-white">
            Sui<span className="gradient-text">Vault</span>
          </span>
        </div>

        {/* Balance pill */}
        {address && (
          <div className="mx-3 mb-6 p-3 rounded-xl border border-brand-border"
            style={{ background: 'rgba(153,69,255,0.08)' }}>
            <p className="text-brand-muted text-xs mb-0.5">Balance</p>
            <p className="text-white font-bold font-mono text-sm">
              {suiBalance} <span className="text-brand-cyan">SUI</span>
            </p>
            <p className="text-brand-muted text-xs font-mono mt-0.5 truncate">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-white bg-brand-purple/20 border border-brand-purple/30'
                    : 'text-brand-muted hover:text-brand-text hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive
                ? { boxShadow: '0 0 12px rgba(153,69,255,0.15)' }
                : {}
              }
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Lock */}
        <button
          onClick={handleLock}
          className="flex items-center gap-3 px-3 py-2.5 mx-0 rounded-xl text-sm font-medium text-brand-muted hover:text-red-400 transition-all duration-150 hover:bg-red-500/10 mt-2"
        >
          <span className="text-base w-5 text-center">⏻</span>
          Lock Wallet
        </button>

        {/* Decorative glow */}
        <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(153,69,255,0.08), transparent)' }} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative">
        {/* Top glow */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(153,69,255,0.4), transparent)' }} />

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
