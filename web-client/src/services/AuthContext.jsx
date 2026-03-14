import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        // Decode token directly — no API call, no re-render loop
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({
          id:       payload.user_id,
          username: payload.username || 'User',
          email:    payload.email    || '',
          role:     payload.role     || 'staff',
        })
      } catch {
        localStorage.clear()
      }
    }
    setLoading(false)
  }, []) // ← empty array = runs ONCE only

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials)
    localStorage.setItem('access_token',  data.access)
    localStorage.setItem('refresh_token', data.refresh)
    const payload = JSON.parse(atob(data.access.split('.')[1]))
    const me = {
      id:       payload.user_id,
      username: payload.username || 'User',
      email:    payload.email    || '',
      role:     payload.role     || 'staff',
    }
    setUser(me)
    return me
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)