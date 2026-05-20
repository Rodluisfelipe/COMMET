import { Link } from 'react-router-dom'
import { buildWhatsAppUrl, whatsAppProductMessage, formatCOP } from '../../utils/whatsapp'
import { WhatsAppGlyph } from './Navbar'

export default function ProductCard({ product }) {
  if (!product) return null

  const img = product.images?.[0]?.src
  const price = formatCOP(product.price)
  const regular = formatCOP(product.regular_price)
  const onSale = product.on_sale && product.regular_price && product.regular_price !== product.price
  const outOfStock = product.stock_status && product.stock_status !== 'instock'
  const detailPath = `/producto/${product.slug || product.id}`

  return (
    <article className="group flex flex-col">
      {/* Imagen */}
      <Link
        to={detailPath}
        className="relative block aspect-square rounded-2xl overflow-hidden bg-slate-50"
      >
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-[11px] uppercase tracking-widest">
            Sin imagen
          </div>
        )}

        {/* Etiquetas — discretas, esquina superior izquierda */}
        {(onSale || product.featured) && !outOfStock && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {onSale && (
              <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-semibold tracking-wide">
                Oferta
              </span>
            )}
          </div>
        )}

        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-slate-900/90 text-white text-[11px] font-medium tracking-wide">
              Agotado
            </span>
          </div>
        )}
      </Link>

      {/* Contenido */}
      <div className="pt-3 sm:pt-3.5 flex flex-col">
        {product.categories?.[0] && (
          <p className="text-[11px] text-slate-500 mb-1 line-clamp-1">
            {product.categories[0].name}
          </p>
        )}
        <Link to={detailPath}>
          <h3 className="text-[14.5px] sm:text-[15px] font-medium text-slate-900 leading-snug line-clamp-2 group-hover:text-orange-700 transition-colors min-h-[2.6em]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
          {price ? (
            <span className="text-[15px] sm:text-base font-semibold text-slate-900">{price}</span>
          ) : (
            <span className="text-[13px] text-slate-500">Consultar precio</span>
          )}
          {onSale && regular && (
            <span className="text-[12px] text-slate-400 line-through">{regular}</span>
          )}
        </div>

        {/* Acción — discreta en mobile, visible al hover en desktop */}
        <a
          href={buildWhatsAppUrl(whatsAppProductMessage(product))}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center justify-center sm:justify-start gap-1.5 text-[13px] font-medium text-slate-700 hover:text-emerald-700 transition-colors"
        >
          <WhatsAppGlyph className="w-4 h-4 text-emerald-600" />
          Consultar
        </a>
      </div>
    </article>
  )
}
