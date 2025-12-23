import { motion } from 'framer-motion';
import { GiftIcon } from '@heroicons/react/24/outline';

export default function LoadingSpinner({ size = 'md', className = '', text = '' }) {
  const sizes = {
    sm: { container: 'h-6 w-6', icon: 'w-3 h-3' },
    md: { container: 'h-12 w-12', icon: 'w-6 h-6' },
    lg: { container: 'h-20 w-20', icon: 'w-10 h-10' }
  }
  
  return (
    <div className={`flex flex-col justify-center items-center gap-4 ${className}`}>
      {/* Spinner animado con logo */}
      <div className="relative">
        {/* Círculo exterior giratorio */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className={`${sizes[size].container} rounded-full border-4 border-gray-200 border-t-blue-500 border-r-blue-600`}
        />
        
        {/* Icono central */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <GiftIcon className={`${sizes[size].icon} text-blue-500`} />
        </motion.div>
      </div>
      
      {/* Texto opcional */}
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm font-medium text-gray-500"
        >
          {text}
        </motion.p>
      )}
      
      {/* Dots animados */}
      {size === 'lg' && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
            />
          ))}
        </div>
      )}
    </div>
  )
}
