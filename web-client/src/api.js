import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request: Attach JWT ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: Auto-refresh 401 + Fire 403 event ───────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    // Auto-refresh on 401
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }

    // 403 → fire global event → AccessDeniedToast will catch it
    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent('access-denied'))
    }

    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  login:           (data) => api.post('/auth/login/', data),
  register:        (data) => api.post('/auth/register/', data),
  forgotPassword:  (data) => api.post('/auth/forgot-password/', data),
  verifyResetCode: (data) => api.post('/auth/verify-reset-code/', data),
  resetPassword:   (data) => api.post('/auth/reset-password/', data),

  me: () => { const token = localStorage.getItem('access_token')
    if (!token) return Promise.reject(new Error('No token'))
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return Promise.resolve({
        data: {
          id:       payload.user_id,
          username: payload.username || 'User',
          email:    payload.email    || '',
          role:     payload.role     || 'staff',
        }
      })
    } catch {
      return Promise.reject(new Error('Invalid token'))
    }
},
  logout: () => localStorage.clear(),
}
// ── Dashboard ─────────────────────────────────────────
// GET /api/dashboard/kpis/ → { total_products, low_stock_alerts, total_movements }
// GET /api/movements/      → paginated movements for recent activity
export const dashboardAPI = {
  getSummary: async () => {
    const [kpis, movements] = await Promise.all([
      api.get('/dashboard/kpis/'),
      api.get('/movements/'),
    ])

    const all = movements.data.results || movements.data  // ← pagination safe

    return {
      data: {
        // From /dashboard/kpis/
        total_products:     kpis.data.total_products    ?? 0,
        low_stock_alerts:   kpis.data.low_stock_alerts  ?? 0,
        total_moves_today:  kpis.data.total_movements   ?? 0,

        // Derived from movements list
        pending_receipts:   all.filter(m =>
          m.movement_type === 'RECEIPT'  && m.status === 'DRAFT').length,
        pending_deliveries: all.filter(m =>
          m.movement_type === 'DELIVERY' && m.status === 'DRAFT').length,

        // Recent 5 for dashboard table
        recent_moves: all.slice(0, 5).map(m => ({
          reference: m.reference || `#${m.id}`,
          type:      m.movement_type,          // RECEIPT / DELIVERY / TRANSFER
          status:    m.status?.toLowerCase(),  // draft / done / cancelled
          date:      m.schedule_date           // ← FIXED: was m.date
            ? new Date(m.schedule_date).toLocaleDateString('en-IN')
            : '—',
        })),
      }
    }
  }
}

// ── Products ──────────────────────────────────────────
// GET    /api/products/      → paginated list
// POST   /api/products/      → create (Manager only)
// PATCH  /api/products/:id/  → update (Manager only)
// DELETE /api/products/:id/  → delete (Manager only)
//
// Fields: name, sku, category, unit_of_measure,
//         current_stock, reorder_level, price, description
export const productsAPI = {
  // params: { search, category, page }
  getAll: (params) => api.get('/products/', { params }),

  getOne: (id) => api.get(`/products/${id}/`),

  create: (data) => api.post('/products/', data),

  update: (id, data) => api.patch(`/products/${id}/`, data),

  delete: (id) => api.delete(`/products/${id}/`),

  // Direct stock update
  updateStock: (id, currentStock) =>
    api.patch(`/products/${id}/`, { current_stock: currentStock }),
}

// ── Legacy alias (keeps stockAPI callers working) ─────
export const stockAPI = {
  getProducts:    (params) => productsAPI.getAll(params),
  updateStock:    (id, { on_hand }) => productsAPI.updateStock(id, on_hand),

  // Maps products → stock-entry shape for Stock page
  getStockEntries: async () => {
    const { data } = await api.get('/products/')
    const items = data.results || data
    return {
      data: items.map(p => ({
        id:          p.id,
        product:     p.id,
        product_name: p.name,
        sku:          p.sku,
        on_hand:     p.current_stock,
        reorder_level: p.reorder_level,
        free_to_use: p.current_stock,
      }))
    }
  },
}

// ── Receipts ──────────────────────────────────────────
// Filter /api/movements/ by movement_type=RECEIPT
// Fields per contract: reference, movement_type, product(ID),
//                      quantity, source(ID), destination(ID),
//                      contact, schedule_date, status, remarks
export const receiptsAPI = {
  // params: { search, status, page }
  getAll: (params) =>
    api.get('/movements/', {
      params: { movement_type: 'RECEIPT', ...params }
    }).then(res => ({
      ...res,
      data: {
        ...res.data,
        results: (res.data.results || res.data).map(mapToReceipt)
      }
    })),

  getOne: (id) =>
    api.get(`/movements/${id}/`).then(res => ({
      data: mapToReceipt(res.data)
    })),

  create: (data) => api.post('/movements/', {
    ...data,
    movement_type: 'RECEIPT'
  }),

  validate: (id) => api.patch(`/movements/${id}/`, { status: 'DONE' }),
  cancel:   (id) => api.patch(`/movements/${id}/`, { status: 'CANCELLED' }),
}

