import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../services/AuthContext'
import { api } from '../../api'
import { productsAPI } from '../../api'
import {
  Search, Plus, CheckCircle2, ChevronLeft,
  ChevronRight, AlertCircle, RefreshCw, SlidersHorizontal,
  Filter, ArrowUpDown, X, Hash, ShieldAlert,
  PackageOpen, MapPin, TrendingUp, ChevronDown
} from 'lucide-react'
import { SpringModal, CustomDropdown } from '../../components/common/Motion'

const STATUS_BADGE = {
  draft:     <span className="badge-draft"><span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />Draft</span>,
  done:      <span className="badge-done"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />Done</span>,
  cancelled: <span className="badge-cancelled"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" />Cancelled</span>,
}

const mapMovement = (m) => ({
  id:            m.id,
  reference:     m.reference     || `#${m.id}`,
  movement_type: m.movement_type,
  product:       m.product,
  product_name:  m.product_name  || `#${m.product}`,
  product_sku:   m.product_sku   || '',
  quantity:      m.quantity,
  variance:      m.quantity,
  date:          new Date(m.date).toLocaleDateString('en-IN'),
  status:        m.status?.toLowerCase(),
  remarks:       m.remarks       || '',
  user_name:     m.user_name     || '—',
})

// ── Shared Adjustments API Helpers ──────────────────────
const adjustmentsAPI = {
  getAll: (params) =>
    api.get('/movements/', {
      params: { movement_type: 'ADJUSTMENT', ...params }
    }).then(res => ({
      ...res, data: { ...res.data, results: (res.data.results || res.data).map(mapMovement) }
    })),
  getOne: (id) => api.get(`/movements/${id}/`).then(res => ({ data: mapMovement(res.data) })),
  create: (productId, data) => api.post(`/products/${productId}/adjust_stock/`, data),
}

// ── New Adjustment Modal ────────────────────────────────
function NewAdjustmentModal({ onClose, onCreated }) {
  const [products,  setProducts]  = useState([])
  const [locations, setLocations] = useState([])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const [form, setForm] = useState({
    product:  '',
    location: '',
    quantity: '',
    type:     'MANUAL',
    remarks:  '',
  })

  useEffect(() => {
    productsAPI.getAll().then(p => setProducts(p.data.results || p.data))
    api.get('/warehouses/').then(res => setLocations(res.data.results || res.data))
  }, [])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    if (!form.product || form.quantity === '') 
      return setError('Product and Quantity are required')

    setSaving(true); setError('')
    try {
      await adjustmentsAPI.create(form.product, {
        physical_count: Number(form.quantity),
        reference:      form.remarks || 'Inventory Adjustment',
      })
      onCreated()
      onClose()
    } catch (e) {
      if (e.response?.status !== 403) {
        setError(e.response?.data?.detail || e.response?.data?.error || 'Failed to create adjustment')
      }
    } finally { setSaving(false) }
  }

  const selectedProduct = products.find(p => p.id === Number(form.product))

  return (
    <SpringModal
      isOpen={true}
      onClose={onClose}
      title="Internal Adjustment"
      subtitle="Correct inventory stock levels"
      footer={(
        <>
          <button onClick={onClose} className="btn-ghost btn-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary btn-sm min-w-[100px]">
            {saving ? <RefreshCw size={12} className="animate-spin" /> : 'Confirm'}
          </button>
        </>
      )}
    >
      <div className="space-y-4">
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 bg-red-500/5 border border-red-500/15 text-red-400 text-xs rounded-lg px-3 py-2"
          >
            <AlertCircle size={12} /> {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Product <span className="text-red-400">*</span></label>
            <CustomDropdown 
              fullWidth
              icon={<PackageOpen size={16} />}
              value={form.product}
              setter={(v) => set('product', v)}
              options={products.map(p => ({ id: p.id, name: `${p.name} (${p.sku})` }))}
              placeholder="Select product..."
            />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Warehouse <span className="text-red-400">*</span></label>
            <CustomDropdown 
              fullWidth
              icon={<MapPin size={16} />}
              value={form.location}
              setter={(v) => set('location', v)}
              options={locations.map(l => ({ id: l.id, name: l.name }))}
              placeholder="Select location..."
            />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">New Quantity <span className="text-red-400">*</span></label>
            <div className="relative group">
              <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-faint group-focus-within:text-emerald-500 transition-colors" />
              <input type="number" className="input pr-4 pl-10 h-11 text-xs font-semibold" placeholder="e.g. 50"
                value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Adjustment Type</label>
          <CustomDropdown 
            fullWidth
            icon={<TrendingUp size={16} />}
            value={form.type}
            setter={(v) => set('type', v)}
            options={[
              { id: 'MANUAL', name: 'Manual Correction' },
              { id: 'SCRAP',  name: 'Scrap / Damage' }
            ]}
            placeholder="Select type..."
          />
        </div>

        <div>
          <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Remarks</label>
          <textarea className="input w-full min-h-[80px]" placeholder="Reason for adjustment..."
            value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
        </div>
      </div>
    </SpringModal>
  )
}

