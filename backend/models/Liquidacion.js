const mongoose = require('mongoose');

const liquidacionSchema = new mongoose.Schema({
  // Código único de liquidación
  codigo: {
    type: String,
    unique: true
  },
  empleado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empleado',
    required: true
  },
  // Contratos incluidos en esta liquidación
  contratos: [{
    contrato: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contrato'
    },
    codigoContrato: String,
    cliente: String,
    montoContrato: Number,
    comisionPagada: Number,
    tipoComision: String,
    valorComision: Number
  }],
  // Totales
  totalComision: {
    type: Number,
    required: true
  },
  // Información del pago
  pago: {
    fecha: {
      type: Date,
      default: Date.now
    },
    metodo: {
      type: String,
      enum: ['efectivo', 'transferencia', 'cheque', 'otro'],
      required: true
    },
    referencia: String,
    comprobante: String,
    observacion: String
  },
  // Estado de la liquidación
  estado: {
    type: String,
    enum: ['pendiente', 'pagada', 'anulada'],
    default: 'pagada'
  },
  // Datos para el comprobante
  empresa: {
    nombre: { type: String, default: 'COMMETP S.A.S' },
    nit: String,
    direccion: String,
    telefono: String
  },
  // Auditoría
  anulacion: {
    fecha: Date,
    motivo: String
  }
}, {
  timestamps: true
});

// Generar código antes de guardar
liquidacionSchema.pre('save', async function(next) {
  if (!this.codigo) {
    const count = await mongoose.model('Liquidacion').countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    this.codigo = `LIQ-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Liquidacion', liquidacionSchema);
