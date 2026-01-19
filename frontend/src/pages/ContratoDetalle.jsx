import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { CanEdit, ViewerBadge } from '../components/CanEdit'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate, formatDateTime, formatPercentage } from '../utils/formatters'
import EstadoBadge from '../components/EstadoBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PencilIcon,
  CalculatorIcon,
  MinusCircleIcon
} from '@heroicons/react/24/outline'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ContratoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit } = useAuth()
  const [contrato, setContrato] = useState(null)
  const [empleados, setEmpleados] = useState([])
  const [tiposComision, setTiposComision] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modales
  const [modalParticipante, setModalParticipante] = useState(false)
  const [modalPago, setModalPago] = useState(false)
  const [modalEstado, setModalEstado] = useState(false)
  const [modalDeducciones, setModalDeducciones] = useState(false)
  
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [formDeducciones, setFormDeducciones] = useState('')
  
  // Forms
  const [formParticipante, setFormParticipante] = useState({
    empleadoId: '',
    tipoComisionId: '',
    usaComisionBase: false,
    comisionPersonalizada: false,
    comision: { tipo: 'porcentaje', valor: 0 }
  })
  const [formPago, setFormPago] = useState({
    monto: '',
    metodo: 'transferencia',
    referencia: '',
    observacion: ''
  })
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [observacionEstado, setObservacionEstado] = useState('')
  const [guardando, setGuardando] = useState(false)
  
  useEffect(() => {
    fetchData()
  }, [id])
  
  const fetchData = async () => {
    try {
      const [contratoRes, empRes, tiposRes] = await Promise.all([
        api.get(`/contratos/${id}`),
        api.get('/empleados?estado=activo'),
        api.get('/tipos-comision?estado=activo')
      ])
      setContrato(contratoRes.data)
      setEmpleados(empRes.data)
      setTiposComision(tiposRes.data)
    } catch (error) {
      toast.error('Error al cargar contrato')
    } finally {
      setLoading(false)
    }
  }
  
  const handleAgregarParticipante = async (e) => {
    e.preventDefault()
    setGuardando(true)
    
    try {
      // Preparar datos según la selección
      const payload = {
        empleadoId: formParticipante.empleadoId,
        usaComisionBase: formParticipante.usaComisionBase,
        tipoComisionId: formParticipante.tipoComisionId || null,
        comision: formParticipante.comisionPersonalizada 
          ? formParticipante.comision 
          : undefined
      }
      
      await api.post(`/contratos/${id}/participantes`, payload)
      toast.success('Comisión agregada')
      setModalParticipante(false)
      setFormParticipante({ 
        empleadoId: '', 
        tipoComisionId: '',
        usaComisionBase: false, 
        comisionPersonalizada: false,
        comision: { tipo: 'porcentaje', valor: 0 } 
      })
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al agregar comisión')
    } finally {
      setGuardando(false)
    }
  }
  
  const handleEliminarParticipante = (participanteId) => {
    setConfirmDelete(participanteId)
  }
  
  const confirmarEliminarParticipante = async () => {
    if (!confirmDelete) return
    
    try {
      await api.delete(`/contratos/${id}/participantes/${confirmDelete}`)
      toast.success('🗑️ Comisión eliminada')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al eliminar')
    } finally {
      setConfirmDelete(null)
    }
  }
  
  const handleRegistrarPago = async (e) => {
    e.preventDefault()
    setGuardando(true)
    
    try {
      await api.post(`/contratos/${id}/pagos`, {
        ...formPago,
        monto: parseFloat(formPago.monto)
      })
      toast.success('Pago registrado')
      setModalPago(false)
      setFormPago({ monto: '', metodo: 'transferencia', referencia: '', observacion: '' })
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al registrar pago')
    } finally {
      setGuardando(false)
    }
  }
  
  const handleCambiarEstado = async (e) => {
    e.preventDefault()
    setGuardando(true)
    
    try {
      await api.post(`/contratos/${id}/estado`, {
        nuevoEstado,
        observacion: observacionEstado
      })
      toast.success('Estado actualizado')
      setModalEstado(false)
      setNuevoEstado('')
      setObservacionEstado('')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al cambiar estado')
    } finally {
      setGuardando(false)
    }
  }
  
  const handleOpenDeducciones = () => {
    setFormDeducciones(contrato.deducciones?.toString() || '0')
    setModalDeducciones(true)
  }
  
  const handleActualizarDeducciones = async (e) => {
    e.preventDefault()
    setGuardando(true)
    
    try {
      await api.put(`/contratos/${id}`, {
        deducciones: parseFloat(formDeducciones) || 0
      })
      toast.success('💰 Deducciones actualizadas - Comisiones recalculadas')
      setModalDeducciones(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al actualizar deducciones')
    } finally {
      setGuardando(false)
    }
  }
  
  const getAccionesEstado = () => {
    // Estados: registrado → pago_parcial/pagado → liquidado
    // Solo se puede liquidar cuando está pagado totalmente
    const acciones = {
      registrado: [
        { estado: 'cancelado', label: 'Cancelar', icon: XCircleIcon, color: 'btn-danger' }
      ],
      pago_parcial: [
        { estado: 'pagado', label: 'Marcar Pagado Completo', icon: CheckCircleIcon, color: 'btn-success' },
        { estado: 'cancelado', label: 'Cancelar', icon: XCircleIcon, color: 'btn-danger' }
      ],
      pagado: [
        { estado: 'liquidado', label: 'Liquidar Comisiones', icon: BanknotesIcon, color: 'btn-success' }
      ],
      liquidado: [],
      cancelado: []
    }
    return acciones[contrato?.estado] || []
  }
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (!contrato) {
    return <div className="text-center mt-20 text-gray-500">Contrato no encontrado</div>
  }
  
  // Calcular monto neto y saldo pendiente sobre el monto neto (no total)
  const montoNeto = contrato.montoNeto || (contrato.montoTotal - (contrato.deducciones || 0))
  const saldoPendiente = Math.max(0, montoNeto - contrato.montoPagado)
  
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
        className="flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Link to="/contratos" className="p-3 hover:bg-gray-100 rounded-xl transition-colors self-start inline-block">
            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
          </Link>
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {contrato.codigo}
            </h1>
            <EstadoBadge estado={contrato.estado} tipo="contrato" />
          </div>
          <p className="text-gray-500">{contrato.cliente?.nombre}</p>
        </div>
        
        {/* Acciones de estado */}
        {canEdit && (
          <div className="flex gap-2 flex-wrap">
            {getAccionesEstado().map((accion) => (
              <motion.button
                key={accion.estado}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setNuevoEstado(accion.estado)
                  setModalEstado(true)
                }}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium shadow-lg transition-all duration-300 ${
                  accion.color === 'btn-success' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25' 
                    : accion.color === 'btn-danger'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25'
                }`}
              >
                <accion.icon className="w-4 h-4" />
                {accion.label}
              </motion.button>
            ))}
            
            {(contrato.estado === 'registrado' || contrato.estado === 'pago_parcial') && (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setModalPago(true)}
                className="flex items-center gap-2 text-sm px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-300"
              >
                <BanknotesIcon className="w-4 h-4" />
                Registrar Pago
              </motion.button>
            )}
          </div>
        )}
      </motion.div>
      
      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Monto Total */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="glass rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center shadow-lg shadow-gray-400/25">
            <DocumentTextIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Monto Total</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(contrato.montoTotal)}</p>
          </div>
        </motion.div>
        
        {/* Deducciones - Con botón editar */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className={`glass rounded-2xl p-5 flex items-center gap-4 relative group ${canEdit && contrato.estado !== 'liquidado' ? 'cursor-pointer' : ''}`}
          onClick={canEdit && contrato.estado !== 'liquidado' ? handleOpenDeducciones : undefined}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
            <MinusCircleIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium">Deducciones</p>
            <p className="text-xl font-bold text-red-600">-{formatCurrency(contrato.deducciones || 0)}</p>
          </div>
          {canEdit && contrato.estado !== 'liquidado' && (
            <motion.div 
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute top-2 right-2 p-1.5 bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <PencilIcon className="w-4 h-4 text-red-600" />
            </motion.div>
          )}
        </motion.div>
        
        {/* Monto Neto */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="glass rounded-2xl p-5 flex items-center gap-4 border-2 border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
            <CalculatorIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-green-700 font-medium">Monto Neto</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(contrato.montoNeto || (contrato.montoTotal - (contrato.deducciones || 0)))}</p>
            <p className="text-[10px] text-green-500">Base para comisiones</p>
          </div>
        </motion.div>
        
        {/* Monto Pagado */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="glass rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <BanknotesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pagado por Cliente</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(contrato.montoPagado)}</p>
          </div>
        </motion.div>
        
        {/* Saldo Pendiente */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="glass rounded-2xl p-5 flex items-center gap-4"
        >
          <div className={`w-12 h-12 bg-gradient-to-br ${saldoPendiente > 0 ? 'from-yellow-400 to-yellow-600 shadow-yellow-500/25' : 'from-green-400 to-green-600 shadow-green-500/25'} rounded-xl flex items-center justify-center shadow-lg`}>
            <ClockIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Saldo Pendiente</p>
            <p className={`text-xl font-bold ${saldoPendiente > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {formatCurrency(saldoPendiente)}
            </p>
          </div>
        </motion.div>
        
        {/* Total Comisiones */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="glass rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Comisiones</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(contrato.totalComisiones)}</p>
          </div>
        </motion.div>
      </motion.div>
      
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info del contrato */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-500" />
            Información del Contrato
          </h2>
          <div className="space-y-3">
            {/* Empresa */}
            {contrato.empresa && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-600 font-medium">Empresa</p>
                <p className="font-bold text-blue-800">{contrato.empresa.nombre}</p>
                <p className="text-xs text-blue-600">NIT: {contrato.empresa.nit}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Tipo</p>
              <p className="font-medium capitalize">{contrato.tipo?.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-medium">{formatDate(contrato.fecha)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Descripción</p>
              <p className="font-medium">{contrato.descripcion || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Margen Neto</p>
              <p className="font-medium text-primary-600">{formatCurrency(contrato.margenNeto)}</p>
            </div>
          </div>
          
          <h3 className="text-md font-semibold text-gray-900 mt-6 mb-3">Datos del Cliente</h3>
          <div className="space-y-2">
            <p className="text-sm"><span className="text-gray-500">NIT:</span> {contrato.cliente?.identificacion || '-'}</p>
            <p className="text-sm"><span className="text-gray-500">Teléfono:</span> {contrato.cliente?.telefono || '-'}</p>
            <p className="text-sm"><span className="text-gray-500">Email:</span> {contrato.cliente?.email || '-'}</p>
          </div>
        </motion.div>
        
        {/* Participantes */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass rounded-2xl p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-blue-500" />
              Participantes y Comisiones
            </h2>
            {canEdit && contrato.estado !== 'liquidado' && contrato.estado !== 'cancelado' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setModalParticipante(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/25"
              >
                <PlusIcon className="w-4 h-4" />
                Agregar Comisión
              </motion.button>
            )}
          </div>
          
          {contrato.participantes?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Empleado</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Comisión</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Estimada</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Calculada</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {contrato.participantes.map((p) => (
                      <motion.tr 
                        key={p._id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{p.empleado?.nombreCompleto}</p>
                          <p className="text-xs text-gray-500">{p.empleado?.codigoInterno}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-medium text-accent-600">
                            {p.comision?.tipo === 'porcentaje'
                              ? formatPercentage(p.comision.valor)
                              : formatCurrency(p.comision?.valor)
                            }
                          </span>
                          <p className="text-xs text-gray-400">
                            {p.tipoComisionNombre || (p.comision?.usaTipoPredefinido === false ? '(Personalizada)' : '(Base)')}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          {formatCurrency(p.comisionEstimada)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium ${
                            contrato.estado === 'pagado' || contrato.estado === 'liquidado'
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}>
                            {contrato.estado === 'pagado' || contrato.estado === 'liquidado'
                              ? formatCurrency(p.comisionCalculada)
                              : '-'
                            }
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <EstadoBadge estado={p.estadoComision} tipo="comision" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canEdit && contrato.estado !== 'liquidado' && p.estadoComision !== 'pagada' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setConfirmDelete(p._id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </motion.button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay participantes asignados</p>
              <p className="text-sm text-gray-400 mt-1">Agrega empleados que participarán en este contrato</p>
            </div>
          )}
          
          {/* Nota importante */}
          {contrato.estado !== 'pagado' && contrato.estado !== 'liquidado' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-100"
            >
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                Las comisiones solo se calculan cuando el contrato está <strong>Pagado</strong>.
                Actualmente se muestran estimaciones.
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
      
      {/* Historial de pagos */}
      {contrato.historialPagos?.length > 0 && (
        <motion.div variants={itemVariants} className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BanknotesIcon className="w-5 h-5 text-green-500" />
            Historial de Pagos del Cliente
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Método</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Referencia</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {contrato.historialPagos.map((pago, index) => (
                    <motion.tr 
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 text-sm">{formatDateTime(pago.fecha)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(pago.monto)}</td>
                      <td className="px-4 py-3 text-sm capitalize">{pago.metodo}</td>
                      <td className="px-4 py-3 text-sm">{pago.referencia || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{pago.observacion || '-'}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
      
      {/* Historial de estados */}
      <motion.div variants={itemVariants} className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-purple-500" />
          Historial de Estados
        </h2>
        <div className="space-y-3">
          <AnimatePresence>
            {contrato.historialEstados?.map((h, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"
              >
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 mt-2 shadow-sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <EstadoBadge estado={h.estado} tipo="contrato" />
                    <span className="text-sm text-gray-500">{formatDateTime(h.fecha)}</span>
                  </div>
                  {h.observacion && <p className="text-sm text-gray-600 mt-1">{h.observacion}</p>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Modal Agregar Comisión a Participante */}
      <Modal
        isOpen={modalParticipante}
        onClose={() => setModalParticipante(false)}
        title="Agregar Comisión"
        icon={UserGroupIcon}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAgregarParticipante} className="space-y-4">
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 mb-2">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Puedes agregar múltiples tipos de comisión al mismo empleado. 
              Por ejemplo: comisión por presentación + comisión por ganado.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empleado *</label>
            <select
              value={formParticipante.empleadoId}
              onChange={(e) => setFormParticipante(prev => ({ ...prev, empleadoId: e.target.value }))}
              className="select-field"
              required
            >
              <option value="">Seleccionar empleado</option>
              {empleados.map(e => (
                  <option key={e._id} value={e._id}>
                    {e.nombreCompleto} - {e.codigoInterno}
                  </option>
                ))
              }
            </select>
          </div>
          
          {/* Opciones de comisión */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Tipo de Comisión *</label>
            
            {/* Tipos predefinidos */}
            {tiposComision.filter(tc => tc.aplicaA?.includes(contrato?.tipo)).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Comisiones Predefinidas</p>
                <div className="grid gap-2">
                  {tiposComision
                    .filter(tc => tc.aplicaA?.includes(contrato?.tipo))
                    .map(tc => (
                      <label
                        key={tc._id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                          formParticipante.tipoComisionId === tc._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tipoComision"
                          checked={formParticipante.tipoComisionId === tc._id}
                          onChange={() => setFormParticipante(prev => ({
                            ...prev,
                            tipoComisionId: tc._id,
                            usaComisionBase: false,
                            comisionPersonalizada: false,
                            comision: { tipo: tc.tipo, valor: tc.valor }
                          }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tc.color }}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{tc.nombre}</p>
                          {tc.descripcion && (
                            <p className="text-xs text-gray-500">{tc.descripcion}</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-accent-600">
                          {tc.tipo === 'porcentaje' ? `${tc.valor}%` : formatCurrency(tc.valor)}
                        </span>
                      </label>
                    ))
                  }
                </div>
              </div>
            )}
            
            {/* Usar comisión base del empleado */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Otras opciones</p>
              <label
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                  formParticipante.usaComisionBase
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="tipoComision"
                  checked={formParticipante.usaComisionBase}
                  onChange={() => setFormParticipante(prev => ({
                    ...prev,
                    tipoComisionId: '',
                    usaComisionBase: true,
                    comisionPersonalizada: false
                  }))}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Usar comisión base del empleado</p>
                  <p className="text-xs text-gray-500">Se usará la comisión configurada en el perfil del empleado</p>
                </div>
              </label>
              
              <label
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition mt-2 ${
                  formParticipante.comisionPersonalizada
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="tipoComision"
                  checked={formParticipante.comisionPersonalizada}
                  onChange={() => setFormParticipante(prev => ({
                    ...prev,
                    tipoComisionId: '',
                    usaComisionBase: false,
                    comisionPersonalizada: true
                  }))}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Comisión personalizada</p>
                  <p className="text-xs text-gray-500">Definir una comisión específica para este contrato</p>
                </div>
              </label>
            </div>
          </div>
          
          {/* Campos para comisión personalizada */}
          {formParticipante.comisionPersonalizada && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formParticipante.comision.tipo}
                  onChange={(e) => setFormParticipante(prev => ({
                    ...prev,
                    comision: { ...prev.comision, tipo: e.target.value }
                  }))}
                  className="select-field"
                >
                  <option value="porcentaje">Porcentaje (%)</option>
                  <option value="fijo">Valor Fijo ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <input
                  type="number"
                  value={formParticipante.comision.valor}
                  onChange={(e) => setFormParticipante(prev => ({
                    ...prev,
                    comision: { ...prev.comision, valor: parseFloat(e.target.value) || 0 }
                  }))}
                  className="input-field"
                  min="0"
                  step={formParticipante.comision.tipo === 'porcentaje' ? '0.01' : '1'}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalParticipante(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Modal Registrar Pago */}
      <Modal
        isOpen={modalPago}
        onClose={() => setModalPago(false)}
        title="Registrar Pago del Cliente"
        icon={BanknotesIcon}
      >
        <form onSubmit={handleRegistrarPago} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg mb-4 space-y-1">
            <p className="text-sm text-blue-800">
              Monto Neto (después de deducciones): <strong>{formatCurrency(montoNeto)}</strong>
            </p>
            <p className="text-sm text-blue-800">
              Ya pagado: <strong>{formatCurrency(contrato.montoPagado)}</strong>
            </p>
            <p className="text-sm text-blue-800 font-semibold">
              Saldo pendiente: <strong>{formatCurrency(saldoPendiente)}</strong>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
            <input
              type="number"
              value={formPago.monto}
              onChange={(e) => setFormPago(prev => ({ ...prev, monto: e.target.value }))}
              className="input-field"
              placeholder="0"
              min="1"
              max={saldoPendiente}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago *</label>
            <select
              value={formPago.metodo}
              onChange={(e) => setFormPago(prev => ({ ...prev, metodo: e.target.value }))}
              className="select-field"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
            <input
              type="text"
              value={formPago.referencia}
              onChange={(e) => setFormPago(prev => ({ ...prev, referencia: e.target.value }))}
              className="input-field"
              placeholder="Número de transacción, cheque, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
            <textarea
              value={formPago.observacion}
              onChange={(e) => setFormPago(prev => ({ ...prev, observacion: e.target.value }))}
              className="input-field"
              rows="2"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalPago(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-success">
              {guardando ? 'Registrando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Modal Cambiar Estado */}
      <Modal
        isOpen={modalEstado}
        onClose={() => setModalEstado(false)}
        title="Cambiar Estado del Contrato"
        icon={DocumentTextIcon}
      >
        <form onSubmit={handleCambiarEstado} className="space-y-4">
          <p className="text-gray-600">
            ¿Confirma que desea cambiar el estado a <strong className="text-primary-600">{nuevoEstado?.replace('_', ' ')}</strong>?
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
            <textarea
              value={observacionEstado}
              onChange={(e) => setObservacionEstado(e.target.value)}
              className="input-field"
              rows="2"
              placeholder="Motivo o comentario (opcional)"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalEstado(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Actualizando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Modal Editar Deducciones */}
      <Modal
        isOpen={modalDeducciones}
        onClose={() => setModalDeducciones(false)}
        title="Editar Deducciones"
        icon={MinusCircleIcon}
      >
        <form onSubmit={handleActualizarDeducciones} className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800">
              Las deducciones se restan del monto total para calcular el <strong>monto neto</strong>, 
              que es la base sobre la cual se calculan las comisiones.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total</label>
              <div className="input-field bg-gray-50 text-gray-600">
                {formatCurrency(contrato.montoTotal)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deducciones *</label>
              <input
                type="number"
                value={formDeducciones}
                onChange={(e) => setFormDeducciones(e.target.value)}
                className="input-field"
                placeholder="0"
                min="0"
                max={contrato.montoTotal}
                required
              />
            </div>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-green-800">Monto Neto (Base Comisiones):</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(contrato.montoTotal - (parseFloat(formDeducciones) || 0))}
              </span>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalDeducciones(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Guardando...' : 'Guardar Deducciones'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* ConfirmDialog para eliminar comisión */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmarEliminarParticipante}
        title="Eliminar Comisión"
        message="¿Está seguro de eliminar esta comisión del contrato? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        type="danger"
      />
    </motion.div>
  )
}
