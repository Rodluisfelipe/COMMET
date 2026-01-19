import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import Modal from '../components/Modal'
import EstadoBadge from '../components/EstadoBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import { CanEdit, ViewerBadge } from '../components/CanEdit'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  XCircleIcon,
  BanknotesIcon,
  SparklesIcon,
  ClockIcon
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

export default function Liquidaciones() {
  const { canEdit } = useAuth()
  const [liquidaciones, setLiquidaciones] = useState([])
  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pendientes')
  const [modalDetalle, setModalDetalle] = useState(null)
  const [modalAnular, setModalAnular] = useState(null)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [procesando, setProcesando] = useState(false)
  
  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    try {
      const [liqRes, pendRes] = await Promise.all([
        api.get('/liquidaciones'),
        api.get('/liquidaciones/pendientes')
      ])
      setLiquidaciones(liqRes.data)
      setPendientes(pendRes.data)
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDescargarComprobante = async (id) => {
    try {
      const response = await api.get(`/liquidaciones/${id}/comprobante`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `comprobante-${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Error al descargar comprobante')
    }
  }
  
  const handleAnular = async () => {
    if (!motivoAnulacion.trim()) {
      toast.error('El motivo es obligatorio')
      return
    }
    
    setProcesando(true)
    try {
      await api.post(`/liquidaciones/${modalAnular}/anular`, { motivo: motivoAnulacion })
      toast.success('Liquidación anulada')
      setModalAnular(null)
      setMotivoAnulacion('')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al anular')
    } finally {
      setProcesando(false)
    }
  }
  
  if (loading) {
    return <LoadingSpinner />
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
            Liquidaciones
          </h1>
          <p className="text-gray-500">Gestiona el pago de bonificaciones a empleados</p>
        </div>
        <CanEdit>
          <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link 
              to="/liquidaciones/nueva" 
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300"
            >
              <BanknotesIcon className="w-5 h-5" />
              Nueva Liquidación
            </Link>
          </motion.div>
        </CanEdit>
      </motion.div>
      
      <ViewerBadge />
      
      {/* Tabs */}
      <motion.div variants={itemVariants} className="border-b border-gray-200">
        <nav className="flex gap-8">
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setTab('pendientes')}
            className={`pb-3 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
              tab === 'pendientes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClockIcon className="w-4 h-4 inline mr-2" />
            Pendientes de Liquidar
            {pendientes.length > 0 && (
              <span className="ml-2 bg-gradient-to-r from-yellow-400 to-blue-500 text-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                {pendientes.length}
              </span>
            )}
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setTab('historial')}
            className={`pb-3 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
              tab === 'historial'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <DocumentArrowDownIcon className="w-4 h-4 inline mr-2" />
            Historial de Liquidaciones
          </motion.button>
        </nav>
      </motion.div>
      
      {/* Tab Content - Pendientes */}
      {tab === 'pendientes' && (
        <motion.div variants={containerVariants} className="space-y-4">
          <AnimatePresence>
            {pendientes.length > 0 ? (
              pendientes.map((emp, index) => (
                <motion.div 
                  key={emp.empleado._id} 
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/25"
                      >
                        {emp.empleado.nombreCompleto?.charAt(0)}
                      </motion.div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{emp.empleado.nombreCompleto}</h3>
                        <p className="text-sm text-gray-500">{emp.empleado.codigoInterno}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Pendiente</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                        {formatCurrency(emp.totalPendiente)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contrato</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo Bonificación</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Monto</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Bonificación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(emp.comisiones || emp.contratos || []).map((c, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-4 py-3">
                              <Link to={`/contratos/${c.contratoId}`} className="font-medium text-blue-600 hover:underline">
                                {c.codigo}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{c.cliente}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                {c.tipoComisionNombre || 'Bonificación'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.montoContrato)}</td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(c.comision)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {canEdit && (
                    <div className="mt-4 flex justify-end">
                      <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                        <Link 
                          to={`/liquidaciones/nueva?empleado=${emp.empleado._id}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 font-medium"
                        >
                          <BanknotesIcon className="w-5 h-5" />
                          Liquidar Bonificaciones
                        </Link>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <motion.div variants={itemVariants}>
                <EmptyState
                  icon={BanknotesIcon}
                  title="No hay bonificaciones pendientes"
                  description="Las bonificaciones aparecerán cuando los contratos estén en estado 'Pagado'"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Tab Content - Historial */}
      {tab === 'historial' && (
        <motion.div variants={itemVariants} className="glass rounded-2xl overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Empleado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Método</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {liquidaciones.length > 0 ? (
                  <AnimatePresence>
                    {liquidaciones.map((liq, index) => (
                      <motion.tr 
                        key={liq._id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-blue-50/30 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            {liq.codigo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-semibold text-gray-900">{liq.empleado?.nombreCompleto}</p>
                          <p className="text-sm text-gray-500">{liq.empleado?.codigoInterno}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDateTime(liq.pago?.fecha)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
                            {liq.pago?.metodo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="font-bold text-lg text-green-600">{formatCurrency(liq.totalComision)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <EstadoBadge estado={liq.estado} tipo="liquidacion" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setModalDetalle(liq)}
                              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalle"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </motion.button>
                            {liq.estado === 'pagada' && (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDescargarComprobante(liq._id)}
                                  className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Descargar comprobante"
                                >
                                  <DocumentArrowDownIcon className="w-5 h-5" />
                                </motion.button>
                                {canEdit && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setModalAnular(liq._id)}
                                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Anular"
                                  >
                                    <XCircleIcon className="w-5 h-5" />
                                  </motion.button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      No hay liquidaciones registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
      
      {/* Modal Detalle */}
      <Modal
        isOpen={!!modalDetalle}
        onClose={() => setModalDetalle(null)}
        title={`Liquidación ${modalDetalle?.codigo}`}
        icon={BanknotesIcon}
        size="lg"
      >
        {modalDetalle && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-medium">Empleado</p>
                <p className="font-semibold text-gray-900">{modalDetalle.empleado?.nombreCompleto}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-medium">Fecha</p>
                <p className="font-semibold text-gray-900">{formatDateTime(modalDetalle.pago?.fecha)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-medium">Método de Pago</p>
                <p className="font-semibold text-gray-900 capitalize">{modalDetalle.pago?.metodo}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-medium">Referencia</p>
                <p className="font-semibold text-gray-900">{modalDetalle.pago?.referencia || '-'}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-5">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <DocumentArrowDownIcon className="w-4 h-4 text-white" />
                </span>
                Comisiones Incluidas
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Contrato</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Tipo</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Monto</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Comisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {modalDetalle.contratos?.map((c, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-blue-600">{c.codigoContrato}</td>
                        <td className="px-4 py-3 text-gray-600">{c.cliente}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            {c.tipoComisionNombre || 'Comisión'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(c.montoContrato)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(c.comisionPagada)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-green-50 to-green-100/50">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right font-bold text-gray-700">Total:</td>
                      <td className="px-4 py-3 text-right font-bold text-xl text-green-600">
                        {formatCurrency(modalDetalle.totalComision)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            {modalDetalle.estado === 'anulada' && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Anulada:</strong> {modalDetalle.anulacion?.motivo}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {formatDateTime(modalDetalle.anulacion?.fecha)}
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setModalDetalle(null)} 
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cerrar
              </motion.button>
              {modalDetalle.estado === 'pagada' && (
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDescargarComprobante(modalDetalle._id)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 font-medium"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Descargar Comprobante
                </motion.button>
              )}
            </div>
          </div>
        )}
      </Modal>
      
      {/* Modal Anular */}
      <Modal
        isOpen={!!modalAnular}
        onClose={() => setModalAnular(null)}
        title="Anular Liquidación"
        icon={XCircleIcon}
      >
        <div className="space-y-5">
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="text-sm text-red-800">
              ⚠️ Esta acción revertirá el pago y las comisiones volverán a estado pendiente.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Motivo de anulación *
            </label>
            <textarea
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 bg-gray-50/50 resize-none"
              rows="3"
              placeholder="Explique el motivo de la anulación..."
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setModalAnular(null)} 
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancelar
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnular} 
              disabled={procesando}
              className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 font-medium disabled:opacity-50"
            >
              {procesando ? '⏳ Anulando...' : '🗑️ Confirmar Anulación'}
            </motion.button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
