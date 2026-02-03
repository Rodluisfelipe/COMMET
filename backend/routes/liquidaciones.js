const express = require('express');
const router = express.Router();
const Liquidacion = require('../models/Liquidacion');
const Contrato = require('../models/Contrato');
const Empleado = require('../models/Empleado');
const PDFDocument = require('pdfkit');

// GET - Obtener todas las liquidaciones
router.get('/', async (req, res) => {
  try {
    const { empleado, fechaDesde, fechaHasta, estado } = req.query;
    let filtro = {};
    
    if (empleado) filtro.empleado = empleado;
    if (estado) filtro.estado = estado;
    if (fechaDesde || fechaHasta) {
      filtro['pago.fecha'] = {};
      if (fechaDesde) filtro['pago.fecha'].$gte = new Date(fechaDesde);
      if (fechaHasta) filtro['pago.fecha'].$lte = new Date(fechaHasta);
    }
    
    const liquidaciones = await Liquidacion.find(filtro)
      .populate('empleado', 'nombreCompleto codigoInterno identificacion')
      .sort({ createdAt: -1 });
    
    res.json(liquidaciones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener liquidaciones', error: error.message });
  }
});

// GET - Obtener resumen para liquidar (comisiones pendientes por empleado)
// Ahora cada comisión se lista individualmente (un empleado puede tener varias comisiones por contrato)
// Incluye comisiones con pagos parciales (saldo pendiente > 0)
router.get('/pendientes', async (req, res) => {
  try {
    // Buscar contratos pagados con comisiones pendientes o parciales
    const contratos = await Contrato.find({
      estado: { $in: ['pagado'] },
      'participantes.estadoComision': { $in: ['pendiente', 'parcial'] }
    })
      .populate('participantes.empleado', 'nombreCompleto codigoInterno')
      .populate('empresa', 'nombre');
    
    // Agrupar por empleado
    const resumenPorEmpleado = {};
    
    contratos.forEach(contrato => {
      contrato.participantes.forEach(p => {
        // Incluir pendientes y parciales (con saldo > 0)
        if ((p.estadoComision === 'pendiente' || p.estadoComision === 'parcial') && p.empleado) {
          const empId = p.empleado._id.toString();
          
          // Calcular saldo pendiente
          const comisionTotal = p.comisionCalculada || 0;
          const comisionPagada = p.comisionPagada || 0;
          const saldoPendiente = comisionTotal - comisionPagada;
          
          // Solo incluir si hay saldo pendiente
          if (saldoPendiente <= 0) return;
          
          if (!resumenPorEmpleado[empId]) {
            resumenPorEmpleado[empId] = {
              empleado: p.empleado,
              comisiones: [],
              totalPendiente: 0
            };
          }
          
          // Cada comisión es una entrada individual
          resumenPorEmpleado[empId].comisiones.push({
            contratoId: contrato._id,
            participanteId: p._id,
            codigo: contrato.codigo,
            cliente: contrato.cliente.nombre,
            empresa: contrato.empresa?.nombre || 'Sin empresa',
            montoContrato: contrato.montoTotal,
            // Comisión total calculada
            comisionTotal: comisionTotal,
            // Monto ya pagado previamente
            comisionPagada: comisionPagada,
            // Saldo pendiente (lo que falta por pagar)
            saldoPendiente: saldoPendiente,
            // Para compatibilidad, 'comision' ahora es el saldo pendiente
            comision: saldoPendiente,
            tipoComision: p.comision.tipo,
            valorComision: p.comision.valor,
            tipoComisionNombre: p.tipoComisionNombre || 'Comisión Base',
            estadoComision: p.estadoComision,
            // Historial de pagos previos
            historialPagos: p.historialPagos || []
          });
          
          resumenPorEmpleado[empId].totalPendiente += saldoPendiente;
        }
      });
    });
    
    res.json(Object.values(resumenPorEmpleado));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener pendientes', error: error.message });
  }
});

// GET - Obtener una liquidación por ID
router.get('/:id', async (req, res) => {
  try {
    const liquidacion = await Liquidacion.findById(req.params.id)
      .populate('empleado', 'nombreCompleto codigoInterno identificacion cargo');
    
    if (!liquidacion) {
      return res.status(404).json({ mensaje: 'Liquidación no encontrada' });
    }
    res.json(liquidacion);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener liquidación', error: error.message });
  }
});

// POST - Crear liquidación (pagar comisiones - soporta pagos parciales)
router.post('/', async (req, res) => {
  try {
    const { empleadoId, contratosIds, pago } = req.body;
    
    // Validar que el empleado existe
    const empleado = await Empleado.findById(empleadoId);
    if (!empleado) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }
    
    // Obtener los contratos y validar
    const contratosParaLiquidar = [];
    let totalComision = 0;
    
    for (const item of contratosIds) {
      const contrato = await Contrato.findById(item.contratoId);
      
      if (!contrato) continue;
      if (contrato.estado !== 'pagado') {
        return res.status(400).json({ 
          mensaje: `El contrato ${contrato.codigo} no está pagado` 
        });
      }
      
      const participante = contrato.participantes.id(item.participanteId);
      
      if (!participante || participante.estadoComision === 'pagada') {
        continue;
      }
      
      // Calcular saldo pendiente
      const comisionTotal = participante.comisionCalculada || 0;
      const comisionYaPagada = participante.comisionPagada || 0;
      const saldoPendiente = comisionTotal - comisionYaPagada;
      
      if (saldoPendiente <= 0) continue;
      
      // Determinar monto a pagar (puede ser parcial o completo)
      // Si viene 'montoPagar' en el item, usarlo; sino pagar todo el saldo
      let montoPagar = item.montoPagar !== undefined ? item.montoPagar : saldoPendiente;
      
      // Validar que no se pague más del saldo pendiente
      if (montoPagar > saldoPendiente) {
        montoPagar = saldoPendiente;
      }
      
      // Validar que el monto sea positivo
      if (montoPagar <= 0) continue;
      
      const esParcial = montoPagar < saldoPendiente;
      
      // Obtener historial de pagos previos (antes de este pago)
      // Buscar códigos de liquidación para pagos que no los tienen
      const historialPrevio = [];
      for (const hp of (participante.historialPagos || [])) {
        let codigoLiq = hp.liquidacionCodigo || null;
        // Si no tiene código pero tiene ID, buscarlo
        if (!codigoLiq && hp.liquidacionId) {
          const liqPrevia = await Liquidacion.findById(hp.liquidacionId).select('codigo');
          if (liqPrevia) {
            codigoLiq = liqPrevia.codigo;
          }
        }
        historialPrevio.push({
          monto: hp.monto,
          fecha: hp.fecha,
          liquidacionCodigo: codigoLiq
        });
      }
      
      contratosParaLiquidar.push({
        contrato: contrato._id,
        participanteId: participante._id,
        codigoContrato: contrato.codigo,
        cliente: contrato.cliente.nombre,
        montoContrato: contrato.montoTotal,
        comisionTotal: comisionTotal,
        comisionPagada: montoPagar,
        comisionPagadaAntes: comisionYaPagada,
        saldoPendienteDespues: saldoPendiente - montoPagar,
        esParcial: esParcial,
        tipoComision: participante.comision.tipo,
        valorComision: participante.comision.valor,
        tipoComisionNombre: participante.tipoComisionNombre || 'Bonificación Base',
        historialPagosPrevios: historialPrevio
      });
      
      totalComision += montoPagar;
      
      // Actualizar el participante en el contrato
      participante.comisionPagada = comisionYaPagada + montoPagar;
      participante.comisionPendiente = comisionTotal - participante.comisionPagada;
      
      // Agregar al historial de pagos del participante
      if (!participante.historialPagos) {
        participante.historialPagos = [];
      }
      participante.historialPagos.push({
        monto: montoPagar,
        fecha: new Date()
        // liquidacionId se actualizará después de crear la liquidación
      });
      
      // Determinar el nuevo estado de la comisión
      if (participante.comisionPendiente <= 0) {
        participante.estadoComision = 'pagada';
        participante.fechaPago = new Date();
      } else {
        participante.estadoComision = 'parcial';
      }
      
      // Verificar si todos los participantes están completamente pagados
      const todosPagados = contrato.participantes.every(p => p.estadoComision === 'pagada');
      if (todosPagados) {
        contrato.estado = 'liquidado';
        contrato.historialEstados.push({
          estado: 'liquidado',
          observacion: 'Todas las bonificaciones liquidadas'
        });
      }
      
      await contrato.save();
    }
    
    if (contratosParaLiquidar.length === 0) {
      return res.status(400).json({ mensaje: 'No hay bonificaciones pendientes para liquidar' });
    }
    
    // Crear la liquidación
    const liquidacion = new Liquidacion({
      empleado: empleadoId,
      contratos: contratosParaLiquidar,
      totalComision,
      pago: {
        fecha: pago.fecha || new Date(),
        metodo: pago.metodo,
        referencia: pago.referencia,
        comprobante: pago.comprobante,
        observacion: pago.observacion
      }
    });
    
    await liquidacion.save();
    
    // Actualizar historial de pagos con el ID de la liquidación
    for (const item of contratosParaLiquidar) {
      const contrato = await Contrato.findById(item.contrato);
      if (contrato) {
        const participante = contrato.participantes.id(item.participanteId);
        if (participante && participante.historialPagos && participante.historialPagos.length > 0) {
          // Actualizar el último pago con el ID y código de liquidación
          const ultimoPago = participante.historialPagos[participante.historialPagos.length - 1];
          ultimoPago.liquidacionId = liquidacion._id;
          ultimoPago.liquidacionCodigo = liquidacion.codigo;
          participante.liquidacionId = liquidacion._id;
          await contrato.save();
        }
      }
    }
    
    // Actualizar estadísticas del empleado
    empleado.estadisticas.totalComisionesPagadas += totalComision;
    empleado.estadisticas.totalComisionesPendientes -= totalComision;
    await empleado.save();
    
    await liquidacion.populate('empleado', 'nombreCompleto codigoInterno identificacion');
    
    res.status(201).json(liquidacion);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear bonificación', error: error.message });
  }
});

