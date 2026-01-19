import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import EstadoBadge from '../components/EstadoBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { CanEdit, ViewerBadge } from '../components/CanEdit'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatPercentage } from '../utils/formatters'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  UsersIcon,
  SparklesIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const initialForm = {
  nombreCompleto: '',
  identificacion: '',
  cargo: '',
  email: '',
  telefono: '',
  estado: 'activo',
  comisionBase: {
    tipo: 'porcentaje',
    valor: 0
  },
  observaciones: ''
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [buscar, setBuscar] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [guardando, setGuardando] = useState(false)
  const { canEdit } = useAuth()
  
  useEffect(() => {
    fetchEmpleados()
  }, [buscar, filtroEstado])
  
  const fetchEmpleados = async () => {
    try {
      const params = new URLSearchParams()
      if (buscar) params.append('buscar', buscar)
      if (filtroEstado) params.append('estado', filtroEstado)
      
      const response = await api.get(`/empleados?${params}`)
      setEmpleados(response.data)
    } catch (error) {
      toast.error('Error al cargar empleados')
    } finally {
      setLoading(false)
    }
  }
  
  const handleOpenModal = (empleado = null) => {
    if (empleado) {
      setEditando(empleado._id)
      setForm({
        nombreCompleto: empleado.nombreCompleto,
        identificacion: empleado.identificacion,
        cargo: empleado.cargo,
        email: empleado.email || '',
        telefono: empleado.telefono || '',
        estado: empleado.estado,
        comisionBase: empleado.comisionBase || { tipo: 'porcentaje', valor: 0 },
        observaciones: empleado.observaciones || ''
      })
    } else {
      setEditando(null)
      setForm(initialForm)
    }
    setModalOpen(true)
  }
  
  const handleCloseModal = () => {
    setModalOpen(false)
    setEditando(null)
    setForm(initialForm)
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('comisionBase.')) {
      const field = name.split('.')[1]
      setForm(prev => ({
        ...prev,
        comisionBase: {
          ...prev.comisionBase,
          [field]: field === 'valor' ? parseFloat(value) || 0 : value
        }
      }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    
    try {
      if (editando) {
        await api.put(`/empleados/${editando}`, form)
        toast.success('Empleado actualizado')
      } else {
        await api.post('/empleados', form)
        toast.success('Empleado creado')
      }
      handleCloseModal()
      fetchEmpleados()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }
  
  const handleEliminar = (empleado) => {
    setConfirmDelete(empleado)
  }
  
  const confirmarEliminar = async () => {
    if (!confirmDelete) return
    
    try {
      await api.delete(`/empleados/${confirmDelete._id}`)
      toast.success('🗑️ Empleado eliminado correctamente')
      fetchEmpleados()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al eliminar')
    } finally {
      setConfirmDelete(null)
    }
  }
  
  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Empleados
          </h1>
          <p className="text-gray-500">Gestiona el personal y sus bonificaciones base</p>
        </div>
        <CanEdit>
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
          >
            <SparklesIcon className="w-5 h-5" />
            Nuevo Empleado
          </motion.button>
        </CanEdit>
      </motion.div>
      
      {/* Aviso modo visor */}
      <ViewerBadge />
      
      {/* Filtros */}
      <motion.div variants={itemVariants} className="glass rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, identificación o código..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full bg-white/50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-white/50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 sm:w-44"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </motion.div>
      
      {/* Lista */}
      {loading ? (
        <LoadingSpinner />
      ) : empleados.length === 0 ? (
        <motion.div variants={itemVariants}>
          <EmptyState
            icon={UsersIcon}
            title="No hay empleados"
            description="Comienza agregando tu primer empleado al equipo"
            actionLabel="Agregar Empleado"
            onAction={() => handleOpenModal()}
          />
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="glass rounded-2xl overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Bonificación Base
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {empleados.map((emp, index) => (
                    <motion.tr 
                      key={emp._id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-blue-50/30 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                          {emp.codigoInterno}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/25">
                            {emp.nombreCompleto.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{emp.nombreCompleto}</p>
                            <p className="text-sm text-gray-500">{emp.identificacion}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {emp.cargo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-blue-600">
                          {emp.comisionBase?.tipo === 'porcentaje' 
                            ? formatPercentage(emp.comisionBase.valor)
                            : formatCurrency(emp.comisionBase?.valor || 0)
                          }
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          ({emp.comisionBase?.tipo === 'porcentaje' ? '%' : 'fijo'})
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <EstadoBadge estado={emp.estado} tipo="empleado" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Link
                              to={`/empleados/${emp._id}`}
                              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalle"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </Link>
                          </motion.div>
                          {canEdit && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleOpenModal(emp)}
                                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEliminar(emp)}
                                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
      
      {/* Confirm Dialog para eliminar */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar Empleado"
        message={`¿Estás seguro de eliminar a "${confirmDelete?.nombreCompleto}"? Esta acción no se puede deshacer si el empleado no tiene contratos liquidados.`}
        confirmText="Eliminar"
        tipo="danger"
      />
      
      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editando ? 'Editar Empleado' : 'Nuevo Empleado'}
        icon={editando ? PencilIcon : UsersIcon}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombreCompleto"
                value={form.nombreCompleto}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Identificación *
              </label>
              <input
                type="text"
                name="identificacion"
                value={form.identificacion}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cargo *
              </label>
              <input
                type="text"
                name="cargo"
                value={form.cargo}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estado
              </label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
              />
            </div>
          </div>
          
          {/* Bonificación Base */}
          <div className="border-t border-gray-100 pt-5 mt-5">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="w-4 h-4 text-white" />
              </span>
              Bonificación Base (Por defecto)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Bonificación
                </label>
                <select
                  name="comisionBase.tipo"
                  value={form.comisionBase.tipo}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                >
                  <option value="porcentaje">Porcentaje (%)</option>
                  <option value="fijo">Valor Fijo ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Valor
                </label>
                <input
                  type="number"
                  name="comisionBase.valor"
                  value={form.comisionBase.valor}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                  min="0"
                  step={form.comisionBase.tipo === 'porcentaje' ? '0.1' : '1000'}
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 resize-none"
              rows="2"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <motion.button 
              type="button" 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCloseModal} 
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancelar
            </motion.button>
            <motion.button 
              type="submit" 
              disabled={guardando}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 font-medium disabled:opacity-50"
            >
              {guardando ? '⏳ Guardando...' : editando ? '✓ Actualizar' : '✨ Crear Empleado'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}
