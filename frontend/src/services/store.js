import { wooFetch } from './woocommerce'

export const storeApi = {
  listProducts: (params = {}) => wooFetch('/products', { ...params, status: 'publish' }),

  getProduct: (id) => {
    if (/^\d+$/.test(String(id))) {
      return wooFetch(`/products/${id}`)
    }
    return wooFetch('/products', { slug: id, status: 'publish' }).then(list => {
      if (!Array.isArray(list) || list.length === 0) throw new Error('Producto no encontrado')
      return list[0]
    })
  },

  listCategories: () => wooFetch('/products/categories', {
    per_page: 100,
    hide_empty: true,
    orderby: 'name'
  }),

  listFeatured: (per_page = 8) => wooFetch('/products', {
    featured: true,
    per_page,
    status: 'publish'
  }),
}
