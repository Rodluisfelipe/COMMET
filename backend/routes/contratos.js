const express = require('express');
const router = express.Router();
const Contrato = require('../models/Contrato');
const Empleado = require('../models/Empleado');
const TipoComision = require('../models/TipoComision');

// GET - Obtener todos los contratos
router.get('/', async (req, res) => {
  try {
    const { estado, tipo, buscar, fechaDesde, fechaHasta } = req.query;
    let filtro = {};
    
    if (estado) filtro.estado = estado;
    if (tipo) filtro.tipo = tipo;
    if (buscar) {
      filtro.$or = [
        { codigo: { $regex: buscar, $options: 'i' } },
        { 'cliente.nombre': { $regex: buscar, $options: 'i' } },
        { descripcion: { $regex: buscar, $options: 'i' } }
      ];
    }
    if (fechaDesde || fechaHasta) {
      filtro.fecha = {};
      if (fechaDesde) filtro.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) filtro.fecha.$lte = new Date(fechaHasta);
    }
    
    const contratos = await Contrato.find(filtro)
      .populate('participantes.empleado', 'nombreCompleto codigoInterno')
      .populate('empresa', 'nombre nit logo')
      .sort({ createdAt: -1 });
    
    res.json(contratos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener contratos', error: error.message });
  }
});

// GET - Generar código automático para contrato
// IMPORTANTE: Esta ruta debe estar ANTES de /:id para que no se confunda con un ID
router.get('/generar-codigo', async (req, res) => {
  try {
    const count = await Contrato.countDocuments();
    const year = new Date().getFullYear();
    const codigo = `CTR-${year}-${String(count + 1).padStart(5, '0')}`;
    res.json({ codigo });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al generar código', error: error.message });
  }
});

// GET - Verificar si un código ya existe
// IMPORTANTE: Esta ruta debe estar ANTES de /:id
router.get('/verificar-codigo/:codigo', async (req, res) => {
  try {
    const existe = await Contrato.findOne({ codigo: req.params.codigo });
    res.json({ existe: !!existe });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al verificar código', error: error.message });
  }
});

// GET - Obtener un contrato por ID
router.get('/:id', async (req, res) => {
  try {
    const contrato = await Contrato.findById(req.params.id)
      .populate('participantes.empleado', 'nombreCompleto codigoInterno cargo comisionBase')
      .populate('empresa', 'nombre nit logo');
    
    if (!contrato) {
      return res.status(404).json({ mensaje: 'Contrato no encontrado' });
    }
    res.json(contrato);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener contrato', error: error.message });
  }
});

// POST - Crear contrato
router.post('/', async (req, res) => {
  try {
    // Si se proporciona un código personalizado, verificar que no exista
    if (req.body.codigo) {
      const existeCodigo = await Contrato.findOne({ codigo: req.body.codigo });
      if (existeCodigo) {
        return res.status(400).json({ mensaje: `El código "${req.body.codigo}" ya existe. Por favor use otro.` });
      }
    }
    
    const contrato = new Contrato(req.body);
    
    // Agregar estado inicial al historial
    contrato.historialEstados.push({
      estado: 'registrado',
      observacion: 'Contrato creado'
    });
    
    // Calcular comisiones estimadas si hay participantes
    if (contrato.participantes && contrato.participantes.length > 0) {
      contrato.calcularComisiones();
    }
    
    await contrato.save();
    
    // Poblar participantes para la respuesta
    await contrato.populate('participantes.empleado', 'nombreCompleto codigoInterno');
    
    res.status(201).json(contrato);
  } catch (error) {
    // Manejar error de código duplicado
    if (error.code === 11000 && error.keyPattern?.codigo) {
      return res.status(400).json({ mensaje: 'El código de contrato ya existe. Por favor use otro.' });
    }
    res.status(400).json({ mensaje: 'Error al crear contrato', error: error.message });
  }
});

// PUT - Actualizar contrato
router.put('/:id', async (req, res) => {
  try {
    const contratoActual = await Contrato.findById(req.params.id);
    
    if (!contratoActual) {
      return res.status(404).json({ mensaje: 'Contrato no encontrado' });
    }
    
    // Verificar si está liquidado
    if (contratoActual.estado === 'liquidado') {
      return res.status(400).json({ mensaje: 'No se puede modificar un contrato liquidado' });
    }
    
    Object.assign(contratoActual, req.body);
    contratoActual.calcularComisiones();
    
    await contratoActual.save();
    await contratoActual.populate('participantes.empleado', 'nombreCompleto codigoInterno');
    
    res.json(contratoActual);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar contrato', error: error.message });
  }
});

