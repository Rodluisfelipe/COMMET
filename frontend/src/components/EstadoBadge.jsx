import { motion } from 'framer-motion';

export default function EstadoBadge({ estado, tipo = 'contrato', animated = false }) {
  const estilos = {
    contrato: {
      registrado: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        ring: 'ring-gray-200',
        dot: 'bg-gray-500'
      },
      pago_parcial: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        ring: 'ring-yellow-200',
        dot: 'bg-yellow-500',
        pulse: true
      },
      pagado: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        ring: 'ring-green-200',
        dot: 'bg-green-500'
      },
      liquidado: {
        bg: 'bg-indigo-100',
        text: 'text-indigo-700',
        ring: 'ring-indigo-200',
        dot: 'bg-indigo-500'
      },
      cancelado: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        ring: 'ring-red-200',
        dot: 'bg-red-500'
      }
    },
    empleado: {
      activo: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        ring: 'ring-green-200',
        dot: 'bg-green-500'
      },
      inactivo: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        ring: 'ring-red-200',
        dot: 'bg-red-500'
      }
    },
    comision: {
      pendiente: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        ring: 'ring-yellow-200',
        dot: 'bg-yellow-500',
        pulse: true
      },
      pagada: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        ring: 'ring-green-200',
        dot: 'bg-green-500'
      }
    },
    liquidacion: {
      pendiente: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        ring: 'ring-yellow-200',
        dot: 'bg-yellow-500',
        pulse: true
      },
      pagada: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        ring: 'ring-green-200',
        dot: 'bg-green-500'
      },
      anulada: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        ring: 'ring-red-200',
        dot: 'bg-red-500'
      }
    }
  }
  
  const etiquetas = {
    contrato: {
      registrado: 'Registrado',
      pago_parcial: 'Pago Parcial',
      pagado: 'Pagado',
      liquidado: 'Liquidado',
      cancelado: 'Cancelado'
    },
    empleado: {
      activo: 'Activo',
      inactivo: 'Inactivo'
    },
    comision: {
      pendiente: 'Pendiente',
      pagada: 'Pagada'
    },
    liquidacion: {
      pendiente: 'Pendiente',
      pagada: 'Pagada',
      anulada: 'Anulada'
    }
  }
  
  const style = estilos[tipo]?.[estado] || { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-200', dot: 'bg-gray-500' }
  const label = etiquetas[tipo]?.[estado] || estado
  
  const Badge = animated ? motion.span : 'span'
  const animationProps = animated ? {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring', stiffness: 500, damping: 25 }
  } : {}
  
  return (
    <Badge
      {...animationProps}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ring-1 ${style.bg} ${style.text} ${style.ring}`}
    >
      {/* Dot indicator */}
      <span className="relative flex h-2 w-2">
        {style.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.dot} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot}`} />
      </span>
      {label}
    </Badge>
  )
}
