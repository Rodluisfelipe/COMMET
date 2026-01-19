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
import { formatCurrency, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  FunnelIcon,
  DocumentTextIcon,
  SparklesIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  BoltIcon
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

const tiposContrato = [
  { value: 'venta_directa', label: 'Venta Directa' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'proyecto', label: 'Proyecto' }
]

const initialForm = {
  codigo: '',
  tipo: 'venta_directa',
  empresa: '',
  cliente: {
    nombre: '',
    identificacion: '',
    telefono: '',
    email: ''
  },
  descripcion: '',
  montoTotal: '',
  deducciones: '',
  fechaVencimiento: '',
  observaciones: ''
}

export default function Contratos() {
  const [contratos, setContratos] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [buscar, setBuscar] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [generandoCodigo, setGenerandoCodigo] = useState(false)
  const [codigoError, setCodigoError] = useState('')
  const { canEdit } = useAuth()
  
  useEffect(() => {
    fetchContratos()
    fetchEmpresas()
  }, [buscar, filtroEstado, filtroTipo])
  
  const fetchContratos = async () => {
    try {
      const params = new URLSearchParams()
      if (buscar) params.append('buscar', buscar)
      if (filtroEstado) params.append('estado', filtroEstado)
      if (filtroTipo) params.append('tipo', filtroTipo)
      
      const response = await api.get(`/contratos?${params}`)
      setContratos(response.data)
    } catch (error) {
      toast.error('Error al cargar contratos')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchEmpresas = async () => {
    try {
      const response = await api.get('/empresas?estado=activo')
      setEmpresas(response.data)
    } catch (error) {
      console.error('Error al cargar empresas:', error)
    }
  }
  
  const handleOpenModal = () => {
    setForm(initialForm)
    setCodigoError('')
    setModalOpen(true)
  }
  
  const handleCloseModal = () => {
    setModalOpen(false)
    setForm(initialForm)
    setCodigoError('')
  }
  
  const handleGenerarCodigo = async () => {
    setGenerandoCodigo(true)
    try {
      const response = await api.get('/contratos/generar-codigo')
      setForm(prev => ({ ...prev, codigo: response.data.codigo }))
      setCodigoError('')
      toast.success('Código generado')
    } catch (error) {
      toast.error('Error al generar código')
    } finally {
      setGenerandoCodigo(false)
    }
  }
  
  const verificarCodigo = async (codigo) => {
    if (!codigo.trim()) {
      setCodigoError('')
      return
    }
    try {
      const response = await api.get(`/contratos/verificar-codigo/${encodeURIComponent(codigo)}`)
      if (response.data.existe) {
        setCodigoError('Este código ya existe')
      } else {
        setCodigoError('')
      }
    } catch (error) {
      console.error('Error al verificar código')
    }
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('cliente.')) {
      const field = name.split('.')[1]
      setForm(prev => ({
        ...prev,
        cliente: { ...prev.cliente, [field]: value }
      }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar que no haya error de código duplicado
    if (codigoError) {
      toast.error('El código de contrato ya existe')
      return
    }
    
    setGuardando(true)
    
    try {
      const data = {
        ...form,
        codigo: form.codigo.trim() || undefined, // Si está vacío, el backend genera uno
        empresa: form.empresa || null,
        montoTotal: parseFloat(form.montoTotal) || 0,
        deducciones: parseFloat(form.deducciones) || 0
      }
      await api.post('/contratos', data)
      toast.success('Contrato creado exitosamente')
      handleCloseModal()
      fetchContratos()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al crear contrato')
    } finally {
      setGuardando(false)
    }
  }
  
  const getTipoLabel = (tipo) => {
    return tiposContrato.find(t => t.value === tipo)?.label || tipo
  }
  
  const handleEliminar = (contrato) => {
    setConfirmDelete(contrato)
  }
  
  const confirmarEliminar = async () => {
    if (!confirmDelete) return
    
    try {
      await api.delete(`/contratos/${confirmDelete._id}`)
      toast.success('🗑️ Contrato eliminado correctamente')
      fetchContratos()
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
            Contratos
          </h1>
          <p className="text-gray-500">Gestiona ventas, contratos y proyectos</p>
        </div>
        <CanEdit>
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenModal} 
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
          >
            <SparklesIcon className="w-5 h-5" />
            Nuevo Contrato
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
              placeholder="Buscar por código, cliente..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full bg-white/50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-white/50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 sm:w-44"
          >
            <option value="">Todos los tipos</option>
            {tiposContrato.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-white/50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 sm:w-52"
          >
            <option value="">Todos los estados</option>
            <option value="registrado">Registrado</option>
            <option value="pago_parcial">Pago Parcial</option>
            <option value="pagado">Pagado</option>
            <option value="liquidado">Liquidado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </motion.div>
      
      {/* Lista */}
      {loading ? (
        <LoadingSpinner />
      ) : contratos.length === 0 ? (
        <motion.div variants={itemVariants}>
          <EmptyState
            icon={DocumentTextIcon}
            title="No hay contratos"
            description="Comienza creando tu primer contrato o venta"
            actionLabel="Crear Contrato"
            onAction={handleOpenModal}
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
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Monto Total
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pagado
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Participantes
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {contratos.map((contrato, index) => (
                    <motion.tr 
                      key={contrato._id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-blue-50/30 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                          {contrato.codigo}
                        </span>
                        <p className="text-xs text-gray-400">{formatDate(contrato.fecha)}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contrato.empresa ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                            <BuildingOfficeIcon className="w-3.5 h-3.5" />
                            {contrato.empresa.nombre}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-semibold text-gray-900">{contrato.cliente?.nombre}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{contrato.descripcion}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full shadow-sm">
                          {getTipoLabel(contrato.tipo)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-bold text-gray-900">{formatCurrency(contrato.montoTotal)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`font-semibold ${contrato.montoPagado >= contrato.montoTotal ? 'text-green-600' : 'text-yellow-600'}`}>
                          {formatCurrency(contrato.montoPagado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <EstadoBadge estado={contrato.estado} tipo="contrato" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/25">
                          {contrato.participantes?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Link
                              to={`/contratos/${contrato._id}`}
                              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                              title="Ver detalle"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </Link>
                          </motion.div>
                          {canEdit && contrato.estado !== 'liquidado' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEliminar(contrato)}
                              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </motion.button>
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
      
      {/* Modal Nuevo Contrato */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Nuevo Contrato"
        icon={DocumentTextIcon}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Código de Contrato */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <DocumentTextIcon className="w-4 h-4 inline mr-1" />
              Código de Contrato
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  name="codigo"
                  value={form.codigo}
                  onChange={(e) => {
                    const valor = e.target.value.toUpperCase()
                    setForm(prev => ({ ...prev, codigo: valor }))
                    // Verificar después de un pequeño delay
                    clearTimeout(window.codigoTimeout)
                    window.codigoTimeout = setTimeout(() => verificarCodigo(valor), 500)
                  }}
                  className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 ${
                    codigoError ? 'border-red-400 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="Ej: CTR-2026-00001 o dejar vacío para generar"
                />
                {codigoError && (
                  <p className="text-xs text-red-500 mt-1">{codigoError}</p>
                )}
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerarCodigo}
                disabled={generandoCodigo}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                title="Generar código automático"
              >
                <BoltIcon className={`w-5 h-5 ${generandoCodigo ? 'animate-spin' : ''}`} />
                {generandoCodigo ? '' : 'Generar'}
              </motion.button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Ingresa un código personalizado o usa el botón para generar uno automático. Si lo dejas vacío, se generará automáticamente.
            </p>
          </div>
          
          {/* Empresa */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <BuildingOfficeIcon className="w-4 h-4 inline mr-1" />
              Empresa
            </label>
            <select
              name="empresa"
              value={form.empresa}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
            >
              <option value="">Sin empresa asignada</option>
              {empresas.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.nombre} - NIT: {emp.nit}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">La empresa aparecerá en el comprobante de liquidación</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Contrato *
              </label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                required
              >
                {tiposContrato.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monto Total *
              </label>
              <input
                type="number"
                name="montoTotal"
                value={form.montoTotal}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>
          
          {/* Deducciones y Monto Neto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deducciones (Costos/Gastos)
              </label>
              <input
                type="number"
                name="deducciones"
                value={form.deducciones}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-gray-400 mt-1">Costos que se restan antes de calcular comisiones</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monto Neto (Base Comisiones)
              </label>
              <div className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency((parseFloat(form.montoTotal) || 0) - (parseFloat(form.deducciones) || 0))}
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">Las comisiones se calculan sobre este monto</p>
            </div>
          </div>
          
          {/* Datos del Cliente */}
          <div className="border-t border-gray-100 pt-5">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-4 h-4 text-white" />
              </span>
              Datos del Cliente
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre / Razón Social *
                </label>
                <input
                  type="text"
                  name="cliente.nombre"
                  value={form.cliente.nombre}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  NIT / Identificación
                </label>
                <input
                  type="text"
                  name="cliente.identificacion"
                  value={form.cliente.identificacion}
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
                  name="cliente.telefono"
                  value={form.cliente.telefono}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="cliente.email"
                  value={form.cliente.email}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 resize-none"
              rows="2"
              placeholder="Descripción del contrato o venta..."
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
              {guardando ? '⏳ Guardando...' : '✨ Crear Contrato'}
            </motion.button>
          </div>
        </form>
      </Modal>
      
      {/* Confirm Dialog para eliminar */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar Contrato"
        message={`¿Estás seguro de eliminar el contrato "${confirmDelete?.codigo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        tipo="danger"
      />
    </motion.div>
  )
}
