import { useNavigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'

export default function LandingPage() {
  const navigate = useNavigate()
  const { hasWallet } = useWallet()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background orbs */}
      <div className="orb w-96 h-96 bg-brand-purple -top-32 -left-32" />
      <div className="orb w-80 h-80 bg-brand-cyan bottom-0 -right-24" />
      <div className="orb w-64 h-64 bg-brand-pink top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{opacity: 0.07}} />

      {/* Animated grid lines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(153,69,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(153,69,255,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Logo + tagline */}
      <div className="text-center mb-12 animate-float relative z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, #9945FF, #00F0FF)', boxShadow: '0 0 30px rgba(153,69,255,0.5)' }}>
            ◈
          </div>
          <h1 className="text-5xl font-display font-extrabold text-white tracking-tight">
            Sui<span className="gradient-text">Vault</span>
          </h1>
        </div>

        <p className="text-brand-muted text-lg max-w-md mx-auto leading-relaxed">
          Your all-in-one <span className="text-brand-cyan font-semibold">Sui wallet</span>,{' '}
          <span className="text-brand-purple font-semibold">NFT marketplace</span> &{' '}
          <span className="text-brand-pink font-semibold">P2P trading</span> platform
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap gap-2 justify-center mt-5">
          <span className="badge-purple">⚡ Non-custodial</span>
          <span className="badge-cyan">🔐 Self-sovereign</span>
          <span className="badge-green">🌐 Sui Network</span>
          <span className="badge-pink">⇄ P2P Swaps</span>
        </div>
      </div>

      {/* CTA Card */}
      <div className="card w-full max-w-sm relative z-10 p-8">
        <div className="flex flex-col gap-3">
          {hasWallet ? (
            <button className="btn-primary py-3.5 text-base" onClick={() => navigate('/unlock')}>
              🔓 Unlock Wallet
            </button>
          ) : (
            <>
              <button className="btn-primary py-3.5 text-base" onClick={() => navigate('/create')}>
                ✨ Create New Wallet
              </button>
              <button className="btn-ghost py-3.5 text-base" onClick={() => navigate('/import')}>
                📥 Import Existing Wallet
              </button>
            </>
          )}
        </div>

        <p className="text-center text-brand-muted text-xs mt-5 leading-relaxed">
          Your keys. Your assets. Always.
          <br />
          <span className="text-brand-green">Keys never leave your device.</span>
        </p>
      </div>

      {/* Stats row */}
      <div className="flex gap-8 mt-12 relative z-10">
        {[
          { label: 'Network', value: 'Sui', color: 'text-brand-cyan' },
          { label: 'Custody', value: 'Self', color: 'text-brand-green' },
          { label: 'Fees', value: 'Low', color: 'text-brand-purple' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <p className={`text-xl font-bold font-display ${color}`}>{value}</p>
            <p className="text-brand-muted text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