// ── Adjustments list page ─────────────────────────────
export default function Adjustments() {
  const { user } = useAuth()
  const isAdmin = user?.username === 'AdminID' || user?.role === 'admin' || user?.isStaff

  const [adjustments, setAdjustments] = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [showModal, setShowModal] = useState(false)
  const [nextUrl, setNextUrl]     = useState(null)
  const [prevUrl, setPrevUrl]     = useState(null)
  const [count, setCount]         = useState(0)
  const [page, setPage]           = useState(1)

  const fetchAdjustments = async (pageNum = 1) => {
    setLoading(true); setError('')
    try {
      const { data } = await adjustmentsAPI.getAll({
        ...(search ? { search } : {}),
        page: pageNum,
      })
      setAdjustments(data.results || data)
      setNextUrl(data.next     || null)
      setPrevUrl(data.previous || null)
      setCount(data.count      || 0)
      setPage(pageNum)
    } catch { setError('Failed to load adjustments') }
    finally   { setLoading(false) }
  }

  useEffect(() => { fetchAdjustments(1) }, [])

  return (
    <div className="page-container animate-fade-in">
      <AnimatePresence>
        {showModal && (
          <NewAdjustmentModal 
            onClose={() => setShowModal(false)} 
            onCreated={() => { setShowModal(false); fetchAdjustments(1) }} 
          />
        )}
      </AnimatePresence>

      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Stock Adjustments</h1>
          <p className="page-subtitle">Track physical count corrections · {count} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchAdjustments(page)} className="btn-secondary btn-sm"><RefreshCw size={12} className={loading ? 'animate-spin' : ''} /></button>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="btn-primary btn-sm"><Plus size={13} /> New Count</button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-faint" />
          <input className="input pl-9" placeholder="Search Adjustments..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAdjustments(1)} />
        </div>
        <button onClick={() => fetchAdjustments(1)} className="btn-secondary btn-sm"><Filter size={12} /> Search</button>
      </div>

      {error && <div className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/15 text-red-400 text-sm rounded-xl px-4 py-3 mb-5"><AlertCircle size={13} /> {error}</div>}

      <div className="card overflow-x-auto custom-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="border-b theme-border-subtle">
              <th className="table-head">Reference</th>
              <th className="table-head">Product</th>
              <th className="table-head text-right">Adjusted Qty</th>
              <th className="table-head">Location</th>
              <th className="table-head">Date</th>
              <th className="table-head">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="flex items-center justify-center py-16 gap-2 theme-text-muted text-sm"><RefreshCw size={14} className="animate-spin" /> Loading...</div></td></tr>
            ) : adjustments.length === 0 ? (
              <tr><td colSpan={6}><div className="text-center py-16"><ShieldAlert size={32} className="theme-bg-active theme-text-faint mx-auto mb-3" /><p className="text-sm theme-text-muted">No adjustments found</p></div></td></tr>
            ) : adjustments.map((a) => (
              <tr key={a.id} className="table-row">
                <td className="table-cell font-medium theme-text whitespace-nowrap">{a.reference}</td>
                <td className="table-cell">
                  <div className="flex flex-col">
                    <span className="theme-text text-sm font-medium">{a.product_name}</span>
                    <span className="theme-text-faint text-[10px]">{a.product_sku}</span>
                  </div>
                </td>
                <td className={`table-cell text-right font-bold ${a.variance > 0 ? 'text-emerald-500' : a.variance < 0 ? 'text-red-500' : 'theme-text'}`}>
                  {a.variance > 0 ? `+${a.variance}` : a.variance}
                </td>
                <td className="table-cell theme-text-secondary">Inventory Adjustment</td>
                <td className="table-cell theme-text-muted text-xs whitespace-nowrap">{a.date}</td>
                <td className="table-cell">
                  {STATUS_BADGE[a.status] || <span className="capitalize">{a.status}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(prevUrl || nextUrl) && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs theme-text-faint">Page {page} · {count} total</p>
          <div className="flex gap-2">
            <button onClick={() => fetchAdjustments(page - 1)} disabled={!prevUrl} className="btn-secondary btn-sm disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={13} /> Previous</button>
            <button onClick={() => fetchAdjustments(page + 1)} disabled={!nextUrl} className="btn-secondary btn-sm disabled:opacity-30 disabled:cursor-not-allowed">Next <ChevronRight size={13} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
