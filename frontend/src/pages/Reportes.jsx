import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters'
import EstadoBadge from '../components/EstadoBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  SparklesIcon
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

export default function Reportes() {
  const [tab, setTab] = useState('empleados')
  const [loading, setLoading] = useState(true)
  const [consolidadoEmpleados, setConsolidadoEmpleados] = useState([])
  const [consolidadoContratos, setConsolidadoContratos] = useState([])
  const [historialLiquidaciones, setHistorialLiquidaciones] = useState(null)
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    estado: ''
  })
  
  useEffect(() => {
    fetchReportes()
  }, [tab])
  
  const fetchReportes = async () => {
    setLoading(true)
    try {
      switch (tab) {
        case 'empleados':
          const empRes = await api.get('/dashboard/consolidado/empleados')
          setConsolidadoEmpleados(empRes.data)
          break
        case 'contratos':
          const params = new URLSearchParams()
          if (filtros.estado) params.append('estado', filtros.estado)
          const contRes = await api.get(`/dashboard/consolidado/contratos?${params}`)
          setConsolidadoContratos(contRes.data)
          break
        case 'liquidaciones':
          const liqParams = new URLSearchParams()
          if (filtros.fechaDesde) liqParams.append('fechaDesde', filtros.fechaDesde)
          if (filtros.fechaHasta) liqParams.append('fechaHasta', filtros.fechaHasta)
          const liqRes = await api.get(`/dashboard/historial/liquidaciones?${liqParams}`)
          setHistorialLiquidaciones(liqRes.data)
          break
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleFiltrar = () => {
    fetchReportes()
  }
  
  // Totales para el reporte de empleados
  const totalesEmpleados = consolidadoEmpleados.reduce((acc, emp) => ({
    contratos: acc.contratos + emp.contratosActivos,
    generado: acc.generado + emp.totalGenerado,
    pagado: acc.pagado + emp.totalPagado,
    pendiente: acc.pendiente + emp.totalPendiente
  }), { contratos: 0, generado: 0, pagado: 0, pendiente: 0 })
  
  // Totales para el reporte de contratos
  const totalesContratos = consolidadoContratos.reduce((acc, c) => ({
    montoTotal: acc.montoTotal + c.montoTotal,
    montoPagado: acc.montoPagado + c.montoPagado,
    comisiones: acc.comisiones + c.totalComisiones,
    margen: acc.margen + c.margenNeto
  }), { montoTotal: 0, montoPagado: 0, comisiones: 0, margen: 0 })
  
  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Reportes y Consolidados
        </h1>
        <p className="text-gray-500">Análisis detallado de comisiones y liquidaciones</p>
      </motion.div>
      
      {/* Tabs */}
      <motion.div variants={itemVariants} className="border-b border-gray-200">
        <nav className="flex gap-8">
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setTab('empleados')}
            className={`pb-3 px-1 border-b-2 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
              tab === 'empleados'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UsersIcon className="w-5 h-5" />
            Por Empleado
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setTab('contratos')}
            className={`pb-3 px-1 border-b-2 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
              tab === 'contratos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <DocumentTextIcon className="w-5 h-5" />
            Por Contrato
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setTab('liquidaciones')}
            className={`pb-3 px-1 border-b-2 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
              tab === 'liquidaciones'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CurrencyDollarIcon className="w-5 h-5" />
            Historial Pagos
          </motion.button>
        </nav>
      </motion.div>
      
      {/* Contenido */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Reporte por Empleado */}
          {tab === 'empleados' && (
            <motion.div variants={containerVariants} className="space-y-4">
              {/* Resumen */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass rounded-2xl p-4 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-500 font-medium">Contratos Activos</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    {totalesEmpleados.contratos}
                  </p>
                </div>
                <div className="glass rounded-2xl p-4 border-l-4 border-green-500">
                  <p className="text-sm text-gray-500 font-medium">Total Generado</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalesEmpleados.generado)}</p>
                </div>
                <div className="glass rounded-2xl p-4 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-500 font-medium">Total Pagado</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalesEmpleados.pagado)}</p>
                </div>
                <div className="glass rounded-2xl p-4 border-l-4 border-yellow-500">
                  <p className="text-sm text-gray-500 font-medium">Total Pendiente</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalesEmpleados.pendiente)}</p>
                </div>
              </motion.div>
              
              {/* Tabla */}
              <motion.div variants={itemVariants} className="glass rounded-2xl overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Empleado</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Cargo</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Contratos</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Generado</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Pagado</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Pendiente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {consolidadoEmpleados.map((emp) => (
                        <tr key={emp.empleado._id} className="hover:bg-blue-50/30 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{emp.empleado.nombreCompleto}</p>
                            <p className="text-sm text-gray-500">{emp.empleado.codigoInterno}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{emp.empleado.cargo}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/25">
                              {emp.contratosActivos}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold">{formatCurrency(emp.totalGenerado)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-green-600">{formatCurrency(emp.totalPagado)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-semibold ${emp.totalPendiente > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                              {formatCurrency(emp.totalPendiente)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200/50">
                      <tr>
                        <td colSpan="2" className="px-6 py-4 font-bold text-gray-900">TOTALES</td>
                        <td className="px-6 py-4 text-center font-bold">{totalesEmpleados.contratos}</td>
                        <td className="px-6 py-4 text-right font-bold">{formatCurrency(totalesEmpleados.generado)}</td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(totalesEmpleados.pagado)}</td>
                        <td className="px-6 py-4 text-right font-bold text-yellow-600">{formatCurrency(totalesEmpleados.pendiente)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}
          
          {/* Reporte por Contrato */}
          {tab === 'contratos' && (
            <motion.div variants={containerVariants} className="space-y-4">
              {/* Filtros */}
              <motion.div variants={itemVariants} className="glass rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                    <select
                      value={filtros.estado}
                      onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                      className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="">Todos</option>
                      <option value="registrado">Registrado</option>
                      <option value="pago_parcial">Pago Parcial</option>
                      <option value="pagado">Pagado</option>
                      <option value="liquidado">Liquidado</option>
                    </select>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFiltrar} 
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 font-medium"
                  >
                    Filtrar
                  </motion.button>
                </div>
              </motion.div>
              
              {/* Resumen */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass rounded-2xl p-4 border-l-4 border-gray-400">
                  <p className="text-sm text-gray-500 font-medium">Monto Total Contratos</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalesContratos.montoTotal)}</p>
                </div>
                <div className="glass rounded-2xl p-4 border-l-4 border-green-500">
                  <p className="text-sm text-gray-500 font-medium">Total Pagado</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalesContratos.montoPagado)}</p>
                </div>
                <div className="glass rounded-2xl p-4 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-500 font-medium">Total Comisiones</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalesContratos.comisiones)}</p>
                </div>
                <div className="glass rounded-2xl p-4 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-500 font-medium">Margen Neto</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalesContratos.margen)}</p>
                </div>
              </motion.div>
              
              {/* Tabla */}
              <motion.div variants={itemVariants} className="glass rounded-2xl overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Contrato</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Monto</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Pagado</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Comisiones</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Margen</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">% Margen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {consolidadoContratos.map((c) => (
                        <tr key={c.contrato._id} className="hover:bg-blue-50/30 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <p className="font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                              {c.contrato.codigo}
                            </p>
                            <p className="text-xs text-gray-400">{formatDate(c.contrato.fecha)}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{c.contrato.cliente}</td>
                          <td className="px-6 py-4 text-center">
                            <EstadoBadge estado={c.contrato.estado} tipo="contrato" />
                          </td>
                          <td className="px-6 py-4 text-right font-semibold">{formatCurrency(c.montoTotal)}</td>
                          <td className="px-6 py-4 text-right text-green-600 font-medium">{formatCurrency(c.montoPagado)}</td>
                          <td className="px-6 py-4 text-right text-blue-600 font-medium">{formatCurrency(c.totalComisiones)}</td>
                          <td className="px-6 py-4 text-right text-blue-600 font-bold">{formatCurrency(c.margenNeto)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-bold px-2 py-1 rounded-full text-xs ${
                              parseFloat(c.porcentajeMargen) >= 50 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {c.porcentajeMargen}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}
          
          {/* Historial de Liquidaciones */}
          {tab === 'liquidaciones' && (
            <motion.div variants={containerVariants} className="space-y-4">
              {/* Filtros */}
              <motion.div variants={itemVariants} className="glass rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Desde</label>
                    <input
                      type="date"
                      value={filtros.fechaDesde}
                      onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
                      className="bg-white/50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hasta</label>
                    <input
                      type="date"
                      value={filtros.fechaHasta}
                      onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
                      className="bg-white/50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFiltrar} 
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 font-medium"
                  >
                    Filtrar
                  </motion.button>
                </div>
              </motion.div>
              
              {/* Resumen */}
              {historialLiquidaciones && (
                <>
                  <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="glass rounded-2xl p-6 border-l-4 border-blue-500">
                      <p className="text-sm text-gray-500 font-medium">Total Liquidaciones</p>
                      <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                        {historialLiquidaciones.totalLiquidaciones}
                      </p>
                    </div>
                    <div className="glass rounded-2xl p-6 border-l-4 border-green-500">
                      <p className="text-sm text-gray-500 font-medium">Total Pagado</p>
                      <p className="text-4xl font-bold text-green-600">
                        {formatCurrency(historialLiquidaciones.totalPagado)}
                      </p>
                    </div>
                  </motion.div>
                  
                  {/* Tabla */}
                  <motion.div variants={itemVariants} className="glass rounded-2xl overflow-hidden p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Empleado</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Método</th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Contratos</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {historialLiquidaciones.detalle.map((liq, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors duration-200">
                              <td className="px-6 py-4 font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                {liq.codigo}
                              </td>
                              <td className="px-6 py-4 text-gray-900 font-medium">{liq.empleado}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{formatDate(liq.fecha)}</td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
                                  {liq.metodo}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/25">
                                  {liq.cantidadContratos}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-lg text-green-600">
                                {formatCurrency(liq.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gradient-to-r from-green-50 to-green-100/50">
                          <tr>
                            <td colSpan="5" className="px-6 py-4 font-bold text-gray-900">TOTAL PAGADO</td>
                            <td className="px-6 py-4 text-right font-bold text-2xl text-green-600">
                              {formatCurrency(historialLiquidaciones.totalPagado)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
