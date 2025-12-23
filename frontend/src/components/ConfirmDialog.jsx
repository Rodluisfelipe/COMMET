import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const iconVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: { type: 'spring', stiffness: 200, damping: 15 }
  },
  exit: { scale: 0, rotate: 180 }
};

const TIPOS = {
  danger: {
    icon: TrashIcon,
    bgIcon: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonBg: 'bg-red-600 hover:bg-red-700',
    ring: 'ring-red-500/20'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgIcon: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
    ring: 'ring-yellow-500/20'
  },
  success: {
    icon: CheckCircleIcon,
    bgIcon: 'bg-green-100',
    iconColor: 'text-green-600',
    buttonBg: 'bg-green-600 hover:bg-green-700',
    ring: 'ring-green-500/20'
  }
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  tipo = 'danger',
  loading = false
}) {
  const config = TIPOS[tipo] || TIPOS.danger;
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop con blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden ring-1 ${config.ring}`}
          >
            {/* Efecto de brillo superior */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            
            <div className="p-6">
              {/* Icono animado */}
              <motion.div
                variants={iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`w-16 h-16 mx-auto rounded-full ${config.bgIcon} flex items-center justify-center mb-4`}
              >
                <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
              </motion.div>
              
              {/* Título */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-bold text-gray-900 text-center mb-2"
              >
                {title}
              </motion.h3>
              
              {/* Mensaje */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-gray-600 text-center"
              >
                {message}
              </motion.p>
              
              {/* Botones */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3 mt-6"
              >
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 px-4 py-3 text-white font-medium rounded-xl ${config.buttonBg} transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Procesando...
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
