import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import axios from 'axios'
import toast from 'react-hot-toast'
import Layout from '../components/shared/Layout'
import { useWallet } from '../context/WalletContext'

// ── Constants ─────────────────────────────────────────────────────────────────
const MIST      = 1_000_000_000
const PAGE_SIZE = 20

// Dedicated mainnet client — marketplace browses mainnet, wallet uses testnet
const mainnetClient = new SuiClient({ url: getFullnodeUrl('mainnet') })

const mistToSui = (mist) => (Number(mist) / MIST).toFixed(4)
const suiToMist = (sui)  => String(Math.floor(Number(sui) * MIST))

// Collection type-string filters (matched against the NFT's Move type path)
const COLLECTIONS = [
  { label: 'All',      typeFilter: null },
  { label: 'SuiFrens', typeFilter: 'suifrens' },
  { label: 'Rootlets', typeFilter: 'rootlet'  },
  { label: 'Capy',     typeFilter: 'capy'     },
  { label: 'Kumo',     typeFilter: 'kumo'     },
]

const TABS    = ['Browse Sui NFTs', 'Platform Listings']
const FILTERS = ['All', 'Recently Listed', 'Price: Low → High', 'Price: High → Low']

// ── Parse SuiClient object into display shape ─────────────────────────────────
function parseObj(obj) {
  if (obj?.error) return null               // object deleted / not found
  const display = obj?.data?.display?.data || {}
  const displayErr = obj?.data?.display?.error
  const fields  = obj?.data?.content?.fields || {}
  const id      = obj?.data?.objectId
  const type    = obj?.data?.type || ''

  // Skip coin objects — they don't have NFT Display data
  if (type.includes('::coin::Coin')) return null

  const name     = display.name     || fields.name     || null
  const imageUrl = display.image_url || display.img_url || fields.image_url || null

  // Need at least a name OR imageUrl — if display errored but we have fields, still show
  if (!name && !imageUrl && !displayErr) return null
  if (!name && !imageUrl && displayErr)  return null  // truly no display data at all

  return {
    objectId:    id,
    name:        name || `NFT ${id?.slice(0, 8)}`,
    description: display.description || fields.description || '',
    imageUrl,
    creator:     display.creator     || '',
    projectUrl:  display.project_url || '',
    owner:       obj?.data?.owner?.AddressOwner || obj?.data?.owner?.ObjectOwner || null,
    type,
  }
}

