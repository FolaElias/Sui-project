import { useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import Layout from '../components/shared/Layout'

const quickActions = [
  { href: '/send',        icon: '↑', label: 'Send',      desc: 'Transfer assets',  color: '#FF2EF7', glow: 'rgba(255,46,247,0.3)' },
  { href: '/receive',     icon: '↓', label: 'Receive',   desc: 'Get paid',         color: '#14F195', glow: 'rgba(20,241,149,0.3)' },
  { href: '/p2p',         icon: '⇄', label: 'P2P Swap',  desc: 'Trade directly',   color: '#00F0FF', glow: 'rgba(0,240,255,0.3)' },
  { href: '/marketplace', icon: '⊕', label: 'Market',    desc: 'Buy & sell NFTs',  color: '#9945FF', glow: 'rgba(153,69,255,0.3)' },
]

export default function DashboardPage() {
  const { address, balance, fetchBalance, fetchObjects, objects } = useWallet()

  useEffect(() => {
    if (address) { fetchBalance(); fetchObjects() }
  }, [address])

  const suiBalance = (Number(balance) / 1_000_000_000).toFixed(4)

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">

        {/* Balance hero card */}
        <div className="relative rounded-2xl overflow-hidden p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(153,69,255,0.15) 0%, rgba(0,240,255,0.08) 100%)',
            border: '1px solid rgba(153,69,255,0.25)',
            boxShadow: '0 0 40px rgba(153,69,255,0.12)',
          }}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.12), transparent)', transform: 'translate(30%, -30%)' }} />

          <p className="text-brand-muted text-sm font-medium mb-2">Total Balance</p>
          <div className="flex items-end gap-3 mb-4">
            <h2 className="text-5xl font-display font-extrabold text-white">{suiBalance}</h2>
            <span className="text-2xl font-bold gradient-text mb-1">SUI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-green">● Live</span>
            <p className="text-brand-muted text-xs font-mono truncate max-w-xs">{address}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h3 className="text-brand-muted text-xs font-semibold uppercase tracking-widest mb-3">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map(({ href, icon, label, desc, color, glow }) => (
              <a key={href} href={href}
                className="card group cursor-pointer hover:scale-105 transition-all duration-200 text-center py-5"
                style={{ '--glow': glow }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 25px ${glow}`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
              >
                <div className="text-3xl mb-2 font-bold" style={{ color }}>{icon}</div>
                <p className="text-white text-sm font-semibold">{label}</p>
                <p className="text-brand-muted text-xs mt-0.5">{desc}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Assets */}
        <div>
          <h3 className="text-brand-muted text-xs font-semibold uppercase tracking-widest mb-3">
            Assets · <span className="text-brand-purple">{objects.length}</span>
          </h3>
          {objects.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-4xl mb-3">🌌</p>
              <p className="text-brand-muted text-sm">No assets yet.</p>
              <p className="text-brand-muted text-xs mt-1">Receive SUI or NFTs to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {objects.slice(0, 6).map((obj) => (
                <div key={obj.data?.objectId} className="card flex items-center gap-3 py-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: 'rgba(153,69,255,0.15)', border: '1px solid rgba(153,69,255,0.2)' }}>
                    {obj.data?.display?.data?.image_url ? (
                      <img src={obj.data.display.data.image_url} className="w-full h-full object-cover rounded-xl" />
                    ) : '◈'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-white text-sm font-medium truncate">
                      {obj.data?.display?.data?.name || 'Object'}
                    </p>
                    <p className="text-brand-muted text-xs font-mono truncate">
                      {obj.data?.objectId?.slice(0, 10)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}
