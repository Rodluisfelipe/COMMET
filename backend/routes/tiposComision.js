const express = require('express');
const router = express.Router();
const TipoComision = require('../models/TipoComision');

// GET - Obtener todos los tipos de comisión
router.get('/', async (req, res) => {
  try {
    const { estado, aplicaA } = req.query;
    let filtro = {};
    
    if (estado) filtro.estado = estado;
    if (aplicaA) {
      filtro.$or = [
        { aplicaA: aplicaA },
        { aplicaA: { $size: 0 } }, // También los que aplican a todos
        { aplicaA: { $exists: false } }
      ];
    }
    
    const tipos = await TipoComision.find(filtro).sort({ orden: 1, nombre: 1 });
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener tipos de comisión', error: error.message });
  }
});

// GET - Obtener un tipo por ID
router.get('/:id', async (req, res) => {
  try {
    const tipo = await TipoComision.findById(req.params.id);
    if (!tipo) {
      return res.status(404).json({ mensaje: 'Tipo de comisión no encontrado' });
    }
    res.json(tipo);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener tipo de comisión', error: error.message });
  }
});

// POST - Crear tipo de comisión
router.post('/', async (req, res) => {
  try {
    const tipo = new TipoComision(req.body);
    await tipo.save();
    res.status(201).json(tipo);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: 'Ya existe un tipo de comisión con ese nombre' });
    }
    res.status(400).json({ mensaje: 'Error al crear tipo de comisión', error: error.message });
  }
});

// PUT - Actualizar tipo de comisión
router.put('/:id', async (req, res) => {
  try {
    const tipo = await TipoComision.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!tipo) {
      return res.status(404).json({ mensaje: 'Tipo de comisión no encontrado' });
    }
    res.json(tipo);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar tipo de comisión', error: error.message });
  }
});

// DELETE - Eliminar tipo de comisión
router.delete('/:id', async (req, res) => {
  try {
    const Contrato = require('../models/Contrato');
    
    // Verificar si está siendo usado en contratos liquidados
    const contratosLiquidados = await Contrato.countDocuments({
      'participantes.tipoComision': req.params.id,
      estado: 'liquidado'
    });
    
    if (contratosLiquidados > 0) {
      return res.status(400).json({ 
        mensaje: 'No se puede eliminar porque está siendo usado en contratos liquidados',
        tieneLiquidados: true
      });
    }
    
    // Eliminar el tipo de comisión
    const tipo = await TipoComision.findByIdAndDelete(req.params.id);
    
    if (!tipo) {
      return res.status(404).json({ mensaje: 'Tipo de comisión no encontrado' });
    }
    
    res.json({ mensaje: 'Tipo de comisión eliminado correctamente', eliminado: true });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar tipo de comisión', error: error.message });
  }
});

// POST - Reordenar tipos de comisión
router.post('/reordenar', async (req, res) => {
  try {
    const { ordenamiento } = req.body; // Array de { id, orden }
    
    const updates = ordenamiento.map(item => 
      TipoComision.findByIdAndUpdate(item.id, { orden: item.orden })
    );
    
    await Promise.all(updates);
    
    res.json({ mensaje: 'Orden actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al reordenar', error: error.message });
  }
});

module.exports = router;