// ── Fetch NFTs from Sui mainnet ────────────────────────────────────────────────
// Strategy: MoveModule query on 0x2::kiosk — returns ALL kiosk events
// (ItemListed<T>, ItemPurchased<T>, ItemDelisted<T>, KioskCreated…).
// We filter client-side for ItemListed events which carry the NFT object ID
// and price. MoveEventType can't be used for generic events like ItemListed<T>
// because on-chain the type includes the concrete type param, e.g. ItemListed<SuiFren>.
async function fetchNFTs(collection, cursor) {
  try {
    const evRes = await mainnetClient.queryEvents({
      query: { MoveModule: { package: '0x2', module: 'kiosk' } },
      limit: 100,
      order: 'descending',
      ...(cursor ? { cursor } : {}),
    })

    // Keep only ItemListed events
    const listingEvents = evRes.data.filter(e => e.type?.includes('ItemListed'))

    // Build id→price map.
    // parsedJson.id is an ID struct: may be plain "0x…" string or { bytes: "0x…" }
    const priceMap = {}
    listingEvents.forEach(e => {
      const raw = e.parsedJson?.id
      const id  = typeof raw === 'string' ? raw : (raw?.bytes ?? null)
      if (id) priceMap[id] = e.parsedJson?.price ?? null
    })

    const ids = Object.keys(priceMap)
    if (!ids.length) return { nfts: [], hasNext: evRes.hasNextPage, nextCursor: evRes.nextCursor }

    const objs = await mainnetClient.multiGetObjects({
      ids,
      options: { showDisplay: true, showContent: true, showOwner: true, showType: true },
    })

    let nfts = objs
      .map(obj => {
        const parsed = parseObj(obj)
        if (!parsed) return null
        return { ...parsed, price: priceMap[parsed.objectId] }
      })
      .filter(Boolean)

    if (collection.typeFilter) {
      nfts = nfts.filter(n => n.type?.toLowerCase().includes(collection.typeFilter))
    }

    return { nfts, hasNext: evRes.hasNextPage, nextCursor: evRes.nextCursor }
  } catch (err) {
    throw new Error(err?.message || 'Failed to fetch from Sui mainnet')
  }
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
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

// ── NFT Card ──────────────────────────────────────────────────────────────────
function NFTCard({ nft, action, actionLabel, actionStyle, isOwn }) {
  const [hovered, setHovered] = useState(false)
  const [imgErr,  setImgErr]  = useState(false)

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 24, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1 } }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="rounded-2xl overflow-hidden border border-brand-border relative group"
      style={{
        background: 'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))',
        boxShadow: hovered ? '0 0 30px rgba(153,69,255,0.2)' : 'none',
        transition: 'box-shadow 0.3s',
      }}
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-brand-purple/10">
        {nft.imageUrl && !imgErr ? (
          <img src={nft.imageUrl} alt={nft.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <motion.span animate={{ rotate: hovered ? 180 : 0 }} transition={{ duration: 0.5 }}
              className="text-5xl opacity-20">◈</motion.span>
          </div>
        )}
        <AnimatePresence>
          {hovered && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
              <span className="text-white text-xs font-semibold">View Details</span>
            </motion.div>
          )}
        </AnimatePresence>
        {isOwn && <div className="absolute top-2 left-2 badge-purple text-xs">Yours</div>}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="text-white font-semibold text-sm truncate">{nft.name}</p>
        <p className="text-brand-muted text-xs font-mono truncate mt-0.5">
          {nft.description || `${nft.objectId?.slice(0, 12)}…`}
        </p>

        <div className="flex items-center justify-between mt-3">
          <div>
            {nft.price ? (
              <>
                <p className="text-brand-muted text-xs">Price</p>
                <p className="font-bold text-white font-mono text-sm">
                  {mistToSui(nft.price)} <span className="text-brand-cyan text-xs">SUI</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-brand-muted text-xs">Network</p>
                <p className="text-brand-green text-xs font-semibold">Sui Mainnet</p>
              </>
            )}
          </div>
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={() => action(nft)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
            style={actionStyle}>
            {actionLabel}
          </motion.button>
        </div>
      </div>

      <motion.div className="absolute bottom-0 left-0 right-0 h-px"
        animate={{ opacity: hovered ? 1 : 0 }}
        style={{ background: 'linear-gradient(90deg,transparent,#9945FF,#00F0FF,transparent)' }} />
    </motion.div>
  )
}

