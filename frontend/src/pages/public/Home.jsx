import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  CheckIcon,
  TruckIcon,
  ShieldCheckIcon,
  ReceiptPercentIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import { storeApi } from '../../services/store'
import { buildWhatsAppUrl } from '../../utils/whatsapp'
import ProductCard from '../../components/public/ProductCard'
import { WhatsAppGlyph } from '../../components/public/Navbar'

const beneficios = [
  { icon: ShieldCheckIcon, title: 'Garantía respaldada', sub: 'Con soporte directo', tone: 'emerald' },
  { icon: TruckIcon, title: 'Envío nacional', sub: 'A toda Colombia', tone: 'sky' },
  { icon: ReceiptPercentIcon, title: 'Factura electrónica', sub: 'DIAN al día', tone: 'violet' },
  { icon: WrenchScrewdriverIcon, title: 'Asesoría real', sub: 'Hablas con personas', tone: 'amber' }
]

const TONES = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-100' },
  sky:     { bg: 'bg-sky-50',     text: 'text-sky-700',     icon: 'bg-sky-100 text-sky-700',         ring: 'ring-sky-100' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  icon: 'bg-violet-100 text-violet-700',   ring: 'ring-violet-100' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-800',   icon: 'bg-amber-100 text-amber-800',     ring: 'ring-amber-100' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    icon: 'bg-rose-100 text-rose-700',       ring: 'ring-rose-100' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  icon: 'bg-orange-100 text-orange-700',   ring: 'ring-orange-100' },
  teal:    { bg: 'bg-teal-50',    text: 'text-teal-700',    icon: 'bg-teal-100 text-teal-700',       ring: 'ring-teal-100' }
}