// ── Deliveries ────────────────────────────────────────
// Filter /api/movements/ by movement_type=DELIVERY
export const deliveriesAPI = {
  // params: { search, status, page }
  getAll: (params) =>
    api.get('/movements/', {
      params: { movement_type: 'DELIVERY', ...params }
    }).then(res => ({
      ...res,
      data: {
        ...res.data,
        results: (res.data.results || res.data).map(mapToDelivery)
      }
    })),

  getOne: (id) =>
    api.get(`/movements/${id}/`).then(res => ({
      data: mapToDelivery(res.data)
    })),

  create: (data) => api.post('/movements/', {
    ...data,
    movement_type: 'DELIVERY'
  }),

  validate: (id) => api.patch(`/movements/${id}/`, { status: 'DONE' }),
  cancel:   (id) => api.patch(`/movements/${id}/`, { status: 'CANCELLED' }),
}

// ── Move History ──────────────────────────────────────
// GET /api/movements/ — all types
// Filters: movement_type, status, search, page
export const movesAPI = {
  getAll: (params) =>
    api.get('/movements/', { params }).then(res => ({
      ...res,
      data: {
        ...res.data,
        results: (res.data.results || res.data).map(m => ({
          id:             m.id,
          reference:      m.reference   || `MVE-${m.id}`,
          movement_type:  m.movement_type,               // RECEIPT/DELIVERY/TRANSFER/ADJUSTMENT
          product:        m.product,                     // product ID
          product_name:   m.product_name || `#${m.product}`,
          quantity:       m.quantity,
          source:         m.source,                      // location ID
          destination:    m.destination,                 // location ID
          from_location:  m.source_name  || '—',
          to_location:    m.dest_name    || '—',
          contact:        m.contact      || '—',
          schedule_date:  m.schedule_date
            ? new Date(m.schedule_date).toLocaleDateString('en-IN')
            : '—',
          status:         m.status?.toLowerCase(),       // draft/done/cancelled
          remarks:        m.remarks      || '',
        }))
      }
    })),
}

// ── Warehouses ────────────────────────────────────────
// GET   /api/warehouses/      → list
// POST  /api/warehouses/      → create (Manager only)
// PATCH /api/warehouses/:id/  → update (Manager only)
//
// Fields: name, short_code
export const warehouseAPI = {
  getAll:  ()         => api.get('/warehouses/'),
  getOne:  (id)       => api.get(`/warehouses/${id}/`),
  create:  (data)     => api.post('/warehouses/', data),
  update:  (id, data) => api.patch(`/warehouses/${id}/`, data),
  delete:  (id)       => api.delete(`/warehouses/${id}/`),
}

// ── Locations ─────────────────────────────────────────
// GET   /api/locations/      → list
// POST  /api/locations/      → create (Manager only)
// PATCH /api/locations/:id/  → update (Manager only)
//
// Fields: name, warehouse (FK id), is_internal
export const locationsAPI = {
  getAll:  (params)   => api.get('/locations/', { params }),
  getOne:  (id)       => api.get(`/locations/${id}/`),
  create:  (data)     => api.post('/locations/', data),
  update:  (id, data) => api.patch(`/locations/${id}/`, data),
  delete:  (id)       => api.delete(`/locations/${id}/`),
}

// ── Mappers ───────────────────────────────────────────
function mapToReceipt(m) {
  return {
    id:               m.id,
    reference:        m.reference     || `RCP-${m.id}`,
    contact:          m.contact       || '—',     // ← FIXED: was vendor_name/source_name
    source:           m.source,                   // location ID (null for receipts)
    destination:      m.destination,              // location ID
    scheduled_date:   m.schedule_date             // ← FIXED: was m.date
      ? new Date(m.schedule_date).toLocaleDateString('en-IN')
      : '—',
    status:           m.status?.toLowerCase(),
    remarks:          m.remarks       || '',
    lines: [{
      product:        m.product,                  // product ID
      product_name:   m.product_name || `#${m.product}`,
      quantity:       m.quantity,
    }],
  }
}

function mapToDelivery(m) {
  return {
    id:               m.id,
    reference:        m.reference     || `DLV-${m.id}`,
    contact:          m.contact       || '—',     // ← FIXED: was address/dest_name
    source:           m.source,                   // location ID
    destination:      m.destination,              // location ID (null for deliveries)
    scheduled_date:   m.schedule_date             // ← FIXED: was m.date
      ? new Date(m.schedule_date).toLocaleDateString('en-IN')
      : '—',
    operation_type:   'Delivery',
    status:           m.status?.toLowerCase(),
    remarks:          m.remarks       || '',
    lines: [{
      product:        m.product,
      product_name:   m.product_name || `#${m.product}`,
      quantity:       m.quantity,
    }],
  }
}

export default api