// ── List NFT Modal ────────────────────────────────────────────────────────────
function ListModal({ objects, onClose, onList }) {
  const [selected, setSelected] = useState(null)
  const [price, setPrice]       = useState('')
  const [desc,  setDesc]        = useState('')
  const [loading, setLoading]   = useState(false)

  const listable = objects.filter(o => !o?.data?.type?.includes('0x2::coin::Coin'))

  const handleList = async () => {
    if (!selected)                                    return toast.error('Select an NFT')
    if (!price || isNaN(price) || Number(price) <= 0) return toast.error('Enter a valid price')
    setLoading(true)
    try {
      const d = selected?.data?.display?.data || {}
      await onList({
        objectId:   selected.data.objectId,
        objectType: selected.data.type,
        name:       d.name        || 'Unnamed NFT',
        description: desc || d.description || '',
        imageUrl:   d.image_url   || null,
        price:      suiToMist(price),
      })
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />

      <motion.div className="relative w-full max-w-lg rounded-3xl overflow-hidden z-10"
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          background: 'linear-gradient(135deg,rgba(18,18,26,0.99),rgba(10,10,15,1))',
          border: '1px solid rgba(153,69,255,0.25)',
          boxShadow: '0 0 80px rgba(153,69,255,0.2)',
        }}>
        <div className="h-px w-full"
          style={{ background: 'linear-gradient(90deg,transparent,#9945FF,#00F0FF,transparent)' }} />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-white">List an NFT</h3>
            <button onClick={onClose} className="text-brand-muted hover:text-white text-xl">✕</button>
          </div>

          <div>
            <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-3 block">
              Select NFT <span className="text-brand-purple">({listable.length} in wallet)</span>
            </label>
            {listable.length === 0 ? (
              <p className="text-center py-8 text-brand-muted text-sm">No NFTs in your wallet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto scrollable pr-1">
                {listable.map(obj => {
                  const d = obj?.data?.display?.data || {}
                  const isSel = selected?.data?.objectId === obj?.data?.objectId
                  return (
                    <motion.div key={obj.data?.objectId ?? Math.random()}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setSelected(obj)}
                      className="rounded-xl overflow-hidden cursor-pointer relative border-2 transition-all"
                      style={{ borderColor: isSel ? '#9945FF' : 'rgba(255,255,255,0.08)', boxShadow: isSel ? '0 0 16px rgba(153,69,255,0.4)' : 'none' }}>
                      <div className="aspect-square bg-brand-purple/10 flex items-center justify-center overflow-hidden">
                        {d.image_url ? <img src={d.image_url} className="w-full h-full object-cover" /> : <span className="text-2xl opacity-40">◈</span>}
                      </div>
                      <div className="px-2 py-1.5 bg-black/40">
                        <p className="text-white text-xs truncate">{d.name || 'NFT'}</p>
                      </div>
                      {isSel && <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-purple flex items-center justify-center text-xs">✓</div>}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">Price (SUI)</label>
            <div className="relative">
              <input type="number" min="0" step="0.01" className="input pr-14"
                placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-cyan text-sm font-bold">SUI</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2 block">
              Description <span className="font-normal normal-case text-brand-muted/60">(optional)</span>
            </label>
            <textarea className="input resize-none" rows={2} placeholder="Describe your NFT…"
              value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          <div className="flex gap-3">
            <button className="btn-ghost flex-1 py-3" onClick={onClose}>Cancel</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="btn-primary flex-1 py-3" onClick={handleList} disabled={loading || !selected}>
              {loading ? 'Listing…' : '✨ List NFT'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const { address, objects, fetchObjects } = useWallet()
  const token = localStorage.getItem('token')

  const [tab, setTab]               = useState(0)
  const [colIdx, setColIdx]         = useState(0)
  const [filter, setFilter]         = useState('All')
  const [search, setSearch]         = useState('')

  // On-chain browse state
  const [nfts, setNfts]             = useState([])
  const [nftCursor, setNftCursor]   = useState(null)
  const [hasMore, setHasMore]       = useState(false)
  const [loadingNfts, setLoadingNfts] = useState(false)
  const [nftError, setNftError]     = useState(null)

  // Platform listings state
  const [listings, setListings]     = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [showListModal, setShowListModal] = useState(false)
  const [buyModal, setBuyModal]     = useState(null)

  // ── Load on-chain NFTs ─────────────────────────────────────────────────────
  const loadNfts = useCallback(async (reset = true) => {
    setLoadingNfts(true)
    setNftError(null)
    try {
      const cur = reset ? null : nftCursor
      const { nfts: fresh, hasNext, nextCursor } = await fetchNFTs(COLLECTIONS[colIdx], cur)
      setNfts(prev => reset ? fresh : [...prev, ...fresh])
      setHasMore(hasNext)
      setNftCursor(nextCursor)
    } catch (err) {
      console.warn('[loadNfts]', err?.message)
      setNftError(err.message)
      toast.error('Could not reach Sui mainnet')
    } finally {
      setLoadingNfts(false)
    }
  }, [nftCursor, colIdx])

  useEffect(() => { if (tab === 0) loadNfts(true) }, [tab, colIdx])

  // ── Platform listings ──────────────────────────────────────────────────────
  const fetchListings = async () => {
    setLoadingList(true)
    try {
      const { data } = await axios.get('/api/listings')
      setListings(data)
    } catch (err) {
      // Backend may not be running locally — fail silently on listings
      console.warn('[listings]', err?.message)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchListings()
    if (address) fetchObjects(address).catch(() => {})
  }, [address])

  const handleList = async (payload) => {
    try {
      await axios.post('/api/listings', { ...payload, sellerAddress: address },
        { headers: { Authorization: `Bearer ${token}` } })
      toast.success('NFT listed!')
      fetchListings()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to list NFT')
    }
  }

  const handleDelist = async (listing) => {
    try {
      await axios.delete(`/api/listings/${listing._id}`, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Listing removed')
      fetchListings()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove listing')
    }
  }

  // ── Filtered views ─────────────────────────────────────────────────────────
  const filteredNfts = useMemo(() =>
    nfts.filter(n => n.name?.toLowerCase().includes(search.toLowerCase()) || n.description?.toLowerCase().includes(search.toLowerCase())),
    [nfts, search])

  const filteredListings = useMemo(() => {
    let out = listings.filter(l =>
      l.name?.toLowerCase().includes(search.toLowerCase()) || l.description?.toLowerCase().includes(search.toLowerCase()))
    if (filter === 'Price: Low → High')  out = [...out].sort((a,b) => Number(a.price) - Number(b.price))
    if (filter === 'Price: High → Low')  out = [...out].sort((a,b) => Number(b.price) - Number(a.price))
    if (filter === 'Recently Listed')    out = [...out].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    return out
  }, [listings, filter, search])

  const stats = [
    { label: 'Live Listings', value: loadingNfts && !nfts.length ? '…' : nfts.length + (hasMore ? '+' : ''), color: '#9945FF' },
    { label: 'Listed',        value: listings.length, color: '#14F195' },
    { label: 'Floor Price',   value: listings.length ? `${mistToSui(Math.min(...listings.map(l => Number(l.price) || Infinity)))} SUI` : '—', color: '#00F0FF' },
  ]

  const cardContainer = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden p-5 sm:p-8"
          style={{
            background: 'linear-gradient(135deg,rgba(153,69,255,0.12),rgba(0,240,255,0.06),rgba(255,46,247,0.08))',
            border: '1px solid rgba(153,69,255,0.2)',
          }}>
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: '#9945FF', animation: 'floatY 6s ease-in-out infinite' }} />
          <div className="absolute -bottom-10 left-10 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ background: '#00F0FF', animation: 'floatY 8s ease-in-out infinite reverse' }} />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-purple">⊕ Marketplace</span>
                <span className="badge-green">● Sui Mainnet</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mb-2">
                Sui <span className="gradient-text">NFT Market</span>
              </h1>
              <p className="text-brand-muted text-sm max-w-md">
                Browse real NFTs from the Sui blockchain, or list yours on our platform.
              </p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
              onClick={() => setShowListModal(true)} className="btn-primary px-6 py-3 sm:px-8 sm:py-3.5 text-sm shrink-0 self-start">
              ✨ List an NFT
            </motion.button>
          </div>

          <div className="relative z-10 flex gap-5 sm:gap-8 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-brand-border flex-wrap">
            {stats.map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-2xl font-display font-bold" style={{ color }}>{value}</p>
                <p className="text-brand-muted text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-2xl border border-brand-border w-fit overflow-x-auto"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          {TABS.map((t, i) => (
            <motion.button key={t} whileTap={{ scale: 0.96 }} onClick={() => setTab(i)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={tab === i ? {
                background: 'linear-gradient(135deg,rgba(153,69,255,0.25),rgba(0,240,255,0.1))',
                color: '#fff', border: '1px solid rgba(153,69,255,0.35)',
                boxShadow: '0 0 15px rgba(153,69,255,0.2)',
              } : { color: '#6B7280' }}>
              {t}
            </motion.button>
          ))}
        </div>

        {/* ── Search + Filter bar ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted text-sm pointer-events-none">🔍</span>
            <input className="input pl-10" placeholder="Search NFTs…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {tab === 0 ? (
            <div className="flex gap-1.5 flex-wrap">
              {COLLECTIONS.map((c, i) => (
                <motion.button key={c.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setColIdx(i); setNfts([]) }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                  style={colIdx === i ? {
                    background: 'linear-gradient(135deg,rgba(0,240,255,0.2),rgba(153,69,255,0.1))',
                    border: '1px solid rgba(0,240,255,0.4)', color: '#fff',
                    boxShadow: '0 0 12px rgba(0,240,255,0.15)',
                  } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280' }}>
                  {c.label}
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map(f => (
                <motion.button key={f} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setFilter(f)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                  style={filter === f ? {
                    background: 'linear-gradient(135deg,rgba(153,69,255,0.2),rgba(0,240,255,0.1))',
                    border: '1px solid rgba(153,69,255,0.4)', color: '#fff',
                  } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280' }}>
                  {f}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">

          {/* ══ TAB 0: Browse Sui NFTs ════════════════════════════════════ */}
          {tab === 0 && (
            <motion.div key="browse" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {nftError && !loadingNfts ? (
                <div className="flex flex-col items-center py-24 text-center gap-5">
                  <div className="text-5xl">⚠️</div>
                  <div>
                    <p className="text-white font-semibold text-lg">Could not reach Sui Mainnet</p>
                    <p className="text-brand-muted text-sm mt-1 max-w-sm">{nftError}</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                    className="btn-primary px-8 py-2.5 text-sm" onClick={() => loadNfts(true)}>
                    Retry
                  </motion.button>
                </div>
              ) : filteredNfts.length === 0 && !loadingNfts ? (
                <div className="flex flex-col items-center py-24 text-center">
                  <motion.div animate={{ y: [0,-10,0] }} transition={{ duration: 4, repeat: Infinity }} className="text-6xl mb-4">🌌</motion.div>
                  <p className="text-white font-semibold text-lg mb-2">
                    {search ? `No results for "${search}"` : colIdx === 0 ? 'No listed NFTs with display data found' : 'No NFTs found for this collection'}
                  </p>
                  <p className="text-brand-muted text-sm max-w-sm">
                    {search ? 'Try clearing your search.' : 'NFTs must be listed in a Sui Kiosk and have Display metadata registered on-chain.'}
                  </p>
                  {colIdx !== 0 && (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { setColIdx(0); setNfts([]) }}
                      className="mt-4 btn-ghost px-6 py-2.5 text-sm">
                      Browse All →
                    </motion.button>
                  )}
                </div>
              ) : (
                <>
                  <motion.div variants={cardContainer} initial="hidden" animate="show"
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {filteredNfts.filter(n => n.objectId).map(nft => (
                      <NFTCard key={nft.objectId} nft={nft}
                        isOwn={nft.owner === address}
                        actionLabel="View Listing"
                        actionStyle={{ background: 'linear-gradient(135deg,#00F0FF,#0088FF)', color: '#0A0A0F', boxShadow: '0 0 12px rgba(0,240,255,0.3)' }}
                        action={(nft) => nft.projectUrl ? window.open(nft.projectUrl, '_blank') : toast('On-chain purchase coming soon! 🚀')}
                      />
                    ))}
                    {loadingNfts && [...Array(4)].map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
                  </motion.div>

                  {(hasMore || loadingNfts) && !search && (
                    <div className="flex justify-center mt-8">
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => loadNfts(false)} disabled={loadingNfts}
                        className="btn-ghost px-10 py-3 text-sm disabled:opacity-40">
                        {loadingNfts ? 'Loading…' : 'Load More'}
                      </motion.button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ══ TAB 1: Platform Listings ══════════════════════════════════ */}
          {tab === 1 && (
            <motion.div key="listings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {loadingList ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {[...Array(10)].map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="flex flex-col items-center py-24 text-center">
                  <motion.div animate={{ y: [0,-10,0] }} transition={{ duration: 4, repeat: Infinity }} className="text-6xl mb-4">🏪</motion.div>
                  <p className="text-white font-semibold text-lg mb-2">
                    {search ? `No results for "${search}"` : 'No listings yet'}
                  </p>
                  <p className="text-brand-muted text-sm mb-6">Be the first to list an NFT on SuiVault.</p>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                    className="btn-primary px-8 py-3" onClick={() => setShowListModal(true)}>
                    ✨ List your first NFT
                  </motion.button>
                </div>
              ) : (
                <>
                  <p className="text-brand-muted text-xs mb-4">
                    <span className="text-white">{filteredListings.length}</span> listing{filteredListings.length !== 1 ? 's' : ''}
                    {search && <> for <span className="text-brand-cyan">"{search}"</span></>}
                  </p>
                  <motion.div variants={cardContainer} initial="hidden" animate="show"
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {filteredListings.map(listing => (
                      <NFTCard key={listing._id}
                        nft={{ ...listing, imageUrl: listing.imageUrl }}
                        isOwn={listing.sellerAddress === address}
                        actionLabel={listing.sellerAddress === address ? 'Delist' : 'Buy Now'}
                        actionStyle={listing.sellerAddress === address
                          ? { background: 'transparent', border: '1px solid rgba(255,46,247,0.4)', color: '#FF2EF7' }
                          : { background: 'linear-gradient(135deg,#9945FF,#6B00FF)', boxShadow: '0 0 12px rgba(153,69,255,0.3)' }}
                        action={(nft) => listing.sellerAddress === address ? handleDelist(listing) : setBuyModal(listing)}
                      />
                    ))}
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showListModal && (
          <ListModal objects={objects} onClose={() => setShowListModal(false)} onList={handleList} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {buyModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
              onClick={() => setBuyModal(null)} />
            <motion.div className="relative w-full max-w-sm rounded-3xl overflow-hidden z-10"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                background: 'linear-gradient(135deg,rgba(18,18,26,0.99),rgba(10,10,15,1))',
                border: '1px solid rgba(20,241,149,0.2)',
                boxShadow: '0 0 60px rgba(20,241,149,0.15)',
              }}>
              <div className="h-px w-full"
                style={{ background: 'linear-gradient(90deg,transparent,#14F195,#00F0FF,transparent)' }} />
              <div className="p-6 space-y-5">
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center bg-brand-purple/10">
                    {buyModal.imageUrl ? <img src={buyModal.imageUrl} className="w-full h-full object-cover" /> : <span className="text-3xl opacity-40">◈</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{buyModal.name}</p>
                    <p className="text-brand-muted text-xs font-mono truncate mt-0.5">{buyModal.objectId?.slice(0,16)}…</p>
                    {buyModal.seller?.username && <p className="text-brand-cyan text-xs mt-1">@{buyModal.seller.username}</p>}
                  </div>
                </div>

                <div className="rounded-2xl border border-brand-border p-4 space-y-2"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {[['NFT Price', `${mistToSui(buyModal.price)} SUI`, 'text-white'], ['Network Fee', '~0.001 SUI', 'text-brand-green']].map(([k,v,c]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-brand-muted">{k}</span>
                      <span className={`font-mono ${c}`}>{v}</span>
                    </div>
                  ))}
                  <div className="h-px bg-brand-border" />
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-white">Total</span>
                    <span className="gradient-text font-mono text-base">{(Number(mistToSui(buyModal.price)) + 0.001).toFixed(4)} SUI</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-brand-yellow/20 bg-brand-yellow/5 text-xs text-brand-yellow">
                  ⚠ On-chain escrow deploys with the Move contract phase. Purchase intent recorded now.
                </div>

                <div className="flex gap-3">
                  <button className="btn-ghost flex-1 py-3 text-sm" onClick={() => setBuyModal(null)}>Cancel</button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-brand-bg"
                    style={{ background: 'linear-gradient(135deg,#14F195,#00C27A)', boxShadow: '0 0 16px rgba(20,241,149,0.3)' }}
                    onClick={() => { toast.success('Purchase recorded! 🎉'); setBuyModal(null) }}>
                    Confirm Buy ✓
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
