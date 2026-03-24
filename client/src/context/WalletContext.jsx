import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import * as bip39 from 'bip39'
import CryptoJS from 'crypto-js'

const WalletContext = createContext(null)

// Sui testnet client — swap to 'mainnet' for production
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') })

export function WalletProvider({ children }) {
  const [keypair, setKeypair] = useState(null)
  const [address, setAddress] = useState(null)
  const [balance, setBalance] = useState('0')
  const [objects, setObjects] = useState([])
  const [loading, setLoading] = useState(false)

  // Auto-restore keypair on mount if session password is cached
  useEffect(() => {
    const pw = sessionStorage.getItem('sui_session_pw')
    const stored = localStorage.getItem('sui_keystore')
    if (!pw || !stored) return
    try {
      const decrypted = CryptoJS.AES.decrypt(stored, pw)
      const { mnemonic } = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))
      const kp = Ed25519Keypair.deriveKeypair(mnemonic)
      setKeypair(kp)
      setAddress(kp.getPublicKey().toSuiAddress())
    } catch {
      // Cached password is invalid — clear it so user is prompted to unlock
      sessionStorage.removeItem('sui_session_pw')
      sessionStorage.removeItem('sui_unlocked')
    }
  }, [])

  // Generate a brand new wallet
  const createWallet = useCallback((password) => {
    const mnemonic = bip39.generateMnemonic()
    const kp = Ed25519Keypair.deriveKeypair(mnemonic)
    const addr = kp.getPublicKey().toSuiAddress()

    const keystore = CryptoJS.AES.encrypt(
      JSON.stringify({ mnemonic, privateKey: kp.getSecretKey() }),
      password
    ).toString()

    localStorage.setItem('sui_keystore', keystore)
    sessionStorage.setItem('sui_session_pw', password)

    setKeypair(kp)
    setAddress(addr)

    return { mnemonic, address: addr }
  }, [])

  // Import wallet from mnemonic
  const importWallet = useCallback((mnemonic, password) => {
    if (!bip39.validateMnemonic(mnemonic)) throw new Error('Invalid mnemonic phrase')

    const kp = Ed25519Keypair.deriveKeypair(mnemonic)
    const addr = kp.getPublicKey().toSuiAddress()

    const keystore = CryptoJS.AES.encrypt(
      JSON.stringify({ mnemonic, privateKey: kp.getSecretKey() }),
      password
    ).toString()

    localStorage.setItem('sui_keystore', keystore)
    sessionStorage.setItem('sui_session_pw', password)

    setKeypair(kp)
    setAddress(addr)

    return { address: addr }
  }, [])

  // Unlock existing wallet with password
  const unlockWallet = useCallback((password) => {
    const stored = localStorage.getItem('sui_keystore')
    if (!stored) throw new Error('No wallet found')

    const decrypted = CryptoJS.AES.decrypt(stored, password)
    const { mnemonic } = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))

    const kp = Ed25519Keypair.deriveKeypair(mnemonic)
    const addr = kp.getPublicKey().toSuiAddress()

    sessionStorage.setItem('sui_session_pw', password)

    setKeypair(kp)
    setAddress(addr)

    return { address: addr }
  }, [])

  // Lock wallet (clear from memory and session)
  const lockWallet = useCallback(() => {
    sessionStorage.removeItem('sui_session_pw')
    sessionStorage.removeItem('sui_unlocked')
    setKeypair(null)
    setAddress(null)
    setBalance('0')
    setObjects([])
  }, [])

  // Fetch balance from Sui RPC
  const fetchBalance = useCallback(async (addr) => {
    const target = addr || address
    if (!target) return
    try {
      const res = await suiClient.getBalance({ owner: target })
      setBalance(res.totalBalance)
      return res.totalBalance
    } catch {
      // Testnet may be temporarily unavailable — keep existing balance
    }
  }, [address])

  // Fetch all owned objects (coins + NFTs)
  const fetchObjects = useCallback(async (addr) => {
    const target = addr || address
    if (!target) return
    setLoading(true)
    try {
      const res = await suiClient.getOwnedObjects({
        owner: target,
        options: { showContent: true, showDisplay: true, showType: true }
      })
      setObjects(res.data)
      return res.data
    } catch {
      // Keep existing objects on error
    } finally {
      setLoading(false)
    }
  }, [address])

  const hasWallet = !!localStorage.getItem('sui_keystore')

  return (
    <WalletContext.Provider value={{
      keypair,
      address,
      balance,
      objects,
      loading,
      hasWallet,
      suiClient,
      createWallet,
      importWallet,
      unlockWallet,
      lockWallet,
      fetchBalance,
      fetchObjects,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => useContext(WalletContext)
