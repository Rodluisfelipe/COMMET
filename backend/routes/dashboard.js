const express = require('express');
const router = express.Router();
const Contrato = require('../models/Contrato');
const Empleado = require('../models/Empleado');
const Liquidacion = require('../models/Liquidacion');

// GET - Dashboard general
router.get('/', async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    let filtroFecha = {};
    
    if (fechaDesde || fechaHasta) {
      filtroFecha.fecha = {};
      if (fechaDesde) filtroFecha.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) filtroFecha.fecha.$lte = new Date(fechaHasta);
    }
    
    // Conteo de empleados
    const totalEmpleados = await Empleado.countDocuments({ estado: 'activo' });
    
    // Estadísticas de contratos
    const contratos = await Contrato.find(filtroFecha);
    
    const estadisticasContratos = {
      total: contratos.length,
      registrados: contratos.filter(c => c.estado === 'registrado').length,
      pagoParcial: contratos.filter(c => c.estado === 'pago_parcial').length,
      pagados: contratos.filter(c => c.estado === 'pagado').length,
      liquidados: contratos.filter(c => c.estado === 'liquidado').length,
      cancelados: contratos.filter(c => c.estado === 'cancelado').length
    };
    
    // Montos
    const montoTotalContratos = contratos.reduce((acc, c) => acc + c.montoTotal, 0);
    const montoPagadoContratos = contratos.reduce((acc, c) => acc + c.montoPagado, 0);
    
    // Comisiones
    let totalComisionesGeneradas = 0;
    let totalComisionesPendientes = 0;
    let totalComisionesPagadas = 0;
    
    contratos.forEach(c => {
      if (c.estado === 'pagado' || c.estado === 'liquidado') {
        c.participantes.forEach(p => {
          totalComisionesGeneradas += p.comisionCalculada || 0;
          if (p.estadoComision === 'pagada') {
            totalComisionesPagadas += p.comisionCalculada || 0;
          } else {
            totalComisionesPendientes += p.comisionCalculada || 0;
          }
        });
      }
    });
    
    // Utilidad neta
    const utilidadNeta = montoPagadoContratos - totalComisionesPagadas;
    
    // Liquidaciones del período
    let filtroLiquidaciones = {};
    if (fechaDesde || fechaHasta) {
      filtroLiquidaciones['pago.fecha'] = {};
      if (fechaDesde) filtroLiquidaciones['pago.fecha'].$gte = new Date(fechaDesde);
      if (fechaHasta) filtroLiquidaciones['pago.fecha'].$lte = new Date(fechaHasta);
    }
    
    const liquidaciones = await Liquidacion.find(filtroLiquidaciones);
    const totalLiquidaciones = liquidaciones.length;
    
    // Últimos contratos
    const ultimosContratos = await Contrato.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('codigo cliente.nombre montoTotal estado createdAt');
    
    // Comisiones pendientes por empleado (top 5)
    const empleadosConPendientes = await Empleado.find({
      'estadisticas.totalComisionesPendientes': { $gt: 0 }
    })
      .sort({ 'estadisticas.totalComisionesPendientes': -1 })
      .limit(5)
      .select('nombreCompleto codigoInterno estadisticas.totalComisionesPendientes');
    
    res.json({
      resumen: {
        totalEmpleados,
        estadisticasContratos,
        montoTotalContratos,
        montoPagadoContratos,
        totalComisionesGeneradas,
        totalComisionesPendientes,
        totalComisionesPagadas,
        utilidadNeta,
        totalLiquidaciones
      },
      ultimosContratos,
      empleadosConPendientes
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener dashboard', error: error.message });
  }
});