// POST - Agregar comisión a participante (un empleado puede tener múltiples comisiones)
router.post('/:id/participantes', async (req, res) => {
  try {
    const contrato = await Contrato.findById(req.params.id);
    
    if (!contrato) {
      return res.status(404).json({ mensaje: 'Contrato no encontrado' });
    }
    
    if (contrato.estado === 'liquidado') {
      return res.status(400).json({ mensaje: 'No se puede modificar un contrato liquidado' });
    }
    
    const { empleadoId, comision, usaComisionBase, tipoComisionId } = req.body;
    
    // Verificar si ya existe esta MISMA combinación de empleado + tipo de comisión
    if (tipoComisionId) {
      const existeMismaComision = contrato.participantes.some(
        p => p.empleado.toString() === empleadoId && 
             p.tipoComision && 
             p.tipoComision.toString() === tipoComisionId
      );
      
      if (existeMismaComision) {
        return res.status(400).json({ mensaje: 'El empleado ya tiene este tipo de comisión asignada' });
      }
    }
    
    // Determinar comisión final
    let comisionFinal = comision;
    let tipoComisionNombre = 'Comisión Base';
    let tipoComisionRef = null;
    
    if (tipoComisionId) {
      // Usar tipo de comisión predefinido
      const tipoComision = await TipoComision.findById(tipoComisionId);
      if (tipoComision) {
        comisionFinal = {
          tipo: tipoComision.tipo,
          valor: tipoComision.valor,
          usaTipoPredefinido: true
        };
        tipoComisionNombre = tipoComision.nombre;
        tipoComisionRef = tipoComisionId;
      }
    } else if (usaComisionBase) {
      // Obtener comisión base del empleado
      const empleado = await Empleado.findById(empleadoId);
      comisionFinal = {
        tipo: empleado.comisionBase.tipo,
        valor: empleado.comisionBase.valor,
        usaTipoPredefinido: false
      };
      tipoComisionNombre = 'Comisión Base Empleado';
    } else if (comision) {
      // Comisión personalizada
      comisionFinal = {
        tipo: comision.tipo,
        valor: comision.valor,
        usaTipoPredefinido: false
      };
      tipoComisionNombre = 'Comisión Personalizada';
    }
    
    contrato.participantes.push({
      empleado: empleadoId,
      tipoComision: tipoComisionRef,
      tipoComisionNombre: tipoComisionNombre,
      comision: comisionFinal
    });
    
    contrato.calcularComisiones();
    await contrato.save();
    await contrato.populate('participantes.empleado', 'nombreCompleto codigoInterno');
    
    res.json(contrato);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al agregar comisión', error: error.message });
  }
});

// DELETE - Eliminar comisión de participante
router.delete('/:id/participantes/:participanteId', async (req, res) => {
  try {
    const contrato = await Contrato.findById(req.params.id);
    
    if (!contrato) {
      return res.status(404).json({ mensaje: 'Contrato no encontrado' });
    }
    
    if (contrato.estado === 'liquidado') {
      return res.status(400).json({ mensaje: 'No se puede modificar un contrato liquidado' });
    }
    
    const participante = contrato.participantes.id(req.params.participanteId);
    
    if (!participante) {
      return res.status(404).json({ mensaje: 'Comisión no encontrada' });
    }
    
    if (participante.estadoComision === 'pagada') {
      return res.status(400).json({ mensaje: 'No se puede eliminar una comisión ya pagada' });
    }
    
    contrato.participantes.pull(req.params.participanteId);
    contrato.calcularComisiones();
    await contrato.save();
    
    res.json(contrato);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al eliminar comisión', error: error.message });
  }
});

// DELETE - Eliminar TODAS las comisiones de un empleado específico (solo las no pagadas)
router.delete('/:id/participantes/empleado/:empleadoId', async (req, res) => {
  try {
    const contrato = await Contrato.findById(req.params.id);
    
    if (!contrato) {
      return res.status(404).json({ mensaje: 'Contrato no encontrado' });
    }
    
    if (contrato.estado === 'liquidado') {
      return res.status(400).json({ mensaje: 'No se puede modificar un contrato liquidado' });
    }
    
    const empleadoId = req.params.empleadoId;
    
    // Filtrar comisiones del empleado que no estén pagadas
    const comisionesAEliminar = contrato.participantes.filter(
      p => p.empleado.toString() === empleadoId && p.estadoComision !== 'pagada'
    );
    
    if (comisionesAEliminar.length === 0) {
      return res.status(400).json({ mensaje: 'No hay comisiones pendientes para eliminar de este empleado' });
    }
    
    // Eliminar cada comisión
    comisionesAEliminar.forEach(p => {
      contrato.participantes.pull(p._id);
    });
    
    contrato.calcularComisiones();
    await contrato.save();
    await contrato.populate('participantes.empleado', 'nombreCompleto codigoInterno');
    
    res.json({ 
      mensaje: `Se eliminaron ${comisionesAEliminar.length} comisión(es) del empleado`,
      contrato 
    });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al eliminar comisiones', error: error.message });
  }
});

