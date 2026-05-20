import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  CheckIcon,
  ShieldCheckIcon,
  TruckIcon,
  CreditCardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  ShareIcon,
  StarIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { storeApi } from '../../services/store'
import {
  buildWhatsAppUrl,
  whatsAppProductMessage,
  formatCOP,
  stripHtml
} from '../../utils/whatsapp'
import ProductCard from '../../components/public/ProductCard'
import { WhatsAppGlyph } from '../../components/public/Navbar'

const CATEGORY_TONES = [
  { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-100' },
  { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-100' },
  { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-100' },
  { bg: 'bg-amber-50', text: 'text-amber-800', ring: 'ring-amber-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' },
  { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-100' },
  { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-100' }
]

function categoryTone(id) {
  if (id == null) return CATEGORY_TONES[0]
  return CATEGORY_TONES[Math.abs(Number(id) || 0) % CATEGORY_TONES.length]
}

export default function ProductoDetalle() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [activeImage, setActiveImage] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState('descripcion')
  const [shareState, setShareState] = useState(null) // 'copied' | 'shared'

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(false)
    setActiveImage(0)
    setQuantity(1)
    setTab('descripcion')
    storeApi.getProduct(id)
      .then(p => { if (alive) setProduct(p) })
      .catch(() => { if (alive) setError(true) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  useEffect(() => {
    if (!product?.categories?.[0]?.id) return
    storeApi.listProducts({ category: product.categories[0].id, per_page: 5 })
      .then(p => {
        const list = (Array.isArray(p) ? p : []).filter(x => x.id !== product.id).slice(0, 4)
        setRelated(list)
      })
      .catch(() => setRelated([]))
  }, [product?.id, product?.categories])

  // Datos derivados
  const images = useMemo(() => product?.images?.length ? product.images : [], [product])
  const price = formatCOP(product?.price)
  const regular = formatCOP(product?.regular_price)
  const onSale = product?.on_sale && product?.regular_price && product?.regular_price !== product?.price
  const inStock = product?.stock_status === 'instock'
  const stockQty = typeof product?.stock_quantity === 'number' ? product.stock_quantity : null
  const lowStock = stockQty != null && stockQty > 0 && stockQty <= 5
  const cat = product?.categories?.[0]
  const tone = categoryTone(cat?.id)

  const savingsAmount = useMemo(() => {
    if (!onSale) return null
    const a = Number(product?.regular_price) - Number(product?.price)
    return a > 0 ? a : null
  }, [onSale, product?.price, product?.regular_price])

  const savingsPct = useMemo(() => {
    if (!savingsAmount || !product?.regular_price) return null
    return Math.round((savingsAmount / Number(product.regular_price)) * 100)
  }, [savingsAmount, product?.regular_price])

  const rating = Number(product?.average_rating) || 0
  const ratingCount = Number(product?.rating_count) || 0
  const totalSales = Number(product?.total_sales) || 0

  const handlePrev = useCallback(() => {
    if (!images.length) return
    setActiveImage(i => (i - 1 + images.length) % images.length)
  }, [images.length])

  const handleNext = useCallback(() => {
    if (!images.length) return
    setActiveImage(i => (i + 1) % images.length)
  }, [images.length])

  // Atajos de teclado en lightbox
  useEffect(() => {
    if (!lightbox) return
    const handler = (e) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, handleNext, handlePrev])

  // Bloquear scroll cuando el lightbox está abierto
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const data = {
      title: product?.name || 'Licitronix',
      text: product?.name ? `Mira este producto en Licitronix: ${product.name}` : 'Mira esto en Licitronix',
      url
    }
    try {
      if (navigator.share) {
        await navigator.share(data)
        setShareState('shared')
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        setShareState('copied')
      }
    } catch { /* cancelado */ }
    setTimeout(() => setShareState(null), 2200)
  }

  const incQty = () => setQuantity(q => Math.min(q + 1, stockQty || 99))
  const decQty = () => setQuantity(q => Math.max(q - 1, 1))

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
          <div className="aspect-square rounded-2xl bg-slate-100 animate-pulse" />
          <div className="space-y-4">
            <div className="h-3 w-1/4 bg-slate-100 rounded animate-pulse" />
            <div className="h-10 w-3/4 bg-slate-100 rounded animate-pulse" />
            <div className="h-8 w-1/3 bg-slate-100 rounded animate-pulse" />
            <div className="h-24 w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-12 w-full bg-slate-100 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-3">
          No encontramos este producto
        </h1>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Puede que se haya retirado del catálogo o que el enlace tenga un error.
        </p>
        <Link to="/tienda" className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-slate-900 text-white font-medium">
          <ArrowLeftIcon className="w-4 h-4" />
          Volver a la tienda
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-5 sm:pt-8 pb-12">
      {/* Breadcrumb */}
      <nav className="mb-5 sm:mb-7 text-[13px]">
        <div className="flex items-center gap-2 text-slate-500 overflow-hidden">
          <Link to="/tienda" className="inline-flex items-center gap-1.5 hover:text-orange-700 transition-colors shrink-0">
            <ArrowLeftIcon className="w-4 h-4" />
            Catálogo
          </Link>
          {cat && (
            <>
              <span className="text-slate-300">/</span>
              <Link
                to={`/tienda?categoria=${cat.id}`}
                className="hover:text-orange-700 transition-colors truncate"
              >
                {cat.name}
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px] gap-8 lg:gap-12">
        {/* GALERÍA */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {/* Imagen principal */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 group">
            {images[activeImage] ? (
              <button
                type="button"
                onClick={() => setLightbox(true)}
                className="block w-full h-full cursor-zoom-in"
                aria-label="Ampliar imagen"
              >
                <img
                  src={images[activeImage].src}
                  alt={images[activeImage].alt || product.name}
                  className="w-full h-full object-contain"
                />
              </button>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 text-[11px] uppercase tracking-widest">
                Sin imagen
              </div>
            )}

            {/* Badges flotantes */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {onSale && savingsPct ? (
                <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11.5px] font-semibold shadow-sm">
                  -{savingsPct}%
                </span>
              ) : null}
              {product.featured && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11.5px] font-semibold shadow-sm">
                  Destacado
                </span>
              )}
            </div>

            {/* Prev/Next */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePrev() }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-900 shadow-md flex items-center justify-center backdrop-blur opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleNext() }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-900 shadow-md flex items-center justify-center backdrop-blur opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>

                {/* Contador */}
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/70 backdrop-blur text-white text-[11.5px] font-medium">
                  {activeImage + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={() => setActiveImage(i)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === i
                      ? 'border-slate-900'
                      : 'border-transparent hover:border-slate-200'
                  }`}
                  aria-label={`Ver imagen ${i + 1}`}
                >
                  <img src={img.src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div>
          {/* Categoría con color */}
          {cat && (
            <Link
              to={`/tienda?categoria=${cat.id}`}
              className={`inline-flex items-center px-3 h-7 rounded-full text-[12px] font-medium ${tone.bg} ${tone.text} ring-1 ${tone.ring}`}
            >
              {cat.name}
            </Link>
          )}

          <h1 className="mt-3 text-2xl sm:text-3xl lg:text-[36px] font-semibold text-slate-900 leading-[1.15] tracking-tight">
            {product.name}
          </h1>

          {/* Rating + ventas */}
          {(rating > 0 || totalSales > 0 || product.sku) && (
            <div className="mt-2.5 flex items-center flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-600">
              {rating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="inline-flex">
                    {[0, 1, 2, 3, 4].map(i => (
                      i < Math.round(rating)
                        ? <StarSolid key={i} className="w-4 h-4 text-amber-500" />
                        : <StarIcon key={i} className="w-4 h-4 text-slate-300" />
                    ))}
                  </span>
                  <span className="font-medium text-slate-900">{rating.toFixed(1)}</span>
                  {ratingCount > 0 && <span className="text-slate-500">· {ratingCount} reseñas</span>}
                </span>
              )}
              {totalSales > 0 && (
                <span>· {totalSales} vendidos</span>
              )}
              {product.sku && (
                <span>SKU <span className="font-mono text-slate-700">{product.sku}</span></span>
              )}
            </div>
          )}

          {/* Precio */}
          <div className="mt-5">
            <div className="flex items-baseline gap-3 flex-wrap">
              {price ? (
                <span className="text-[34px] sm:text-[40px] font-semibold text-slate-900 leading-none">
                  {price}
                </span>
              ) : (
                <span className="text-xl font-medium text-slate-500">Consultar precio</span>
              )}
              {onSale && regular && (
                <span className="text-base text-slate-400 line-through">{regular}</span>
              )}
            </div>
            {onSale && savingsAmount && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[12.5px] font-medium ring-1 ring-rose-100">
                Ahorras {formatCOP(savingsAmount)}{savingsPct ? ` · ${savingsPct}% off` : ''}
              </p>
            )}
            <p className="mt-2 text-[12.5px] text-slate-500">
              Precio antes de impuestos según ciudad de envío. Confirma el total con tu asesor.
            </p>
          </div>

          {/* Stock */}
          <div className="mt-5">
            {inStock ? (
              <span className="inline-flex items-center gap-2 text-[14px] font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {lowStock
                  ? <span className="text-amber-700">Quedan {stockQty} unidades</span>
                  : <span className="text-emerald-700">Disponible para envío</span>
                }
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Consultar disponibilidad
              </span>
            )}
          </div>

          {/* Short description */}
          {product.short_description && (
            <div
              className="mt-5 text-[15px] text-slate-700 leading-relaxed [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:text-slate-900"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          )}

          {/* Cantidad + CTAs */}
          <div className="mt-7 space-y-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center h-12 rounded-full border border-slate-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={decQty}
                  disabled={quantity <= 1}
                  className="w-11 h-12 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  aria-label="Disminuir cantidad"
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-[15px] font-semibold text-slate-900 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={incQty}
                  disabled={stockQty != null && quantity >= stockQty}
                  className="w-11 h-12 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  aria-label="Aumentar cantidad"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[13px] text-slate-500">
                Cantidad
              </p>
            </div>

            <a
              href={buildWhatsAppUrl(whatsAppProductMessage(product, { quantity }))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-14 w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[15.5px] transition-colors"
            >
              <WhatsAppGlyph className="w-5 h-5" />
              Comprar por WhatsApp
            </a>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={buildWhatsAppUrl(`Hola Licitronix, necesito una cotización formal de: ${product.name}${quantity > 1 ? ` (cantidad ${quantity})` : ''}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-900 font-medium text-[14px] border border-slate-200 transition-colors"
              >
                Cotización formal
              </a>
              <button
                type="button"
                onClick={handleShare}
                className="relative inline-flex items-center justify-center gap-2 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-900 font-medium text-[14px] border border-slate-200 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                {shareState === 'copied' ? 'Enlace copiado' : shareState === 'shared' ? 'Compartido' : 'Compartir'}
              </button>
            </div>
          </div>

          {/* Beneficios coloridos */}
          <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Benefit
              tone="emerald"
              icon={ShieldCheckIcon}
              title="Garantía"
              sub="Soporte directo"
            />
            <Benefit
              tone="sky"
              icon={TruckIcon}
              title="Envío"
              sub="A todo el país"
            />
            <Benefit
              tone="violet"
              icon={CreditCardIcon}
              title="Pagos"
              sub="Varias opciones"
            />
            <Benefit
              tone="amber"
              icon={ArrowUturnLeftIcon}
              title="Devoluciones"
              sub="Hasta 5 días"
            />
          </div>

          {/* Asesoría link */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 border border-slate-200">
              <WhatsAppGlyph className="w-4.5 h-4.5" />
            </span>
            <div className="flex-1 text-[13.5px] text-slate-600">
              ¿Dudas antes de comprar? Te asesoramos sin compromiso.
            </div>
            <a
              href={buildWhatsAppUrl(`Hola Licitronix, tengo una duda sobre: ${product.name}`)}
              target="_blank" rel="noopener noreferrer"
              className="text-[13.5px] font-semibold text-emerald-700 hover:text-emerald-800 shrink-0"
            >
              Escribir →
            </a>
          </div>
        </div>
      </div>

      {/* TABS */}
      <section className="mt-14 sm:mt-20">
        <div className="border-b border-slate-200">
          <div className="flex gap-1 sm:gap-6 -mb-px overflow-x-auto scrollbar-none">
            <Tab active={tab === 'descripcion'} onClick={() => setTab('descripcion')}>
              Descripción
            </Tab>
            <Tab active={tab === 'especificaciones'} onClick={() => setTab('especificaciones')}>
              Especificaciones
            </Tab>
            <Tab active={tab === 'envio'} onClick={() => setTab('envio')}>
              Envío y garantía
            </Tab>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 max-w-3xl">
          {tab === 'descripcion' && (
            product.description ? (
              <div
                className="text-[15.5px] text-slate-700 leading-relaxed [&_p]:mt-3 [&_p:first-child]:mt-0 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-1 [&_strong]:text-slate-900 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-5 [&_img]:rounded-xl [&_img]:my-4 [&_a]:text-orange-700 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : product.short_description ? (
              <p className="text-[15.5px] text-slate-700">{stripHtml(product.short_description)}</p>
            ) : (
              <p className="text-slate-500 italic">Este producto no tiene una descripción detallada todavía.</p>
            )
          )}

          {tab === 'especificaciones' && (
            Array.isArray(product.attributes) && product.attributes.length > 0 ? (
              <dl className="rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                {product.attributes.map(attr => (
                  <div key={attr.id || attr.name} className="grid grid-cols-3 px-4 sm:px-5 py-3 sm:py-3.5 text-[14px]">
                    <dt className="text-slate-500">{attr.name}</dt>
                    <dd className="col-span-2 text-slate-900">{(attr.options || []).join(', ')}</dd>
                  </div>
                ))}
                {product.weight && (
                  <div className="grid grid-cols-3 px-4 sm:px-5 py-3 sm:py-3.5 text-[14px]">
                    <dt className="text-slate-500">Peso</dt>
                    <dd className="col-span-2 text-slate-900">{product.weight} kg</dd>
                  </div>
                )}
                {product.dimensions && (product.dimensions.length || product.dimensions.width || product.dimensions.height) && (
                  <div className="grid grid-cols-3 px-4 sm:px-5 py-3 sm:py-3.5 text-[14px]">
                    <dt className="text-slate-500">Dimensiones</dt>
                    <dd className="col-span-2 text-slate-900">
                      {[product.dimensions.length, product.dimensions.width, product.dimensions.height].filter(Boolean).join(' × ')} cm
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-slate-500 italic">Las especificaciones se confirman con tu asesor por WhatsApp.</p>
            )
          )}

          {tab === 'envio' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoBlock
                tone="sky"
                icon={TruckIcon}
                title="Envíos a toda Colombia"
                body="Despachamos desde Ibagué. Tiempo estimado entre 2 y 5 días hábiles según ciudad. Para zonas remotas confirmamos cobertura antes de cobrar el envío."
              />
              <InfoBlock
                tone="emerald"
                icon={ShieldCheckIcon}
                title="Garantía respaldada"
                body="Trabajamos con marcas que sí responden. La garantía aplica según condiciones de cada fabricante. Te apoyamos directamente con el trámite."
              />
              <InfoBlock
                tone="violet"
                icon={CreditCardIcon}
                title="Formas de pago"
                body="Transferencia, consignación, tarjeta de crédito y opciones a plazos para clientes corporativos. Facturación electrónica DIAN incluida."
              />
              <InfoBlock
                tone="amber"
                icon={ArrowUturnLeftIcon}
                title="Cambios y devoluciones"
                body="Si el producto llega con falla de fábrica o no corresponde a lo pedido, hacemos cambio o devolución dentro de los primeros 5 días."
              />
            </div>
          )}
        </div>
      </section>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="mt-16 sm:mt-20">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-5">
            También podría interesarte
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Sticky CTA mobile */}
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-slate-100 p-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500 leading-none">Total</p>
            <p className="text-[17px] font-semibold text-slate-900 leading-tight truncate">
              {price ? price : 'Consultar'}
              {quantity > 1 && <span className="text-[12px] text-slate-500 ml-1.5 font-normal">× {quantity}</span>}
            </p>
          </div>
          <a
            href={buildWhatsAppUrl(whatsAppProductMessage(product, { quantity }))}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full bg-emerald-600 active:bg-emerald-700 text-white font-medium text-[15px]"
          >
            <WhatsAppGlyph className="w-5 h-5" />
            Comprar
          </a>
        </div>
      </div>
      <div className="lg:hidden h-20" aria-hidden />

      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightbox && images[activeImage] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-slate-950/95 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 sm:px-6 h-14 text-white">
              <span className="text-[13.5px] text-slate-300 truncate pr-2">
                {product.name}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[12.5px] text-slate-400 mr-2">
                  {activeImage + 1} / {images.length}
                </span>
                <button
                  onClick={() => setLightbox(false)}
                  className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center"
                  aria-label="Cerrar"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
              <button
                onClick={() => setLightbox(false)}
                className="absolute inset-0 cursor-zoom-out"
                aria-label="Cerrar"
                tabIndex={-1}
              />
              <motion.img
                key={activeImage}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                src={images[activeImage].src}
                alt={images[activeImage].alt || product.name}
                className="relative w-full h-full object-contain p-4 sm:p-12 pointer-events-none"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur text-white flex items-center justify-center"
                    aria-label="Anterior"
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur text-white flex items-center justify-center"
                    aria-label="Siguiente"
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="p-3 sm:p-4 flex justify-center" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
                <div className="flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeImage ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Imagen ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const TONES = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-700' },
  sky:     { bg: 'bg-sky-50',     text: 'text-sky-700',     icon: 'bg-sky-100 text-sky-700' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  icon: 'bg-violet-100 text-violet-700' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-800',   icon: 'bg-amber-100 text-amber-800' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    icon: 'bg-rose-100 text-rose-700' }
}

function Benefit({ tone = 'emerald', icon: Icon, title, sub }) {
  const t = TONES[tone] || TONES.emerald
  return (
    <div className={`p-3 rounded-xl ${t.bg}`}>
      <div className={`w-8 h-8 rounded-lg ${t.icon} flex items-center justify-center mb-2`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className={`text-[13px] font-semibold ${t.text}`}>{title}</p>
      <p className="text-[11.5px] text-slate-600">{sub}</p>
    </div>
  )
}

function InfoBlock({ tone, icon: Icon, title, body }) {
  const t = TONES[tone] || TONES.emerald
  return (
    <div className={`p-5 rounded-2xl ${t.bg}`}>
      <div className={`w-10 h-10 rounded-xl ${t.icon} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <h4 className={`text-[15px] font-semibold ${t.text}`}>{title}</h4>
      <p className="text-[13.5px] text-slate-700 leading-relaxed mt-1.5">{body}</p>
    </div>
  )
}

function Tab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-3 sm:px-1 py-3 text-[14px] sm:text-[15px] font-medium whitespace-nowrap transition-colors ${
        active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
      {active && (
        <motion.span
          layoutId="tab-underline"
          className="absolute inset-x-0 -bottom-px h-0.5 bg-orange-500 rounded-full"
        />
      )}
    </button>
  )
}
