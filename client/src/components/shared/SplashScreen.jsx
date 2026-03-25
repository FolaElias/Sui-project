import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SuiLogo from './SuiLogo'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in') // 'in' | 'hold' | 'out'

  useEffect(() => {
    // Hold after intro animation, then fade out
    const hold  = setTimeout(() => setPhase('out'), 2600)
    const done  = setTimeout(() => onDone(), 3300)
    return () => { clearTimeout(hold); clearTimeout(done) }
  }, [])

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#07070f' }}
        >
          {/* ── Background orbs ── */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ background: '#6d28d9', top: '-10%', right: '-10%' }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.35, scale: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background: '#1d4ed8', bottom: '-10%', left: '-5%' }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.25, scale: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
          />

          {/* ── Center content ── */}
          <div className="relative z-10 flex flex-col items-center gap-6">

            {/* Logo with spin-in + pulse ring */}
            <div className="relative flex items-center justify-center">
              {/* Outer pulse ring */}
              <motion.div
                className="absolute rounded-full border border-purple-500/30"
                initial={{ width: 80, height: 80, opacity: 0 }}
                animate={{ width: 160, height: 160, opacity: [0, 0.5, 0] }}
                transition={{ duration: 1.8, delay: 0.5, repeat: Infinity, ease: 'easeOut' }}
              />
              {/* Inner ring */}
              <motion.div
                className="absolute rounded-full border border-cyan-400/20"
                initial={{ width: 60, height: 60, opacity: 0 }}
                animate={{ width: 120, height: 120, opacity: [0, 0.4, 0] }}
                transition={{ duration: 1.8, delay: 0.8, repeat: Infinity, ease: 'easeOut' }}
              />

              {/* Logo icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.2 }}
                className="w-24 h-24 rounded-3xl flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(109,40,217,0.3), rgba(29,78,216,0.2))',
                  border: '1px solid rgba(139,92,246,0.4)',
                  boxShadow: '0 0 60px rgba(109,40,217,0.5), 0 0 120px rgba(109,40,217,0.2)',
                }}
              >
                <SuiLogo size={56} />
              </motion.div>
            </div>

            {/* App name */}
            <div className="flex flex-col items-center gap-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
                className="flex items-baseline gap-1"
              >
                <span
                  className="text-5xl font-black tracking-tight text-white"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Sui
                </span>
                <span
                  className="text-5xl font-black tracking-tight"
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Vault
                </span>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="text-sm tracking-[0.3em] uppercase text-white/40 font-medium"
              >
                Web3 Wallet & Marketplace
              </motion.p>
            </div>

            {/* Loading bar */}
            <motion.div
              className="w-48 h-px rounded-full overflow-hidden mt-2"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ delay: 1.3, duration: 1.1, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          {/* ── Built by Snow ── */}
          <motion.div
            className="absolute bottom-10 flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            <p className="text-xs tracking-[0.25em] uppercase text-white/25 font-medium">
              Built by
            </p>
            <p
              className="text-sm font-bold tracking-widest"
              style={{
                background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ❄ SNOW
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