// POST - Cambiar estado del contrato
router.post('/:id/estado', async (req, res) => {
  try {
    const { nuevoEstado, observacion } = req.body;
    const contrato = await Contrato.findById(req.params.id);
    
    if (!contrato) {
      return res.status(404).json({ mensaje: 'Contrato no encontrado' });
    }
    
    // Validar transiciones de estado
    // registrado: contrato ingresado (ya ganado)
    // pago_parcial: cliente pagó parcialmente
    // pagado: cliente pagó todo (listo para liquidar)
    // liquidado: comisiones pagadas
    // cancelado: contrato cancelado
    const transicionesValidas = {
      'registrado': ['pago_parcial', 'pagado', 'cancelado'],
      'pago_parcial': ['pagado', 'cancelado'],
      'pagado': ['liquidado'],
      'liquidado': [],
      'cancelado': []
    };
    
    if (!transicionesValidas[contrato.estado]?.includes(nuevoEstado)) {
      return res.status(400).json({ 
        mensaje: `No se puede cambiar de ${contrato.estado} a ${nuevoEstado}` 
      });
    }
    
    contrato.estado = nuevoEstado;
    contrato.historialEstados.push({
      estado: nuevoEstado,
      observacion: observacion || ''
    });
    
    // Si cambia a pagado, establecer monto pagado igual al neto y recalcular
    if (nuevoEstado === 'pagado') {
      contrato.montoPagado = contrato.montoNeto || (contrato.montoTotal - (contrato.deducciones || 0));
      contrato.calcularComisiones();
      
      // Actualizar estadísticas de empleados participantes
      const Empleado = require('../models/Empleado');
      for (const participante of contrato.participantes) {
        const empleado = await Empleado.findById(participante.empleado);
        if (empleado) {
          empleado.estadisticas.totalComisionesPendientes += participante.comisionCalculada || 0;
          empleado.estadisticas.contratosAsociados += 1;
          await empleado.save();
        }
      }
    }
    
    await contrato.save();
    await contrato.populate('participantes.empleado', 'nombreCompleto codigoInterno');
    
    res.json(contrato);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al cambiar estado', error: error.message });
  }
});

// POST - Registrar pago del cliente
router.post('/:id/pagos', async (req, res) => {
  try {
    const { monto, metodo, referencia, observacion } = req.body;
    const contrato = await Contrato.findById(req.params.id);
    
    if (!contrato) {
      return res.status(404).json({ mensaje: 'Contrato no encontrado' });
    }
    
    if (contrato.estado === 'liquidado' || contrato.estado === 'cancelado') {
      return res.status(400).json({ mensaje: 'No se puede registrar pago en este estado' });
    }
    
    // Calcular monto neto si no existe
    const montoNeto = contrato.montoNeto || (contrato.montoTotal - (contrato.deducciones || 0));
    
    contrato.historialPagos.push({
      monto,
      metodo,
      referencia,
      observacion
    });
    
    contrato.montoPagado += monto;
    
    // Actualizar estado según el pago - comparar con monto NETO, no total
    let cambioAPagado = false;
    if (contrato.montoPagado >= montoNeto) {
      // Pago completo del monto neto
      contrato.estado = 'pagado';
      contrato.montoPagado = montoNeto; // No exceder el monto neto
      contrato.historialEstados.push({
        estado: 'pagado',
        observacion: 'Pago completado - Listo para liquidar comisiones'
      });
      cambioAPagado = true;
    } else if (contrato.montoPagado > 0 && contrato.estado === 'registrado') {
      // Pago parcial
      contrato.estado = 'pago_parcial';
      contrato.historialEstados.push({
        estado: 'pago_parcial',
        observacion: 'Pago parcial registrado'
      });
    }
    
    contrato.calcularComisiones();
    await contrato.save();
    
    // Si cambió a pagado, actualizar estadísticas de empleados
    if (cambioAPagado) {
      const Empleado = require('../models/Empleado');
      for (const participante of contrato.participantes) {
        const empleado = await Empleado.findById(participante.empleado);
        if (empleado) {
          empleado.estadisticas.totalComisionesPendientes += participante.comisionCalculada || 0;
          empleado.estadisticas.contratosAsociados += 1;
          await empleado.save();
        }
      }
    }
    
    await contrato.populate('participantes.empleado', 'nombreCompleto codigoInterno');
    
    res.json(contrato);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al registrar pago', error: error.message });
  }
});

// DELETE - Eliminar contrato
router.delete('/:id', async (req, res) => {
  try {
    const contrato = await Contrato.findById(req.params.id);
    
    if (!contrato) {
      return res.status(404).json({ mensaje: 'Contrato no encontrado' });
    }
    
    if (contrato.estado === 'liquidado') {
      return res.status(400).json({ mensaje: 'No se puede eliminar un contrato liquidado' });
    }
    
    // Verificar si tiene comisiones pagadas
    const tienePagadas = contrato.participantes.some(p => p.estadoComision === 'pagada');
    if (tienePagadas) {
      return res.status(400).json({ mensaje: 'No se puede eliminar, tiene comisiones pagadas' });
    }
    
    await Contrato.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Contrato eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar contrato', error: error.message });
  }
});

module.exports = router;
