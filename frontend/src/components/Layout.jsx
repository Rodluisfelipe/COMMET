import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import ConfirmDialog from './ConfirmDialog'
import {
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  TagIcon,
  SparklesIcon,
  GiftIcon,
  BuildingOfficeIcon,
  TrashIcon,
  ShieldCheckIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Empresas', href: '/empresas', icon: BuildingOfficeIcon },
  { name: 'Empleados', href: '/empleados', icon: UsersIcon },
  { name: 'Contratos', href: '/contratos', icon: DocumentTextIcon },
  { name: 'Liquidaciones', href: '/liquidaciones', icon: CurrencyDollarIcon },
  { name: 'Tipos Comisión', href: '/tipos-comision', icon: TagIcon },
  { name: 'Reportes', href: '/reportes', icon: ChartBarIcon },
]

// Componente de Logo animado
function Logo({ compact = false }) {
  return (
    <motion.div 
      className="flex items-center gap-2"
      whileHover={{ scale: 1.02 }}
    >
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        className="relative"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <GiftIcon className="w-6 h-6 text-white" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full"
        />
      </motion.div>
      {!compact && (
        <div className="flex flex-col">
          <span className="text-lg font-bold leading-none">
            <span className="text-blue-400">Tecno</span>
            <span className="text-white"> Rewards</span>
          </span>
          <span className="text-[10px] text-gray-400 tracking-wider">BONIFICACIONES & BONOS</span>
        </div>
      )}
    </motion.div>
  )
}

// Componente de item de navegación animado
function NavItem({ item, isActive, onClick }) {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className="relative block"
    >
      <motion.div
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200 ${
          isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
      >
        <motion.div
          animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <item.icon className="w-5 h-5" />
        </motion.div>
        <span className="font-medium">{item.name}</span>
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute right-2 w-2 h-2 rounded-full bg-white"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </motion.div>
    </Link>
  )
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetting, setResetting] = useState(false)
  const { user, logout, isSuperAdmin, isVisor, canResetDB } = useAuth()
  const location = useLocation()
  
  const handleResetDB = async () => {
    setResetting(true)
    try {
      const response = await api.post('/auth/reiniciar-bd')
      toast.success('Base de datos reiniciada correctamente', {
        duration: 5000,
        icon: '🗑️'
      })
      console.log('BD Reiniciada:', response.data)
      // Recargar la página para reflejar los cambios
      window.location.reload()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al reiniciar la base de datos')
    } finally {
      setResetting(false)
      setShowResetDialog(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30">
      {/* Sidebar móvil */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-72 bg-gray-900 shadow-2xl"
            >
              <div className="flex items-center justify-between h-20 px-5 border-b border-gray-800">
                <Logo />
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSidebarOpen(false)}
                  className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </motion.button>
              </div>
              <nav className="mt-6 px-3">
                {navigation.map((item, index) => {
                  const isActive = location.pathname === item.href
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <NavItem
                        item={item}
                        isActive={isActive}
                        onClick={() => setSidebarOpen(false)}
                      />
                    </motion.div>
                  )
                })}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-1 bg-gray-900 shadow-xl">
          {/* Logo */}
          <div className="flex items-center h-20 px-5 border-b border-gray-800">
            <Logo />
          </div>
          
          {/* Navegación */}
          <nav className="flex-1 mt-6 px-3 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/' && location.pathname.startsWith(item.href))
              return (
                <NavItem key={item.name} item={item} isActive={isActive} />
              )
            })}
          </nav>
          
          {/* Stats rápido */}
          <div className="px-4 py-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Tip del día</span>
              </div>
              <p className="text-xs text-gray-400">
                Usa los tipos de comisión predefinidos para agilizar la asignación a empleados.
              </p>
            </motion.div>
          </div>
          
          {/* Usuario */}
          <div className="p-4 border-t border-gray-800">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-800 mb-3"
            >
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
                  isSuperAdmin 
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20' 
                    : 'bg-blue-600 shadow-blue-500/20'
                }`}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  user?.nombre?.charAt(0) || 'A'
                )}
              </motion.div>
              <div className="flex-1 truncate">
                <p className="text-sm font-semibold text-white">{user?.nombre || 'Admin'}</p>
                <div className="flex items-center gap-1">
                  {isSuperAdmin ? (
                    <ShieldCheckIcon className="w-3 h-3 text-amber-400" />
                  ) : (
                    <EyeIcon className="w-3 h-3 text-blue-400" />
                  )}
                  <p className="text-xs text-gray-500">
                    {isSuperAdmin ? 'Super Admin' : 'Solo Lectura'}
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Botón Reiniciar BD - Solo visible para roles autorizados */}
            {canResetDB && (
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowResetDialog(true)}
                className="flex items-center gap-2 text-gray-500 hover:text-amber-400 transition-colors text-sm w-full px-3 py-2 rounded-lg hover:bg-amber-500/10 mb-2"
              >
                <TrashIcon className="w-5 h-5" />
                Reiniciar Base de Datos
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-400 transition-colors text-sm w-full px-3 py-2 rounded-lg hover:bg-red-500/10"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Cerrar sesión
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Dialog de confirmación para reiniciar BD */}
      <ConfirmDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleResetDB}
        title="⚠️ Reiniciar Base de Datos"
        message="Esta acción eliminará TODOS los datos del sistema (contratos, empleados, liquidaciones, empresas y tipos de comisión). Solo se mantendrán los usuarios. Esta acción NO se puede deshacer."
        confirmText={resetting ? "Reiniciando..." : "Sí, Reiniciar Todo"}
        cancelText="Cancelar"
        tipo="danger"
        loading={resetting}
      />
      
      {/* Contenido principal */}
      <div className="lg:pl-72">
        {/* Header móvil */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 lg:hidden"
        >
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
            >
              <Bars3Icon className="w-5 h-5 text-gray-600" />
            </motion.button>
            <Logo compact />
          </div>
        </motion.div>
        
        {/* Main content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 lg:p-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}