// GET - Generar comprobante PDF
router.get('/:id/comprobante', async (req, res) => {
  try {
    const liquidacion = await Liquidacion.findById(req.params.id)
      .populate('empleado', 'nombreCompleto codigoInterno identificacion cargo');
    
    if (!liquidacion) {
      return res.status(404).json({ mensaje: 'Liquidación no encontrada' });
    }
    
    // Obtener la empresa del primer contrato de la liquidación
    const Contrato = require('../models/Contrato');
    const Empresa = require('../models/Empresa');
    let empresa = null;
    
    if (liquidacion.contratos && liquidacion.contratos.length > 0) {
      const primerContrato = await Contrato.findOne({ codigo: liquidacion.contratos[0].codigoContrato })
        .populate('empresa');
      if (primerContrato && primerContrato.empresa) {
        empresa = primerContrato.empresa;
      }
    }
    
    // Buscar códigos de liquidación para pagos previos que no los tienen
    for (const c of liquidacion.contratos) {
      if (c.historialPagosPrevios && c.historialPagosPrevios.length > 0) {
        for (const hp of c.historialPagosPrevios) {
          if (!hp.liquidacionCodigo && hp.liquidacionId) {
            // Buscar el código de la liquidación
            const liqPrevia = await Liquidacion.findById(hp.liquidacionId).select('codigo');
            if (liqPrevia) {
              hp.liquidacionCodigo = liqPrevia.codigo;
            }
          }
        }
      }
    }
    
    // Función para descargar imagen desde URL
    const downloadImage = (url) => {
      return new Promise((resolve, reject) => {
        if (!url || typeof url !== 'string') {
          reject(new Error('URL inválida'));
          return;
        }
        
        const https = require('https');
        const http = require('http');
        const protocol = url.startsWith('https') ? https : http;
        
        const options = {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        };
        
        const request = protocol.get(url, options, (response) => {
          // Seguir redirecciones
          if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              downloadImage(redirectUrl).then(resolve).catch(reject);
              return;
            }
          }
          
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}`));
            return;
          }
          
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            const buffer = Buffer.concat(chunks);
            if (buffer.length > 0) {
              resolve(buffer);
            } else {
              reject(new Error('Imagen vacía'));
            }
          });
          response.on('error', reject);
        });
        
        request.on('error', reject);
        request.setTimeout(5000, () => {
          request.destroy();
          reject(new Error('Timeout'));
        });
      });
    };
    
    // Verificar si hay pagos parciales para ajustar altura
    const hayPagosParciales = liquidacion.contratos.some(c => c.esParcial || (c.comisionTotal && c.comisionTotal !== c.comisionPagada));
    
    // Calcular altura dinámica del documento
    const hasObservacion = liquidacion.pago.observacion ? 60 : 0;
    
    // Alturas de cada sección
    const headerHeight = 110;           // Logo y datos empresa
    const tituloHeight = 60;            // Título comprobante
    const infoLiqHeight = 60;           // Código y fecha
    const beneficiarioHeight = 75;      // Datos beneficiario
    const detalleHeaderHeight = 60;     // Título detalle + encabezado tabla
    
    // Calcular altura de filas considerando pagos previos
    let totalFilasHeight = 0;
    liquidacion.contratos.forEach(c => {
      const tienePagosPrevios = c.historialPagosPrevios && c.historialPagosPrevios.length > 0;
      const rowHeight = hayPagosParciales ? (tienePagosPrevios ? 44 + (c.historialPagosPrevios.length * 10) : 36) : 28;
      totalFilasHeight += rowHeight;
    });
    
    const totalHeight = 50;             // Caja de total
    const pagoHeight = 80 + hasObservacion; // Info pago
    const firmasHeight = 100;           // Zona de firmas
    const footerHeight = 50;            // Pie de página (nota legal)
    const margins = 50;                 // Márgenes
    
    const calculatedHeight = headerHeight + tituloHeight + infoLiqHeight + 
                            beneficiarioHeight + detalleHeaderHeight + 
                            totalFilasHeight + totalHeight + 
                            pagoHeight + firmasHeight + footerHeight + margins;
    
    // Usar tamaño carta (792) si cabe, o el tamaño calculado si es mayor
    const pageHeight = Math.max(calculatedHeight, 500);
    
    // Crear PDF con tamaño personalizado (sin espacio extra innecesario)
    const doc = new PDFDocument({ 
      margin: 40,
      size: [612, pageHeight] // Ancho carta, alto ajustado al contenido
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=comprobante-${liquidacion.codigo}.pdf`);
    
    doc.pipe(res);
    
    const pageWidth = doc.page.width - 80;
    const leftMargin = 40;
    const rightMargin = doc.page.width - 40;
    
    // ============ ENCABEZADO BLANCO CON LOGO ============
    // Fondo blanco (ya es el default)
    
    // Datos de la empresa
    const nombreEmpresa = empresa ? empresa.nombre.toUpperCase() : 'TECNO REWARDS';
    const nitEmpresa = empresa ? empresa.nit : '';
    const direccionEmpresa = empresa?.direccion || '';
    const telefonoEmpresa = empresa?.telefono || '';
    const emailEmpresa = empresa?.email || '';
    
    // Intentar cargar el logo
    let logoBuffer = null;
    if (empresa && empresa.logo) {
      console.log('Intentando cargar logo desde:', empresa.logo);
      try {
        logoBuffer = await downloadImage(empresa.logo);
        console.log('Logo descargado, tamaño:', logoBuffer.length, 'bytes');
        
        // Convertir a PNG si es necesario (WebP, etc.)
        const sharp = require('sharp');
        try {
          logoBuffer = await sharp(logoBuffer)
            .png()
            .toBuffer();
          console.log('Logo convertido a PNG, nuevo tamaño:', logoBuffer.length, 'bytes');
        } catch (conversionError) {
          console.log('Imagen ya es compatible o error de conversión:', conversionError.message);
        }
      } catch (e) {
        console.log('Error descargando logo:', e.message);
        logoBuffer = null;
      }
    }
    
    // Dibujar logo en la esquina izquierda si existe
    let logoEndX = leftMargin;
    if (logoBuffer && logoBuffer.length > 100) {
      try {
        doc.image(logoBuffer, leftMargin, 25, { 
          width: 70,
          height: 70,
          fit: [70, 70]
        });
        logoEndX = leftMargin + 85;
        console.log('Logo insertado correctamente');
      } catch (e) {
        console.log('Error insertando logo en PDF:', e.message);
        logoEndX = leftMargin;
      }
    }
    
    // Nombre y datos de la empresa (al lado del logo o desde el inicio)
    doc.fillColor('#000000')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text(nombreEmpresa, logoEndX, 25, { width: rightMargin - logoEndX - 10 });
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#000000');
    
    let headerInfoY = 52;
    if (nitEmpresa) {
      doc.text(`NIT: ${nitEmpresa}`, logoEndX, headerInfoY);
      headerInfoY += 12;
    }
    if (direccionEmpresa) {
      doc.text(direccionEmpresa, logoEndX, headerInfoY);
      headerInfoY += 12;
    }
    if (telefonoEmpresa || emailEmpresa) {
      const contacto = [telefonoEmpresa, emailEmpresa].filter(Boolean).join(' | ');
      doc.text(contacto, logoEndX, headerInfoY);
    }
    
    // Línea separadora del encabezado
    doc.moveTo(leftMargin, 105).lineTo(rightMargin, 105).lineWidth(2).stroke('#000000');
    
    // ============ TÍTULO DEL COMPROBANTE ============
    const currentY = 115;
    
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('COMPROBANTE DE BONIFICACIÓN', leftMargin, currentY + 15, { align: 'center' });
    
    // Línea decorativa inferior
    doc.moveTo(leftMargin, currentY + 45).lineTo(leftMargin + pageWidth, currentY + 45).lineWidth(1).stroke('#000000');
    
    // ============ INFORMACIÓN DE LA LIQUIDACIÓN ============
    const infoY = currentY + 60;
    
    // Caja de información
    doc.rect(leftMargin, infoY, pageWidth, 50).lineWidth(1).stroke('#000000');
    
    // Dividir en dos columnas
    const midPoint = leftMargin + pageWidth / 2;
    doc.moveTo(midPoint, infoY).lineTo(midPoint, infoY + 50).stroke('#000000');
    
    // Columna izquierda
    doc.fontSize(9).font('Helvetica').fillColor('#000000')
       .text('CÓDIGO', leftMargin + 15, infoY + 10);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
       .text(liquidacion.codigo, leftMargin + 15, infoY + 25);
    
    // Columna derecha
    doc.fontSize(9).font('Helvetica').fillColor('#000000')
       .text('FECHA DE EMISIÓN', midPoint + 15, infoY + 10);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
       .text(new Date(liquidacion.pago.fecha).toLocaleDateString('es-CO', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       }), midPoint + 15, infoY + 25);
    
    // ============ DATOS DEL BENEFICIARIO ============
    const beneficiarioY = infoY + 70;
    
    // Título de sección con fondo
    doc.rect(leftMargin, beneficiarioY, pageWidth, 25).fill('#e0e0e0');
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
       .text('DATOS DEL BENEFICIARIO', leftMargin + 15, beneficiarioY + 7);
    
    // Contenido del beneficiario
    const beneficiarioContentY = beneficiarioY + 35;
    
    // Grid de 3 columnas
    const colWidth = pageWidth / 3;
    
    // Nombre completo
    doc.fontSize(8).font('Helvetica').fillColor('#000000')
       .text('NOMBRE COMPLETO', leftMargin, beneficiarioContentY);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
       .text(liquidacion.empleado.nombreCompleto.toUpperCase(), leftMargin, beneficiarioContentY + 12);
    
    // Identificación
    doc.fontSize(8).font('Helvetica').fillColor('#000000')
       .text('IDENTIFICACIÓN', leftMargin + colWidth, beneficiarioContentY);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
       .text(liquidacion.empleado.identificacion || 'N/A', leftMargin + colWidth, beneficiarioContentY + 12);
    
    // Código empleado
    doc.fontSize(8).font('Helvetica').fillColor('#000000')
       .text('CÓDIGO EMPLEADO', leftMargin + colWidth * 2, beneficiarioContentY);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
       .text(liquidacion.empleado.codigoInterno, leftMargin + colWidth * 2, beneficiarioContentY + 12);
    
    // Línea separadora
    doc.moveTo(leftMargin, beneficiarioContentY + 35).lineTo(leftMargin + pageWidth, beneficiarioContentY + 35).lineWidth(0.5).stroke('#000000');
    
    // ============ DETALLE DE BONIFICACIONES ============
    const detalleY = beneficiarioContentY + 50;
    
    // Título de sección
    doc.rect(leftMargin, detalleY, pageWidth, 25).fill('#e0e0e0');
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
       .text('DETALLE DE BONIFICACIONES', leftMargin + 15, detalleY + 7);
    
    // Encabezados de la tabla
    const tableHeaderY = detalleY + 35;
    doc.rect(leftMargin, tableHeaderY, pageWidth, 20).fill('#000000');
    
    // Columnas ajustadas - si hay pagos parciales, mostrar más columnas
    const col1 = leftMargin + 5;      // N°
    const col2 = leftMargin + 25;     // Contrato
    const col3 = leftMargin + 95;     // Cliente
    
    let col4, col5, col6, col7;
    if (hayPagosParciales) {
      col4 = leftMargin + 195;    // Tipo Comisión
      col5 = leftMargin + 285;    // Total Comisión
      col6 = leftMargin + 365;    // Pagado
      col7 = leftMargin + 445;    // Pendiente
    } else {
      col4 = leftMargin + 220;    // Tipo Comisión
      col5 = leftMargin + 330;    // Monto
      col6 = leftMargin + 430;    // Comisión
    }
    
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('N°', col1, tableHeaderY + 6);
    doc.text('CONTRATO', col2, tableHeaderY + 6);
    doc.text('CLIENTE', col3, tableHeaderY + 6);
    doc.text('TIPO', col4, tableHeaderY + 6);
    
    if (hayPagosParciales) {
      doc.text('TOTAL', col5, tableHeaderY + 6);
      doc.text('PAGADO', col6, tableHeaderY + 6);
      doc.text('PENDIENTE', col7, tableHeaderY + 6);
    } else {
      doc.text('MONTO', col5, tableHeaderY + 6);
      doc.text('BONIF.', col6, tableHeaderY + 6);
    }
    
    // Filas de la tabla
    let tableY = tableHeaderY + 20;
    liquidacion.contratos.forEach((c, index) => {
      const isEven = index % 2 === 0;
      const tienePagosPrevios = c.historialPagosPrevios && c.historialPagosPrevios.length > 0;
      // Altura extra si tiene pagos previos (agregamos 8px adicionales para separación)
      const rowHeight = hayPagosParciales ? (tienePagosPrevios ? 44 + (c.historialPagosPrevios.length * 10) : 36) : 28;
      doc.rect(leftMargin, tableY, pageWidth, rowHeight).fill(isEven ? '#ffffff' : '#f5f5f5');
      
      doc.fontSize(9).font('Helvetica').fillColor('#000000');
      doc.text(`${index + 1}`, col1, tableY + 9);
      doc.font('Helvetica-Bold').text(c.codigoContrato, col2, tableY + 9, { width: 65 });
      
      // Cliente con texto completo
      doc.font('Helvetica').text(c.cliente, col3, tableY + 5, { 
        width: hayPagosParciales ? 95 : 120, 
        height: 22,
        ellipsis: true
      });
      
      // Tipo de comisión
      doc.text(c.tipoComisionNombre || 'Bonificación', col4, tableY + 9, { width: hayPagosParciales ? 85 : 100 });
      
      if (hayPagosParciales) {
        // Mostrar desglose: Total Comisión | Pagado en esta liquidación | Saldo Pendiente después
        const comisionTotal = c.comisionTotal || c.comisionPagada;
        const pagadoEnEstaLiq = c.comisionPagada;
        const saldoDespues = c.saldoPendienteDespues !== undefined ? c.saldoPendienteDespues : (c.esParcial ? (comisionTotal - pagadoEnEstaLiq) : 0);
        
        // Total de la comisión
        doc.font('Helvetica').fillColor('#000000')
           .text(`$ ${comisionTotal.toLocaleString('es-CO')}`, col5, tableY + 9, { width: 75 });
        
        // Pagado en esta liquidación
        doc.font('Helvetica-Bold').fillColor('#000000')
           .text(`$ ${pagadoEnEstaLiq.toLocaleString('es-CO')}`, col6, tableY + 9, { width: 75 });
        
        // Saldo pendiente después de este pago
        if (c.esParcial && saldoDespues > 0) {
          doc.font('Helvetica').fillColor('#000000')
             .text(`$ ${saldoDespues.toLocaleString('es-CO')}`, col7, tableY + 9, { width: 75 });
          // Indicador de pago parcial
          doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000')
             .text('(PARCIAL)', col6, tableY + 22);
        } else {
          doc.font('Helvetica').fillColor('#000000')
             .text('$ 0', col7, tableY + 9, { width: 75 });
        }
        
        // Mostrar historial de pagos previos si existen
        if (tienePagosPrevios) {
          let histY = tableY + 32;
          doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000')
             .text('Pagos anteriores:', col2, histY);
          histY += 10;
          c.historialPagosPrevios.forEach((hp) => {
            const fechaPago = new Date(hp.fecha).toLocaleDateString('es-CO');
            const codigoLiq = hp.liquidacionCodigo || 'N/A';
            doc.fontSize(7).font('Helvetica').fillColor('#000000')
               .text(`• ${fechaPago} - Doc: ${codigoLiq} - $ ${hp.monto.toLocaleString('es-CO')}`, col2 + 5, histY, { width: 300 });
            histY += 10;
          });
        }
      } else {
        doc.fillColor('#000000')
           .text(`$ ${c.montoContrato.toLocaleString('es-CO')}`, col5, tableY + 9, { width: 90 });
        doc.font('Helvetica-Bold').text(`$ ${c.comisionPagada.toLocaleString('es-CO')}`, col6, tableY + 9, { width: 90 });
      }
      
      tableY += rowHeight;
    });
    
    // Línea de cierre de tabla
    doc.moveTo(leftMargin, tableY).lineTo(leftMargin + pageWidth, tableY).lineWidth(1).stroke('#000000');
    
    // ============ TOTAL ============
    const totalY = tableY + 10;
    doc.rect(leftMargin + pageWidth - 180, totalY, 180, 35).fill('#000000');
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff')
       .text('TOTAL BONIFICADO:', leftMargin + pageWidth - 170, totalY + 5);
    doc.fontSize(16).font('Helvetica-Bold')
       .text(`$ ${liquidacion.totalComision.toLocaleString('es-CO')}`, leftMargin + pageWidth - 170, totalY + 17);
    
    // ============ INFORMACIÓN DEL PAGO ============
    const pagoY = totalY + 55;
    
    doc.rect(leftMargin, pagoY, pageWidth, 25).fill('#e0e0e0');
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
       .text('INFORMACIÓN DEL PAGO', leftMargin + 15, pagoY + 7);
    
    const pagoContentY = pagoY + 35;
    
    // Método de pago
    doc.fontSize(8).font('Helvetica').fillColor('#000000')
       .text('MÉTODO DE PAGO', leftMargin, pagoContentY);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
       .text(liquidacion.pago.metodo.toUpperCase(), leftMargin, pagoContentY + 12);
    
    // Referencia
    if (liquidacion.pago.referencia) {
      doc.fontSize(8).font('Helvetica').fillColor('#000000')
         .text('REFERENCIA / COMPROBANTE', leftMargin + colWidth, pagoContentY);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
         .text(liquidacion.pago.referencia, leftMargin + colWidth, pagoContentY + 12);
    }
    
    // Observación
    if (liquidacion.pago.observacion) {
      const obsY = pagoContentY + 40;
      doc.fontSize(8).font('Helvetica').fillColor('#000000')
         .text('OBSERVACIONES', leftMargin, obsY);
      doc.fontSize(10).font('Helvetica').fillColor('#000000')
         .text(liquidacion.pago.observacion, leftMargin, obsY + 12, { width: pageWidth });
    }
    
    // ============ FIRMAS ============
    // Calcular posición de firmas basada en el contenido (no fija al fondo)
    let firmasY;
    if (liquidacion.pago.observacion) {
      firmasY = pagoContentY + 80;
    } else {
      firmasY = pagoContentY + 45;
    }
    
    // Línea decorativa
    doc.moveTo(leftMargin, firmasY).lineTo(leftMargin + pageWidth, firmasY).lineWidth(0.5).stroke('#000000');
    
    firmasY += 25;
    
    // Firma del empleado
    doc.moveTo(leftMargin + 50, firmasY + 25).lineTo(leftMargin + 200, firmasY + 25).lineWidth(1).stroke('#000000');
    doc.fontSize(9).font('Helvetica').fillColor('#000000')
       .text('Firma del Beneficiario', leftMargin + 80, firmasY + 30);
    doc.fontSize(8).font('Helvetica').fillColor('#000000')
       .text(liquidacion.empleado.nombreCompleto, leftMargin + 50, firmasY + 42, { width: 160, align: 'center' });
    
    // Firma autorizada
    doc.moveTo(leftMargin + pageWidth - 200, firmasY + 25).lineTo(leftMargin + pageWidth - 50, firmasY + 25).lineWidth(1).stroke('#000000');
    doc.fontSize(9).font('Helvetica').fillColor('#000000')
       .text('Firma Autorizada', leftMargin + pageWidth - 170, firmasY + 30);
    doc.fontSize(8).font('Helvetica').fillColor('#000000')
       .text(nombreEmpresa, leftMargin + pageWidth - 200, firmasY + 42, { width: 160, align: 'center' });
    
    // ============ PIE DE PÁGINA (NOTA LEGAL) ============
    // Posicionar justo después de las firmas
    const footerY = firmasY + 60;
    
    // Línea separadora antes del footer
    doc.moveTo(leftMargin, footerY).lineTo(leftMargin + pageWidth, footerY).lineWidth(0.5).stroke('#000000');
    
    // Nota legal
    doc.fontSize(7).font('Helvetica').fillColor('#000000')
       .text('Nota Legal: Acepto que este pago es un acto de mera liberalidad del empleador y, según el Art. 128 del Código Sustantivo del Trabajo, NO constituye salario para ningún efecto legal (ni para prestaciones sociales, ni para seguridad social).', leftMargin, footerY + 8, { width: pageWidth, align: 'justify' });
    
    // Fecha y hora de generación
    doc.fontSize(6).fillColor('#000000')
       .text(`Generado el ${new Date().toLocaleDateString('es-CO')} a las ${new Date().toLocaleTimeString('es-CO')}`, leftMargin, footerY + 28, { width: pageWidth, align: 'center' });
    
    doc.end();
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al generar comprobante', error: error.message });
  }
});

