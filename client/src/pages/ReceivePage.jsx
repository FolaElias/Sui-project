import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'react-qr-code'
import toast from 'react-hot-toast'
import Layout from '../components/shared/Layout'
import { useWallet } from '../context/WalletContext'

export default function ReceivePage() {
  const { address } = useWallet()
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    toast.success('Address copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: 'linear-gradient(135deg,rgba(20,241,149,0.15),rgba(0,240,255,0.08))',
              border: '1px solid rgba(20,241,149,0.25)',
            }}>
            ↓
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Receive SUI</h1>
            <p className="text-brand-muted text-sm">Share your address to receive assets</p>
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg,rgba(18,18,26,0.95),rgba(10,10,15,0.98))',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 0 60px rgba(20,241,149,0.06)',
          }}
        >
          <div className="h-px w-full"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(20,241,149,0.5),rgba(0,240,255,0.5),transparent)' }} />

          <div className="p-8 flex flex-col items-center gap-6">

            {/* QR Code */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
              className="relative"
            >
              {/* Orbit ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-4 rounded-3xl border border-brand-green/10 pointer-events-none"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-6 rounded-3xl border border-brand-cyan/8 pointer-events-none"
              />

              <div className="relative p-3 sm:p-4 rounded-2xl"
                style={{
                  background: 'white',
                  boxShadow: '0 0 40px rgba(20,241,149,0.15), 0 0 80px rgba(0,240,255,0.08)',
                }}
              >
                {address ? (
                  <QRCode
                    value={address}
                    size={180}
                    bgColor="white"
                    fgColor="#0A0A0F"
                    level="M"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50">
                    <p className="text-gray-400 text-xs text-center">Unlock wallet<br/>to see QR</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Network badge */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-green/20"
              style={{ background: 'rgba(20,241,149,0.06)' }}
            >
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-brand-green inline-block"
              />
              <span className="text-brand-green text-xs font-medium">Sui Testnet</span>
            </motion.div>

            {/* Address display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="w-full"
            >
              <p className="text-brand-muted text-xs font-medium text-center mb-3">Your Sui Address</p>

              <div className="relative group">
                <div className="p-4 rounded-2xl border border-brand-border font-mono text-sm text-brand-muted break-all text-center leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {address
                    ? <><span className="text-brand-cyan">{address.slice(0, 10)}</span>
                        {address.slice(10, -10)}
                        <span className="text-brand-purple">{address.slice(-10)}</span></>
                    : <span className="opacity-40">Wallet not unlocked</span>
                  }
                </div>
              </div>
            </motion.div>

            {/* Copy button */}
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(20,241,149,0.3)' }}
              whileTap={{ scale: 0.97 }}
              onClick={copy}
              disabled={!address}
              className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: address ? 'linear-gradient(135deg,#14F195,#00C9A7)' : 'rgba(255,255,255,0.05)',
                boxShadow: address ? '0 0 20px rgba(20,241,149,0.3)' : 'none',
                color: address ? '#0A0A0F' : undefined,
              }}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span key="check"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="flex items-center gap-2">
                    ✓ Copied!
                  </motion.span>
                ) : (
                  <motion.span key="copy"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="flex items-center gap-2">
                    ⧉ Copy Address
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          <div className="h-px w-full"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(0,240,255,0.4),transparent)' }} />
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { icon: '⚡', title: 'Instant', desc: 'Sub-second finality on Sui' },
            { icon: '🔒', title: 'Safe', desc: 'Non-custodial, your keys' },
          ].map(({ icon, title, desc }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="p-4 rounded-2xl border border-brand-border"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="text-xl mb-1">{icon}</div>
              <p className="text-white text-xs font-semibold">{title}</p>
              <p className="text-brand-muted text-xs mt-0.5">{desc}</p>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-brand-muted text-xs mt-4">
          Only send Sui assets to this address. Sending from other chains may result in permanent loss.
        </p>
      </motion.div>
    </Layout>
  )
}
