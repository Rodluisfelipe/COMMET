const express = require('express');
const router = express.Router();
const Empleado = require('../models/Empleado');
const Contrato = require('../models/Contrato');

// GET - Obtener todos los empleados
router.get('/', async (req, res) => {
  try {
    const { estado, buscar } = req.query;
    let filtro = {};
    
    if (estado) filtro.estado = estado;
    if (buscar) {
      filtro.$or = [
        { nombreCompleto: { $regex: buscar, $options: 'i' } },
        { identificacion: { $regex: buscar, $options: 'i' } },
        { codigoInterno: { $regex: buscar, $options: 'i' } }
      ];
    }
    
    const empleados = await Empleado.find(filtro).sort({ createdAt: -1 });
    res.json(empleados);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener empleados', error: error.message });
  }
});

// GET - Obtener un empleado por ID
router.get('/:id', async (req, res) => {
  try {
    const empleado = await Empleado.findById(req.params.id);
    if (!empleado) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }
    res.json(empleado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener empleado', error: error.message });
  }
});

// GET - Obtener comisiones de un empleado
// Ahora maneja múltiples comisiones por contrato para el mismo empleado
router.get('/:id/comisiones', async (req, res) => {
  try {
    const contratos = await Contrato.find({
      'participantes.empleado': req.params.id
    }).populate('participantes.empleado', 'nombreCompleto codigoInterno');
    
    let comisiones = [];
    let totalGenerado = 0;
    let totalPagado = 0;
    let totalPendiente = 0;
    
    contratos.forEach(contrato => {
      // Buscar TODAS las participaciones del empleado en este contrato (puede haber múltiples)
      const participaciones = contrato.participantes.filter(
        p => p.empleado._id.toString() === req.params.id
      );
      
      participaciones.forEach(participante => {
        // Calcular montos de pago parcial
        const comisionTotal = participante.comisionCalculada || 0;
        const comisionPagadaReal = participante.comisionPagada || 0;
        const comisionPendienteReal = participante.comisionPendiente !== undefined 
          ? participante.comisionPendiente 
          : (comisionTotal - comisionPagadaReal);
        
        const comisionData = {
          contratoId: contrato._id,
          participanteId: participante._id,
          codigoContrato: contrato.codigo,
          cliente: contrato.cliente.nombre,
          montoContrato: contrato.montoTotal,
          montoPagado: contrato.montoPagado,
          estadoContrato: contrato.estado,
          tipoComision: participante.comision.tipo,
          valorComision: participante.comision.valor,
          tipoComisionNombre: participante.tipoComisionNombre || 'Comisión Base',
          comisionEstimada: participante.comisionEstimada,
          comisionCalculada: participante.comisionCalculada,
          // Datos de pago parcial
          comisionPagada: comisionPagadaReal,
          comisionPendiente: comisionPendienteReal,
          historialPagos: participante.historialPagos || [],
          estadoComision: participante.estadoComision,
          fechaPago: participante.fechaPago
        };
        
        comisiones.push(comisionData);
        
        if (contrato.estado === 'pagado' || contrato.estado === 'liquidado') {
          totalGenerado += comisionTotal;
          totalPagado += comisionPagadaReal;
          totalPendiente += comisionPendienteReal;
        }
      });
    });
    
    res.json({
      empleadoId: req.params.id,
      totalGenerado,
      totalPagado,
      totalPendiente,
      comisiones
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener comisiones', error: error.message });
  }
});

// POST - Crear empleado
router.post('/', async (req, res) => {
  try {
    const empleado = new Empleado(req.body);
    await empleado.save();
    res.status(201).json(empleado);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ mensaje: 'Ya existe un empleado con esa identificación' });
    }
    res.status(400).json({ mensaje: 'Error al crear empleado', error: error.message });
  }
});

// PUT - Actualizar empleado
router.put('/:id', async (req, res) => {
  try {
    const empleado = await Empleado.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!empleado) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }
    res.json(empleado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar empleado', error: error.message });
  }
});

// DELETE - Eliminar empleado
router.delete('/:id', async (req, res) => {
  try {
    // Verificar si tiene contratos liquidados
    const contratosLiquidados = await Contrato.countDocuments({
      'participantes.empleado': req.params.id,
      estado: 'liquidado'
    });
    
    if (contratosLiquidados > 0) {
      return res.status(400).json({ 
        mensaje: 'No se puede eliminar el empleado porque tiene contratos liquidados',
        tieneLiquidados: true
      });
    }
    
    // Verificar si tiene comisiones pagadas en algún contrato
    const contratosConPagos = await Contrato.find({
      'participantes.empleado': req.params.id,
      'participantes.estadoComision': 'pagada'
    });
    
    if (contratosConPagos.length > 0) {
      return res.status(400).json({ 
        mensaje: 'No se puede eliminar el empleado porque tiene comisiones pagadas',
        tienePagos: true
      });
    }
    
    // Si tiene contratos no liquidados, eliminar la participación del empleado en esos contratos
    await Contrato.updateMany(
      { 'participantes.empleado': req.params.id },
      { $pull: { participantes: { empleado: req.params.id } } }
    );
    
    // Recalcular comisiones en contratos afectados
    const contratosAfectados = await Contrato.find({
      'participantes.empleado': req.params.id
    });
    
    for (const contrato of contratosAfectados) {
      contrato.calcularComisiones();
      await contrato.save();
    }
    
    await Empleado.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Empleado eliminado correctamente', eliminado: true });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar empleado', error: error.message });
  }
});

