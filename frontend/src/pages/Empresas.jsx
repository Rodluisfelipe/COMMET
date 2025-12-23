import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { CanEdit, ViewerBadge } from '../components/CanEdit'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function Empresas() {
  const { canEdit } = useAuth()
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalForm, setModalForm] = useState(false)
  const [empresaEditar, setEmpresaEditar] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [guardando, setGuardando] = useState(false)
  
  const [form, setForm] = useState({
    nombre: '',
    nit: '',
    logo: '',
    direccion: '',
    telefono: '',
    email: ''
  })
  
  useEffect(() => {
    fetchEmpresas()
  }, [])
  
  const fetchEmpresas = async () => {
    try {
      const response = await api.get('/empresas')
      setEmpresas(response.data)
    } catch (error) {
      toast.error('Error al cargar empresas')
    } finally {
      setLoading(false)
    }
  }
  
  const handleOpenModal = (empresa = null) => {
    if (empresa) {
      setEmpresaEditar(empresa)
      setForm({
        nombre: empresa.nombre,
        nit: empresa.nit,
        logo: empresa.logo || '',
        direccion: empresa.direccion || '',
        telefono: empresa.telefono || '',
        email: empresa.email || ''
      })
    } else {
      setEmpresaEditar(null)
      setForm({
        nombre: '',
        nit: '',
        logo: '',
        direccion: '',
        telefono: '',
        email: ''
      })
    }
    setModalForm(true)
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    
    try {
      if (empresaEditar) {
        await api.put(`/empresas/${empresaEditar._id}`, form)
        toast.success('✅ Empresa actualizada')
      } else {
        await api.post('/empresas', form)
        toast.success('🏢 Empresa creada')
      }
      setModalForm(false)
      fetchEmpresas()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar empresa')
    } finally {
      setGuardando(false)
    }
  }
  
  const handleEliminar = (empresa) => {
    setConfirmDelete(empresa)
  }
  
  const confirmarEliminar = async () => {
    if (!confirmDelete) return
    
    try {
      await api.delete(`/empresas/${confirmDelete._id}`)
      toast.success('🗑️ Empresa eliminada')
      fetchEmpresas()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al eliminar')
    } finally {
      setConfirmDelete(null)
    }
  }
  
  const toggleEstado = async (empresa) => {
    try {
      const nuevoEstado = empresa.estado === 'activo' ? 'inactivo' : 'activo'
      await api.put(`/empresas/${empresa._id}/estado`, { estado: nuevoEstado })
      toast.success(`Empresa ${nuevoEstado === 'activo' ? 'activada' : 'desactivada'}`)
      fetchEmpresas()
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }
  
  const empresasFiltradas = empresas.filter(emp =>
    emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    emp.nit.toLowerCase().includes(busqueda.toLowerCase())
  )
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="Cargando empresas..." />
      </div>
    )
  }
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Empresas
          </h1>
          <p className="text-gray-500 mt-1">Gestiona las empresas del sistema</p>
        </div>
        <CanEdit>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
          >
            <PlusIcon className="w-5 h-5" />
            Nueva Empresa
          </motion.button>
        </CanEdit>
      </motion.div>
      
      <ViewerBadge />
      
      {/* Búsqueda */}
      <motion.div variants={itemVariants} className="glass rounded-2xl p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o NIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
          />
        </div>
      </motion.div>
      
      {/* Lista de empresas */}
      {empresasFiltradas.length === 0 ? (
        <motion.div variants={itemVariants}>
          <EmptyState
            icon={BuildingOfficeIcon}
            title="No hay empresas"
            description="Crea tu primera empresa para asignarla a los contratos"
            action={canEdit ? () => handleOpenModal() : null}
            actionLabel="Crear Empresa"
          />
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {empresasFiltradas.map((empresa) => (
              <motion.div
                key={empresa._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                className="glass rounded-2xl p-5 relative group"
              >
                {/* Estado badge */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => toggleEstado(empresa)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
                      empresa.estado === 'activo'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {empresa.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
                
                {/* Logo o placeholder */}
                <div className="flex items-center gap-4 mb-4">
                  {empresa.logo ? (
                    <img
                      src={empresa.logo}
                      alt={empresa.nombre}
                      className="w-16 h-16 rounded-xl object-contain bg-white border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold ${empresa.logo ? 'hidden' : ''}`}
                  >
                    {empresa.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{empresa.nombre}</h3>
                    <p className="text-sm text-gray-500">NIT: {empresa.nit}</p>
                  </div>
                </div>
                
                {/* Info adicional */}
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  {empresa.direccion && (
                    <p className="truncate">📍 {empresa.direccion}</p>
                  )}
                  {empresa.telefono && (
                    <p>📞 {empresa.telefono}</p>
                  )}
                  {empresa.email && (
                    <p className="truncate">✉️ {empresa.email}</p>
                  )}
                </div>
                
                {/* Acciones */}
                {canEdit && (
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenModal(empresa)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Editar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEliminar(empresa)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Modal de formulario */}
      <Modal
        isOpen={modalForm}
        onClose={() => setModalForm(false)}
        title={empresaEditar ? 'Editar Empresa' : 'Nueva Empresa'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Ej: Tecnophone S.A.S"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                NIT *
              </label>
              <input
                type="text"
                value={form.nit}
                onChange={(e) => setForm({ ...form, nit: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Ej: 900123456-1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Ej: 601 234 5678"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL del Logo
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={form.logo}
                  onChange={(e) => setForm({ ...form, logo: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="https://ejemplo.com/logo.png"
                />
                {form.logo && (
                  <div className="w-12 h-12 rounded-xl border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                    <img 
                      src={form.logo} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                      onError={(e) => e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12">❌</text></svg>'}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Este logo aparecerá en los comprobantes de liquidación</p>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Ej: Calle 100 # 50-25, Bogotá"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Ej: contacto@empresa.com"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setModalForm(false)}
              className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={guardando}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : empresaEditar ? 'Actualizar' : 'Crear Empresa'}
            </motion.button>
          </div>
        </form>
      </Modal>
      
      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar Empresa"
        message={`¿Estás seguro de eliminar la empresa "${confirmDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
      />
    </motion.div>
  )
}
