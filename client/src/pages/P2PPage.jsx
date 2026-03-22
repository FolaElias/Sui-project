import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import Layout from '../components/shared/Layout'
import { useWallet } from '../context/WalletContext'

const api = axios.create()
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

const TABS = ['Inbox', 'Sent', 'New Offer']

function statusStyle(status) {
  const map = {
    pending:  { color: '#FFD600', bg: 'rgba(255,214,0,0.1)', border: 'rgba(255,214,0,0.2)' },
    accepted: { color: '#14F195', bg: 'rgba(20,241,149,0.1)', border: 'rgba(20,241,149,0.2)' },
    declined: { color: '#FF4444', bg: 'rgba(255,68,68,0.1)', border: 'rgba(255,68,68,0.2)' },
    cancelled:{ color: '#8B949E', bg: 'rgba(139,148,158,0.1)', border: 'rgba(139,148,158,0.2)' },
    completed:{ color: '#00F0FF', bg: 'rgba(0,240,255,0.1)', border: 'rgba(0,240,255,0.2)' },
  }
  return map[status] || map.pending
}

function OfferCard({ offer, isInbox, onAccept, onDecline, onCancel }) {
  const s = statusStyle(offer.status)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-2xl border border-brand-border overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                {offer.status}
              </span>
              {isInbox && (
                <span className="text-xs text-brand-muted">
                  from {offer.from?.username || offer.fromAddress?.slice(0, 10) + '…'}
                </span>
              )}
              {!isInbox && (
                <span className="text-xs text-brand-muted">
                  to {offer.toAddress?.slice(0, 10)}…
                </span>
              )}
            </div>
            <p className="text-xs text-brand-muted">
              {new Date(offer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Objects */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-brand-border"
            style={{ background: 'rgba(255,46,247,0.04)' }}>
            <p className="text-brand-muted text-xs mb-2">Offering</p>
            {offer.offerObjects?.length > 0 ? (
              offer.offerObjects.map((id, i) => (
                <p key={i} className="text-brand-pink text-xs font-mono truncate">{id?.slice(0, 12)}…</p>
              ))
            ) : (
              <p className="text-brand-muted text-xs">—</p>
            )}
          </div>
          <div className="p-3 rounded-xl border border-brand-border"
            style={{ background: 'rgba(20,241,149,0.04)' }}>
            <p className="text-brand-muted text-xs mb-2">Requesting</p>
            {offer.requestObjects?.length > 0 ? (
              offer.requestObjects.map((id, i) => (
                <p key={i} className="text-brand-green text-xs font-mono truncate">{id?.slice(0, 12)}…</p>
              ))
            ) : (
              <p className="text-brand-muted text-xs">—</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {offer.status === 'pending' && (
          <div className="flex gap-2 mt-3">
            {isInbox ? (
              <>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => onAccept(offer._id)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-black"
                  style={{ background: '#14F195' }}>
                  ✓ Accept
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => onDecline(offer._id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-red-400 border border-red-400/20"
                  style={{ background: 'rgba(255,68,68,0.06)' }}>
                  ✕ Decline
                </motion.button>
              </>
            ) : (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => onCancel(offer._id)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-brand-muted border border-brand-border"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                Cancel Offer
              </motion.button>
            )}
          </div>
        )}

        {offer.txDigest && (
          <div className="mt-2 pt-2 border-t border-brand-border">
            <a href={`https://suiexplorer.com/txblock/${offer.txDigest}?network=testnet`}
              target="_blank" rel="noreferrer"
              className="text-brand-cyan text-xs hover:underline">
              View tx {offer.txDigest.slice(0, 12)}… ↗
            </a>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function NewOfferForm({ onCreated }) {
  const [toAddress, setToAddress]       = useState('')
  const [offerIds, setOfferIds]         = useState('')
  const [requestIds, setRequestIds]     = useState('')
  const [submitting, setSubmitting]     = useState(false)

  const handleSubmit = async () => {
    if (!toAddress || !offerIds) {
      toast.error('Fill in all required fields')
      return
    }
    setSubmitting(true)
    try {
      const offerObjects   = offerIds.split(',').map(s => s.trim()).filter(Boolean)
      const requestObjects = requestIds.split(',').map(s => s.trim()).filter(Boolean)
      await api.post('/api/p2p', { toAddress, offerObjects, requestObjects })
      toast.success('Offer sent!')
      setToAddress(''); setOfferIds(''); setRequestIds('')
      onCreated()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create offer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg,rgba(18,18,26,0.9),rgba(10,10,15,0.95))',
        border: '1px solid rgba(255,46,247,0.15)',
      }}
    >
      <div className="h-px w-full"
        style={{ background: 'linear-gradient(90deg,transparent,#FF2EF7,#9945FF,transparent)' }} />

      <div className="p-6 space-y-5">
        <div className="p-4 rounded-2xl border border-brand-border"
          style={{ background: 'rgba(255,46,247,0.04)' }}>
          <p className="text-brand-muted text-xs leading-relaxed">
            <span className="text-brand-pink font-semibold">P2P Trade</span> — Propose a trade directly to another Sui address.
            Both parties must sign for the trade to complete. Paste the object IDs of NFTs/assets you want to trade.
          </p>
        </div>

        <div>
          <label className="text-brand-muted text-xs font-medium mb-2 block">Counterparty Address *</label>
          <input value={toAddress} onChange={e => setToAddress(e.target.value)}
            placeholder="0x…"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-brand-border text-white placeholder-brand-muted text-sm font-mono outline-none focus:border-brand-purple/50 transition-colors"
            style={{ caretColor: '#9945FF' }}
          />
        </div>

        <div>
          <label className="text-brand-muted text-xs font-medium mb-2 block">
            You Offer — Object IDs * <span className="text-brand-muted/50">(comma-separated)</span>
          </label>
          <textarea value={offerIds} onChange={e => setOfferIds(e.target.value)}
            placeholder="0xabc123…, 0xdef456…"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-brand-border text-white placeholder-brand-muted text-sm font-mono outline-none focus:border-brand-purple/50 transition-colors resize-none"
            style={{ caretColor: '#9945FF' }}
          />
        </div>

        <div>
          <label className="text-brand-muted text-xs font-medium mb-2 block">
            You Request — Object IDs <span className="text-brand-muted/50">(optional, comma-separated)</span>
          </label>
          <textarea value={requestIds} onChange={e => setRequestIds(e.target.value)}
            placeholder="0x789abc…"
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-brand-border text-white placeholder-brand-muted text-sm font-mono outline-none focus:border-brand-purple/50 transition-colors resize-none"
            style={{ caretColor: '#9945FF' }}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(255,46,247,0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={submitting || !toAddress || !offerIds}
          className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg,#FF2EF7,#9945FF)',
            boxShadow: '0 0 20px rgba(255,46,247,0.25)',
          }}
        >
          {submitting ? (
            <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⟳</motion.span> Sending…</>
          ) : '⇄ Send Offer'}
        </motion.button>
      </div>
    </div>
  )
}

export default function P2PPage() {
  const { address } = useWallet()
  const [tab, setTab]       = useState('Inbox')
  const [inbox, setInbox]   = useState([])
  const [sent, setSent]     = useState([])
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [inboxRes, sentRes] = await Promise.all([
        api.get('/api/p2p/inbox'),
        api.get('/api/p2p/sent'),
      ])
      setInbox(inboxRes.data)
      setSent(sentRes.data)
    } catch (err) {
      // 401 = not logged in yet, ignore silently
      if (err?.response?.status !== 401) {
        console.warn('[p2p]', err?.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/p2p/${id}/status`, { status })
      toast.success(`Offer ${status}`)
      loadData()
    } catch (err) {
      toast.error('Failed to update offer')
    }
  }

  const currentList = tab === 'Inbox' ? inbox : sent

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{
                background: 'linear-gradient(135deg,rgba(255,46,247,0.15),rgba(153,69,255,0.08))',
                border: '1px solid rgba(255,46,247,0.25)',
              }}>
              ⇄
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">P2P Trade</h1>
              <p className="text-brand-muted text-sm">Propose and manage peer-to-peer trades</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {inbox.filter(o => o.status === 'pending').length > 0 && (
              <motion.span
                animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-brand-pink"
                style={{ boxShadow: '0 0 8px #FF2EF7' }}
              />
            )}
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={loadData} disabled={loading}
              className="px-4 py-2 rounded-xl text-sm text-brand-muted border border-brand-border hover:text-white transition-colors flex items-center gap-2 disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <motion.span animate={loading ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}>⟳</motion.span>
              Refresh
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {TABS.map(t => (
            <motion.button key={t} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setTab(t)}
              className="px-5 py-2 rounded-xl text-sm font-medium relative transition-all"
              style={tab === t ? {
                background: 'linear-gradient(135deg,rgba(255,46,247,0.15),rgba(153,69,255,0.08))',
                border: '1px solid rgba(255,46,247,0.3)',
                color: '#FF2EF7',
              } : {
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#8B949E',
              }}
            >
              {t}
              {t === 'Inbox' && inbox.filter(o => o.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold text-white flex items-center justify-center"
                  style={{ background: '#FF2EF7', fontSize: '10px' }}>
                  {inbox.filter(o => o.status === 'pending').length}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === 'New Offer' ? (
            <motion.div key="new" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <NewOfferForm onCreated={() => { setTab('Sent'); loadData() }} />
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl border border-brand-border animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.02)' }} />
              ))}
            </motion.div>
          ) : currentList.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="relative mb-6">
                {[60, 90, 120].map((size, i) => (
                  <motion.div key={size}
                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 10 + i * 4, repeat: Infinity, ease: 'linear' }}
                    className="absolute border border-brand-pink/10 rounded-full"
                    style={{ width: size, height: size, top: '50%', left: '50%', marginLeft: -size / 2, marginTop: -size / 2 }}
                  />
                ))}
                <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}
                  className="relative z-10 text-5xl block">⇄</motion.span>
              </div>
              <h3 className="text-white font-display font-bold text-xl mb-2">
                {tab === 'Inbox' ? 'No incoming offers' : 'No sent offers'}
              </h3>
              <p className="text-brand-muted text-sm max-w-xs mb-6">
                {tab === 'Inbox'
                  ? 'When someone proposes a trade with you, it will appear here.'
                  : 'Start a new P2P trade by clicking "New Offer".'}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setTab('New Offer')}
                className="px-6 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#FF2EF7,#9945FF)', boxShadow: '0 0 20px rgba(255,46,247,0.3)' }}>
                ⇄ New Offer
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-3">
              <AnimatePresence>
                {currentList.map(offer => (
                  <OfferCard
                    key={offer._id}
                    offer={offer}
                    isInbox={tab === 'Inbox'}
                    onAccept={id => updateStatus(id, 'accepted')}
                    onDecline={id => updateStatus(id, 'declined')}
                    onCancel={id => updateStatus(id, 'cancelled')}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  )
}
