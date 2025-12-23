const mongoose = require('mongoose');

const empresaSchema = new mongoose.Schema({
  // Nombre de la empresa
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  // NIT o identificación fiscal
  nit: {
    type: String,
    required: [true, 'El NIT es obligatorio'],
    trim: true,
    unique: true
  },
  // URL del logo
  logo: {
    type: String,
    trim: true
  },
  // Información adicional
  direccion: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  // Estado
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Empresa', empresaSchema);
