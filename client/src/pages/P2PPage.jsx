import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Transaction } from '@mysten/sui/transactions'
import axios from 'axios'
import toast from 'react-hot-toast'
import Layout from '../components/shared/Layout'
import { useWallet } from '../context/WalletContext'

const MIST = 1_000_000_000

const api = axios.create()
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

const TABS        = ['Buy', 'Sell', 'My Trades', 'My Ads']
const PAY_METHODS = ['Sui Transfer', 'Bank Transfer', 'PayPal', 'Wise']

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400)return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

const STATUS_META = {
  pending:      { label: 'Awaiting Payment',  color: '#FFD600', icon: '⏳' },
  payment_sent: { label: 'Payment Sent',      color: '#00F0FF', icon: '💳' },
  confirming:   { label: 'Confirming',        color: '#9945FF', icon: '🔍' },
  completed:    { label: 'Completed',         color: '#14F195', icon: '✓'  },
  disputed:     { label: 'Disputed',          color: '#FF4444', icon: '⚠'  },
  cancelled:    { label: 'Cancelled',         color: '#8B949E', icon: '✕'  },
}

// ── Trade status timeline ─────────────────────────────────────────────────────
const STEPS = ['pending', 'payment_sent', 'confirming', 'completed']

function TradeTimeline({ status }) {
  const stepIdx = STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-0 w-full my-4">
      {STEPS.map((step, i) => {
        const done    = i <= stepIdx && status !== 'cancelled' && status !== 'disputed'
        const current = i === stepIdx && done
        const meta    = STATUS_META[step]
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={current ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                style={{
                  background: done ? meta.color + '25' : 'rgba(255,255,255,0.05)',
                  borderColor: done ? meta.color : 'rgba(255,255,255,0.1)',
                  color: done ? meta.color : '#4B5563',
                }}
              >
                {done ? '✓' : i + 1}
              </motion.div>
              <span className="text-[9px] text-brand-muted whitespace-nowrap hidden sm:block capitalize">
                {step.replace('_', ' ')}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-1 transition-all"
                style={{ background: i < stepIdx && done ? '#14F195' : 'rgba(255,255,255,0.08)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Trade room ────────────────────────────────────────────────────────────────
function TradeRoom({ tradeId, currentUserId, onBack }) {
  const { keypair, suiClient, address, balance, fetchBalance } = useWallet()
  const [trade, setTrade]   = useState(null)
  const [msg, setMsg]       = useState('')
  const [busy, setBusy]     = useState(false)
  const chatRef             = useRef(null)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/p2p/trades/${tradeId}`)
      setTrade(data)
    } catch (err) {
      if (err?.response?.status !== 401) console.warn('[trade]', err?.message)
    }
  }, [tradeId])

  useEffect(() => {
    load()
    const iv = setInterval(load, 5000)   // poll every 5 s for chat + status updates
    return () => clearInterval(iv)
  }, [load])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [trade?.messages?.length])

  const sendMsg = async () => {
    if (!msg.trim()) return
    try {
      await api.post(`/api/p2p/trades/${tradeId}/message`, { text: msg.trim() })
      setMsg('')
      load()
    } catch { toast.error('Failed to send message') }
  }

  const advance = async (status, extra = {}) => {
    setBusy(true)
    try {
      await api.patch(`/api/p2p/trades/${tradeId}/status`, { status, ...extra })
      toast.success(STATUS_META[status]?.label || status)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed')
    } finally { setBusy(false) }
  }

  if (!trade) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="text-brand-purple text-2xl">⟳</motion.div>
    </div>
  )

  const meta      = STATUS_META[trade.status] || STATUS_META.pending
  const isBuyer   = String(trade.buyer?._id)  === currentUserId
  const isSeller  = String(trade.seller?._id) === currentUserId
  const isActive  = !['completed', 'cancelled', 'disputed'].includes(trade.status)

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-brand-muted hover:text-white text-sm transition-colors">
        ← Back to P2P
      </button>

      {/* Trade header */}
      <div className="rounded-2xl border border-brand-border p-5"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{meta.icon}</span>
              <span className="font-bold text-white">
                {isBuyer ? 'Buying' : 'Selling'} {trade.amount} SUI
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ color: meta.color, background: meta.color + '18', border: `1px solid ${meta.color}30` }}>
                {meta.label}
              </span>
            </div>
            <p className="text-brand-muted text-xs">
              Counterparty: <span className="text-brand-cyan font-semibold">
                {isBuyer ? (trade.seller?.username || 'Unknown') : (trade.buyer?.username || 'Unknown')}
              </span>
            </p>
            <p className="text-brand-muted text-xs mt-0.5">
              Price: <span className="text-white">${trade.pricePerSui}/SUI</span>
              {' · '}Total: <span className="text-brand-green font-semibold">${(trade.amount * trade.pricePerSui).toFixed(2)}</span>
            </p>
          </div>
          <div className="text-right text-xs text-brand-muted">
            <p>Trade ID</p>
            <p className="text-brand-cyan font-mono">{trade._id?.slice(-8)}</p>
            {trade.txDigest && (
              <a
                href={`https://suiscan.xyz/testnet/tx/${trade.txDigest}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-brand-green hover:underline font-semibold"
              >
                ✓ View on Explorer ↗
              </a>
            )}
          </div>
        </div>

        {/* Timeline */}
        {trade.status !== 'cancelled' && trade.status !== 'disputed' && (
          <TradeTimeline status={trade.status} />
        )}

        {/* Action buttons */}
        {isActive && (
          <div className="flex gap-2 flex-wrap mt-2">
            {/* Buyer: mark payment sent */}
            {isBuyer && trade.status === 'pending' && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => advance('payment_sent')} disabled={busy}
                className="btn-primary px-5 py-2.5 text-sm flex-1 disabled:opacity-50">
                💳 I've Paid
              </motion.button>
            )}

            {/* Seller: confirm payment received + release */}
            {isSeller && trade.status === 'payment_sent' && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => advance('confirming')} disabled={busy}
                className="btn-primary px-5 py-2.5 text-sm flex-1 disabled:opacity-50">
                🔍 Confirm Receipt
              </motion.button>
            )}
            {isSeller && trade.status === 'confirming' && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  if (!keypair) return toast.error('Wallet not unlocked')

                  const amountMist = BigInt(Math.floor(trade.amount * MIST))
                  const sellerBal  = BigInt(balance || '0')
                  if (amountMist > sellerBal) {
                    return toast.error(`Insufficient balance. You have ${(Number(sellerBal) / MIST).toFixed(4)} SUI`)
                  }

                  setBusy(true)
                  try {
                    // Build & sign on-chain transfer to buyer
                    const tx = new Transaction()
                    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)])
                    tx.transferObjects([coin], trade.buyerAddress)

                    const result = await suiClient.signAndExecuteTransaction({
                      signer: keypair,
                      transaction: tx,
                    })

                    // Mark trade completed on backend with tx digest
                    await api.patch(`/api/p2p/trades/${tradeId}/status`, {
                      status: 'completed',
                      txDigest: result.digest,
                    })

                    await fetchBalance()
                    toast.success(`✓ ${trade.amount} SUI sent to buyer!`)
                    load()
                  } catch (err) {
                    toast.error(err?.message || 'Transaction failed')
                  } finally { setBusy(false) }
                }}
                disabled={busy}
                className="px-5 py-2.5 text-sm flex-1 rounded-xl font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#14F195,#00F0FF)', color: '#0A0A0F' }}>
                {busy ? 'Sending…' : '✓ Release SUI'}
              </motion.button>
            )}

            {/* Dispute */}
            {!['disputed', 'cancelled'].includes(trade.status) && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const reason = prompt('Describe the issue:')
                  if (reason) advance('disputed', { disputeReason: reason })
                }} disabled={busy}
                className="px-4 py-2.5 text-sm rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                ⚠ Dispute
              </motion.button>
            )}

            {/* Cancel (buyer only, while pending) */}
            {isBuyer && trade.status === 'pending' && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => advance('cancelled')} disabled={busy}
                className="px-4 py-2.5 text-sm rounded-xl border border-brand-border text-brand-muted hover:text-white transition-colors disabled:opacity-50">
                Cancel
              </motion.button>
            )}
          </div>
        )}

        {/* Payment instructions */}
        {trade.status === 'pending' && isBuyer && (
          <div className="mt-4 p-3 rounded-xl border border-brand-cyan/20"
            style={{ background: 'rgba(0,240,255,0.05)' }}>
            <p className="text-brand-cyan text-xs font-semibold mb-1">Payment Instructions</p>
            <p className="text-white text-xs">
              Send <strong>{trade.amount} SUI</strong> to:
            </p>
            <p className="text-brand-cyan font-mono text-xs mt-1 break-all">{trade.sellerAddress}</p>
            {trade.ad?.terms && (
              <p className="text-brand-muted text-xs mt-2 italic">"{trade.ad.terms}"</p>
            )}
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="rounded-2xl border border-brand-border overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="px-4 py-3 border-b border-brand-border">
          <p className="text-white text-sm font-semibold">💬 Trade Chat</p>
          <p className="text-brand-muted text-xs">Only you and your counterparty can see this</p>
        </div>

        {/* Messages */}
        <div ref={chatRef} className="p-4 space-y-3 max-h-64 overflow-y-auto scrollable">
          {trade.messages?.length === 0 && (
            <p className="text-brand-muted text-xs text-center py-4">No messages yet. Say hello!</p>
          )}
          {trade.messages?.map((m, i) => {
            const isMe = String(m.sender?._id) === currentUserId
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                  isMe
                    ? 'rounded-br-sm text-white'
                    : 'rounded-bl-sm text-white'
                }`}
                  style={{ background: isMe ? 'rgba(153,69,255,0.3)' : 'rgba(255,255,255,0.07)' }}>
                  {!isMe && (
                    <p className="text-brand-cyan text-xs font-semibold mb-0.5">{m.sender?.username}</p>
                  )}
                  <p>{m.text}</p>
                  <p className="text-white/40 text-[10px] mt-0.5 text-right">{timeAgo(m.createdAt)}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Input */}
        {isActive && (
          <div className="flex gap-2 p-3 border-t border-brand-border">
            <input
              className="input flex-1 text-sm py-2"
              placeholder="Type a message…"
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
            />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={sendMsg}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#9945FF,#6B00FF)' }}>
              Send
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Ad Card ───────────────────────────────────────────────────────────────────
function AdCard({ ad, onTrade, currentUserId }) {
  const isOwn = String(ad.maker?._id) === currentUserId
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-brand-border p-4 hover:border-brand-purple/40 transition-all"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Maker info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(153,69,255,0.2),rgba(0,240,255,0.1))' }}>
            {ad.maker?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm">{ad.maker?.username || 'Anonymous'}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-brand-green text-xs font-medium">
                ✓ {ad.completedTrades} trades
              </span>
              <span className="text-brand-muted text-xs">{timeAgo(ad.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <p className="text-xl font-bold font-display" style={{ color: ad.type === 'sell' ? '#14F195' : '#FF2EF7' }}>
            ${ad.price.toFixed(2)}
          </p>
          <p className="text-brand-muted text-xs">per SUI</p>
        </div>
      </div>

      {/* Details row */}
      <div className="grid grid-cols-3 gap-3 mt-4 mb-4">
        {[
          { label: 'Available', value: `${ad.totalAmount} SUI` },
          { label: 'Limit',     value: `${ad.minOrder}–${ad.maxOrder} SUI` },
          { label: 'Payment',   value: ad.paymentMethod },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-2.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-brand-muted text-[10px] uppercase tracking-wider">{label}</p>
            <p className="text-white text-xs font-semibold mt-0.5 truncate">{value}</p>
          </div>
        ))}
      </div>

      {ad.terms && (
        <p className="text-brand-muted text-xs italic mb-3 line-clamp-2">"{ad.terms}"</p>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={() => onTrade(ad)}
        disabled={isOwn}
        className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={isOwn ? { background: 'rgba(255,255,255,0.05)' } : {
          background: ad.type === 'sell'
            ? 'linear-gradient(135deg,#14F195,#00AA6D)'
            : 'linear-gradient(135deg,#FF2EF7,#9945FF)',
          color: ad.type === 'sell' ? '#0A0A0F' : '#fff',
          boxShadow: `0 0 20px ${ad.type === 'sell' ? 'rgba(20,241,149,0.3)' : 'rgba(255,46,247,0.3)'}`,
        }}
      >
        {isOwn ? 'Your Ad' : ad.type === 'sell' ? `Buy SUI` : `Sell SUI`}
      </motion.button>
    </motion.div>
  )
}

// ── Post Ad Modal ─────────────────────────────────────────────────────────────
function PostAdModal({ type, onClose, onSuccess }) {
  const { balance } = useWallet()
  const [form, setForm] = useState({
    price: '', totalAmount: '', minOrder: '', maxOrder: '',
    paymentMethod: 'Sui Transfer', terms: '',
  })
  const [busy, setBusy] = useState(false)

  const suiBalance = Number(balance || '0') / MIST
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.price || !form.totalAmount || !form.minOrder || !form.maxOrder)
      return toast.error('Fill all required fields')

    // Sellers cannot advertise more SUI than they hold
    if (type === 'sell' && Number(form.totalAmount) > suiBalance) {
      return toast.error(`Insufficient balance — you only have ${suiBalance.toFixed(4)} SUI`)
    }
    setBusy(true)
    try {
      await api.post('/api/p2p/ads', {
        type,
        price:         Number(form.price),
        totalAmount:   Number(form.totalAmount),
        minOrder:      Number(form.minOrder),
        maxOrder:      Number(form.maxOrder),
        paymentMethod: form.paymentMethod,
        terms:         form.terms,
      })
      toast.success('Ad posted!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to post ad')
    } finally { setBusy(false) }
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
        onClick={onClose} />
      <motion.div className="relative w-full max-w-md rounded-3xl overflow-hidden z-10"
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          background: 'linear-gradient(135deg,rgba(18,18,26,0.99),rgba(10,10,15,1))',
          border: `1px solid ${type === 'sell' ? 'rgba(20,241,149,0.25)' : 'rgba(255,46,247,0.25)'}`,
        }}>
        <div className="h-px w-full"
          style={{ background: `linear-gradient(90deg,transparent,${type === 'sell' ? '#14F195' : '#FF2EF7'},transparent)` }} />
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-white">
              Post {type === 'sell' ? 'Sell' : 'Buy'} Ad
            </h3>
            <button onClick={onClose} className="text-brand-muted hover:text-white text-xl">✕</button>
          </div>

          {/* Balance chip — sellers see their limit */}
          {type === 'sell' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-brand-green/20"
              style={{ background: 'rgba(20,241,149,0.05)' }}>
              <span className="text-brand-green text-xs">●</span>
              <span className="text-brand-muted text-xs">Your balance:</span>
              <span className="text-brand-green font-bold font-mono text-xs">{suiBalance.toFixed(4)} SUI</span>
              <span className="text-brand-muted text-xs ml-auto">Max you can sell</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Price per SUI ($)', key: 'price',       placeholder: '3.50' },
              { label: 'Total Amount (SUI)', key: 'totalAmount', placeholder: '100'  },
              { label: 'Min Order (SUI)',    key: 'minOrder',    placeholder: '1'    },
              { label: 'Max Order (SUI)',    key: 'maxOrder',    placeholder: '50'   },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-1 block">{label}</label>
                <input type="number" min="0" step="0.01" className="input text-sm py-2"
                  placeholder={placeholder} value={form[key]} onChange={e => set(key, e.target.value)} />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-1 block">Payment Method</label>
            <div className="flex flex-wrap gap-2">
              {PAY_METHODS.map(m => (
                <button key={m} onClick={() => set('paymentMethod', m)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={form.paymentMethod === m ? {
                    background: type === 'sell' ? 'rgba(20,241,149,0.15)' : 'rgba(255,46,247,0.15)',
                    border: `1px solid ${type === 'sell' ? '#14F195' : '#FF2EF7'}40`,
                    color: type === 'sell' ? '#14F195' : '#FF2EF7',
                  } : {
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280'
                  }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-1 block">
              Terms <span className="font-normal normal-case opacity-60">(optional)</span>
            </label>
            <textarea className="input resize-none text-sm" rows={2}
              placeholder="e.g. Payment within 15 mins, verified accounts only…"
              value={form.terms} onChange={e => set('terms', e.target.value)} />
          </div>

          <div className="flex gap-3">
            <button className="btn-ghost flex-1 py-3" onClick={onClose}>Cancel</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: type === 'sell'
                  ? 'linear-gradient(135deg,#14F195,#00AA6D)'
                  : 'linear-gradient(135deg,#FF2EF7,#9945FF)',
                color: type === 'sell' ? '#0A0A0F' : '#fff',
              }}
              onClick={submit} disabled={busy}>
              {busy ? 'Posting…' : 'Post Ad'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Initiate Trade Modal ──────────────────────────────────────────────────────
function InitiateModal({ ad, onClose, onStarted }) {
  const [amount, setAmount] = useState(ad.minOrder)
  const [busy,   setBusy]   = useState(false)

  const total = (Number(amount) * ad.price).toFixed(2)

  const submit = async () => {
    if (!amount || amount < ad.minOrder || amount > ad.maxOrder)
      return toast.error(`Amount must be ${ad.minOrder}–${ad.maxOrder} SUI`)
    setBusy(true)
    try {
      const { data } = await api.post(`/api/p2p/ads/${ad._id}/trade`, { amount: Number(amount) })
      toast.success('Trade started!')
      onStarted(data._id)
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start trade')
    } finally { setBusy(false) }
  }

  const adColor = ad.type === 'sell' ? '#14F195' : '#FF2EF7'

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
        onClick={onClose} />
      <motion.div className="relative w-full max-w-sm rounded-3xl overflow-hidden z-10"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          background: 'linear-gradient(135deg,rgba(18,18,26,0.99),rgba(10,10,15,1))',
          border: `1px solid ${adColor}30`,
        }}>
        <div className="h-px w-full"
          style={{ background: `linear-gradient(90deg,transparent,${adColor},transparent)` }} />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-white">
              {ad.type === 'sell' ? 'Buy SUI' : 'Sell SUI'}
            </h3>
            <button onClick={onClose} className="text-brand-muted hover:text-white">✕</button>
          </div>

          {/* Seller info */}
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ background: `${adColor}20` }}>
              {ad.maker?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{ad.maker?.username}</p>
              <p className="text-brand-green text-xs">✓ {ad.completedTrades} completed trades</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-bold" style={{ color: adColor }}>${ad.price.toFixed(2)}</p>
              <p className="text-brand-muted text-xs">per SUI</p>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">
              Amount (SUI) · Limit: {ad.minOrder}–{ad.maxOrder}
            </label>
            <div className="relative">
              <input type="number" className="input pr-16 text-lg font-bold"
                min={ad.minOrder} max={ad.maxOrder} step="0.1"
                value={amount} onChange={e => setAmount(e.target.value)} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-cyan font-bold text-sm">SUI</span>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl p-4 space-y-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              ['You get',    `${amount} SUI`],
              ['You pay',    `$${total}`    ],
              ['Rate',       `$${ad.price}/SUI`],
              ['Payment via', ad.paymentMethod],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-brand-muted">{k}</span>
                <span className="text-white font-semibold">{v}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button className="btn-ghost flex-1 py-3" onClick={onClose}>Cancel</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl font-bold text-sm"
              style={{
                background: ad.type === 'sell'
                  ? 'linear-gradient(135deg,#14F195,#00AA6D)'
                  : 'linear-gradient(135deg,#FF2EF7,#9945FF)',
                color: ad.type === 'sell' ? '#0A0A0F' : '#fff',
              }}
              onClick={submit} disabled={busy}>
              {busy ? 'Starting…' : ad.type === 'sell' ? 'Buy Now' : 'Sell Now'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function P2PPage() {
  const { address }   = useWallet()
  const token         = localStorage.getItem('token')
  const currentUserId = (() => {
    try { return JSON.parse(atob(token?.split('.')[1] || ''))?.id } catch { return null }
  })()

  const [tab,       setTab]       = useState(0)
  const [ads,       setAds]       = useState([])
  const [trades,    setTrades]    = useState([])
  const [myAds,     setMyAds]     = useState([])
  const [loading,   setLoading]   = useState(false)

  const [showPostModal,   setShowPostModal]   = useState(null)   // 'buy' | 'sell' | null
  const [initiateAd,      setInitiateAd]      = useState(null)   // ad object
  const [openTradeId,     setOpenTradeId]     = useState(null)   // trade _id string

  // Fetch ads (Buy tab shows 'sell' ads, Sell tab shows 'buy' ads)
  const loadAds = useCallback(async () => {
    setLoading(true)
    try {
      const adType = tab === 0 ? 'sell' : 'buy'
      const { data } = await api.get(`/api/p2p/ads?type=${adType}`)
      setAds(data)
    } catch (err) {
      if (err?.response?.status !== 401) console.warn('[p2p ads]', err?.message)
    } finally { setLoading(false) }
  }, [tab])

  const loadTrades = useCallback(async () => {
    try {
      const { data } = await api.get('/api/p2p/trades')
      setTrades(data)
    } catch (err) {
      if (err?.response?.status !== 401) console.warn('[p2p trades]', err?.message)
    }
  }, [])

  const loadMyAds = useCallback(async () => {
    try {
      const { data } = await api.get('/api/p2p/my-ads')
      setMyAds(data)
    } catch (err) {
      if (err?.response?.status !== 401) console.warn('[p2p myads]', err?.message)
    }
  }, [])

  useEffect(() => {
    if (tab === 0 || tab === 1) loadAds()
    if (tab === 2) loadTrades()
    if (tab === 3) loadMyAds()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const removeMyAd = async (id) => {
    try {
      await api.delete(`/api/p2p/ads/${id}`)
      toast.success('Ad removed')
      loadMyAds()
    } catch { toast.error('Failed to remove ad') }
  }

  // If trade room is open, render it full-screen
  if (openTradeId) {
    return (
      <Layout>
        <TradeRoom
          tradeId={openTradeId}
          currentUserId={currentUserId}
          onBack={() => { setOpenTradeId(null); setTab(2); loadTrades() }}
        />
      </Layout>
    )
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              P2P <span className="gradient-text">Trading</span>
            </h1>
            <p className="text-brand-muted text-sm mt-1">
              Buy and sell SUI directly with other users — no middleman
            </p>
          </div>
          {token && (
            <div className="flex gap-2">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setShowPostModal('sell')}
                className="px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#14F195,#00AA6D)', color: '#0A0A0F' }}>
                + Sell Ad
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setShowPostModal('buy')}
                className="px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#FF2EF7,#9945FF)' }}>
                + Buy Ad
              </motion.button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl border border-brand-border w-fit overflow-x-auto"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          {TABS.map((t, i) => (
            <motion.button key={t} whileTap={{ scale: 0.96 }} onClick={() => setTab(i)}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap relative"
              style={tab === i ? {
                background: 'linear-gradient(135deg,rgba(153,69,255,0.25),rgba(0,240,255,0.1))',
                color: '#fff', border: '1px solid rgba(153,69,255,0.35)',
              } : { color: '#6B7280' }}>
              {t}
              {t === 'My Trades' && trades.filter(tr => ['pending','payment_sent','confirming'].includes(tr.status)).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: '#FF2EF7', color: '#fff' }}>
                  {trades.filter(tr => ['pending','payment_sent','confirming'].includes(tr.status)).length}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* ── Buy / Sell tabs: ad board ── */}
        {(tab === 0 || tab === 1) && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-brand-muted text-sm">
                <span className="text-white font-semibold">{ads.length}</span>{' '}
                {tab === 0 ? 'sellers' : 'buyers'} available
              </p>
              <button onClick={loadAds} className="text-brand-muted text-xs hover:text-white transition-colors flex items-center gap-1">
                <motion.span animate={loading ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⟳</motion.span>
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-brand-border p-4 animate-pulse h-40"
                    style={{ background: 'rgba(255,255,255,0.02)' }} />
                ))}
              </div>
            ) : ads.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <motion.div animate={{ y: [0,-8,0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-4">
                  {tab === 0 ? '🛒' : '💰'}
                </motion.div>
                <p className="text-white font-semibold text-lg mb-2">No {tab === 0 ? 'sell' : 'buy'} ads yet</p>
                <p className="text-brand-muted text-sm mb-5">Be the first to post one</p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowPostModal(tab === 0 ? 'sell' : 'buy')}
                  className="btn-primary px-8 py-3 text-sm">
                  Post Ad
                </motion.button>
              </div>
            ) : (
              <div className="space-y-3">
                {ads.map(ad => (
                  <AdCard key={ad._id} ad={ad} currentUserId={currentUserId}
                    onTrade={ad => setInitiateAd(ad)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── My Trades tab ── */}
        {tab === 2 && (
          <div className="space-y-3">
            {trades.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <motion.div animate={{ y: [0,-8,0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-4">⇄</motion.div>
                <p className="text-white font-semibold text-lg mb-2">No trades yet</p>
                <p className="text-brand-muted text-sm">Browse the Buy or Sell tab to start trading</p>
              </div>
            ) : trades.map(trade => {
              const meta    = STATUS_META[trade.status] || STATUS_META.pending
              const isBuyer = String(trade.buyer?._id) === currentUserId
              const other   = isBuyer ? trade.seller?.username : trade.buyer?.username
              return (
                <motion.div key={trade._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => setOpenTradeId(trade._id)}
                  className="rounded-2xl border border-brand-border p-4 cursor-pointer hover:border-brand-purple/40 transition-all flex items-center justify-between gap-3"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: meta.color + '18', border: `1px solid ${meta.color}30` }}>
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm">
                        {isBuyer ? 'Buying' : 'Selling'} {trade.amount} SUI
                      </p>
                      <p className="text-brand-muted text-xs">
                        with <span className="text-brand-cyan">{other || '—'}</span>
                        {' · '}{timeAgo(trade.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs px-2 py-1 rounded-full font-semibold"
                      style={{ color: meta.color, background: meta.color + '18', border: `1px solid ${meta.color}30` }}>
                      {meta.label}
                    </span>
                    <p className="text-brand-muted text-xs mt-1">→ Open</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* ── My Ads tab ── */}
        {tab === 3 && (
          <div className="space-y-3">
            {myAds.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <motion.div animate={{ y: [0,-8,0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-4">📋</motion.div>
                <p className="text-white font-semibold text-lg mb-2">No ads posted</p>
                <p className="text-brand-muted text-sm mb-5">Post a buy or sell ad to get started</p>
              </div>
            ) : myAds.map(ad => (
              <motion.div key={ad._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-brand-border p-4"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize"
                        style={{
                          color: ad.type === 'sell' ? '#14F195' : '#FF2EF7',
                          background: ad.type === 'sell' ? 'rgba(20,241,149,0.1)' : 'rgba(255,46,247,0.1)',
                          border: `1px solid ${ad.type === 'sell' ? 'rgba(20,241,149,0.2)' : 'rgba(255,46,247,0.2)'}`,
                        }}>
                        {ad.type} Ad
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{
                          color: ad.status === 'active' ? '#14F195' : '#8B949E',
                          background: 'rgba(255,255,255,0.05)',
                        }}>
                        ● {ad.status}
                      </span>
                    </div>
                    <p className="text-white font-semibold">{ad.totalAmount} SUI · ${ad.price}/SUI</p>
                    <p className="text-brand-muted text-xs">Limit: {ad.minOrder}–{ad.maxOrder} SUI · {ad.completedTrades} trades completed</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => api.patch(`/api/p2p/ads/${ad._id}`, { status: ad.status === 'active' ? 'paused' : 'active' }).then(loadMyAds)}
                      className="px-3 py-1.5 rounded-xl text-xs border border-brand-border text-brand-muted hover:text-white transition-colors">
                      {ad.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                    <button onClick={() => removeMyAd(ad._id)}
                      className="px-3 py-1.5 rounded-xl text-xs border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showPostModal && (
          <PostAdModal
            type={showPostModal}
            onClose={() => setShowPostModal(null)}
            onSuccess={() => { loadAds(); loadMyAds() }}
          />
        )}
        {initiateAd && (
          <InitiateModal
            ad={initiateAd}
            onClose={() => setInitiateAd(null)}
            onStarted={(id) => { setOpenTradeId(id); loadTrades() }}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}
