import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  TagIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { CanEdit, ViewerBadge } from '../components/CanEdit';
import { useAuth } from '../context/AuthContext';

const COLORES_DISPONIBLES = [
  { valor: '#1e40af', nombre: 'Azul Oscuro' },
  { valor: '#3b82f6', nombre: 'Azul' },
  { valor: '#f97316', nombre: 'Naranja' },
  { valor: '#22c55e', nombre: 'Verde' },
  { valor: '#eab308', nombre: 'Amarillo' },
  { valor: '#ef4444', nombre: 'Rojo' },
  { valor: '#8b5cf6', nombre: 'Violeta' },
  { valor: '#ec4899', nombre: 'Rosa' },
  { valor: '#14b8a6', nombre: 'Teal' },
  { valor: '#6b7280', nombre: 'Gris' },
];

const TIPOS_CONTRATO = [
  { valor: 'venta_directa', nombre: 'Venta Directa' },
  { valor: 'contrato', nombre: 'Contrato' },
  { valor: 'proyecto', nombre: 'Proyecto' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

export default function TiposComision() {
  const { canEdit } = useAuth();
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'porcentaje',
    valor: '',
    aplicaA: ['venta_directa', 'contrato', 'proyecto'],
    color: '#1e40af',
    estado: 'activo'
  });

  useEffect(() => {
    cargarTipos();
  }, []);

  const cargarTipos = async () => {
    try {
      const { data } = await api.get('/tipos-comision');
      setTipos(data);
    } catch (error) {
      toast.error('Error al cargar tipos de comisión');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (!formData.valor || formData.valor <= 0) {
      toast.error('El valor debe ser mayor a 0');
      return;
    }
    if (formData.aplicaA.length === 0) {
      toast.error('Debe seleccionar al menos un tipo de contrato');
      return;
    }

    try {
      if (editando) {
        await api.put(`/tipos-comision/${editando._id}`, formData);
        toast.success('✨ Tipo de comisión actualizado');
      } else {
        await api.post('/tipos-comision', formData);
        toast.success('🎉 Tipo de comisión creado');
      }
      setModalOpen(false);
      resetForm();
      cargarTipos();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar');
    }
  };

  const handleEditar = (tipo) => {
    setEditando(tipo);
    setFormData({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      tipo: tipo.tipo,
      valor: tipo.valor,
      aplicaA: tipo.aplicaA || ['venta', 'proyecto', 'servicio'],
      color: tipo.color || '#1e40af',
      estado: tipo.estado
    });
    setModalOpen(true);
  };

  const handleEliminar = (id) => {
    setConfirmDelete(id);
  };

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;
    
    try {
      await api.delete(`/tipos-comision/${confirmDelete}`);
      toast.success('🗑️ Tipo de comisión eliminado');
      cargarTipos();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al eliminar');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleToggleEstado = async (tipo) => {
    try {
      await api.put(`/tipos-comision/${tipo._id}`, {
        ...tipo,
        estado: tipo.estado === 'activo' ? 'inactivo' : 'activo'
      });
      toast.success('Estado actualizado');
      cargarTipos();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const resetForm = () => {
    setEditando(null);
    setFormData({
      nombre: '',
      descripcion: '',
      tipo: 'porcentaje',
      valor: '',
      aplicaA: ['venta_directa', 'contrato', 'proyecto'],
      color: '#1e40af',
      estado: 'activo'
    });
  };

  const handleAplicaAChange = (tipoContrato) => {
    setFormData(prev => ({
      ...prev,
      aplicaA: prev.aplicaA.includes(tipoContrato)
        ? prev.aplicaA.filter(t => t !== tipoContrato)
        : [...prev.aplicaA, tipoContrato]
    }));
  };

  if (loading) return <LoadingSpinner />;

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
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Tipos de Comisión
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Configura las comisiones predefinidas para tu equipo
          </p>
        </div>
        <CanEdit>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
          >
            <SparklesIcon className="w-5 h-5" />
            Nuevo Tipo
          </motion.button>
        </CanEdit>
      </motion.div>
      
      <ViewerBadge />

      {/* Stats Summary */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <TagIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{tipos.length}</p>
            <p className="text-sm text-gray-500">Total Tipos</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
            <ChartPieIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {tipos.filter(t => t.estado === 'activo').length}
            </p>
            <p className="text-sm text-gray-500">Activos</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <CurrencyDollarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {tipos.filter(t => t.tipo === 'porcentaje').length}
            </p>
            <p className="text-sm text-gray-500">Por Porcentaje</p>
          </div>
        </div>
      </motion.div>

      {/* Lista de tipos */}
      {tipos.length === 0 ? (
        <motion.div variants={itemVariants}>
          <EmptyState
            icon={TagIcon}
            title="No hay tipos de comisión"
            description="Crea tu primer tipo de comisión para usarlo en los contratos"
            actionLabel="Crear tipo de comisión"
            onAction={() => {
              resetForm();
              setModalOpen(true);
            }}
          />
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {tipos.map((tipo, index) => (
              <motion.div
                key={tipo._id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ delay: index * 0.05 }}
                className={`glass rounded-2xl p-5 relative overflow-hidden group ${
                  tipo.estado === 'inactivo' ? 'opacity-60' : ''
                }`}
              >
                {/* Barra de color superior con gradiente */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
                  style={{ 
                    background: `linear-gradient(90deg, ${tipo.color || '#1e40af'}, ${tipo.color || '#1e40af'}99)` 
                  }}
                />
                
                {/* Efecto hover glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"
                  style={{ backgroundColor: tipo.color }}
                />
                
                <div className="flex items-start justify-between mt-2 relative z-10">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${tipo.color}30, ${tipo.color}10)`,
                        boxShadow: `0 4px 15px ${tipo.color}20`
                      }}
                    >
                      {tipo.tipo === 'porcentaje' ? (
                        <ChartPieIcon className="w-6 h-6" style={{ color: tipo.color }} />
                      ) : (
                        <CurrencyDollarIcon className="w-6 h-6" style={{ color: tipo.color }} />
                      )}
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tipo.nombre}</h3>
                      <p className="text-sm font-medium" style={{ color: tipo.color }}>
                        {tipo.tipo === 'porcentaje' ? `${tipo.valor}%` : `$${tipo.valor.toLocaleString()}`}
                      </p>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditar(tipo)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEliminar(tipo._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}
                </div>

                {tipo.descripcion && (
                  <p className="text-sm text-gray-600 mt-3 relative z-10">{tipo.descripcion}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 relative z-10">
                  {tipo.aplicaA?.map((tipoContrato) => (
                    <span
                      key={tipoContrato}
                      className="px-2.5 py-1 bg-gray-100/80 text-gray-600 text-xs rounded-full font-medium capitalize backdrop-blur-sm"
                    >
                      {tipoContrato.replace('_', ' ')}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200/50 flex items-center justify-between relative z-10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleEstado(tipo)}
                    className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-300 ${
                      tipo.estado === 'activo'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {tipo.estado === 'activo' ? '✓ Activo' : 'Inactivo'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editando ? 'Editar Tipo de Comisión' : 'Nuevo Tipo de Comisión'}
        icon={editando ? PencilIcon : SparklesIcon}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
              placeholder="Ej: Comisión por presentación"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 resize-none"
              placeholder="Descripción opcional..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto Fijo ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Valor *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                  {formData.tipo === 'porcentaje' ? '%' : '$'}
                </span>
                <input
                  type="number"
                  step={formData.tipo === 'porcentaje' ? '0.01' : '1'}
                  min="0"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || '' })}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
                  placeholder={formData.tipo === 'porcentaje' ? '0.5' : '1000'}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Aplica a tipos de contrato *
            </label>
            <div className="flex flex-wrap gap-3">
              {TIPOS_CONTRATO.map((tipoContrato) => (
                <motion.label
                  key={tipoContrato.valor}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border-2 transition-all duration-200 ${
                    formData.aplicaA.includes(tipoContrato.valor)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50/50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.aplicaA.includes(tipoContrato.valor)}
                    onChange={() => handleAplicaAChange(tipoContrato.valor)}
                    className="hidden"
                  />
                  <span className="text-sm font-medium">{tipoContrato.nombre}</span>
                </motion.label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Color del tipo
            </label>
            <div className="flex flex-wrap gap-3">
              {COLORES_DISPONIBLES.map((color) => (
                <motion.button
                  key={color.valor}
                  type="button"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setFormData({ ...formData, color: color.valor })}
                  className={`w-9 h-9 rounded-xl shadow-md transition-all duration-200 ${
                    formData.color === color.valor
                      ? 'ring-2 ring-offset-2 ring-gray-800 scale-110'
                      : 'hover:shadow-lg'
                  }`}
                  style={{ backgroundColor: color.valor }}
                  title={color.nombre}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 font-medium"
            >
              {editando ? '✓ Guardar Cambios' : '✨ Crear Tipo'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar tipo de comisión"
        message="¿Estás seguro de que deseas eliminar este tipo de comisión? Esta acción no se puede deshacer."
        tipo="danger"
        confirmText="Eliminar"
      />
    </motion.div>
  );
}
