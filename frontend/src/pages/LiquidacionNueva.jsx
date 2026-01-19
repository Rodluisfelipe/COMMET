import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../utils/formatters'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import { 
  ArrowLeftIcon, 
  CheckIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  LockClosedIcon
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

export default function LiquidacionNueva() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedEmpleado = searchParams.get('empleado')
  const { canEdit } = useAuth()
  
  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(preselectedEmpleado || '')
  const [contratosSeleccionados, setContratosSeleccionados] = useState([])
  const [formPago, setFormPago] = useState({
    metodo: 'transferencia',
    referencia: '',
    observacion: ''
  })
  const [procesando, setProcesando] = useState(false)
  
  useEffect(() => {
    // Si no puede editar, redirigir
    if (!canEdit) {
      toast.error('No tienes permisos para crear liquidaciones')
      navigate('/liquidaciones')
      return
    }
    fetchPendientes()
  }, [canEdit, navigate])
  
  const fetchPendientes = async () => {
    try {
      const response = await api.get('/liquidaciones/pendientes')
      setPendientes(response.data)
      
      // Si hay empleado preseleccionado, seleccionar todas sus comisiones
      if (preselectedEmpleado) {
        const empData = response.data.find(p => p.empleado._id === preselectedEmpleado)
        if (empData) {
          // Ahora usamos 'comisiones' en lugar de 'contratos'
          const comisiones = empData.comisiones || empData.contratos || []
          setContratosSeleccionados(comisiones.map(c => ({
            contratoId: c.contratoId,
            participanteId: c.participanteId
          })))
        }
      }
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }
  
  const empleadoData = pendientes.find(p => p.empleado._id === empleadoSeleccionado)
  // Compatibilidad: usar 'comisiones' o 'contratos' (para datos antiguos)
  const comisionesEmpleado = empleadoData?.comisiones || empleadoData?.contratos || []
  
  const handleToggleContrato = (contratoId, participanteId) => {
    setContratosSeleccionados(prev => {
      // Usar participanteId para identificar cada comisión individual
      const existe = prev.some(c => c.participanteId === participanteId)
      if (existe) {
        return prev.filter(c => c.participanteId !== participanteId)
      } else {
        return [...prev, { contratoId, participanteId }]
      }
    })
  }
  
  const handleSelectAll = () => {
    if (!empleadoData) return
    if (contratosSeleccionados.length === comisionesEmpleado.length) {
      setContratosSeleccionados([])
    } else {
      setContratosSeleccionados(comisionesEmpleado.map(c => ({
        contratoId: c.contratoId,
        participanteId: c.participanteId
      })))
    }
  }
  
  const totalSeleccionado = comisionesEmpleado
    .filter(c => contratosSeleccionados.some(s => s.participanteId === c.participanteId))
    .reduce((acc, c) => acc + c.comision, 0) || 0
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!empleadoSeleccionado) {
      toast.error('Seleccione un empleado')
      return
    }
    
    if (contratosSeleccionados.length === 0) {
      toast.error('Seleccione al menos un contrato')
      return
    }
    
    setProcesando(true)
    
    try {
      await api.post('/liquidaciones', {
        empleadoId: empleadoSeleccionado,
        contratosIds: contratosSeleccionados,
        pago: formPago
      })
      
      toast.success('¡Liquidación creada exitosamente!')
      navigate('/liquidaciones')
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al crear liquidación')
    } finally {
      setProcesando(false)
    }
  }
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  return (
    <motion.div 
      className="space-y-6 max-w-4xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Link to="/liquidaciones" className="p-3 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
          </Link>
        </motion.div>
        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
          <SparklesIcon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Nueva Liquidación
          </h1>
          <p className="text-gray-500">Pago de bonificaciones a empleados</p>
        </div>
      </motion.div>
      
      {pendientes.length === 0 ? (
        <motion.div 
          variants={itemVariants}
          className="glass rounded-2xl p-10 text-center"
        >
          <CurrencyDollarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-3">No hay bonificaciones pendientes de liquidar</p>
          <Link 
            to="/contratos" 
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <DocumentTextIcon className="w-5 h-5" />
            Ver contratos
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paso 1: Seleccionar Empleado */}
          <motion.div variants={itemVariants} className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">1</div>
              <UserGroupIcon className="w-5 h-5 text-blue-500" />
              Seleccionar Empleado
            </h2>
            <select
              value={empleadoSeleccionado}
              onChange={(e) => {
                setEmpleadoSeleccionado(e.target.value)
                const empData = pendientes.find(p => p.empleado._id === e.target.value)
                if (empData) {
                  // Compatibilidad: usar 'comisiones' o 'contratos'
                  const comisiones = empData.comisiones || empData.contratos || []
                  setContratosSeleccionados(comisiones.map(c => ({
                    contratoId: c.contratoId,
                    participanteId: c.participanteId
                  })))
                } else {
                  setContratosSeleccionados([])
                }
              }}
              className="select-field"
              required
            >
              <option value="">Seleccionar empleado...</option>
              {pendientes.map(p => (
                <option key={p.empleado._id} value={p.empleado._id}>
                  {p.empleado.nombreCompleto} - {p.empleado.codigoInterno} ({formatCurrency(p.totalPendiente)} pendiente)
                </option>
              ))}
            </select>
          </motion.div>
          
          {/* Paso 2: Seleccionar Contratos */}
          <AnimatePresence>
            {empleadoData && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">2</div>
                    <DocumentTextIcon className="w-5 h-5 text-green-500" />
                    Seleccionar Bonificaciones a Liquidar
                  </h2>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSelectAll}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {contratosSeleccionados.length === comisionesEmpleado.length
                      ? 'Deseleccionar todas'
                      : 'Seleccionar todas'
                    }
                  </motion.button>
                </div>
                
                <div className="space-y-3">
                  {comisionesEmpleado.map((c, index) => {
                    const isSelected = contratosSeleccionados.some(s => s.participanteId === c.participanteId)
                    return (
                      <motion.label
                        key={c.participanteId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-sky-50 shadow-lg shadow-blue-500/10'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleContrato(c.contratoId, c.participanteId)}
                          className="w-5 h-5 text-blue-600 rounded-lg border-2"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{c.codigo}</p>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                              {c.tipoComisionNombre || 'Bonificación'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{c.cliente}</p>
                          {c.empresa && (
                            <p className="text-xs text-blue-600 font-medium mt-1">{c.empresa}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Monto contrato</p>
                          <p className="font-medium text-gray-700">{formatCurrency(c.montoContrato)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Bonificación</p>
                          <p className="font-bold text-blue-600">{formatCurrency(c.comision)}</p>
                        </div>
                      </motion.label>
                    )
                  })}
                </div>
                
                {/* Total */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 p-5 bg-gradient-to-r from-primary-100 to-blue-100 rounded-xl flex justify-between items-center"
                >
                  <span className="font-semibold text-primary-900 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" />
                    Total a Liquidar:
                  </span>
                  <span className="text-3xl font-bold text-primary-700">{formatCurrency(totalSeleccionado)}</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Paso 3: Información del Pago */}
          <AnimatePresence>
            {empleadoData && contratosSeleccionados.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-2xl p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">3</div>
                  <CurrencyDollarIcon className="w-5 h-5 text-blue-500" />
                  Información del Pago
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método de Pago *
                    </label>
                    <select
                      value={formPago.metodo}
                      onChange={(e) => setFormPago(prev => ({ ...prev, metodo: e.target.value }))}
                      className="select-field"
                      required
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="cheque">Cheque</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Referencia / Comprobante
                    </label>
                    <input
                      type="text"
                      value={formPago.referencia}
                      onChange={(e) => setFormPago(prev => ({ ...prev, referencia: e.target.value }))}
                      className="input-field"
                      placeholder="Número de transacción, cheque, etc."
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observación
                  </label>
                  <textarea
                    value={formPago.observacion}
                    onChange={(e) => setFormPago(prev => ({ ...prev, observacion: e.target.value }))}
                    className="input-field"
                    rows="2"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Botones */}
          <motion.div variants={itemVariants} className="flex justify-end gap-3">
            <Link to="/liquidaciones" className="btn-secondary">
              Cancelar
            </Link>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={procesando || !empleadoSeleccionado || contratosSeleccionados.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {procesando ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Procesando...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Confirmar Liquidación ({formatCurrency(totalSeleccionado)})
                </>
              )}
            </motion.button>
          </motion.div>
        </form>
      )}
    </motion.div>
  )
}
