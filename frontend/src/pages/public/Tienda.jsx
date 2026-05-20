import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { storeApi } from '../../services/store'
import ProductCard from '../../components/public/ProductCard'

const ORDER_OPTIONS = [
  { label: 'Más recientes', value: 'date|desc' },
  { label: 'Más antiguos', value: 'date|asc' },
  { label: 'Precio: menor a mayor', value: 'price|asc' },
  { label: 'Precio: mayor a menor', value: 'price|desc' },
  { label: 'Más vendidos', value: 'popularity|desc' }
]

export default function Tienda() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const buscar = searchParams.get('buscar') || ''
  const categoria = searchParams.get('categoria') || ''
  const orden = searchParams.get('orden') || 'date|desc'
  const [orderby, order] = orden.split('|')

  const [searchInput, setSearchInput] = useState(buscar)

  useEffect(() => { setSearchInput(buscar) }, [buscar])

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== buscar) {
        const next = new URLSearchParams(searchParams)
        if (searchInput) next.set('buscar', searchInput)
        else next.delete('buscar')
        setSearchParams(next, { replace: true })
      }
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  useEffect(() => {
    storeApi.listCategories()
      .then(c => setCategories(Array.isArray(c) ? c : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    storeApi.listProducts({
      search: buscar || undefined,
      category: categoria || undefined,
      orderby,
      order,
      per_page: 24
    })
      .then(p => { if (alive) setProducts(Array.isArray(p) ? p : []) })
      .catch(() => { if (alive) setProducts([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [buscar, categoria, orderby, order])

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  const activeCategoryName = useMemo(() => {
    if (!categoria) return null
    return categories.find(c => String(c.id) === String(categoria))?.name
  }, [categoria, categories])

  const hasFilters = !!(buscar || categoria || orden !== 'date|desc')

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-12">
      {/* Header sobrio */}
      <header className="mb-7 sm:mb-10">
        <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-orange-600 mb-1.5">
          Catálogo
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
          {activeCategoryName || 'Tienda'}
        </h1>
        <p className="mt-2 text-[15px] text-slate-600 max-w-xl">
          Recorre nuestro catálogo. Si no encuentras algo, escríbenos: muchas cosas no
          alcanzan a entrar a la página.
        </p>
      </header>

      <div className="grid lg:grid-cols-[240px_1fr] gap-8 lg:gap-10">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block">
          <FilterPanel
            categories={categories}
            categoria={categoria}
            onChangeCategoria={(v) => updateParam('categoria', v)}
          />
        </aside>

        {/* Main */}
        <div>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                type="search"
                placeholder="Buscar en la tienda…"
                className="w-full pl-10 pr-4 h-12 rounded-full bg-slate-100 border border-transparent focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5 focus:shadow-sm outline-none transition text-[14.5px] placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-2.5">
              <select
                value={orden}
                onChange={e => updateParam('orden', e.target.value)}
                className="h-12 flex-1 sm:flex-none px-4 pr-8 rounded-full bg-slate-100 border border-transparent focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5 outline-none text-[14px] font-medium cursor-pointer appearance-none"
                style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%2364748b%22><path d=%22M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z%22/></svg>')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                {ORDER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="lg:hidden h-12 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-medium inline-flex items-center justify-center gap-2 transition-colors"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                Filtros
              </button>
            </div>
          </div>

          {/* Filtros activos */}
          {hasFilters && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {buscar && (
                <Chip onClear={() => { setSearchInput(''); updateParam('buscar', '') }}>
                  «{buscar}»
                </Chip>
              )}
              {activeCategoryName && (
                <Chip onClear={() => updateParam('categoria', '')}>
                  {activeCategoryName}
                </Chip>
              )}
              <button
                onClick={() => { setSearchInput(''); setSearchParams({}) }}
                className="text-[13px] font-medium text-slate-500 hover:text-orange-700 ml-1"
              >
                Limpiar
              </button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-square bg-slate-100 animate-pulse rounded-2xl" />
                  <div className="pt-3 space-y-2">
                    <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse" />
                    <div className="h-4 w-4/5 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center bg-slate-50/50">
              <p className="text-lg font-medium text-slate-800">Nada por aquí</p>
              <p className="mt-1 text-slate-500 max-w-md mx-auto">
                No encontramos productos con esos filtros. Prueba con otra palabra
                o limpia los filtros.
              </p>
              {hasFilters && (
                <button
                  onClick={() => { setSearchInput(''); setSearchParams({}) }}
                  className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-slate-900 text-white text-[14px] font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-[13px] text-slate-500 mb-4">
                {products.length} producto{products.length === 1 ? '' : 's'}
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Drawer filtros mobile */}
      <AnimatePresence>
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
              onClick={() => setShowFilters(false)}
            />
            <motion.aside
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.3 }}
              className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
                <div className="w-10 h-1 bg-slate-200 rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
                <h3 className="text-[17px] font-semibold text-slate-900">Filtros</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
                  aria-label="Cerrar"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="px-5 py-5 overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
                <FilterPanel
                  categories={categories}
                  categoria={categoria}
                  onChangeCategoria={(v) => { updateParam('categoria', v); setShowFilters(false) }}
                />
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Chip({ children, onClear }) {
  return (
    <span className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[12.5px] font-medium">
      {children}
      <button
        onClick={onClear}
        className="w-5 h-5 rounded-full hover:bg-slate-200 flex items-center justify-center"
        aria-label="Quitar filtro"
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </span>
  )
}

function FilterPanel({ categories, categoria, onChangeCategoria }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 mb-3">
        Categorías
      </p>
      <div className="space-y-0.5">
        <button
          onClick={() => onChangeCategoria('')}
          className={`block w-full text-left px-3 py-2.5 rounded-lg text-[14px] transition-colors ${
            !categoria
              ? 'bg-slate-900 text-white font-medium'
              : 'hover:bg-slate-50 text-slate-700'
          }`}
        >
          Todas las categorías
        </button>
        {categories.map(cat => {
          const active = String(cat.id) === String(categoria)
          return (
            <button
              key={cat.id}
              onClick={() => onChangeCategoria(String(cat.id))}
              className={`flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-[14px] transition-colors ${
                active
                  ? 'bg-slate-900 text-white font-medium'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              <span className={`text-[11px] ml-2 ${active ? 'text-white/60' : 'text-slate-400'}`}>
                {cat.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
