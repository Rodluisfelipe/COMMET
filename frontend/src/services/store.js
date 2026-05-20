import api from './api'

export const storeApi = {
  listProducts: (params = {}) => api.get('/store/products', { params }).then(r => r.data),
  getProduct: (id) => api.get(`/store/products/${id}`).then(r => r.data),
  listCategories: () => api.get('/store/categories').then(r => r.data),
  listFeatured: (per_page = 8) => api.get('/store/products', {
    params: { featured: true, per_page }
  }).then(r => r.data),
}