// GET - Reporte consolidado por empleado
router.get('/consolidado/empleados', async (req, res) => {
  try {
    const empleados = await Empleado.find({ estado: 'activo' });
    
    const consolidado = await Promise.all(empleados.map(async (emp) => {
      const contratos = await Contrato.find({
        'participantes.empleado': emp._id
      });
      
      let totalGenerado = 0;
      let totalPagado = 0;
      let totalPendiente = 0;
      let contratosActivos = 0;
      
      contratos.forEach(c => {
        const participante = c.participantes.find(
          p => p.empleado.toString() === emp._id.toString()
        );
        
        if (participante) {
          contratosActivos++;
          if (c.estado === 'pagado' || c.estado === 'liquidado') {
            totalGenerado += participante.comisionCalculada || 0;
            if (participante.estadoComision === 'pagada') {
              totalPagado += participante.comisionCalculada || 0;
            } else {
              totalPendiente += participante.comisionCalculada || 0;
            }
          }
        }
      });
      
      return {
        empleado: {
          _id: emp._id,
          nombreCompleto: emp.nombreCompleto,
          codigoInterno: emp.codigoInterno,
          cargo: emp.cargo
        },
        contratosActivos,
        totalGenerado,
        totalPagado,
        totalPendiente
      };
    }));
    
    res.json(consolidado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener consolidado', error: error.message });
  }
});

// GET - Reporte consolidado por contrato
router.get('/consolidado/contratos', async (req, res) => {
  try {
    const { estado, tipo } = req.query;
    let filtro = {};
    
    if (estado) filtro.estado = estado;
    if (tipo) filtro.tipo = tipo;
    
    const contratos = await Contrato.find(filtro)
      .populate('participantes.empleado', 'nombreCompleto codigoInterno')
      .sort({ createdAt: -1 });
    
    const consolidado = contratos.map(c => ({
      contrato: {
        _id: c._id,
        codigo: c.codigo,
        tipo: c.tipo,
        cliente: c.cliente.nombre,
        fecha: c.fecha,
        estado: c.estado
      },
      montoTotal: c.montoTotal,
      montoPagado: c.montoPagado,
      totalComisiones: c.totalComisiones,
      margenNeto: c.margenNeto,
      porcentajeMargen: c.montoPagado > 0 
        ? ((c.margenNeto / c.montoPagado) * 100).toFixed(2)
        : 0,
      participantes: c.participantes.map(p => ({
        empleado: p.empleado?.nombreCompleto || 'N/A',
        comision: p.comisionCalculada,
        estado: p.estadoComision
      }))
    }));
    
    res.json(consolidado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener consolidado', error: error.message });
  }
});

// GET - Reporte de historial de liquidaciones
router.get('/historial/liquidaciones', async (req, res) => {
  try {
    const { empleado, fechaDesde, fechaHasta } = req.query;
    let filtro = { estado: 'pagada' };
    
    if (empleado) filtro.empleado = empleado;
    if (fechaDesde || fechaHasta) {
      filtro['pago.fecha'] = {};
      if (fechaDesde) filtro['pago.fecha'].$gte = new Date(fechaDesde);
      if (fechaHasta) filtro['pago.fecha'].$lte = new Date(fechaHasta);
    }
    
    const liquidaciones = await Liquidacion.find(filtro)
      .populate('empleado', 'nombreCompleto codigoInterno')
      .sort({ 'pago.fecha': -1 });
    
    const resumen = {
      totalLiquidaciones: liquidaciones.length,
      totalPagado: liquidaciones.reduce((acc, l) => acc + l.totalComision, 0),
      detalle: liquidaciones.map(l => ({
        codigo: l.codigo,
        empleado: l.empleado?.nombreCompleto || 'N/A',
        fecha: l.pago.fecha,
        metodo: l.pago.metodo,
        total: l.totalComision,
        cantidadContratos: l.contratos.length
      }))
    };
    
    res.json(resumen);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener historial', error: error.message });
  }
});

// POST - Recalcular estadísticas de todos los empleados
router.post('/recalcular-estadisticas', async (req, res) => {
  try {
    // Resetear todas las estadísticas de empleados
    await Empleado.updateMany({}, {
      $set: {
        'estadisticas.totalComisionesPendientes': 0,
        'estadisticas.totalComisionesPagadas': 0,
        'estadisticas.contratosAsociados': 0
      }
    });
    
    // Obtener todos los contratos en estado pagado (no liquidado)
    const contratosPagados = await Contrato.find({ estado: 'pagado' });
    
    // Acumular comisiones pendientes por empleado
    const comisionesPorEmpleado = {};
    const contratosPorEmpleado = {};
    
    for (const contrato of contratosPagados) {
      for (const participante of contrato.participantes) {
        const empId = participante.empleado.toString();
        if (!comisionesPorEmpleado[empId]) {
          comisionesPorEmpleado[empId] = 0;
          contratosPorEmpleado[empId] = 0;
        }
        comisionesPorEmpleado[empId] += participante.comisionCalculada || 0;
        contratosPorEmpleado[empId] += 1;
      }
    }
    
    // Obtener liquidaciones pagadas para calcular comisiones pagadas
    const liquidacionesPagadas = await Liquidacion.find({ estado: 'pagada' });
    const comisionesPagadasPorEmpleado = {};
    
    for (const liq of liquidacionesPagadas) {
      const empId = liq.empleado.toString();
      if (!comisionesPagadasPorEmpleado[empId]) {
        comisionesPagadasPorEmpleado[empId] = 0;
      }
      comisionesPagadasPorEmpleado[empId] += liq.totalComision || 0;
    }
    
    // Actualizar cada empleado
    const empleados = await Empleado.find({});
    let actualizados = 0;
    
    for (const empleado of empleados) {
      const empId = empleado._id.toString();
      empleado.estadisticas.totalComisionesPendientes = comisionesPorEmpleado[empId] || 0;
      empleado.estadisticas.totalComisionesPagadas = comisionesPagadasPorEmpleado[empId] || 0;
      empleado.estadisticas.contratosAsociados = contratosPorEmpleado[empId] || 0;
      await empleado.save();
      actualizados++;
    }
    
    res.json({
      mensaje: 'Estadísticas recalculadas correctamente',
      empleadosActualizados: actualizados,
      contratosPagados: contratosPagados.length,
      liquidacionesPagadas: liquidacionesPagadas.length
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al recalcular estadísticas', error: error.message });
  }
});

module.exports = router;
