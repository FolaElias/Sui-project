import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import toast from 'react-hot-toast'
import Layout from '../components/shared/Layout'
import { useWallet } from '../context/WalletContext'

const testnetClient = new SuiClient({ url: getFullnodeUrl('testnet') })

function parseNFT(obj) {
  const display = obj?.data?.display?.data || {}
  const fields  = obj?.data?.content?.fields || {}
  const id      = obj?.data?.objectId
  const type    = obj?.data?.type || ''

  // Skip coins and system objects
  if (type.includes('::coin::') || type.includes('::sui::')) return null

  const name     = display.name     || fields.name || null
  const imageUrl = display.image_url || display.img_url || fields.image_url || null

  if (!name && !imageUrl) return null

  return {
    objectId:    id,
    name:        name || `Object ${id?.slice(0, 6)}`,
    description: display.description || fields.description || '',
    imageUrl,
    creator:     display.creator || '',
    projectUrl:  display.project_url || '',
    type,
  }
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-brand-border animate-pulse"
      style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="aspect-square bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-white/5 rounded-full w-3/4" />
        <div className="h-3 bg-white/5 rounded-full w-1/2" />
        <div className="h-8 bg-white/5 rounded-xl mt-3" />
      </div>
    </div>
  )
}

function NFTDetailModal({ nft, onClose, onSend, address }) {
  const [sendTo, setSendTo] = useState('')
  const [showSend, setShowSend] = useState(false)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          background: 'linear-gradient(135deg,rgba(18,18,26,0.99),rgba(10,10,15,1))',
          border: '1px solid rgba(0,240,255,0.2)',
          boxShadow: '0 0 60px rgba(0,240,255,0.12)',
        }}
      >
        <div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg,transparent,#00F0FF,#9945FF,transparent)' }} />

        {/* Image */}
        <div className="aspect-square bg-brand-purple/10 relative">
          {nft.imageUrl ? (
            <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-20">◈</span>
            </div>
          )}
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-lg font-display font-bold text-white">{nft.name}</h3>
            {nft.description && <p className="text-brand-muted text-sm mt-1">{nft.description}</p>}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-brand-muted">Object ID</span>
              <span className="text-brand-cyan font-mono">{nft.objectId?.slice(0, 10)}…</span>
            </div>
            {nft.creator && (
              <div className="flex justify-between">
                <span className="text-brand-muted">Creator</span>
                <span className="text-white">{nft.creator.length > 20 ? nft.creator.slice(0, 20) + '…' : nft.creator}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-brand-muted">Type</span>
              <span className="text-brand-purple font-mono text-xs">{nft.type?.split('::').slice(-1)[0]}</span>
            </div>
          </div>

          {/* Send NFT section */}
          <AnimatePresence>
            {showSend ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <input
                  value={sendTo}
                  onChange={e => setSendTo(e.target.value)}
                  placeholder="Recipient address (0x…)"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-brand-border text-white placeholder-brand-muted text-xs font-mono outline-none focus:border-brand-purple/50 mb-2"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowSend(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs text-brand-muted border border-brand-border hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    Cancel
                  </button>
                  <button onClick={() => onSend(nft, sendTo)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#00F0FF,#9945FF)' }}>
                    Send NFT
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div className="flex gap-2">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowSend(true)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg,#00F0FF20,#9945FF20)', border: '1px solid rgba(0,240,255,0.3)' }}>
                  <span style={{ color: '#00F0FF' }}>↑</span> Transfer
                </motion.button>
                {nft.projectUrl && (
                  <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    href={nft.projectUrl} target="_blank" rel="noreferrer"
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-brand-muted border border-brand-border hover:text-white transition-colors text-center"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    View Project
                  </motion.a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg,transparent,#9945FF,transparent)' }} />
      </motion.div>
    </motion.div>
  )
}

export default function NFTsPage() {
  const { keypair, address, suiClient } = useWallet()
  const [nfts, setNfts]           = useState([])
  const [loading, setLoading]     = useState(false)
  const [selected, setSelected]   = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!address) return
    const load = async () => {
      setLoading(true)
      try {
        // Paginate through all owned objects
        let allObjs = []
        let cursor = null
        do {
          const res = await testnetClient.getOwnedObjects({
            owner: address,
            options: { showDisplay: true, showContent: true, showType: true },
            limit: 50,
            ...(cursor ? { cursor } : {}),
          })
          allObjs = allObjs.concat(res.data)
          cursor = res.hasNextPage ? res.nextCursor : null
        } while (cursor)

        const parsed = allObjs.map(parseNFT).filter(Boolean)
        setNfts(parsed)
      } catch (err) {
        console.warn('[nfts]', err?.message)
        toast.error('Failed to load NFTs')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [address, refreshKey])

  const handleSendNFT = async (nft, recipient) => {
    if (!/^0x[0-9a-fA-F]{64}$/.test(recipient)) {
      toast.error('Invalid recipient address')
      return
    }
    try {
      const tx = new Transaction()
      tx.transferObjects([tx.object(nft.objectId)], recipient)
      const result = await testnetClient.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true },
      })
      toast.success(`NFT sent! ${result.digest.slice(0, 12)}…`)
      setSelected(null)
      setTimeout(() => setRefreshKey(k => k + 1), 1500)
    } catch (err) {
      toast.error(err?.message || 'Transfer failed')
    }
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
  }
  const item = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show:   { opacity: 1, y: 0,  scale: 1 },
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{
                background: 'linear-gradient(135deg,rgba(0,240,255,0.15),rgba(153,69,255,0.08))',
                border: '1px solid rgba(0,240,255,0.25)',
              }}>
              ◈
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">My NFTs</h1>
              <p className="text-brand-muted text-sm">
                {loading ? 'Loading…' : `${nfts.length} item${nfts.length !== 1 ? 's' : ''} in your wallet`}
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setRefreshKey(k => k + 1)}
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

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : nfts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-28 text-center"
          >
            {/* Floating rings */}
            <div className="relative mb-8">
              {[80, 120, 160].map((size, i) => (
                <motion.div key={size}
                  animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                  transition={{ duration: 10 + i * 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute border border-brand-purple/10 rounded-full"
                  style={{ width: size, height: size, top: '50%', left: '50%', marginLeft: -size / 2, marginTop: -size / 2 }}
                />
              ))}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 text-6xl"
                style={{ filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.4))' }}
              >◈</motion.div>
            </div>
            <h3 className="text-white font-display font-bold text-xl mb-2">No NFTs yet</h3>
            <p className="text-brand-muted text-sm max-w-xs">
              {!address
                ? 'Unlock your wallet to view your NFTs'
                : 'Your NFT collection is empty. Browse the marketplace to discover NFTs on Sui.'}
            </p>
            {address && (
              <motion.a href="/marketplace"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="mt-6 px-6 py-3 rounded-xl text-sm font-bold text-white inline-block"
                style={{ background: 'linear-gradient(135deg,#9945FF,#00F0FF)', boxShadow: '0 0 20px rgba(153,69,255,0.3)' }}>
                Explore Marketplace →
              </motion.a>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={container} initial="hidden" animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {nfts.map(nft => (
              <motion.div
                key={nft.objectId}
                variants={item}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => setSelected(nft)}
                className="rounded-2xl overflow-hidden border border-brand-border cursor-pointer group relative"
                style={{
                  background: 'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))',
                }}
              >
                {/* Image */}
                <div className="aspect-square bg-brand-purple/10 relative overflow-hidden">
                  {nft.imageUrl ? (
                    <img src={nft.imageUrl} alt={nft.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl opacity-20">◈</span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.7),transparent)' }}>
                    <span className="text-white text-xs font-semibold">View Details →</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3.5">
                  <p className="text-white font-semibold text-sm truncate">{nft.name}</p>
                  <p className="text-brand-muted text-xs font-mono truncate mt-0.5">
                    {nft.type?.split('::').slice(-1)[0] || nft.objectId?.slice(0, 10) + '…'}
                  </p>
                </div>

                {/* Bottom neon line on hover */}
                <div className="h-px w-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(90deg,transparent,#00F0FF,#9945FF,transparent)' }} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <NFTDetailModal
            nft={selected}
            address={address}
            onClose={() => setSelected(null)}
            onSend={handleSendNFT}
          />
        )}
      </AnimatePresence>
    </Layout>
  )
}
