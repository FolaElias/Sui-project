import { createContext, useContext, useState } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// Axios instance that always attaches JWT
const api = axios.create()
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Persist unlock state across refreshes via sessionStorage
  // (sessionStorage survives refresh but clears when the tab is closed)
  const [isUnlocked, setIsUnlocked] = useState(
    () => sessionStorage.getItem('sui_unlocked') === 'true' && !!localStorage.getItem('token')
  )

  const register = async (username, email, password) => {
    const { data } = await api.post('/api/auth/register', { username, email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('sui_email', email)
    sessionStorage.setItem('sui_unlocked', 'true')
    setUser(data.user)
    setIsUnlocked(true)
    return data
  }

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('sui_email', email)
    sessionStorage.setItem('sui_unlocked', 'true')
    setUser(data.user)
    setIsUnlocked(true)
    return data
  }

  // Link a Sui address to the logged-in user profile
  const linkAddress = async (suiAddress) => {
    const { data } = await api.patch('/api/user/address', { suiAddress })
    setUser(data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('sui_unlocked')
    sessionStorage.removeItem('sui_session_pw')
    setUser(null)
    setIsUnlocked(false)
  }

  const unlock = () => {
    sessionStorage.setItem('sui_unlocked', 'true')
    setIsUnlocked(true)
  }
  const lock = () => {
    sessionStorage.removeItem('sui_unlocked')
    sessionStorage.removeItem('sui_session_pw')
    setIsUnlocked(false)
  }

  const savedEmail = localStorage.getItem('sui_email') || ''

  return (
    <AuthContext.Provider value={{
      user, isUnlocked, savedEmail,
      register, login, logout,
      linkAddress, unlock, lock,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
