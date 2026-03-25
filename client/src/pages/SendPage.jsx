import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'
import Layout from '../components/shared/Layout'
import { useWallet } from '../context/WalletContext'
import PinModal, { hasPin, getBanRemaining } from '../components/shared/PinModal'

const MIST = 1_000_000_000

// Simple address validator (0x + 64 hex chars)
const isValidAddr = (a) => /^0x[0-9a-fA-F]{64}$/.test(a)

function ConfirmModal({ to, amount, fee, onConfirm, onCancel, sending }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={!sending ? onCancel : undefined}
      />
      <motion.div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          background: 'linear-gradient(135deg,rgba(18,18,26,0.98),rgba(10,10,15,0.99))',
          border: '1px solid rgba(255,46,247,0.2)',
          boxShadow: '0 0 60px rgba(255,46,247,0.15)',
        }}
      >
        <div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg,transparent,#FF2EF7,#9945FF,transparent)' }} />

        <div className="p-7 space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <motion.div
              animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{
                background: 'linear-gradient(135deg,rgba(255,46,247,0.12),rgba(153,69,255,0.08))',
                border: '1px solid rgba(255,46,247,0.25)',
              }}
            >↑</motion.div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-display font-bold text-white mb-1">Confirm Send</h3>
            <p className="text-brand-muted text-sm">Review before signing</p>
          </div>

          {/* Details */}
          <div className="space-y-3 p-4 rounded-2xl border border-brand-border"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <Row label="To" value={`${to.slice(0,10)}…${to.slice(-8)}`} mono />
            <Row label="Amount" value={`${amount} SUI`} highlight />
            <Row label="Network fee" value="~0.001 SUI" dim />
          </div>

          <div className="flex gap-3">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onCancel} disabled={sending}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-brand-muted border border-brand-border hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >Cancel</motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onConfirm} disabled={sending}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#FF2EF7,#9945FF)', boxShadow: '0 0 20px rgba(255,46,247,0.3)' }}
            >
              {sending ? (
                <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block">⟳</motion.span> Sending…</>
              ) : '↑ Send Now'}
            </motion.button>
          </div>
        </div>

        <div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg,transparent,#9945FF,#00F0FF,transparent)' }} />
      </motion.div>
    </motion.div>
  )
}

function Row({ label, value, mono, highlight, dim }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-brand-muted">{label}</span>
      <span className={`${mono ? 'font-mono' : ''} ${highlight ? 'text-brand-green font-bold' : dim ? 'text-brand-muted' : 'text-white font-medium'}`}>
        {value}
      </span>
    </div>
  )
}

