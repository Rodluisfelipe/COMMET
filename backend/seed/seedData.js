const mongoose = require('mongoose');
require('dotenv').config();

const Usuario = require('../models/Usuario');
const Empleado = require('../models/Empleado');
const Contrato = require('../models/Contrato');
const TipoComision = require('../models/TipoComision');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Limpiar datos existentes
    await Usuario.deleteMany({});
    await Empleado.deleteMany({});
    await Contrato.deleteMany({});
    await TipoComision.deleteMany({});
    
    // Crear usuario admin
    await Usuario.create({
      nombre: 'Administrador',
      email: 'admin@commetp.com',
      password: 'admin123',
      rol: 'admin'
    });
    console.log('✅ Usuario admin creado: admin@commetp.com / admin123');
    
    // Crear tipos de comisión predefinidos
    await TipoComision.create([
      {
        nombre: 'Comisión por Presentación',
        descripcion: 'Comisión básica por presentar el cliente o proyecto',
        tipo: 'porcentaje',
        valor: 0.5,
        aplicaA: ['venta_directa', 'contrato', 'proyecto'],
        color: '#3b82f6',
        orden: 1
      },
      {
        nombre: 'Comisión Venta Directa',
        descripcion: 'Comisión estándar por cierre de venta',
        tipo: 'porcentaje',
        valor: 3,
        aplicaA: ['venta_directa'],
        color: '#22c55e',
        orden: 2
      },
      {
        nombre: 'Comisión por Proyecto',
        descripcion: 'Comisión completa por gestión de proyecto',
        tipo: 'porcentaje',
        valor: 1,
        aplicaA: ['proyecto', 'contrato'],
        color: '#f97316',
        orden: 3
      },
      {
        nombre: 'Bono Fijo por Cierre',
        descripcion: 'Monto fijo por cerrar cualquier negocio',
        tipo: 'fijo',
        valor: 100000,
        aplicaA: ['venta_directa', 'contrato', 'proyecto'],
        color: '#8b5cf6',
        orden: 4
      },
      {
        nombre: 'Comisión Premium',
        descripcion: 'Comisión especial para clientes corporativos',
        tipo: 'porcentaje',
        valor: 5,
        aplicaA: ['proyecto'],
        color: '#1e40af',
        orden: 5
      }
    ]);
    console.log('✅ Tipos de comisión predefinidos creados');
    
    // Crear empleados de ejemplo
    const empleados = await Empleado.create([
      {
        nombreCompleto: 'Juan Carlos Pérez',
        identificacion: '1234567890',
        cargo: 'Vendedor Senior',
        email: 'juan.perez@commetp.com',
        telefono: '3001234567',
        comisionBase: { tipo: 'porcentaje', valor: 5 }
      },
      {
        nombreCompleto: 'María García López',
        identificacion: '0987654321',
        cargo: 'Ejecutiva Comercial',
        email: 'maria.garcia@commetp.com',
        telefono: '3009876543',
        comisionBase: { tipo: 'porcentaje', valor: 4 }
      },
      {
        nombreCompleto: 'Carlos Rodríguez',
        identificacion: '5555555555',
        cargo: 'Asesor de Proyectos',
        email: 'carlos.rodriguez@commetp.com',
        telefono: '3005555555',
        comisionBase: { tipo: 'fijo', valor: 500000 }
      }
    ]);
    console.log('✅ Empleados de ejemplo creados');
    
    // Crear contratos de ejemplo
    const contrato1 = new Contrato({
      tipo: 'contrato',
      cliente: {
        nombre: 'Empresa ABC S.A.S',
        identificacion: '900123456-7',
        telefono: '6012345678',
        email: 'contacto@empresaabc.com'
      },
      descripcion: 'Proyecto de implementación de software',
      montoTotal: 50000000,
      estado: 'pagado',
      montoPagado: 50000000,
      participantes: [
        {
          empleado: empleados[0]._id,
          comision: { tipo: 'porcentaje', valor: 5, usaComisionBase: true }
        },
        {
          empleado: empleados[1]._id,
          comision: { tipo: 'porcentaje', valor: 3, usaComisionBase: false }
        }
      ]
    });
    contrato1.calcularComisiones();
    contrato1.historialEstados.push({ estado: 'registrado', observacion: 'Contrato creado' });
    contrato1.historialEstados.push({ estado: 'pago_parcial', observacion: 'Primer pago recibido' });
    contrato1.historialEstados.push({ estado: 'pagado', observacion: 'Pago completado' });
    await contrato1.save();
    
    const contrato2 = new Contrato({
      tipo: 'venta_directa',
      cliente: {
        nombre: 'Comercializadora XYZ',
        identificacion: '800987654-1',
        telefono: '6019876543',
        email: 'ventas@xyz.com'
      },
      descripcion: 'Venta de equipos de cómputo',
      montoTotal: 15000000,
      estado: 'pago_parcial',
      participantes: [
        {
          empleado: empleados[2]._id,
          comision: { tipo: 'fijo', valor: 500000, usaComisionBase: true }
        }
      ]
    });
    contrato2.calcularComisiones();
    contrato2.historialEstados.push({ estado: 'registrado', observacion: 'Contrato creado' });
    contrato2.historialEstados.push({ estado: 'pago_parcial', observacion: 'Pago parcial recibido' });
    await contrato2.save();
    
    const contrato3 = new Contrato({
      tipo: 'proyecto',
      cliente: {
        nombre: 'Gobierno Municipal',
        identificacion: '899999999-0',
        telefono: '6011111111',
        email: 'licitaciones@municipio.gov'
      },
      descripcion: 'Proyecto de modernización tecnológica',
      montoTotal: 120000000,
      estado: 'registrado',
      participantes: [
        {
          empleado: empleados[0]._id,
          comision: { tipo: 'porcentaje', valor: 3, usaComisionBase: false }
        },
        {
          empleado: empleados[1]._id,
          comision: { tipo: 'porcentaje', valor: 2, usaComisionBase: false }
        },
        {
          empleado: empleados[2]._id,
          comision: { tipo: 'fijo', valor: 1000000, usaComisionBase: false }
        }
      ]
    });
    contrato3.calcularComisiones();
    contrato3.historialEstados.push({ estado: 'registrado', observacion: 'Contrato creado' });
    await contrato3.save();
    
    console.log('✅ Contratos de ejemplo creados');
    
    console.log('\n🚀 Seed completado exitosamente!');
    console.log('\n📌 Credenciales de acceso:');
    console.log('   Email: admin@commetp.com');
    console.log('   Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seedData();
