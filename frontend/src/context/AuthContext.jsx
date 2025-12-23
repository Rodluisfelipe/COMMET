import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    checkAuth()
  }, [])
  
  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await api.get('/auth/verify')
        if (response.data.valid) {
          setUser(response.data.usuario)
        } else {
          localStorage.removeItem('token')
        }
      } catch (error) {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }
  
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', response.data.token)
    setUser(response.data.usuario)
    return response.data
  }
  
  const loginWithGoogle = async (credential) => {
    const response = await api.post('/auth/google', { credential })
    localStorage.setItem('token', response.data.token)
    setUser(response.data.usuario)
    return response.data
  }
  
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }
  
  // Helpers para verificar permisos
  const isSuperAdmin = user?.rol === 'superadmin'
  const isVisor = user?.rol === 'visor'
  const canEdit = isSuperAdmin // Solo superadmin puede editar
  const canResetDB = isSuperAdmin || isVisor // Ambos pueden reiniciar BD
  
  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      isSuperAdmin,
      isVisor,
      canEdit,
      canResetDB,
      login,
      loginWithGoogle,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