export default function SendPage() {
  const { keypair, address, balance, fetchBalance, suiClient } = useWallet()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount]       = useState('')
  const [memo, setMemo]           = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPin, setShowPin]     = useState(false)
  const [sending, setSending]     = useState(false)
  const [banRemaining, setBanRemaining] = useState(getBanRemaining)

  // Countdown timer while banned
  useEffect(() => {
    if (banRemaining <= 0) return
    const t = setInterval(() => {
      const rem = getBanRemaining()
      setBanRemaining(rem)
      if (rem <= 0) clearInterval(t)
    }, 1000)
    return () => clearInterval(t)
  }, [banRemaining])
  const [txDigest, setTxDigest]   = useState(null)
  const [addrError, setAddrError] = useState('')
  const [amtError, setAmtError]   = useState('')

  const suiBal = (Number(balance) / MIST).toFixed(4)

  useEffect(() => {
    if (address) fetchBalance().catch(() => {})
  }, [address])

  const validateAndConfirm = () => {
    const ban = getBanRemaining()
    if (ban > 0) {
      setBanRemaining(ban)
      toast.error(`Sending blocked. Try again in ${Math.ceil(ban / 1000)}s`)
      return
    }
    let ok = true
    if (!isValidAddr(recipient)) {
      setAddrError('Invalid Sui address (must be 0x + 64 hex chars)')
      ok = false
    } else setAddrError('')

    const num = parseFloat(amount)
    const balSui = Number(balance) / MIST
    if (!num || num <= 0) {
      setAmtError('Enter a valid amount')
      ok = false
    } else if (num >= balSui) {
      setAmtError('Insufficient balance (keep some SUI for gas)')
      ok = false
    } else setAmtError('')

    if (ok) setShowConfirm(true)
  }

  const executeSend = async () => {
    setSending(true)
    try {
      const amountMist = BigInt(Math.floor(parseFloat(amount) * MIST))
      const tx = new Transaction()
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)])
      tx.transferObjects([coin], recipient)

      const result = await suiClient.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true },
      })

      setTxDigest(result.digest)
      setShowConfirm(false)
      setRecipient('')
      setAmount('')
      setMemo('')
      await fetchBalance()
      toast.success('Transaction sent!')
    } catch (err) {
      console.warn('[send]', err?.message)
      toast.error(err?.message || 'Transaction failed')
      setShowConfirm(false)
    } finally {
      setSending(false)
    }
  }

  const setMax = () => {
    const max = Math.max(0, Number(balance) / MIST - 0.005)
    setAmount(max.toFixed(4))
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg,rgba(255,46,247,0.15),rgba(153,69,255,0.08))', border: '1px solid rgba(255,46,247,0.25)' }}>
            ↑
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Send SUI</h1>
            <p className="text-brand-muted text-sm">Transfer to any Sui address</p>
          </div>
        </div>

        {/* Success state */}
        <AnimatePresence>
          {txDigest && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 p-4 rounded-2xl border border-brand-green/30 flex items-start gap-3"
              style={{ background: 'rgba(20,241,149,0.06)' }}
            >
              <span className="text-brand-green text-lg mt-0.5">✓</span>
              <div>
                <p className="text-brand-green font-semibold text-sm">Transaction sent!</p>
                <p className="text-brand-muted text-xs font-mono mt-1 break-all">{txDigest}</p>
                <a
                  href={`https://suiexplorer.com/txblock/${txDigest}?network=testnet`}
                  target="_blank" rel="noreferrer"
                  className="text-brand-cyan text-xs hover:underline mt-1 inline-block"
                >View on Explorer →</a>
              </div>
              <button onClick={() => setTxDigest(null)} className="ml-auto text-brand-muted hover:text-white text-xs shrink-0">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg,rgba(18,18,26,0.9),rgba(10,10,15,0.95))',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 0 40px rgba(153,69,255,0.08)',
          }}
        >
          <div className="h-px w-full"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,46,247,0.5),transparent)' }} />

          <div className="p-6 space-y-5">
            {/* Balance */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-brand-border"
              style={{ background: 'rgba(153,69,255,0.05)' }}>
              <div>
                <p className="text-brand-muted text-xs mb-0.5">Available balance</p>
                <p className="text-white font-bold font-mono">{suiBal} <span className="text-brand-cyan text-sm">SUI</span></p>
              </div>
              <div className="w-2 h-2 rounded-full bg-brand-green" style={{ boxShadow: '0 0 8px #14F195' }} />
            </div>

            {/* Recipient */}
            <div>
              <label className="text-brand-muted text-xs font-medium mb-2 block">Recipient Address</label>
              <div className="relative">
                <input
                  value={recipient}
                  onChange={e => { setRecipient(e.target.value); setAddrError('') }}
                  placeholder="0x…"
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-brand-border text-white placeholder-brand-muted text-sm font-mono outline-none focus:border-brand-purple/50 transition-colors pr-20"
                  style={{ caretColor: '#9945FF' }}
                />
                {recipient && (
                  <button onClick={() => setRecipient('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white text-xs px-2 py-1 rounded-lg transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    Clear
                  </button>
                )}
              </div>
              {addrError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1.5">{addrError}</motion.p>
              )}
              {recipient && !addrError && isValidAddr(recipient) && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-brand-green text-xs mt-1.5 flex items-center gap-1">
                  <span>✓</span> Valid Sui address
                </motion.p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="text-brand-muted text-xs font-medium mb-2 block">Amount (SUI)</label>
              <div className="relative">
                <input
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setAmtError('') }}
                  placeholder="0.0000"
                  type="number" min="0" step="0.0001"
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-brand-border text-white placeholder-brand-muted text-lg font-mono outline-none focus:border-brand-purple/50 transition-colors pr-28"
                  style={{ caretColor: '#9945FF' }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-brand-cyan text-sm font-semibold">SUI</span>
                  <button onClick={setMax}
                    className="text-brand-purple text-xs font-bold px-2 py-1 rounded-lg hover:bg-brand-purple/10 transition-colors">
                    MAX
                  </button>
                </div>
              </div>
              {amtError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1.5">{amtError}</motion.p>
              )}
            </div>

            {/* Memo (optional) */}
            <div>
              <label className="text-brand-muted text-xs font-medium mb-2 block">
                Memo <span className="text-brand-muted/50">(optional)</span>
              </label>
              <input
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="Note for yourself…"
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-brand-border text-white placeholder-brand-muted text-sm outline-none focus:border-brand-purple/50 transition-colors"
                style={{ caretColor: '#9945FF' }}
              />
            </div>

            {/* Preview */}
            <AnimatePresence>
              {amount && recipient && isValidAddr(recipient) && parseFloat(amount) > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-2xl border border-brand-purple/20 space-y-2"
                  style={{ background: 'rgba(153,69,255,0.05)' }}
                >
                  <p className="text-brand-muted text-xs font-medium mb-3">Transaction Preview</p>
                  <Row label="Sending" value={`${amount} SUI`} highlight />
                  <Row label="To" value={`${recipient.slice(0,8)}…${recipient.slice(-6)}`} mono />
                  <Row label="Est. fee" value="~0.001 SUI" dim />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ban notice */}
            <AnimatePresence>
              {banRemaining > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <span className="text-xl">🚫</span>
                  <div className="flex-1">
                    <p className="text-red-400 text-sm font-semibold">Sending blocked</p>
                    <p className="text-red-400/70 text-xs">Too many wrong PIN attempts. Try again in{' '}
                      <span className="font-mono font-bold text-red-400">
                        {Math.floor(banRemaining / 60000)}:{String(Math.floor((banRemaining % 60000) / 1000)).padStart(2, '0')}
                      </span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: banRemaining > 0 ? 1 : 1.02, boxShadow: banRemaining > 0 ? 'none' : '0 0 40px rgba(255,46,247,0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={validateAndConfirm}
              disabled={!keypair || !recipient || !amount || banRemaining > 0}
              className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: (!keypair || !recipient || !amount || banRemaining > 0)
                  ? 'rgba(255,255,255,0.05)'
                  : 'linear-gradient(135deg,#FF2EF7,#9945FF)',
                boxShadow: (!keypair || !recipient || !amount || banRemaining > 0) ? 'none' : '0 0 20px rgba(255,46,247,0.3)',
              }}
            >
              {banRemaining > 0 ? `🚫 Blocked (${Math.floor(banRemaining / 60000)}:${String(Math.floor((banRemaining % 60000) / 1000)).padStart(2, '0')})` : !keypair ? '🔒 Wallet Locked' : '↑ Continue'}
            </motion.button>
          </div>

          <div className="h-px w-full"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(153,69,255,0.4),transparent)' }} />
        </div>

        {/* Warning */}
        <p className="text-center text-brand-muted text-xs mt-4">
          ⚠️ Transactions on Sui are irreversible. Double-check the address.
        </p>
      </motion.div>

      {/* Confirm modal */}
      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal
            to={recipient}
            amount={amount}
            onConfirm={() => {
              if (!hasPin()) {
                toast.error('Set a transaction PIN first in Settings → Security')
                return
              }
              setShowConfirm(false)
              setShowPin(true)
            }}
            onCancel={() => setShowConfirm(false)}
            sending={sending}
          />
        )}
      </AnimatePresence>

      {/* PIN modal */}
      <AnimatePresence>
        {showPin && (
          <PinModal
            title="Confirm Send"
            subtitle="Enter your 4-digit PIN to authorise"
            onSuccess={() => { setShowPin(false); executeSend() }}
            onCancel={() => setShowPin(false)}
            onLockout={() => setBanRemaining(getBanRemaining())}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}
