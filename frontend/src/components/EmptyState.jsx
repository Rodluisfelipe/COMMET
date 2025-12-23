import { motion } from 'framer-motion';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
  actionLabel,
  iconColor = 'text-gray-300'
}) {
  // Soportar tanto action como onAction
  const handleClick = action || onAction;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {/* Icono animado */}
      <motion.div
        initial={{ y: -10 }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mb-6"
      >
        {/* Círculo de fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-2xl opacity-50 scale-150" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <Icon className={`w-12 h-12 ${iconColor}`} />
        </div>
      </motion.div>
      
      {/* Título */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-xl font-bold text-gray-700 text-center mb-2"
      >
        {title}
      </motion.h3>
      
      {/* Descripción */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-gray-500 text-center max-w-sm mb-6"
      >
        {description}
      </motion.p>
      
      {/* Acción */}
      {handleClick && actionLabel && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
