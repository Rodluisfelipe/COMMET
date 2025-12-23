const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const Usuario = require('../models/Usuario');

// Cliente de Google OAuth
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Correos permitidos para login con Google
const ALLOWED_GOOGLE_EMAILS = [
  'ventas@tecnophone.co',
  'gerencia@tecnophone.co'
];

// POST - Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const usuario = await Usuario.findOne({ email });
    
    if (!usuario || !(await usuario.comparePassword(password))) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }
    
    if (usuario.estado === 'inactivo') {
      return res.status(401).json({ mensaje: 'Usuario inactivo' });
    }
    
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en login', error: error.message });
  }
});

// POST - Crear usuario admin (solo para setup inicial)
router.post('/setup', async (req, res) => {
  try {
    const existeAdmin = await Usuario.findOne({ rol: 'admin' });
    
    if (existeAdmin) {
      return res.status(400).json({ mensaje: 'Ya existe un administrador' });
    }
    
    const usuario = new Usuario({
      nombre: req.body.nombre || 'Administrador',
      email: req.body.email || 'admin@commetp.com',
      password: req.body.password || 'admin123',
      rol: 'admin'
    });
    
    await usuario.save();
    
    res.status(201).json({ mensaje: 'Administrador creado correctamente' });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear usuario', error: error.message });
  }
});

// GET - Verificar token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ valid: false });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select('-password');
    
    if (!usuario || usuario.estado === 'inactivo') {
      return res.status(401).json({ valid: false });
    }
    
    res.json({ valid: true, usuario });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// POST - Login con Google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ mensaje: 'Token de Google requerido' });
    }
    
    // Verificar el token con Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    
    // Verificar que el correo está en la lista permitida
    if (!ALLOWED_GOOGLE_EMAILS.includes(email.toLowerCase())) {
      return res.status(403).json({ 
        mensaje: 'Acceso denegado. Este correo no está autorizado.',
        email 
      });
    }
    
    // Verificar que sea del dominio correcto
    if (!email.endsWith('@tecnophone.co')) {
      return res.status(403).json({ 
        mensaje: 'Solo se permiten correos del dominio @tecnophone.co' 
      });
    }
    
    // Buscar o crear usuario
    let usuario = await Usuario.findOne({ email: email.toLowerCase() });
    
    if (!usuario) {
      // Crear usuario automáticamente para los correos permitidos
      // gerencia = superadmin (todos los permisos)
      // ventas = visor (solo lectura + reiniciar BD)
      const rol = email.toLowerCase() === 'gerencia@tecnophone.co' ? 'superadmin' : 'visor';
      
      usuario = new Usuario({
        nombre: name,
        email: email.toLowerCase(),
        googleId,
        avatar: picture,
        rol,
        authProvider: 'google',
        // Password aleatorio ya que usará Google
        password: Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16)
      });
      
      await usuario.save();
    } else {
      // Actualizar datos de Google si ya existe
      usuario.googleId = googleId;
      usuario.avatar = picture;
      if (!usuario.authProvider) {
        usuario.authProvider = 'google';
      }
      // Actualizar rol si es necesario
      if (email.toLowerCase() === 'gerencia@tecnophone.co' && usuario.rol !== 'superadmin') {
        usuario.rol = 'superadmin';
      } else if (email.toLowerCase() === 'ventas@tecnophone.co' && usuario.rol !== 'visor') {
        usuario.rol = 'visor';
      }
      await usuario.save();
    }
    
    if (usuario.estado === 'inactivo') {
      return res.status(401).json({ mensaje: 'Usuario inactivo' });
    }
    
    // Generar JWT
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // 7 días para Google Auth
    );
    
    res.json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        avatar: usuario.avatar
      }
    });
  } catch (error) {
    console.error('Error en Google Auth:', error);
    res.status(500).json({ mensaje: 'Error en autenticación con Google', error: error.message });
  }
});

// POST - Reiniciar base de datos (solo visor y superadmin)
// Elimina todos los datos EXCEPTO usuarios
router.post('/reiniciar-bd', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ mensaje: 'No autorizado' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id);
    
    if (!usuario || !['superadmin', 'visor'].includes(usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para esta acción' });
    }
    
    // Importar modelos
    const Contrato = require('../models/Contrato');
    const Empleado = require('../models/Empleado');
    const Liquidacion = require('../models/Liquidacion');
    const TipoComision = require('../models/TipoComision');
    const Empresa = require('../models/Empresa');
    
    // Eliminar todos los documentos de cada colección
    const resultados = {
      contratos: await Contrato.deleteMany({}),
      empleados: await Empleado.deleteMany({}),
      liquidaciones: await Liquidacion.deleteMany({}),
      tiposComision: await TipoComision.deleteMany({}),
      empresas: await Empresa.deleteMany({})
    };
    
    // Registrar la acción
    console.log(`[${new Date().toISOString()}] Base de datos reiniciada por: ${usuario.email}`);
    console.log('Documentos eliminados:', resultados);
    
    res.json({ 
      mensaje: 'Base de datos reiniciada correctamente',
      eliminados: {
        contratos: resultados.contratos.deletedCount,
        empleados: resultados.empleados.deletedCount,
        liquidaciones: resultados.liquidaciones.deletedCount,
        tiposComision: resultados.tiposComision.deletedCount,
        empresas: resultados.empresas.deletedCount
      },
      ejecutadoPor: usuario.email,
      fecha: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al reiniciar BD:', error);
    res.status(500).json({ mensaje: 'Error al reiniciar base de datos', error: error.message });
  }
});

module.exports = router;
