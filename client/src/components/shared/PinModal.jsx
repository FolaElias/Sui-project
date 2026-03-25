import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CryptoJS from 'crypto-js'

// Verify a PIN against the stored hash
export function verifyPin(pin) {
  const stored = localStorage.getItem('sui_pin_hash')
  if (!stored) return false
  return CryptoJS.SHA256(pin).toString() === stored
}

// Check if PIN has been set up
export function hasPin() {
  return !!localStorage.getItem('sui_pin_hash')
}

// Save a new PIN
export function savePin(pin) {
  localStorage.setItem('sui_pin_hash', CryptoJS.SHA256(pin).toString())
}

// ── PIN Dot indicators ─────────────────────────────────────────────────────
function PinDots({ value, shake }) {
  return (
    <motion.div
      className="flex gap-4 justify-center"
      animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      {[0, 1, 2, 3].map(i => (
        <motion.div
          key={i}
          animate={value.length > i ? { scale: [1.3, 1], opacity: 1 } : { scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="w-4 h-4 rounded-full"
          style={{
            background: value.length > i
              ? 'linear-gradient(135deg, #a78bfa, #60a5fa)'
              : 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: value.length > i ? '0 0 12px rgba(167,139,250,0.6)' : 'none',
          }}
        />
      ))}
    </motion.div>
  )
}

// ── Number Pad ─────────────────────────────────────────────────────────────
function NumPad({ onPress }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((k, i) => (
        k === '' ? <div key={i} /> : (
          <motion.button
            key={k}
            whileTap={{ scale: 0.88 }}
            onClick={() => onPress(k)}
            className="h-14 rounded-2xl text-white font-semibold text-lg transition-colors flex items-center justify-center"
            style={{
              background: k === '⌫' ? 'rgba(255,46,247,0.08)' : 'rgba(255,255,255,0.06)',
              border: k === '⌫' ? '1px solid rgba(255,46,247,0.2)' : '1px solid rgba(255,255,255,0.08)',
              color: k === '⌫' ? '#f472b6' : '#fff',
            }}
          >
            {k}
          </motion.button>
        )
      ))}
    </div>
  )
}

const BAN_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export function setBanUntil() {
  localStorage.setItem('sui_send_ban_until', Date.now() + BAN_DURATION_MS)
}

export function getBanRemaining() {
  const until = Number(localStorage.getItem('sui_send_ban_until') || 0)
  const remaining = until - Date.now()
  return remaining > 0 ? remaining : 0
}

export function clearBan() {
  localStorage.removeItem('sui_send_ban_until')
}

// ── Main PinModal ──────────────────────────────────────────────────────────
export default function PinModal({ title = 'Confirm Transaction', subtitle = 'Enter your 4-digit PIN', onSuccess, onCancel, onLockout }) {
  const [pin, setPin]       = useState('')
  const [shake, setShake]   = useState(false)
  const [error, setError]   = useState('')
  const [attempts, setAttempts] = useState(0)
  const MAX_ATTEMPTS = 5

  const handleKey = (k) => {
    if (k === '⌫') {
      setPin(p => p.slice(0, -1))
      setError('')
      return
    }
    if (pin.length >= 4) return
    const next = pin + k
    setPin(next)
    if (next.length === 4) verify(next)
  }

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key)
      if (e.key === 'Backspace') handleKey('⌫')
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pin, attempts])

  const verify = (value) => {
    if (verifyPin(value)) {
      onSuccess()
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setShake(true)
      setPin('')
      setTimeout(() => setShake(false), 500)
      if (newAttempts >= MAX_ATTEMPTS) {
        setBanUntil()
        setError('Too many incorrect attempts. Sending blocked for 5 minutes.')
        setTimeout(() => {
          onLockout?.()
          onCancel()
        }, 1800)
      } else {
        setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} left.`)
      }
    }
  }

  const locked = attempts >= MAX_ATTEMPTS

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onCancel}
      />

      {/* Card */}
      <motion.div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden z-10"
        initial={{ y: 60, opacity: 0, scale: 0.95 }}
        animate={{ y: 0,  opacity: 1, scale: 1    }}
        exit={{    y: 60, opacity: 0, scale: 0.95  }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          background: 'linear-gradient(135deg, rgba(15,10,30,0.99), rgba(8,5,20,1))',
          border: '1px solid rgba(167,139,250,0.2)',
          boxShadow: '0 0 80px rgba(109,40,217,0.3), 0 0 160px rgba(109,40,217,0.1)',
        }}
      >
        {/* Top line */}
        <div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #a78bfa, #60a5fa, transparent)' }} />

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl mb-3"
            >
              🔐
            </motion.div>
            <h3 className="text-white font-display font-bold text-lg">{title}</h3>
            <p className="text-white/40 text-sm mt-1">{subtitle}</p>
          </div>

          {/* Dots */}
          <PinDots value={pin} shake={shake} />

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-xs text-red-400 font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Numpad */}
          <div className={locked ? 'opacity-40 pointer-events-none' : ''}>
            <NumPad onPress={handleKey} />
          </div>

          {/* Cancel */}
          <button
            onClick={onCancel}
            className="w-full text-center text-sm text-white/30 hover:text-white/60 transition-colors pt-1"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
