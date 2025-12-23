const express = require('express');
const router = express.Router();
const Empresa = require('../models/Empresa');
const Contrato = require('../models/Contrato');

// GET - Obtener todas las empresas
router.get('/', async (req, res) => {
  try {
    const { estado } = req.query;
    let filtro = {};
    
    if (estado) filtro.estado = estado;
    
    const empresas = await Empresa.find(filtro).sort({ nombre: 1 });
    res.json(empresas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener empresas', error: error.message });
  }
});

// GET - Obtener una empresa por ID
router.get('/:id', async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.id);
    
    if (!empresa) {
      return res.status(404).json({ mensaje: 'Empresa no encontrada' });
    }
    
    res.json(empresa);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener empresa', error: error.message });
  }
});

// POST - Crear empresa
router.post('/', async (req, res) => {
  try {
    const { nombre, nit, logo, direccion, telefono, email } = req.body;
    
    // Verificar si ya existe una empresa con ese NIT
    const existente = await Empresa.findOne({ nit });
    if (existente) {
      return res.status(400).json({ mensaje: 'Ya existe una empresa con ese NIT' });
    }
    
    const empresa = new Empresa({
      nombre,
      nit,
      logo,
      direccion,
      telefono,
      email
    });
    
    await empresa.save();
    res.status(201).json(empresa);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear empresa', error: error.message });
  }
});

// PUT - Actualizar empresa
router.put('/:id', async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.id);
    
    if (!empresa) {
      return res.status(404).json({ mensaje: 'Empresa no encontrada' });
    }
    
    Object.assign(empresa, req.body);
    await empresa.save();
    
    res.json(empresa);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar empresa', error: error.message });
  }
});

// DELETE - Eliminar empresa
router.delete('/:id', async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.id);
    
    if (!empresa) {
      return res.status(404).json({ mensaje: 'Empresa no encontrada' });
    }
    
    // Verificar si hay contratos asociados
    const contratosAsociados = await Contrato.countDocuments({ empresa: empresa._id });
    if (contratosAsociados > 0) {
      return res.status(400).json({ 
        mensaje: `No se puede eliminar. Hay ${contratosAsociados} contrato(s) asociado(s) a esta empresa.` 
      });
    }
    
    await Empresa.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Empresa eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar empresa', error: error.message });
  }
});

// PUT - Cambiar estado de empresa
router.put('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const empresa = await Empresa.findById(req.params.id);
    
    if (!empresa) {
      return res.status(404).json({ mensaje: 'Empresa no encontrada' });
    }
    
    empresa.estado = estado;
    await empresa.save();
    
    res.json(empresa);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al cambiar estado', error: error.message });
  }
});

module.exports = router;
