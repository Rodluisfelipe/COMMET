import { useState, cloneElement } from 'react'
import {
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { buildWhatsAppUrl, whatsAppContactMessage } from '../../utils/whatsapp'
import { WhatsAppGlyph } from '../../components/public/Navbar'

export default function Contacto() {
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    mensaje: ''
  })

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const url = buildWhatsAppUrl(whatsAppContactMessage(form))
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="bg-white">
      {/* Header sobrio */}
      <section className="border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-8 sm:pb-12">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-orange-600 mb-2">
            Contacto
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold text-slate-900 leading-[1.1] tracking-tight">
            Cuéntanos qué necesitas.
          </h1>
          <p className="mt-4 text-[16.5px] text-slate-600 leading-relaxed max-w-xl">
            Respondemos en horario hábil. Si tienes apuro o un proyecto grande, escríbenos
            por WhatsApp y te atendemos al instante.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14 grid lg:grid-cols-[1.15fr_1fr] gap-10">
        {/* Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Tu nombre" required>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                autoComplete="name"
                placeholder="Ej. Andrés Gómez"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Celular" required>
                <input
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="3001234567"
                />
              </Field>
              <Field label="Correo" hint="opcional">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  placeholder="tu@empresa.com"
                />
              </Field>
            </div>

            <Field label="Mensaje" required>
              <textarea
                name="mensaje"
                value={form.mensaje}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Productos, cantidades, plazos, ciudad de entrega..."
              />
            </Field>

            <div className="pt-1">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[15px] transition-colors w-full sm:w-auto"
              >
                <WhatsAppGlyph className="w-5 h-5" />
                Enviar por WhatsApp
                <ArrowRightIcon className="w-4 h-4" />
              </button>
              <p className="mt-3 text-[12.5px] text-slate-500">
                Se abrirá WhatsApp con tu mensaje listo. Lo enviamos al
                <span className="text-slate-700 font-medium"> +57 300 821 7971</span>.
              </p>
            </div>
          </form>
        </div>

        {/* Info */}
        <aside className="space-y-2.5">
          <a
            href={buildWhatsAppUrl('Hola Licitronix, llegué desde la página de contacto.')}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <span className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <WhatsAppGlyph className="w-6 h-6" />
            </span>
            <span className="flex-1">
              <span className="block text-[11.5px] font-medium uppercase tracking-[0.18em] text-emerald-100">
                WhatsApp · respuesta rápida
              </span>
              <span className="block text-[16px] font-semibold mt-0.5">+57 300 821 7971</span>
            </span>
          </a>

          <a
            href="mailto:gerencia@licitronix.com"
            className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-colors"
          >
            <span className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <EnvelopeIcon className="w-5 h-5" />
            </span>
            <span>
              <span className="block text-[11.5px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Correo gerencial
              </span>
              <span className="block text-[15.5px] font-semibold text-slate-900 mt-0.5">
                gerencia@licitronix.com
              </span>
            </span>
          </a>

          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60">
            <div className="flex items-start gap-3">
              <ClockIcon className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div className="text-[14px] text-slate-700 leading-relaxed">
                <p className="font-medium text-slate-900">Horario de atención</p>
                <p>Lun – Vie · 8:00 a.m. – 6:00 p.m.</p>
                <p>Sábados · 9:00 a.m. – 1:00 p.m.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 mt-4 pt-4 border-t border-slate-200/70">
              <MapPinIcon className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div className="text-[14px] text-slate-700 leading-relaxed">
                <p className="font-medium text-slate-900">Sede principal</p>
                <p>CL 130 # 5 - 127, Brr. El Salado</p>
                <p>Ibagué, Tolima — Colombia</p>
              </div>
            </div>
          </div>

          <p className="text-[12px] text-slate-500 px-1 pt-2">
            LICITRONIX S.A.S. · NIT 901.906.209-1
          </p>
        </aside>
      </section>
    </div>
  )
}

function Field({ label, hint, required, children }) {
  const baseInput =
    'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 outline-none transition placeholder:text-slate-400 text-[15px]'

  const childWithClass = cloneElement(children, {
    className: `${baseInput} ${children.props.className || ''}`.trim()
  })

  return (
    <label className="block">
      <span className="flex items-baseline justify-between mb-1.5">
        <span className="text-[13.5px] font-medium text-slate-700">
          {label}{required && <span className="text-orange-600 ml-0.5">*</span>}
        </span>
        {hint && <span className="text-[12px] text-slate-400">{hint}</span>}
      </span>
      {childWithClass}
    </label>
  )
}
