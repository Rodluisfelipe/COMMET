import { Link } from 'react-router-dom'
import {
  MapPinIcon,
  EnvelopeIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { buildWhatsAppUrl } from '../../utils/whatsapp'
import { WhatsAppGlyph } from '../../components/public/Navbar'

const principios = [
  {
    title: 'Producto original, siempre',
    body: 'Trabajamos con distribuidores autorizados. Sin réplicas, sin atajos. Si lo vendemos, responde.'
  },
  {
    title: 'Asesoría que sí asesora',
    body: 'No te empujamos lo más caro. Te explicamos qué necesitas y por qué, hasta que estés tranquilo con la decisión.'
  },
  {
    title: 'Tiempos que se cumplen',
    body: 'Cotizamos en horas, no en días. Y cuando decimos que un equipo llega tal día, llega tal día.'
  }
]

export default function Nosotros() {
  return (
    <div className="bg-white">
      {/* Hero discreto */}
      <section className="border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-10 sm:pb-14">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-orange-600 mb-3">
            Nosotros
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold text-slate-900 leading-[1.1] tracking-tight">
            Somos una empresa colombiana<br className="hidden sm:block" /> de tecnología seria.
          </h1>
          <p className="mt-5 text-[17px] text-slate-600 leading-relaxed max-w-2xl">
            Desde Ibagué atendemos a empresas, instituciones públicas y profesionales en
            todo el país. No somos un marketplace gigante: somos un equipo pequeño que
            responde rápido, factura bien y entrega cuando dice.
          </p>
        </div>
      </section>

      {/* Historia */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-start">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-orange-600 mb-2">
              Cómo trabajamos
            </p>
            <h2 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight">
              No tenemos un manual de marca con frases bonitas.
            </h2>
            <p className="mt-5 text-[15.5px] text-slate-700 leading-relaxed">
              Lo que sí tenemos son tres maneras de hacer las cosas que nunca negociamos.
              Si alguna vez sentís que no las cumplimos, escribís y respondemos.
            </p>

            <div className="mt-8 space-y-6">
              {principios.map((p, i) => (
                <div key={p.title} className="flex gap-4">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[12px] font-medium mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-slate-900">{p.title}</h3>
                    <p className="mt-1 text-[14.5px] text-slate-600 leading-relaxed">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta lateral compacta */}
          <aside className="lg:w-[260px] shrink-0">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 mb-3">
                Datos legales
              </p>
              <dl className="space-y-2 text-[13.5px]">
                <Row label="Razón social" value="LICITRONIX S.A.S." />
                <Row label="NIT" value="901.906.209-1" />
                <Row label="Domicilio" value="Ibagué, Tolima" />
                <Row label="Dirección" value="CL 130 # 5 - 127" />
                <Row label="Barrio" value="El Salado" />
              </dl>
              <a
                href="mailto:gerencia@licitronix.com"
                className="mt-4 flex items-center gap-2 text-[13.5px] text-slate-700 hover:text-orange-700"
              >
                <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                gerencia@licitronix.com
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* Lo que ofrecemos */}
      <section className="border-t border-slate-100 bg-slate-50/40">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-orange-600 mb-2">
            En qué te ayudamos
          </p>
          <h2 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight">
            Compra directa, compra corporativa, licitaciones.
          </h2>
          <ul className="mt-7 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-[15px] text-slate-700">
            {[
              'Equipos de cómputo, periféricos y accesorios',
              'Soluciones móviles y comunicaciones',
              'Venta a personas naturales con factura electrónica',
              'Órdenes corporativas y contratos estatales',
              'Cotizaciones formales con tiempos de entrega',
              'Asesoría técnica antes de comprar'
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckIcon className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA contacto */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="grid sm:grid-cols-2 gap-3">
          <a
            href={buildWhatsAppUrl('Hola Licitronix, llegué desde la sección Nosotros.')}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <span className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <WhatsAppGlyph className="w-6 h-6" />
            </span>
            <span>
              <span className="block text-[12px] font-medium uppercase tracking-[0.18em] text-emerald-100">
                WhatsApp
              </span>
              <span className="block text-[16px] font-semibold mt-0.5">+57 300 821 7971</span>
            </span>
          </a>
          <Link
            to="/contacto"
            className="flex items-center gap-4 p-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
          >
            <span className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <MapPinIcon className="w-5 h-5" />
            </span>
            <span>
              <span className="block text-[12px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Más formas de contacto
              </span>
              <span className="block text-[16px] font-semibold text-slate-900 mt-0.5">
                Ir a contacto →
              </span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 leading-snug">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  )
}
