import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters'
import EstadoBadge from '../components/EstadoBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  ArrowLeftIcon,
  UserIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  DocumentTextIcon
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

export default function EmpleadoDetalle() {
  const { id } = useParams()
  const [empleado, setEmpleado] = useState(null)
  const [comisiones, setComisiones] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  
  useEffect(() => {
    fetchData()
  }, [id])
  
  const fetchData = async () => {
    try {
      const [empRes, comRes] = await Promise.all([
        api.get(`/empleados/${id}`),
        api.get(`/empleados/${id}/comisiones`)
      ])
      setEmpleado(empRes.data)
      setComisiones(comRes.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (!empleado) {
    return <div className="text-center mt-20 text-gray-500">Empleado no encontrado</div>
  }
  
  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Link to="/empleados" className="p-3 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
          </Link>
        </motion.div>
        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
          <UserIcon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {empleado.nombreCompleto}
          </h1>
          <p className="text-gray-500">{empleado.codigoInterno}</p>
        </div>
        <div className="ml-auto">
          <EstadoBadge estado={empleado.estado} tipo="empleado" />
        </div>
      </motion.div>
      
      {/* Info Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="glass rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
            <CurrencyDollarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Generado</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(comisiones?.totalGenerado || 0)}</p>
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="glass rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <CheckCircleIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Pagado</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(comisiones?.totalPagado || 0)}</p>
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="glass rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
            <ClockIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pendiente por Pagar</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(comisiones?.totalPendiente || 0)}</p>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Datos del empleado */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-500" />
            Datos Personales
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Identificación</p>
              <p className="font-medium">{empleado.identificacion}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cargo</p>
              <p className="font-medium">{empleado.cargo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{empleado.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium">{empleado.telefono || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bonificación Base</p>
              <p className="font-medium text-accent-600">
                {empleado.comisionBase?.tipo === 'porcentaje'
                  ? formatPercentage(empleado.comisionBase.valor)
                  : formatCurrency(empleado.comisionBase?.valor || 0)
                }
                <span className="text-gray-400 text-sm ml-1">
                  ({empleado.comisionBase?.tipo})
                </span>
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Historial de comisiones */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass rounded-2xl p-6 lg:col-span-2"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-blue-500" />
              Historial de Bonificaciones
            </h2>
            
            {/* Filtro por estado */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFiltroEstado('todos')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filtroEstado === 'todos'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroEstado('pendiente')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filtroEstado === 'pendiente'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setFiltroEstado('parcial')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filtroEstado === 'parcial'
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
              >
                Pago Parcial
              </button>
              <button
                onClick={() => setFiltroEstado('pagada')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filtroEstado === 'pagada'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                Pagadas
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contrato</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Monto</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Bonificación</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Pagado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Pendiente</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {comisiones?.comisiones?.filter(c => 
                    filtroEstado === 'todos' || c.estadoComision === filtroEstado
                  ).length > 0 ? (
                    comisiones.comisiones
                      .filter(c => filtroEstado === 'todos' || c.estadoComision === filtroEstado)
                      .map((c, index) => (
                      <motion.tr 
                        key={c.participanteId || index} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link 
                            to={`/contratos/${c.contratoId}`}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {c.codigoContrato}
                          </Link>
                          <p className="text-xs text-gray-400 mt-1">
                            <EstadoBadge estado={c.estadoContrato} tipo="contrato" />
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.cliente}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            {c.tipoComisionNombre || 'Bonificación'}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            {c.tipoComision === 'porcentaje' ? `${c.valorComision}%` : formatCurrency(c.valorComision)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">{formatCurrency(c.montoContrato)}</td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-semibold text-accent-600">
                            {c.estadoContrato === 'pagado' || c.estadoContrato === 'liquidado'
                              ? formatCurrency(c.comisionCalculada)
                              : formatCurrency(c.comisionEstimada)
                            }
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(c.estadoContrato === 'pagado' || c.estadoContrato === 'liquidado') ? (
                            <p className={`font-semibold ${c.comisionPagada > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                              {formatCurrency(c.comisionPagada || 0)}
                            </p>
                          ) : (
                            <p className="text-gray-400">-</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(c.estadoContrato === 'pagado' || c.estadoContrato === 'liquidado') ? (
                            <p className={`font-semibold ${c.comisionPendiente > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                              {formatCurrency(c.comisionPendiente || 0)}
                            </p>
                          ) : (
                            <p className="text-gray-400">-</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <EstadoBadge estado={c.estadoComision} tipo="comision" />
                          {/* Mostrar historial de pagos si hay pagos parciales */}
                          {c.historialPagos && c.historialPagos.length > 0 && c.estadoComision === 'parcial' && (
                            <div className="mt-2 text-left">
                              <p className="text-xs font-medium text-gray-500 mb-1">Pagos realizados:</p>
                              {c.historialPagos.map((hp, idx) => (
                                <p key={idx} className="text-xs text-gray-400">
                                  • {new Date(hp.fecha).toLocaleDateString('es-CO')} - {formatCurrency(hp.monto)}
                                  {hp.liquidacionCodigo && <span className="ml-1 text-blue-500">({hp.liquidacionCodigo})</span>}
                                </p>
                              ))}
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center">
                        <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                          {filtroEstado === 'todos' 
                            ? 'No hay bonificaciones registradas'
                            : `No hay bonificaciones con estado "${filtroEstado === 'pendiente' ? 'Pendiente' : filtroEstado === 'parcial' ? 'Pago Parcial' : 'Pagada'}"`
                          }
                        </p>
                        {filtroEstado !== 'todos' && (
                          <button 
                            onClick={() => setFiltroEstado('todos')}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            Ver todas las bonificaciones
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