// POST - Anular liquidación (soporta pagos parciales)
router.post('/:id/anular', async (req, res) => {
  try {
    const { motivo } = req.body;
    
    if (!motivo) {
      return res.status(400).json({ mensaje: 'El motivo es obligatorio para anular' });
    }
    
    const liquidacion = await Liquidacion.findById(req.params.id);
    
    if (!liquidacion) {
      return res.status(404).json({ mensaje: 'Liquidación no encontrada' });
    }
    
    if (liquidacion.estado === 'anulada') {
      return res.status(400).json({ mensaje: 'La liquidación ya está anulada' });
    }
    
    // Revertir estado de comisiones en contratos
    for (const contratoInfo of liquidacion.contratos) {
      const contrato = await Contrato.findById(contratoInfo.contrato);
      if (contrato) {
        // Usar participanteId si está disponible (nuevas liquidaciones)
        let participante;
        if (contratoInfo.participanteId) {
          participante = contrato.participantes.id(contratoInfo.participanteId);
        } else {
          // Fallback para liquidaciones antiguas sin participanteId
          participante = contrato.participantes.find(
            p => p.empleado.toString() === liquidacion.empleado.toString()
          );
        }
        
        if (participante) {
          // Restar el monto pagado en esta liquidación
          const montoPagadoEnEstaLiq = contratoInfo.comisionPagada || 0;
          participante.comisionPagada = Math.max(0, (participante.comisionPagada || 0) - montoPagadoEnEstaLiq);
          participante.comisionPendiente = (participante.comisionCalculada || 0) - participante.comisionPagada;
          
          // Determinar nuevo estado
          if (participante.comisionPagada <= 0) {
            participante.estadoComision = 'pendiente';
            participante.fechaPago = null;
          } else {
            participante.estadoComision = 'parcial';
          }
          
          // Eliminar este pago del historial
          if (participante.historialPagos && participante.historialPagos.length > 0) {
            participante.historialPagos = participante.historialPagos.filter(
              hp => hp.liquidacionId?.toString() !== liquidacion._id.toString()
            );
          }
          
          participante.liquidacionId = null;
        }
        
        // Revertir estado del contrato si estaba liquidado
        if (contrato.estado === 'liquidado') {
          contrato.estado = 'pagado';
          contrato.historialEstados.push({
            estado: 'pagado',
            observacion: `Revertido por anulación de liquidación ${liquidacion.codigo}`
          });
        }
        
        await contrato.save();
      }
    }
    
    // Actualizar estadísticas del empleado
    const empleado = await Empleado.findById(liquidacion.empleado);
    if (empleado) {
      empleado.estadisticas.totalComisionesPagadas -= liquidacion.totalComision;
      empleado.estadisticas.totalComisionesPendientes += liquidacion.totalComision;
      await empleado.save();
    }
    
    // Anular la liquidación
    liquidacion.estado = 'anulada';
    liquidacion.anulacion = {
      fecha: new Date(),
      motivo
    };
    
    await liquidacion.save();
    
    res.json({ mensaje: 'Liquidación anulada correctamente', liquidacion });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al anular liquidación', error: error.message });
  }
});

module.exports = router;
