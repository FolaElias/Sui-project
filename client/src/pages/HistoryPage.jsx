import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import Layout from '../components/shared/Layout'
import { useWallet } from '../context/WalletContext'

const testnetClient = new SuiClient({ url: getFullnodeUrl('testnet') })
const MIST = 1_000_000_000

function formatDate(ms) {
  if (!ms) return '—'
  const d = new Date(Number(ms))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function shortAddr(addr) {
  if (!addr) return '—'
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

function TxRow({ tx, address }) {
  const [open, setOpen] = useState(false)

  // Determine tx direction and type
  const effects    = tx?.effects
  const timestamp  = tx?.timestampMs
  const digest     = tx?.digest
  const status     = effects?.status?.status

  // balanceChanges is a TOP-LEVEL field on the tx, not inside effects
  const balChanges = tx?.balanceChanges || []
  const myChange   = balChanges.find(c =>
    c.owner?.AddressOwner?.toLowerCase() === address?.toLowerCase()
  )

  let direction = 'interaction'
  let amount    = null
  let color     = '#8B949E'
  let icon      = '⇄'

  if (myChange) {
    const val = BigInt(myChange.amount)
    if (val > 0n) {
      direction = 'received'
      amount    = `+${(Number(val) / MIST).toFixed(4)} SUI`
      color     = '#14F195'
      icon      = '↓'
    } else {
      direction = 'sent'
      amount    = `${(Number(val) / MIST).toFixed(4)} SUI`
      color     = '#FF2EF7'
      icon      = '↑'
    }
  }

  // Get the tx kind label
  const kind = tx?.transaction?.data?.transaction?.kind || 'ProgrammableTransaction'
  const kindLabel = kind === 'ProgrammableTransaction' ? 'Smart Contract' : kind

  return (
    <motion.div
      layout
      className="rounded-2xl border border-brand-border overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      {/* Row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors"
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{
            background: `${color}15`,
            border: `1px solid ${color}30`,
            color,
          }}>
          {icon}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-semibold capitalize">{direction}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              status === 'success' ? 'text-brand-green bg-brand-green/10 border border-brand-green/20' : 'text-red-400 bg-red-400/10 border border-red-400/20'
            }`}>
              {status || 'unknown'}
            </span>
          </div>
          <p className="text-brand-muted text-xs font-mono mt-0.5 truncate">
            {formatDate(timestamp)}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          {amount && (
            <p className="text-sm font-bold font-mono" style={{ color }}>
              {amount}
            </p>
          )}
          <p className="text-brand-muted text-xs">{kindLabel}</p>
        </div>

        {/* Chevron */}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-brand-muted text-xs shrink-0"
        >▾</motion.span>
      </button>

      {/* Expanded */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-2 border-t border-brand-border"
              style={{ background: 'rgba(255,255,255,0.01)' }}>
              <div className="h-2" />

              {/* Digest */}
              <div className="flex items-start justify-between text-xs gap-2">
                <span className="text-brand-muted shrink-0">Tx ID</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-brand-cyan font-mono truncate">{digest?.slice(0, 14)}…</span>
                  <a href={`https://suiexplorer.com/txblock/${digest}?network=testnet`}
                    target="_blank" rel="noreferrer"
                    className="text-brand-purple hover:underline shrink-0">
                    ↗
                  </a>
                </div>
              </div>

              {/* Balance changes */}
              {balChanges.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-brand-muted">
                    {c.owner?.AddressOwner ? shortAddr(c.owner.AddressOwner) : 'Object'}
                  </span>
                  <span className={Number(c.amount) >= 0 ? 'text-brand-green font-mono' : 'text-brand-pink font-mono'}>
                    {Number(c.amount) >= 0 ? '+' : ''}{(Number(c.amount) / MIST).toFixed(6)} SUI
                  </span>
                </div>
              ))}

              {/* Gas */}
              {effects?.gasUsed && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-brand-border">
                  <span className="text-brand-muted">Gas fee</span>
                  <span className="text-brand-muted font-mono">
                    {((
                      Number(effects.gasUsed.computationCost) +
                      Number(effects.gasUsed.storageCost) -
                      Number(effects.gasUsed.storageRebate)
                    ) / MIST).toFixed(6)} SUI
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SkeletonRow() {
  return (
    <div className="rounded-2xl border border-brand-border p-4 flex items-center gap-4 animate-pulse"
      style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/5 rounded-full w-1/3" />
        <div className="h-3 bg-white/5 rounded-full w-1/2" />
      </div>
      <div className="h-4 bg-white/5 rounded-full w-20" />
    </div>
  )
}

const FILTER_OPTIONS = ['All', 'Received', 'Sent', 'Contract']

export default function HistoryPage() {
  const { address } = useWallet()
  const [txs, setTxs]         = useState([])
  const [loading, setLoading] = useState(false)
  const [cursor, setCursor]   = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [filter, setFilter]   = useState('All')

  const load = async (reset = false, cursorOverride = undefined) => {
    if (!address) return
    setLoading(true)
    try {
      const cur = reset ? null : (cursorOverride !== undefined ? cursorOverride : cursor)
      const res = await testnetClient.queryTransactionBlocks({
        filter:  { ToAddress: address },
        options: { showEffects: true, showBalanceChanges: true, showInput: true },
        limit:   20,
        order:   'descending',
        ...(cur ? { cursor: cur } : {}),
      })

      // Also fetch sent transactions
      const sent = await testnetClient.queryTransactionBlocks({
        filter:  { FromAddress: address },
        options: { showEffects: true, showBalanceChanges: true, showInput: true },
        limit:   20,
        order:   'descending',
        ...(cur ? { cursor: cur } : {}),
      })

      // Merge, deduplicate by digest, sort newest first
      const merged = [...res.data, ...sent.data]
      const seen   = new Set()
      const unique = merged.filter(tx => {
        if (seen.has(tx.digest)) return false
        seen.add(tx.digest)
        return true
      }).sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs))

      setTxs(prev => {
        if (reset) return unique
        const existing = new Set(prev.map(t => t.digest))
        return [...prev, ...unique.filter(t => !existing.has(t.digest))]
      })
      setHasMore(res.hasNextPage || sent.hasNextPage)
      setCursor(res.nextCursor || sent.nextCursor)
    } catch (err) {
      // Silently handle RPC errors — testnet may be temporarily unavailable
      console.warn('[history]', err?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!address) return
    setTxs([])
    setCursor(null)
    const run = async () => { await load(true) }
    run()
  }, [address]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = txs.filter(tx => {
    if (filter === 'All') return true
    const balChanges = tx?.balanceChanges || []
    const myChange   = balChanges.find(c =>
      c.owner?.AddressOwner?.toLowerCase() === address?.toLowerCase()
    )
    if (filter === 'Received') return myChange && Number(myChange.amount) > 0
    if (filter === 'Sent')     return myChange && Number(myChange.amount) < 0
    if (filter === 'Contract') return !myChange
    return true
  })

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{
                background: 'linear-gradient(135deg,rgba(153,69,255,0.15),rgba(255,46,247,0.08))',
                border: '1px solid rgba(153,69,255,0.25)',
              }}>
              ◷
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">History</h1>
              <p className="text-brand-muted text-sm">
                {loading && txs.length === 0 ? 'Loading…' : `${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setTxs([]); setCursor(null); load(true, null) }}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm text-brand-muted border border-brand-border hover:text-white transition-colors flex items-center gap-2 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <motion.span animate={loading ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}>
              ⟳
            </motion.span>
            Refresh
          </motion.button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {FILTER_OPTIONS.map(f => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
              style={filter === f ? {
                background: 'linear-gradient(135deg,rgba(153,69,255,0.2),rgba(153,69,255,0.08))',
                border: '1px solid rgba(153,69,255,0.3)',
                color: '#9945FF',
              } : {
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#8B949E',
              }}
            >
              {f}
            </motion.button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading && txs.length === 0 ? (
            Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="relative mb-6">
                {[60, 90, 120].map((size, i) => (
                  <motion.div key={size}
                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 10 + i * 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute border border-brand-purple/10 rounded-full"
                    style={{ width: size, height: size, top: '50%', left: '50%', marginLeft: -size / 2, marginTop: -size / 2 }}
                  />
                ))}
                <motion.span
                  animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
                  className="relative z-10 text-5xl block">◷</motion.span>
              </div>
              <h3 className="text-white font-display font-bold text-xl mb-2">No transactions yet</h3>
              <p className="text-brand-muted text-sm max-w-xs">
                {!address ? 'Unlock your wallet to view history' : 'Your transaction history will appear here once you send or receive SUI.'}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filtered.map(tx => (
                <motion.div
                  key={tx.digest}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <TxRow tx={tx} address={address} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Load more */}
        {hasMore && !loading && filtered.length > 0 && (
          <div className="mt-6 text-center">
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => load(false, cursor)}
              className="px-6 py-2.5 rounded-xl text-sm text-brand-muted border border-brand-border hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              Load more
            </motion.button>
          </div>
        )}

        {loading && txs.length > 0 && (
          <div className="mt-4 text-center">
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block text-brand-muted">⟳</motion.span>
          </div>
        )}
      </motion.div>
    </Layout>
  )
}
