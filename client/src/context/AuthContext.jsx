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
  const [isUnlocked, setIsUnlocked] = useState(false)

  const register = async (username, email, password) => {
    const { data } = await api.post('/api/auth/register', { username, email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('sui_email', email)   // remember email for unlock screen
    setUser(data.user)
    setIsUnlocked(true)
    return data
  }

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('sui_email', email)
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
    setUser(null)
    setIsUnlocked(false)
  }

  const unlock = () => setIsUnlocked(true)
  const lock   = () => setIsUnlocked(false)

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
