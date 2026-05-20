const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuración CORS para producción - múltiples orígenes permitidos
const allowedOrigins = [
  'https://licitronix.com',
  'https://www.licitronix.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como apps móviles o Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Middleware para configurar headers de seguridad compatibles con Google OAuth
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

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
app.use('/api/store', require('./routes/store'));

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'COMMETP API funcionando correctamente' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 COMMETP Backend corriendo en puerto ${PORT}`);
});
