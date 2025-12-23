const mongoose = require('mongoose');

const tipoComisionSchema = new mongoose.Schema({
  // Nombre descriptivo: "Por presentación", "Proyecto completo", "Venta directa", etc.
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    unique: true
  },
  // Descripción detallada
  descripcion: {
    type: String,
    trim: true
  },
  // Tipo de cálculo
  tipo: {
    type: String,
    enum: ['porcentaje', 'fijo'],
    required: true
  },
  // Valor (porcentaje o monto fijo)
  valor: {
    type: Number,
    required: true,
    min: 0
  },
  // Aplica a qué tipo de contrato (opcional, vacío = todos)
  aplicaA: [{
    type: String,
    enum: ['venta_directa', 'contrato', 'proyecto']
  }],
  // Color para identificación visual (opcional)
  color: {
    type: String,
    default: '#3b82f6'
  },
  // Estado
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  },
  // Orden de visualización
  orden: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TipoComision', tipoComisionSchema);
