import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { buildWhatsAppUrl } from '../../utils/whatsapp'

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/tienda', label: 'Tienda' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' }
]

function Wordmark({ size = 'md' }) {
  const big = size === 'lg'
  return (
    <Link to="/" className="flex items-baseline gap-1 group">
      <span className={`${big ? 'text-2xl' : 'text-[19px]'} font-semibold tracking-tight text-slate-900`}>
        Licitr<span className="text-orange-600">o</span>nix
      </span>
      <span className={`${big ? 'text-[11px]' : 'text-[9px]'} font-medium text-slate-400 uppercase tracking-[0.18em] pb-0.5`}>
        SAS
      </span>
    </Link>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [query, setQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  // Cierra al cambiar de ruta
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Bloquea scroll cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Cambio de estilo en scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    navigate(`/tienda?buscar=${encodeURIComponent(q)}`)
    setQuery('')
  }

  return (
    <>
      {/* Top bar discreta — solo desktop */}
      <div className="hidden md:block bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-8 h-9 flex items-center justify-between text-[12px] text-slate-500">
          <span>Distribuidores de tecnología · Ibagué, Tolima</span>
          <div className="flex items-center gap-5">
            <a href="mailto:gerencia@licitronix.com" className="hover:text-slate-800 transition-colors">
              gerencia@licitronix.com
            </a>
            <a
              href={buildWhatsAppUrl('Hola Licitronix.')}
              target="_blank" rel="noopener noreferrer"
              className="hover:text-emerald-700 transition-colors"
            >
              +57 300 821 7971
            </a>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <header
        className={`sticky top-0 z-40 bg-white transition-shadow ${
          scrolled ? 'shadow-[0_1px_0_0_rgba(0,0,0,0.06)]' : 'border-b border-slate-100'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[60px] sm:h-16 flex items-center gap-5">
          <Wordmark />

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-6">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-[14px] font-medium transition-colors ${
                    isActive
                      ? 'text-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Search — desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xs ml-auto items-center bg-slate-100 hover:bg-slate-100/80 rounded-full px-4 h-9 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:shadow-sm transition-all"
          >
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              type="search"
              placeholder="Buscar"
              className="bg-transparent flex-1 outline-none text-[13.5px] placeholder:text-slate-400"
            />
          </form>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-1 ml-auto">
            <Link
              to="/tienda"
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700"
              aria-label="Buscar"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700"
              aria-label="Abrir menú"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — lateral derecho, pantalla completa */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 md:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.3 }}
              className="fixed inset-y-0 right-0 w-[88%] max-w-sm bg-white z-50 md:hidden flex flex-col"
            >
              {/* Header del drawer */}
              <div className="flex items-center justify-between px-5 h-[60px] border-b border-slate-100">
                <Wordmark />
                <button
                  onClick={() => setOpen(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
                  aria-label="Cerrar menú"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Buscador mobile */}
              <form
                onSubmit={handleSearch}
                className="m-5 mb-3 flex items-center bg-slate-100 rounded-full px-4 h-12"
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 mr-2.5 shrink-0" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  type="search"
                  placeholder="Buscar productos…"
                  className="bg-transparent flex-1 outline-none text-[15px] placeholder:text-slate-400"
                  autoFocus={false}
                />
              </form>

              {/* Links */}
              <nav className="px-3 flex-1 overflow-y-auto">
                {navLinks.map((link, i) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3.5 rounded-xl text-[17px] font-medium ${
                        isActive
                          ? 'text-slate-900 bg-slate-50'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`
                    }
                  >
                    {link.label}
                    <span className="text-slate-300 text-xl leading-none">›</span>
                  </NavLink>
                ))}

                <div className="mt-6 px-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 mb-3">
                    Contacto directo
                  </p>
                  <a
                    href={buildWhatsAppUrl('Hola Licitronix, vengo desde la web.')}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 py-2.5 text-[15px] text-slate-700"
                  >
                    <span className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <WhatsAppGlyph className="w-5 h-5" />
                    </span>
                    +57 300 821 7971
                  </a>
                  <a
                    href="mailto:gerencia@licitronix.com"
                    className="flex items-center gap-3 py-2.5 text-[14px] text-slate-600"
                  >
                    <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-semibold">
                      @
                    </span>
                    gerencia@licitronix.com
                  </a>
                </div>
              </nav>

              {/* CTA inferior */}
              <div className="p-5 border-t border-slate-100" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
                <a
                  href={buildWhatsAppUrl('Hola Licitronix, quisiera hacer una consulta.')}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[15px] transition-colors"
                >
                  <WhatsAppGlyph className="w-5 h-5" />
                  Escribir por WhatsApp
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export function WhatsAppGlyph({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.06 21.785h-.005a9.87 9.87 0 0 1-5.031-1.378l-.36-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05.213C5.495.213.16 5.547.157 12.107a11.86 11.86 0 0 0 1.587 5.945L.057 24l6.066-1.59a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.481-8.413z" />
    </svg>
  )
}
