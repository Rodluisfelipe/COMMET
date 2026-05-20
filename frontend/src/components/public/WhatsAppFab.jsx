import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { buildWhatsAppUrl } from '../../utils/whatsapp'
import { WhatsAppGlyph } from './Navbar'

export default function WhatsAppFab() {
  const [visible, setVisible] = useState(false)
  const location = useLocation()

  // En detalle de producto hay barra sticky inferior en mobile → escondemos el FAB ahí
  const isProductDetail = location.pathname.startsWith('/producto/')

  // Aparece después del primer scroll — no satura la primera vista
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 240)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          href={buildWhatsAppUrl('Hola Licitronix, llegué desde la web.')}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir por WhatsApp"
          className={`group fixed right-4 sm:right-6 z-30 inline-flex items-center gap-2.5 h-12 sm:h-13 pl-3 pr-3 sm:pr-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-colors ${isProductDetail ? 'hidden sm:inline-flex' : ''}`}
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)'
          }}
        >
          <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <WhatsAppGlyph className="w-5 h-5" />
          </span>
          <span className="hidden sm:inline text-[14px] font-medium pr-1">
            ¿Hablamos?
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  )
}