// DELETE - Limpiar registros de comisiones pagadas de un empleado
// Esto elimina las participaciones con comisiones 100% pagadas de los contratos
// y las liquidaciones asociadas, para mantener la BD limpia
router.delete('/:id/limpiar-pagadas', async (req, res) => {
  try {
    const Liquidacion = require('../models/Liquidacion');
    const empleadoId = req.params.id;
    
    // Verificar que el empleado existe
    const empleado = await Empleado.findById(empleadoId);
    if (!empleado) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }
    
    // Buscar contratos donde el empleado tiene participaciones con comisión COMPLETAMENTE pagada
    const contratos = await Contrato.find({
      'participantes.empleado': empleadoId,
      'participantes.estadoComision': 'pagada'
    });
    
    let participacionesEliminadas = 0;
    let liquidacionesEliminadas = 0;
    let contratosActualizados = 0;
    
    for (const contrato of contratos) {
      // Encontrar las participaciones pagadas de este empleado
      const participacionesPagadas = contrato.participantes.filter(
        p => p.empleado.toString() === empleadoId && p.estadoComision === 'pagada'
      );
      
      if (participacionesPagadas.length === 0) continue;
      
      // Eliminar las liquidaciones asociadas a estas participaciones
      for (const part of participacionesPagadas) {
        // Eliminar liquidaciones que contengan esta participación
        const resultado = await Liquidacion.deleteMany({
          empleado: empleadoId,
          'contratos.participanteId': part._id
        });
        liquidacionesEliminadas += resultado.deletedCount;
      }
      
      // Eliminar las participaciones pagadas del contrato
      const cantidadAntes = contrato.participantes.length;
      contrato.participantes = contrato.participantes.filter(
        p => !(p.empleado.toString() === empleadoId && p.estadoComision === 'pagada')
      );
      
      participacionesEliminadas += cantidadAntes - contrato.participantes.length;
      
      // Verificar si el contrato ya no tiene participantes pendientes
      // Si todas las comisiones fueron pagadas y eliminadas, el contrato queda "limpio"
      const tienePendientes = contrato.participantes.some(
        p => p.estadoComision !== 'pagada'
      );
      
      // Si no hay más participantes, el contrato puede cambiar de estado
      if (contrato.participantes.length === 0 && contrato.estado === 'liquidado') {
        // Mantener como liquidado pero limpio
        contrato.observaciones = (contrato.observaciones || '') + 
          `\n[${new Date().toLocaleDateString('es-CO')}] Registros de comisiones pagadas limpiados.`;
      }
      
      await contrato.save();
      contratosActualizados++;
    }
    
    // Actualizar estadísticas del empleado
    empleado.estadisticas.totalComisionesPagadas = 0;
    await empleado.save();
    
    res.json({
      mensaje: 'Registros de comisiones pagadas eliminados correctamente',
      detalles: {
        participacionesEliminadas,
        liquidacionesEliminadas,
        contratosActualizados
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al limpiar registros', error: error.message });
  }
});

// GET - Obtener resumen de comisiones pagadas para limpieza
router.get('/:id/resumen-pagadas', async (req, res) => {
  try {
    const Liquidacion = require('../models/Liquidacion');
    const empleadoId = req.params.id;
    
    // Buscar contratos con comisiones pagadas
    const contratos = await Contrato.find({
      'participantes.empleado': empleadoId,
      'participantes.estadoComision': 'pagada'
    }).populate('participantes.empleado', 'nombreCompleto');
    
    let totalPagado = 0;
    let comisionesPagadas = [];
    
    for (const contrato of contratos) {
      const participacionesPagadas = contrato.participantes.filter(
        p => p.empleado._id.toString() === empleadoId && p.estadoComision === 'pagada'
      );
      
      for (const part of participacionesPagadas) {
        totalPagado += part.comisionCalculada || 0;
        comisionesPagadas.push({
          contratoId: contrato._id,
          codigoContrato: contrato.codigo,
          cliente: contrato.cliente.nombre,
          tipoComision: part.tipoComisionNombre || 'Comisión Base',
          montoPagado: part.comisionCalculada || 0,
          fechaPago: part.fechaPago
        });
      }
    }
    
    // Contar liquidaciones asociadas
    const liquidaciones = await Liquidacion.countDocuments({
      empleado: empleadoId,
      estado: 'pagada'
    });
    
    res.json({
      totalPagado,
      cantidadComisiones: comisionesPagadas.length,
      cantidadLiquidaciones: liquidaciones,
      comisiones: comisionesPagadas
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener resumen', error: error.message });
  }
});

module.exports = router;
