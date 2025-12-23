const mongoose = require('mongoose');

// Sub-esquema para participantes del contrato
const participanteSchema = new mongoose.Schema({
  empleado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empleado',
    required: true
  },
  // Referencia al tipo de comisión predefinido (nuevo)
  tipoComision: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoComision'
  },
  // Nombre del tipo de comisión (para historial)
  tipoComisionNombre: {
    type: String
  },
  // Comisión específica para este contrato
  comision: {
    tipo: {
      type: String,
      enum: ['porcentaje', 'fijo'],
      required: true
    },
    valor: {
      type: Number,
      required: true
    },
    // Indica si usa un tipo predefinido o es personalizada
    usaTipoPredefinido: {
      type: Boolean,
      default: true
    }
  },
  // Cálculo de comisión
  comisionCalculada: {
    type: Number,
    default: 0
  },
  comisionEstimada: {
    type: Number,
    default: 0
  },
  // Estado de la comisión del participante
  estadoComision: {
    type: String,
    enum: ['pendiente', 'pagada'],
    default: 'pendiente'
  },
  fechaPago: Date,
  liquidacionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Liquidacion'
  }
}, { _id: true });

const contratoSchema = new mongoose.Schema({
  // Código interno único
  codigo: {
    type: String,
    unique: true
  },
  // Empresa a la que pertenece el contrato
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa'
  },
  tipo: {
    type: String,
    enum: ['venta_directa', 'contrato', 'proyecto'],
    required: [true, 'El tipo es obligatorio']
  },
  cliente: {
    nombre: {
      type: String,
      required: [true, 'El nombre del cliente es obligatorio'],
      trim: true
    },
    identificacion: String,
    telefono: String,
    email: String
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  fechaVencimiento: Date,
  descripcion: {
    type: String,
    trim: true
  },
  // Montos
  montoTotal: {
    type: Number,
    required: [true, 'El monto total es obligatorio'],
    min: 0
  },
  // Deducciones (costos, gastos, etc.) que se restan del total
  deducciones: {
    type: Number,
    default: 0,
    min: 0
  },
  // Monto neto = montoTotal - deducciones (sobre este se calculan comisiones)
  montoNeto: {
    type: Number,
    default: 0,
    min: 0
  },
  montoPagado: {
    type: Number,
    default: 0,
    min: 0
  },
  // ESTADOS DEL CONTRATO
  // registrado: recién ingresado al sistema (ya ganado)
  // pago_parcial: cliente ha pagado parcialmente
  // pagado: cliente pagó el total (listo para liquidar comisiones)
  // liquidado: comisiones ya fueron pagadas a empleados
  // cancelado: contrato cancelado
  estado: {
    type: String,
    enum: ['registrado', 'pago_parcial', 'pagado', 'liquidado', 'cancelado'],
    default: 'registrado'
  },
  // Participantes con sus comisiones
  participantes: [participanteSchema],
  // Historial de pagos del cliente
  historialPagos: [{
    fecha: { type: Date, default: Date.now },
    monto: Number,
    metodo: String,
    referencia: String,
    observacion: String
  }],
  // Auditoría
  historialEstados: [{
    estado: String,
    fecha: { type: Date, default: Date.now },
    observacion: String
  }],
  observaciones: String,
  // Cálculos totales
  totalComisiones: {
    type: Number,
    default: 0
  },
  margenNeto: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generar código antes de guardar
contratoSchema.pre('save', async function(next) {
  if (!this.codigo) {
    const count = await mongoose.model('Contrato').countDocuments();
    const year = new Date().getFullYear();
    this.codigo = `CTR-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Pre-save hook para calcular monto neto
contratoSchema.pre('save', function(next) {
  // Calcular monto neto = total - deducciones
  this.montoNeto = this.montoTotal - (this.deducciones || 0);
  if (this.montoNeto < 0) this.montoNeto = 0;
  next();
});

// Método para calcular comisiones (basado en monto neto)
contratoSchema.methods.calcularComisiones = function() {
  let totalComisiones = 0;
  
  // Calcular monto neto = total - deducciones
  this.montoNeto = this.montoTotal - (this.deducciones || 0);
  if (this.montoNeto < 0) this.montoNeto = 0;
  
  // Base de cálculo es el monto neto (lo que realmente entra)
  const baseCalculo = this.montoNeto;
  
  // Calcular proporción pagada sobre el monto NETO (no total)
  // Los pagos se registran sobre el valor neto
  const proporcionPagada = baseCalculo > 0 
    ? Math.min(this.montoPagado / baseCalculo, 1) 
    : 0;
  const montoNetoPagado = baseCalculo * proporcionPagada;
  
  this.participantes.forEach(p => {
    let comisionReal = 0;
    let comisionEstimada = 0;
    
    if (p.comision.tipo === 'porcentaje') {
      // Comisión estimada: sobre el monto neto total
      comisionEstimada = (baseCalculo * p.comision.valor) / 100;
      // Comisión real: sobre lo que efectivamente se ha pagado del neto
      comisionReal = (montoNetoPagado * p.comision.valor) / 100;
    } else {
      // Comisión fija
      comisionEstimada = p.comision.valor;
      comisionReal = p.comision.valor * proporcionPagada;
    }
    
    p.comisionEstimada = comisionEstimada;
    
    // La comisión calculada (real) solo se establece cuando está pagado o liquidado
    if (this.estado === 'pagado' || this.estado === 'liquidado') {
      p.comisionCalculada = comisionEstimada; // Cuando está pagado, la comisión es la estimada completa
    } else {
      p.comisionCalculada = comisionReal;
    }
    
    totalComisiones += p.comisionCalculada;
  });
  
  this.totalComisiones = totalComisiones;
  this.margenNeto = this.montoPagado - totalComisiones;
  
  return this;
};

module.exports = mongoose.model('Contrato', contratoSchema);
