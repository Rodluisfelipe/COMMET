import axios from 'axios'

const WOO_BASE = import.meta.env.VITE_WOO_API_URL || 'https://wp.tecnophone.co/wp-json/wc/v3'
const WOO_KEY = import.meta.env.VITE_WOO_CONSUMER_KEY || ''
const WOO_SECRET = import.meta.env.VITE_WOO_CONSUMER_SECRET || ''

const woo = axios.create({
  baseURL: WOO_BASE,
  headers: { Accept: 'application/json' },
  params: {
    consumer_key: WOO_KEY,
    consumer_secret: WOO_SECRET
  }
})

// Cache simple en memoria (5 min TTL)
const CACHE_TTL = 5 * 60 * 1000
const cache = new Map()

function withCache(key, fetcher) {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    return Promise.resolve(entry.data)
  }
  return fetcher().then(data => {
    cache.set(key, { ts: Date.now(), data })
    return data
  })
}

export function wooFetch(path, params = {}) {
  const cacheKey = `${path}?${JSON.stringify(params)}`
  return withCache(cacheKey, () =>
    woo.get(path, { params }).then(r => r.data)
  )
}

export default woo
