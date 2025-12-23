import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { 
  GiftIcon, 
  SparklesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    try {
      await loginWithGoogle(credentialResponse.credential)
      toast.success('¡Bienvenido a Tecno Rewards!', {
        icon: '🎉',
        style: {
          borderRadius: '12px',
          background: '#1e40af',
          color: '#fff',
        },
      })
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al iniciar sesión con Google')
    } finally {
      setLoading(false)
    }
  }
  
  const handleGoogleError = () => {
    toast.error('Error al conectar con Google')
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950 relative overflow-hidden">
      {/* Elementos decorativos animados */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Círculos flotantes */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, 30, 0],
            y: [0, -15, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/4 w-48 h-48 bg-blue-400/5 rounded-full blur-2xl"
        />
        
        {/* Estrellas/partículas */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{ 
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1]
            }}
            transition={{ 
              duration: 2 + Math.random() * 2, 
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
      
      <div className="w-full max-w-md p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20"
        >
          {/* Logo animado */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 shadow-2xl shadow-blue-500/40 mb-4"
            >
              <GiftIcon className="w-10 h-10 text-white" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold">
                <span className="text-blue-600">Tecno</span>
                <span className="text-gray-900"> Rewards</span>
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <SparklesIcon className="w-4 h-4 text-blue-500" />
                <p className="text-gray-500 text-sm font-medium">Sistema de Gestión de Comisiones</p>
                <SparklesIcon className="w-4 h-4 text-blue-500" />
              </div>
            </motion.div>
          </motion.div>
          
          {/* Mensaje de bienvenida */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-8"
          >
            <p className="text-gray-600 mb-2">Inicia sesión con tu cuenta corporativa</p>
            <p className="text-sm text-gray-400">@tecnophone.co</p>
          </motion.div>
          
          {/* Botón de Google */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            {loading ? (
              <div className="flex items-center gap-3 py-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full"
                />
                <span className="text-gray-600">Verificando acceso...</span>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                size="large"
                text="continue_with"
                shape="pill"
                locale="es"
              />
            )}
          </motion.div>
          
          {/* Info de acceso */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl border border-blue-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Acceso Restringido</p>
                <p className="text-xs text-gray-500">
                  Solo usuarios autorizados de Tecnophone
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-primary-300 mt-6 text-sm"
        >
          © 2025 Tecno Rewards - Todos los derechos reservados
        </motion.p>
      </div>
    </div>
  )
}
