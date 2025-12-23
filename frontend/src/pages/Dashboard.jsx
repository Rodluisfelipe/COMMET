import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'
import { formatCurrency } from '../utils/formatters'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  UsersIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ChartBarIcon,
  ArrowRightIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recalculando, setRecalculando] = useState(false)
  const [trm, setTrm] = useState(null)
  
  useEffect(() => {
    fetchDashboard()
    fetchTRM()
  }, [])
  
  const fetchDashboard = async () => {
    try {
      const response = await api.get('/dashboard')
      setData(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchTRM = async () => {
    try {
      const response = await fetch('https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=1')
      const data = await response.json()
      if (data && data.length > 0) {
        setTrm(data[0])
      }
    } catch (error) {
      console.error('Error al obtener TRM:', error)
    }
  }
  
  const handleRecalcularEstadisticas = async () => {
    setRecalculando(true)
    try {
      const response = await api.post('/dashboard/recalcular-estadisticas')
      toast.success(`✅ ${response.data.mensaje}`)
      fetchDashboard() // Recargar datos
    } catch (error) {
      toast.error('Error al recalcular estadísticas')
    } finally {
      setRecalculando(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    )
  }
  
  if (!data) {
    return <div className="text-center mt-20 text-gray-500">Error al cargar datos</div>
  }
  
  const { resumen, empleadosConPendientes } = data

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  }

  const stats = [
    { label: 'Empleados', value: resumen.totalEmpleados, icon: UsersIcon, color: 'blue', link: '/empleados' },
    { label: 'Contratos', value: resumen.estadisticasContratos.total, icon: DocumentTextIcon, color: 'indigo', link: '/contratos' },
    { label: 'Por Liquidar', value: resumen.estadisticasContratos.pagados, icon: ClockIcon, color: 'yellow', link: '/liquidaciones' },
    { label: 'Pendiente', value: formatCurrency(resumen.totalComisionesPendientes), icon: CurrencyDollarIcon, color: 'green', link: '/liquidaciones' }
  ]

  const estados = [
    { label: 'Registrados', value: resumen.estadisticasContratos.registrados, color: 'gray' },
    { label: 'Pago Parcial', value: resumen.estadisticasContratos.pagoParcial, color: 'yellow' },
    { label: 'Pagados', value: resumen.estadisticasContratos.pagados, color: 'green' },
    { label: 'Liquidados', value: resumen.estadisticasContratos.liquidados, color: 'indigo' },
    { label: 'Cancelados', value: resumen.estadisticasContratos.cancelados, color: 'red' }
  ]

  const getColor = (color, type) => {
    const colors = {
      gray: { bg: 'bg-gray-100', text: 'text-gray-600', bar: 'bg-gray-400', border: 'border-gray-200' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', bar: 'bg-blue-500', border: 'border-blue-200' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', bar: 'bg-indigo-500', border: 'border-indigo-200' },
      green: { bg: 'bg-green-100', text: 'text-green-600', bar: 'bg-green-500', border: 'border-green-200' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', bar: 'bg-yellow-500', border: 'border-yellow-200' },
      red: { bg: 'bg-red-100', text: 'text-red-600', bar: 'bg-red-400', border: 'border-red-200' }
    }
    return colors[color]?.[type] || ''
  }
  
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Bienvenido a Tecno Rewards</p>
        </div>
        <div className="flex items-center gap-3">
          {/* TRM del día */}
          {trm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-green-50 border border-green-200 rounded-xl"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <span className="text-sm font-bold text-green-700">$</span>
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">TRM Hoy</p>
                <p className="text-lg font-bold text-green-700">
                  {parseFloat(trm.valor).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </motion.div>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRecalcularEstadisticas}
            disabled={recalculando}
            className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
            title="Recalcular estadísticas"
          >
            <ArrowPathIcon className={`w-4 h-4 ${recalculando ? 'animate-spin' : ''}`} />
          </motion.button>
          <Link 
            to="/liquidaciones/nueva"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva Liquidación
          </Link>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Link key={idx} to={stat.link}>
            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`p-4 bg-white rounded-xl border ${getColor(stat.color, 'border')} hover:shadow-md transition-all cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${getColor(stat.color, 'bg')}`}>
                  <stat.icon className={`w-5 h-5 ${getColor(stat.color, 'text')}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className={`text-xl font-bold ${getColor(stat.color, 'text')}`}>{stat.value}</p>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Estado de Contratos */}
        <motion.div variants={item} className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Estado de Contratos</h2>
            <Link to="/contratos" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Ver todos <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {estados.map((estado, idx) => {
              const total = resumen.estadisticasContratos.total || 1
              const percentage = Math.round((estado.value / total) * 100)
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-xl ${getColor(estado.color, 'bg')} border ${getColor(estado.color, 'border')}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">{estado.label}</span>
                    <span className={`text-xs font-bold ${getColor(estado.color, 'text')}`}>{percentage}%</span>
                  </div>
                  <p className={`text-2xl font-bold ${getColor(estado.color, 'text')}`}>{estado.value}</p>
                  <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + idx * 0.05 }}
                      className={`h-full ${getColor(estado.color, 'bar')} rounded-full`}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Empleados por Liquidar */}
        <motion.div variants={item} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Por Liquidar</h2>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {empleadosConPendientes?.length || 0}
            </span>
          </div>
          
          <div className="flex-1">
            {empleadosConPendientes?.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {empleadosConPendientes.slice(0, 4).map((emp, idx) => (
                  <motion.div
                    key={emp._id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                  >
                    <Link
                      to={`/empleados/${emp._id}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                          {emp.nombreCompleto?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{emp.nombreCompleto}</p>
                          <p className="text-xs text-gray-400">{emp.codigoInterno}</p>
                        </div>
                      </div>
                      <p className="font-bold text-green-600 text-sm">
                        {formatCurrency(emp.estadisticas?.totalComisionesPendientes || 0)}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCircleIcon className="w-12 h-12 text-green-500" />
                </motion.div>
                <p className="text-gray-600 font-medium mt-2">¡Todo al día!</p>
                <p className="text-xs text-gray-400">No hay comisiones pendientes</p>
              </div>
            )}
          </div>

          <Link 
            to="/liquidaciones"
            className="p-3 bg-gray-50 border-t border-gray-100 text-center text-sm text-blue-600 hover:text-blue-700 hover:bg-gray-100 transition-colors font-medium flex items-center justify-center gap-1"
          >
            Ver todas <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </motion.div>
      </div>

      {/* Accesos Rápidos */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Nuevo Contrato', desc: 'Registrar venta', icon: DocumentTextIcon, link: '/contratos', color: 'blue' },
          { title: 'Nuevo Empleado', desc: 'Agregar personal', icon: UsersIcon, link: '/empleados', color: 'indigo' },
          { title: 'Tipos Comisión', desc: 'Configurar tipos', icon: ChartBarIcon, link: '/tipos-comision', color: 'purple' },
          { title: 'Reportes', desc: 'Ver estadísticas', icon: BanknotesIcon, link: '/reportes', color: 'green' }
        ].map((acc, idx) => (
          <Link key={idx} to={acc.link}>
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-3 group"
            >
              <div className={`p-2 rounded-lg ${getColor(acc.color, 'bg')}`}>
                <acc.icon className={`w-5 h-5 ${getColor(acc.color, 'text')}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{acc.title}</p>
                <p className="text-xs text-gray-400 truncate">{acc.desc}</p>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </motion.div>
  )
}
