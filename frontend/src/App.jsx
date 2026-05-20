import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Admin (sistema existente, oculto bajo /admin)
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Empleados from './pages/Empleados'
import EmpleadoDetalle from './pages/EmpleadoDetalle'
import Contratos from './pages/Contratos'
import ContratoDetalle from './pages/ContratoDetalle'
import Liquidaciones from './pages/Liquidaciones'
import LiquidacionNueva from './pages/LiquidacionNueva'
import Reportes from './pages/Reportes'
import TiposBonificacion from './pages/TiposComision'
import Empresas from './pages/Empresas'

// Sitio público Licitronix
import PublicLayout from './components/public/PublicLayout'
import Home from './pages/public/Home'
import Tienda from './pages/public/Tienda'
import ProductoDetalle from './pages/public/ProductoDetalle'
import Nosotros from './pages/public/Nosotros'
import Contacto from './pages/public/Contacto'

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/admin/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Sitio público Licitronix SAS */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tienda" element={<Tienda />} />
        <Route path="/producto/:id" element={<ProductoDetalle />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/contacto" element={<Contacto />} />
      </Route>

      {/* Sistema interno (oculto) */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="empleados" element={<Empleados />} />
        <Route path="empleados/:id" element={<EmpleadoDetalle />} />
        <Route path="contratos" element={<Contratos />} />
        <Route path="contratos/:id" element={<ContratoDetalle />} />
        <Route path="liquidaciones" element={<Liquidaciones />} />
        <Route path="liquidaciones/nueva" element={<LiquidacionNueva />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="tipos-comision" element={<TiposBonificacion />} />
        <Route path="empresas" element={<Empresas />} />
      </Route>

      {/* Redirecciones de compatibilidad (rutas viejas del panel) */}
      <Route path="/login" element={<Navigate to="/admin/login" replace />} />
      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#fff',
              borderRadius: '16px',
              padding: '16px 20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              style: {
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#059669',
              },
            },
            error: {
              style: {
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#dc2626',
              },
            },
            loading: {
              style: {
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              },
            },
          }}
        />
      </AuthProvider>
    </Router>
  )
}

export default App
