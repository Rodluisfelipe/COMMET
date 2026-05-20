export const WHATSAPP_NUMBER = '573008217971'

export function buildWhatsAppUrl(message) {
  const text = encodeURIComponent(message || '')
  return `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${text}` : ''}`
}

export function whatsAppProductMessage(product, opts = {}) {
  if (!product) return 'Hola Licitronix, quiero más información.'
  const { quantity = 1 } = opts
  const lines = [
    'Hola Licitronix, me interesa este producto:',
    '',
    `• Producto: ${product.name}`,
    quantity > 1 ? `• Cantidad: ${quantity}` : null,
    product.sku ? `• SKU: ${product.sku}` : null,
    product.price ? `• Precio publicado: $${Number(product.price).toLocaleString('es-CO')}` : null,
    product.permalink ? `• Enlace: ${product.permalink}` : null,
    '',
    '¿Me podrían confirmar disponibilidad y formas de pago?'
  ].filter(Boolean)
  return lines.join('\n')
}

export function whatsAppContactMessage(form) {
  const lines = [
    '¡Hola Licitronix! Quiero hacer una consulta:',
    '',
    form?.nombre ? `Nombre: ${form.nombre}` : null,
    form?.telefono ? `Teléfono: ${form.telefono}` : null,
    form?.email ? `Email: ${form.email}` : null,
    '',
    form?.mensaje || ''
  ].filter(Boolean)
  return lines.join('\n')
}

export function formatCOP(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return null
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n)
}

export function stripHtml(html = '') {
  return String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
