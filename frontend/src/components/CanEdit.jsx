import { useAuth } from '../context/AuthContext'

// Componente que solo renderiza su contenido si el usuario puede editar (superadmin)
export function CanEdit({ children, fallback = null }) {
  const { canEdit } = useAuth()
  
  if (!canEdit) {
    return fallback
  }
  
  return children
}

// Componente que muestra un mensaje cuando el usuario es visor
export function ViewerBadge() {
  const { isVisor } = useAuth()
  
  if (!isVisor) return null
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-amber-600 text-sm">👁️</span>
        <span className="text-sm text-amber-700 font-medium">
          Modo Solo Lectura
        </span>
        <span className="text-xs text-amber-600">
          - No puedes crear, editar o eliminar registros
        </span>
      </div>
    </div>
  )
}

export default CanEdit
