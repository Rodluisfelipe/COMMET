# 🚀 tECNO REWARDS - Sistema de Gestión de Comisiones y Liquidaciones

Sistema completo para el control de comisiones de empleados, gestión de contratos y liquidaciones.

## 📋 Características

### Módulos Principales
- **👥 Empleados**: Registro y gestión de personal con comisiones base
- **📄 Contratos**: Gestión de ventas, contratos y proyectos
- **💰 Liquidaciones**: Pago de comisiones con trazabilidad completa
- **📊 Reportes**: Consolidados por empleado, contrato e historial de pagos

### Regla de Oro
> *Ninguna comisión se paga si el dinero no ha ingresado*

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + Vite + Tailwind CSS
- **Colores**: Azul (#1e40af)  + Blanco

## 📦 Instalación

### Requisitos Previos
- Node.js 18+
- MongoDB (local o Atlas)

### 1. Clonar e instalar Backend

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Editar el archivo `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/commetp
JWT_SECRET=xxxx-xxxxx-xxxxx
NODE_ENV=development
```

### 3. Cargar datos de ejemplo (opcional)

```bash
cd backend
npm run seed
```

### 4. Iniciar Backend

```bash
cd backend
npm run dev
```

### 5. Instalar Frontend

```bash
cd frontend
npm install
```

### 6. Iniciar Frontend

```bash
cd frontend
npm run dev
```

## 🌐 Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

### Credenciales Demo
- **Email**: admin@commetp.com (se reemplazo por google auth)
- **Password**: admin123

## 📁 Estructura del Proyecto

```
COMMET/
├── backend/
│   ├── models/
│   │   ├── Empleado.js
│   │   ├── Contrato.js
│   │   ├── Liquidacion.js
│   │   └── Usuario.js
│   ├── routes/
│   │   ├── empleados.js
│   │   ├── contratos.js
│   │   ├── liquidaciones.js
│   │   ├── dashboard.js
│   │   └── auth.js
│   ├── seed/
│   │   └── seedData.js
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Modal.jsx
    │   │   ├── EstadoBadge.jsx
    │   │   └── LoadingSpinner.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Empleados.jsx
    │   │   ├── EmpleadoDetalle.jsx
    │   │   ├── Contratos.jsx
    │   │   ├── ContratoDetalle.jsx
    │   │   ├── Liquidaciones.jsx
    │   │   ├── LiquidacionNueva.jsx
    │   │   ├── Reportes.jsx
    │   │   └── Login.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── utils/
    │   │   └── formatters.js
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

## 🔄 Flujo Operativo

1. **Crear empleado** → Definir comisión base
2. **Crear contrato** → Registrar venta/proyecto
3. **Asociar empleados** → Asignar participantes con comisiones
4. **Marcar como ganado** → Cierre comercial
5. **Registrar pago cliente** → Cambio a estado "Pagado"
6. **Liquidar comisiones** → Pagar a empleados
7. **Generar comprobante** → PDF descargable
8. **Ver reportes** → Consolidados y análisis

## 📊 Estados de Contratos

| Estado | Descripción | Comisiones |
|--------|-------------|------------|
| Registrado | Recién creado | ❌ Solo estimadas |
| Ganado | Cierre comercial | ❌ Solo estimadas |
| Pendiente Pago | En espera de pago | ❌ Solo estimadas |
| **Pagado** | Cliente pagó | ✅ **Calculadas y liquidables** |
| Liquidado | Comisiones pagadas | ✅ Todas pagadas |
| Cancelado | Anulado | ❌ Sin comisiones |

## 🔐 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/setup` - Crear admin inicial
- `GET /api/auth/verify` - Verificar token

### Empleados
- `GET /api/empleados` - Listar empleados
- `GET /api/empleados/:id` - Obtener empleado
- `GET /api/empleados/:id/comisiones` - Comisiones del empleado
- `POST /api/empleados` - Crear empleado
- `PUT /api/empleados/:id` - Actualizar empleado
- `DELETE /api/empleados/:id` - Eliminar/desactivar

### Contratos
- `GET /api/contratos` - Listar contratos
- `GET /api/contratos/:id` - Obtener contrato
- `POST /api/contratos` - Crear contrato
- `PUT /api/contratos/:id` - Actualizar contrato
- `POST /api/contratos/:id/participantes` - Agregar participante
- `DELETE /api/contratos/:id/participantes/:pid` - Eliminar participante
- `POST /api/contratos/:id/estado` - Cambiar estado
- `POST /api/contratos/:id/pagos` - Registrar pago cliente

### Liquidaciones
- `GET /api/liquidaciones` - Listar liquidaciones
- `GET /api/liquidaciones/pendientes` - Comisiones por liquidar
- `GET /api/liquidaciones/:id` - Obtener liquidación
- `POST /api/liquidaciones` - Crear liquidación
- `GET /api/liquidaciones/:id/comprobante` - Descargar PDF
- `POST /api/liquidaciones/:id/anular` - Anular liquidación

### Dashboard y Reportes
- `GET /api/dashboard` - Resumen general
- `GET /api/dashboard/consolidado/empleados` - Reporte por empleado
- `GET /api/dashboard/consolidado/contratos` - Reporte por contrato
- `GET /api/dashboard/historial/liquidaciones` - Historial de pagos

## 🎨 Diseño UI

- **Color Primario**: Azul (#1e40af - primary-800)
- **Color Acento**: Naranja (#f97316 - accent-500)
- **Fondo**: Blanco y grises claros
- **Tipografía**: Inter (Google Fonts)

## 📝 Licencia

MIT License - © 2025 COMMETP
