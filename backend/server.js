const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuración CORS para producción
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado - COMMETP'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// Rutas
app.use('/api/empleados', require('./routes/empleados'));
app.use('/api/contratos', require('./routes/contratos'));
app.use('/api/liquidaciones', require('./routes/liquidaciones'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tipos-comision', require('./routes/tiposComision'));
app.use('/api/empresas', require('./routes/empresas'));

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'COMMETP API funcionando correctamente' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 COMMETP Backend corriendo en puerto ${PORT}`);
});
