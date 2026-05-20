const express = require('express');
const router = express.Router();

const WOO_BASE = process.env.WOO_API_URL || 'https://wp.tecnophone.co/wp-json/wc/v3';
const WOO_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_SECRET = process.env.WOO_CONSUMER_SECRET;

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key, data) {
  cache.set(key, { ts: Date.now(), data });
}

async function wooFetch(path, params = {}) {
  if (!WOO_KEY || !WOO_SECRET) {
    throw new Error('Faltan credenciales de WooCommerce en variables de entorno');
  }

  const url = new URL(`${WOO_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, v);
    }
  });
  url.searchParams.set('consumer_key', WOO_KEY);
  url.searchParams.set('consumer_secret', WOO_SECRET);

  const cacheKey = url.toString();
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`WooCommerce respondió ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  cacheSet(cacheKey, data);
  return data;
}

// GET /api/store/products
router.get('/products', async (req, res) => {
  try {
    const {
      search,
      category,
      per_page = 24,
      page = 1,
      orderby = 'date',
      order = 'desc',
      featured,
      on_sale,
      min_price,
      max_price
    } = req.query;

    const data = await wooFetch('/products', {
      search,
      category,
      per_page,
      page,
      orderby,
      order,
      featured,
      on_sale,
      min_price,
      max_price,
      status: 'publish'
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error consultando productos', error: error.message });
  }
});

// GET /api/store/products/:id  (acepta ID numérico o slug)
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (/^\d+$/.test(id)) {
      const data = await wooFetch(`/products/${id}`);
      return res.json(data);
    }

    const list = await wooFetch('/products', { slug: id, status: 'publish' });
    if (!Array.isArray(list) || list.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json(list[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error consultando el producto', error: error.message });
  }
});

// GET /api/store/categories
router.get('/categories', async (req, res) => {
  try {
    const data = await wooFetch('/products/categories', {
      per_page: 100,
      hide_empty: true,
      orderby: 'name'
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error consultando categorías', error: error.message });
  }
});

module.exports = router;
