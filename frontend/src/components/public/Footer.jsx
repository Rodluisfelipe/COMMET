import { Link } from 'react-router-dom'
import { buildWhatsAppUrl } from '../../utils/whatsapp'
import { WhatsAppGlyph } from './Navbar'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-100 bg-slate-50/60 mt-16 sm:mt-20">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-8">
        <div className="grid gap-10 sm:gap-12 sm:grid-cols-2 lg:grid-cols-12">
          {/* Marca + propósito */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-baseline gap-1">
              <span className="text-xl font-semibold tracking-tight text-slate-900">
                Licitr<span className="text-orange-600">o</span>nix
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">SAS</span>
            </Link>
            <p className="mt-3 text-[14.5px] text-slate-600 leading-relaxed max-w-md">
              Distribuidores de tecnología en Colombia. Trabajamos con marcas que
              respondan y clientes que necesitan que las cosas funcionen.
            </p>

            <a
              href={buildWhatsAppUrl('Hola Licitronix.')}
              target="_blank" rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 h-11 px-4 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-[14px] font-medium text-slate-800 transition-colors"
            >
              <WhatsAppGlyph className="w-4 h-4 text-emerald-600" />
              +57 300 821 7971
            </a>
          </div>

          {/* Navegación */}
          <div className="lg:col-span-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 mb-3.5">
              Tienda
            </p>
            <ul className="space-y-2 text-[14px] text-slate-700">
              <li><Link to="/" className="hover:text-orange-700 transition-colors">Inicio</Link></li>
              <li><Link to="/tienda" className="hover:text-orange-700 transition-colors">Catálogo</Link></li>
              <li><Link to="/nosotros" className="hover:text-orange-700 transition-colors">Nosotros</Link></li>
              <li><Link to="/contacto" className="hover:text-orange-700 transition-colors">Contacto</Link></li>
            </ul>
          </div>

          {/* Ubicación */}
          <div className="lg:col-span-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 mb-3.5">
              Encuéntranos
            </p>
            <address className="not-italic text-[14px] text-slate-700 leading-relaxed">
              <a href="mailto:gerencia@licitronix.com" className="hover:text-orange-700 transition-colors block">
                gerencia@licitronix.com
              </a>
              <span className="block mt-2">
                CL 130 # 5 - 127, Brr. El Salado<br />
                Ibagué, Tolima — Colombia
              </span>
            </address>
          </div>
        </div>

        {/* Línea legal */}
        <div className="mt-12 pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-[12px] text-slate-500">
          <p>
            © {year} <span className="font-medium text-slate-700">LICITRONIX S.A.S.</span> · NIT 901.906.209-1 ·
            Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span>Hecho en Ibagué</span>
            {/* Acceso interno — intencionalmente discreto */}
            <Link
              to="/admin/login"
              aria-label="Acceso interno"
              title="Acceso interno"
              className="text-slate-300 hover:text-slate-500 transition-colors select-none text-base leading-none"
            >
              ·
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