const CAT_PALETTE = ['orange', 'sky', 'violet', 'amber', 'emerald', 'rose', 'teal']

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [recent, setRecent] = useState([])
  const [onSale, setOnSale] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([
      storeApi.listFeatured(8).catch(() => []),
      storeApi.listProducts({ per_page: 8, orderby: 'date', order: 'desc' }).catch(() => []),
      storeApi.listProducts({ per_page: 4, on_sale: true }).catch(() => []),
      storeApi.listCategories().catch(() => [])
    ]).then(([f, r, s, c]) => {
      if (!alive) return
      const fArr = Array.isArray(f) ? f : []
      const rArr = Array.isArray(r) ? r : []
      setFeatured(fArr.length ? fArr : rArr)
      setRecent(rArr)
      setOnSale(Array.isArray(s) ? s : [])
      setCategories(Array.isArray(c) ? c : [])
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  return (
    <div className="bg-white">
      {/* HERO — sin tarjeta lateral, fondo cálido suave */}
      <section className="relative overflow-hidden border-b border-slate-100">
        {/* Manchas de color decorativas, muy suaves */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-orange-100/60 blur-3xl" />
          <div className="absolute top-10 right-0 w-[360px] h-[360px] rounded-full bg-sky-100/60 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-[260px] h-[260px] rounded-full bg-amber-100/40 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-14 sm:pb-20">
          <p className="text-[13px] font-medium text-orange-600 mb-3">
            Hola, somos Licitronix.
          </p>
          <h1 className="text-[36px] sm:text-5xl lg:text-[60px] leading-[1.04] tracking-tight font-semibold text-slate-900 max-w-[16ch]">
            Tecnología confiable, <span className="text-orange-600">sin vueltas.</span>
          </h1>
          <p className="mt-5 text-[17px] text-slate-600 leading-relaxed max-w-xl">
            Distribuimos equipos originales para empresas, instituciones y personas
            que necesitan que las cosas <em>simplemente funcionen</em>. Te asesoramos,
            cotizamos y enviamos a todo el país.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/tienda"
              className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[15px] font-medium transition-colors"
            >
              Ver el catálogo
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <a
              href={buildWhatsAppUrl('Hola Licitronix, vengo de la web. Quisiera más información.')}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-white hover:bg-emerald-50 text-slate-900 text-[15px] font-medium border border-slate-200 transition-colors"
            >
              <WhatsAppGlyph className="w-5 h-5 text-emerald-600" />
              Hablemos por WhatsApp
            </a>
          </div>

          {/* Mini-pills coloreadas (productos originales, etc.) */}
          <ul className="mt-7 flex flex-wrap gap-2">
            {[
              { label: 'Productos originales', dot: 'bg-emerald-500' },
              { label: 'Envíos a todo el país', dot: 'bg-sky-500' },
              { label: 'Factura electrónica', dot: 'bg-violet-500' },
              { label: 'Atendemos desde Ibagué', dot: 'bg-orange-500' }
            ].map(p => (
              <li
                key={p.label}
                className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-white/70 backdrop-blur border border-slate-200/70 text-[13px] text-slate-700"
              >
                <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                {p.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TIRA DE BENEFICIOS — 4 colores diferentes */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {beneficios.map(b => {
            const t = TONES[b.tone]
            return (
              <div
                key={b.title}
                className={`p-4 sm:p-5 rounded-2xl ${t.bg} ring-1 ${t.ring}`}
              >
                <div className={`w-10 h-10 rounded-xl ${t.icon} flex items-center justify-center`}>
                  <b.icon className="w-5 h-5" />
                </div>
                <p className={`mt-3 text-[14.5px] font-semibold ${t.text}`}>{b.title}</p>
                <p className="text-[12.5px] text-slate-600">{b.sub}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20">
        <SectionHeader
          kicker="Esta semana"
          title="Lo que más se está moviendo"
          to="/tienda"
          toLabel="Ver todo el catálogo"
        />

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : featured.length === 0 ? (
          <EmptyCatalog />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {featured.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* OFERTAS — banda oscura */}
      {onSale.length > 0 && (
        <section className="mt-14 sm:mt-20 bg-slate-900 text-white py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-start">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-rose-300 mb-3">
                  Ofertas
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">
                  Precios que mueven el inventario.
                </h2>
                <p className="mt-3 text-[14.5px] text-slate-300 max-w-xs">
                  Productos seleccionados con descuento por tiempo limitado.
                </p>
                <Link
                  to="/tienda"
                  className="mt-5 inline-flex items-center gap-2 h-11 px-4 rounded-full bg-white text-slate-900 text-[14px] font-medium hover:bg-slate-100 transition-colors"
                >
                  Ver ofertas
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
              {/* En desktop 4 cards, en mobile 2 */}
              <div className="bg-white rounded-2xl p-4 sm:p-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {onSale.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CATEGORÍAS — paleta rotativa */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20">
          <SectionHeader
            kicker="Por dónde empezar"
            title="Explora por categoría"
            to="/tienda"
            toLabel="Ver todas"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.slice(0, 8).map((cat, idx) => {
              const t = TONES[CAT_PALETTE[idx % CAT_PALETTE.length]]
              return (
                <Link
                  key={cat.id}
                  to={`/tienda?categoria=${cat.id}`}
                  className={`group relative aspect-[5/4] rounded-2xl overflow-hidden ${t.bg} ring-1 ${t.ring} hover:shadow-md transition-shadow`}
                >
                  {cat.image?.src ? (
                    <>
                      <img
                        src={cat.image.src}
                        alt={cat.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-[1.03] transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3.5">
                        <p className="text-white font-medium leading-tight line-clamp-2 text-[15px]">
                          {cat.name}
                        </p>
                        <p className="text-[11px] text-white/85 mt-0.5">{cat.count} productos</p>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 p-4 flex flex-col justify-end">
                      <p className={`text-[15px] font-semibold ${t.text} leading-tight line-clamp-3`}>
                        {cat.name}
                      </p>
                      <p className="text-[11.5px] text-slate-600 mt-0.5">{cat.count} productos</p>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* RECIÉN LLEGADOS — banda azul suave */}
      {recent.length > 0 && (
        <section className="mt-14 sm:mt-20 bg-sky-50/50 py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <SectionHeader
              kicker="Recién llegados"
              title="Nuevo en la tienda"
              to="/tienda?orden=date|desc"
              toLabel="Ver más"
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {recent.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA corporativo */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-7 sm:p-10">
          <div aria-hidden className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-orange-500/30 blur-3xl" />
          <div aria-hidden className="absolute -bottom-16 -left-12 w-64 h-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-orange-300 mb-2">
                Compras corporativas
              </p>
              <h3 className="text-2xl sm:text-3xl font-semibold leading-tight max-w-2xl">
                ¿Una orden de compra grande o una licitación?
              </h3>
              <p className="mt-3 text-slate-300 max-w-2xl leading-relaxed">
                Atendemos pedidos empresariales e institucionales con facturación
                electrónica y cotizaciones formales. Te respondemos hoy mismo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <a
                href={buildWhatsAppUrl('Hola Licitronix, necesito una cotización corporativa.')}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[15px] font-medium transition-colors"
              >
                <WhatsAppGlyph className="w-5 h-5" />
                Solicitar cotización
              </a>
              <Link
                to="/contacto"
                className="inline-flex items-center h-12 px-5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-[15px] font-medium transition-colors"
              >
                Otras formas
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionHeader({ kicker, title, to, toLabel }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5 sm:mb-7">
      <div>
        {kicker && (
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-orange-600 mb-1.5">
            {kicker}
          </p>
        )}
        <h2 className="text-xl sm:text-2xl lg:text-[28px] font-semibold text-slate-900 leading-tight">
          {title}
        </h2>
      </div>
      {to && (
        <Link
          to={to}
          className="shrink-0 text-[13px] sm:text-sm font-medium text-slate-600 hover:text-orange-600 inline-flex items-center gap-1 group"
        >
          <span className="hidden sm:inline">{toLabel}</span>
          <span className="sm:hidden">Ver más</span>
          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  )
}

function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden">
          <div className="aspect-square bg-slate-100 animate-pulse rounded-2xl" />
          <div className="pt-3 space-y-2">
            <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-2/5 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyCatalog() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center bg-slate-50/50">
      <p className="text-slate-600 max-w-md mx-auto">
        Estamos preparando el catálogo. Mientras tanto escríbenos por WhatsApp y
        te enviamos disponibilidad personalizada.
      </p>
      <a
        href={buildWhatsAppUrl('Hola Licitronix, quiero saber qué tienen disponible.')}
        target="_blank" rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-medium transition-colors"
      >
        <WhatsAppGlyph className="w-5 h-5" />
        Escribir por WhatsApp
      </a>
    </div>
  )
}
