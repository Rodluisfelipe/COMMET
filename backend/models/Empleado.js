const mongoose = require('mongoose');

const empleadoSchema = new mongoose.Schema({
  // ID interno generado automáticamente
  codigoInterno: {
    type: String,
    unique: true
  },
  nombreCompleto: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  identificacion: {
    type: String,
    required: [true, 'La identificación es obligatoria'],
    unique: true,
    trim: true
  },
  cargo: {
    type: String,
    required: [true, 'El cargo es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  telefono: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  },
  // Comisión por defecto del empleado
  comisionBase: {
    tipo: {
      type: String,
      enum: ['porcentaje', 'fijo'],
      default: 'porcentaje'
    },
    valor: {
      type: Number,
      default: 0
    }
  },
  observaciones: {
    type: String,
    trim: true
  },
  // Estadísticas calculadas
  estadisticas: {
    totalComisionesGeneradas: { type: Number, default: 0 },
    totalComisionesPagadas: { type: Number, default: 0 },
    totalComisionesPendientes: { type: Number, default: 0 },
    contratosAsociados: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Generar código interno antes de guardar
empleadoSchema.pre('save', async function(next) {
  if (!this.codigoInterno) {
    const count = await mongoose.model('Empleado').countDocuments();
    this.codigoInterno = `EMP-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Empleado', empleadoSchema);
