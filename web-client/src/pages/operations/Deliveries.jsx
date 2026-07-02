import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../services/AuthContext'
import api, { deliveriesAPI, productsAPI, locationsAPI } from '../../api'
import {
  Search, Plus, CheckCircle2, XCircle, ChevronLeft,
  ChevronRight, AlertCircle, RefreshCw, Truck,
  Calendar, User, Filter,
  MapPin, TrendingUp, PackageOpen
} from 'lucide-react'
import {  SpringModal, CustomDropdown } from '../../components/common/Motion'

const STATUS_BADGE = {
  draft:     <span className="badge-draft"><span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />Draft</span>,
  packed:    <span className="badge-ready"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />Packed</span>,
  done:      <span className="badge-done"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />Done</span>,
  cancelled: <span className="badge-cancelled"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" />Cancelled</span>,
}

// ── New Delivery Modal ────────────────────────────────
function NewDeliveryModal({ onClose, onCreated }) {
  const [products,  setProducts]  = useState([])
  const [locations, setLocations] = useState([])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const [form, setForm] = useState({
    product:       '',
    quantity:      '',
    source:        '',
    contact:       '',
    schedule_date: '',
    remarks:       '',
    status:        'DRAFT',
  })

  useEffect(() => {
    Promise.all([
      productsAPI.getAll(),
      locationsAPI.getAll(),
    ]).then(([pRes, lRes]) => {
      setProducts(pRes.data.results  || pRes.data)
      setLocations(lRes.data.results || lRes.data)
    }).catch(() => {})
  }, [])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    if (!form.product)  return setError('Please select a product')
    if (!form.quantity) return setError('Please enter a quantity')
    setSaving(true); setError('')
    try {
      // POST /api/movements/ — movement_type=DELIVERY added by deliveriesAPI.create
      // Staff users get 403 → api.js interceptor fires global 'access-denied' event
      await deliveriesAPI.create({
        product:       Number(form.product),
        quantity:      Number(form.quantity),
        source:        form.source        ? Number(form.source) : null,
        contact:       form.contact       || null,
        schedule_date: form.schedule_date || null,
        remarks:       form.remarks       || null,
        status:        form.status,
      })
      onCreated()
      onClose()
    } catch (e) {
      // 403 handled globally — only show other errors here
      if (e.response?.status !== 403) {
        setError(e.response?.data?.detail || 'Failed to create delivery')
      }
    } finally {
      setSaving(false)
    }
  }

  
  return (
    <SpringModal
      isOpen={true}
      onClose={onClose}
      title="New Delivery Order"
      subtitle="Create outgoing shipment for customer"
      footer={(
        <>
          <button onClick={onClose} className="btn-ghost btn-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary btn-sm min-w-[100px]">
            {saving ? <RefreshCw size={12} className="animate-spin" /> : 'Create Order'}
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
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Customer / Destination <span className="text-red-400">*</span></label>
            <div className="relative group">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-faint group-focus-within:text-emerald-500 transition-colors" />
              <input
                className="input pr-4 pl-10 h-11 text-xs font-semibold" placeholder="e.g. Acme Corp"
                value={form.contact} onChange={(e) => set('contact', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Dispatch Warehouse <span className="text-red-400">*</span></label>
            <CustomDropdown 
              fullWidth
              icon={<MapPin size={16} />}
              value={form.source}
              setter={(v) => set('source', v)}
              options={locations.map(l => ({ id: l.id, name: l.name }))}
              placeholder="Select warehouse..."
            />
          </div>

          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Status</label>
            <CustomDropdown 
              fullWidth
              icon={<TrendingUp size={16} />}
              value={form.status}
              setter={(v) => set('status', v)}
              options={[
                { id: 'DRAFT',  name: 'Draft' },
                { id: 'PACKED', name: 'Packed' },
                { id: 'DONE',   name: 'Done (Direct Dispatch)' }
              ]}
              placeholder="Select status..."
            />
          </div>
        </div>

        <div className="pt-4 border-t theme-border">
          <label className="block text-xs theme-text-faint mb-3 font-bold uppercase tracking-wider">Line Item</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <CustomDropdown 
                fullWidth
                icon={<PackageOpen size={16} />}
                value={form.product}
                setter={(v) => set('product', v)}
                options={products.map(p => ({ id: p.id, name: `${p.name} (${p.sku})` }))}
                placeholder="Select product..."
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Quantity</label>
              <input type="number" className="input h-11 text-xs font-semibold" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </SpringModal>
  )
}

// ── Delivery detail view ──────────────────────────────
function DeliveryDetail({ delivery, onBack, onRefresh }) {
  const [loading, setLoading] = useState(false)

  const act = async (fn, label) => {
    if (!window.confirm(`${label} this delivery?`)) return
    setLoading(true)
    try   { await fn(delivery.id); onRefresh() }
    catch (e) { alert(e.response?.data?.detail || `${label} failed`) }
    finally   { setLoading(false) }
  }

  const canPack = delivery.status === 'draft'
  const canValidate = delivery.status === 'packed' || delivery.status === 'draft'
  const canCancel = delivery.status === 'draft' || delivery.status === 'packed'

  const packDelivery = () => act((id) => api.patch(`/movements/${id}/`, { status: 'PACKED' }), 'Pack')

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-ghost btn-sm"><ChevronLeft size={14} /> Back</button>
        <span className="text-gray-700">/</span>
        <span className="text-sm text-gray-400">Deliveries</span>
        <span className="text-gray-700">/</span>
        <span className="text-sm text-gray-300 mono">{delivery.reference}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h2 className="text-lg font-semibold theme-text mono">{delivery.reference}</h2>
                  {STATUS_BADGE[delivery.status] || <span className="badge-draft">{delivery.status}</span>}
                </div>
                <p className="text-sm theme-text-muted">Delivery #{delivery.id}</p>
              </div>
              {canCancel && (
                <div className="flex gap-2">
                  {canPack && (
                    <button onClick={packDelivery} disabled={loading} className="btn-secondary btn-sm">
                      <Plus size={13} /> Pack
                    </button>
                  )}
                  {canValidate && (
                    <button onClick={() => act(deliveriesAPI.validate, 'Validate')} disabled={loading} className="btn-primary btn-sm">
                      <CheckCircle2 size={13} /> Validate
                    </button>
                  )}
                  <button onClick={() => act(deliveriesAPI.cancel, 'Cancel')} disabled={loading} className="btn-danger btn-sm">
                    <XCircle size={13} /> Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-6">
              {[
                { label: 'Customer / Contact', value: delivery.contact,       icon: User     },
                { label: 'Scheduled Date',     value: delivery.schedule_date, icon: Calendar },
                { label: 'From Location',      value: delivery.source_warehouse || delivery.source_name, icon: null },
                { label: 'To Location',        value: delivery.dest_warehouse   || delivery.dest_name,   icon: null },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3 py-3 border-b theme-border last:border-0">
                  {Icon && <Icon size={13} className="theme-text-faint mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className="text-xs theme-text-faint mb-0.5">{label}</p>
                    <p className="text-sm theme-text-secondary">{value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
            {delivery.remarks && (
              <div className="mt-4 p-3 theme-bg-hover rounded-lg border theme-border">
                <p className="text-xs theme-text-faint mb-1">Notes / Remarks</p>
                <p className="text-sm theme-text-secondary">{delivery.remarks}</p>
              </div>
            )}
          </div>

          <div className="card overflow-x-auto custom-scrollbar">
            <div className="px-5 py-4 border-b theme-border">
              <h3 className="text-sm font-semibold theme-text">Product Lines</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b theme-border">
                  <th className="table-head">Product</th>
                  <th className="table-head">SKU</th>
                  <th className="table-head">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {(delivery.lines || []).length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8 text-sm theme-text-muted">No product lines</td></tr>
                ) : delivery.lines.map((l, i) => (
                  <tr key={i} className="border-b theme-border last:border-0">
                    <td className="table-cell theme-text-secondary">{l.product_name}</td>
                    <td className="table-cell mono text-xs theme-text-faint">{l.product_sku || '—'}</td>
                    <td className="table-cell theme-text-muted">{l.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5 h-fit">
          <h3 className="text-sm font-semibold theme-text mb-4">Status</h3>
          {['Draft', 'Packed', 'Done'].map((s, i) => {
            const order = ['draft', 'packed', 'done']
            const curr  = order.indexOf(delivery.status)
            const isDone = i < curr, isActive = i === curr
            return (
              <div key={s} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-xs ${
                  isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                  isActive ? 'bg-blue-500/20 border-blue-500 text-blue-400' :
                  'theme-bg-active theme-border text-gray-400'
                }`}>{isDone ? '✓' : i + 1}</div>
                <span className={`text-sm ${isActive ? 'theme-text font-medium' : isDone ? 'theme-text-faint' : 'theme-text-muted opacity-50'}`}>{s}</span>
              </div>
            )
          })}
          {delivery.status === 'cancelled' && (
            <div className="mt-3 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-xs text-red-400">✕</div>
              <span className="text-sm text-red-400 font-medium">Cancelled</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Deliveries list page ──────────────────────────────
export default function Deliveries() {
  const { user } = useAuth()
  const isAdmin = user?.username === 'AdminID' || user?.role === 'admin' || user?.isStaff

  const [deliveries, setDeliveries] = useState([])
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [selectedDelivery, setSelectedDelivery]     = useState(null) // Renamed from 'selected'
  const [showModal, setShowModal]   = useState(false)
  const [nextUrl, setNextUrl]       = useState(null)
  const [prevUrl, setPrevUrl]       = useState(null)
  const [count, setCount]           = useState(0)
  const [page, setPage]             = useState(1)

  const fetchDeliveries = async (pageNum = 1) => {
    setLoading(true); setError('')
    try {
      const { data } = await deliveriesAPI.getAll({
        ...(search       ? { search }               : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        page: pageNum,
      })
      setDeliveries(data.results || data)
      setNextUrl(data.next       || null)
      setPrevUrl(data.previous   || null)
      setCount(data.count        || 0)
      setPage(pageNum)
    } catch { setError('Failed to load deliveries') }
    finally   { setLoading(false) }
  }

    useEffect(() => { fetchDeliveries(1) }, [])

  const openDetail = async (id) => {
    try { const { data } = await deliveriesAPI.getOne(id); setSelectedDelivery(data) }
    catch { alert('Could not load delivery') }
  }

  const refreshDetail = async () => {
    if (!selectedDelivery) return
    try { const { data } = await deliveriesAPI.getOne(selectedDelivery.id); setSelectedDelivery(data); fetchDeliveries(page) }
    catch {}
  }

  return (
    <div className="page-container">
      <AnimatePresence mode="wait">
        {selectedDelivery ? (
          <DeliveryDetail 
            key="detail"
            delivery={selectedDelivery} 
            onBack={() => { setSelectedDelivery(null); fetchDeliveries(page) }} 
            onRefresh={refreshDetail}
            isAdmin={isAdmin}
          />
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="page-header flex-wrap gap-4">
              <div>
                <h1 className="page-title">Delivery Orders</h1>
                <p className="page-subtitle">Outgoing shipments & sales · {count} total</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => fetchDeliveries(page)} className="btn-secondary btn-sm"><RefreshCw size={12} className={loading ? 'animate-spin' : ''} /></button>
                {isAdmin && (
                  <button onClick={() => setShowModal(true)} className="btn-primary btn-sm"><Plus size={13} /> New Order</button>
                )}
              </div>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-faint" />
                <input className="input pl-9" placeholder="Search by reference or customer..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchDeliveries(1)} />
              </div>
              <CustomDropdown 
                icon={<TrendingUp size={14} />}
                value={statusFilter} 
                setter={(v) => { setStatus(v); fetchDeliveries(1) }} 
                options={[
                  { id: 'DRAFT',     name: 'Draft' },
                  { id: 'PACKED',    name: 'Packed' },
                  { id: 'DONE',      name: 'Done' },
                  { id: 'CANCELLED', name: 'Cancelled' }
                ]} 
                placeholder="All Status" 
              />
              <button onClick={() => fetchDeliveries(1)} className="btn-secondary btn-sm h-11 px-4"><Filter size={12} /> Apply</button>
            </div>

            {error && <div className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/15 text-red-400 text-sm rounded-xl px-4 py-3 mb-5"><AlertCircle size={13} /> {error}</div>}

            <div className="card overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="border-b theme-border-subtle">
                    <th className="table-head">Reference</th>
                    <th className="table-head">Customer</th>
                    <th className="table-head">Warehouse</th>
                    <th className="table-head">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border-subtle">
                  {loading ? (
                    <tr><td colSpan={4}><div className="flex items-center justify-center py-16 gap-2 theme-text-muted text-sm"><RefreshCw size={14} className="animate-spin" /> Loading...</div></td></tr>
                  ) : deliveries.length === 0 ? (
                    <tr><td colSpan={4}><div className="text-center py-16"><Truck size={32} className="theme-bg-active theme-text-faint mx-auto mb-3" /><p className="text-sm theme-text-muted">No delivery orders found</p></div></td></tr>
                  ) : deliveries.map((d) => (
                    <motion.tr 
                      key={d.id} 
                      whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.03)' }}
                      className="table-row cursor-pointer" 
                      onClick={() => openDetail(d.id)}
                    >
                      <td className="table-cell font-medium text-blue-500 mono">{d.reference}</td>
                      <td className="table-cell theme-text-secondary">{d.contact || '—'}</td>
                      <td className="table-cell theme-text-faint text-xs">{d.source_warehouse || d.source_name || '—'}</td>
                      <td className="table-cell">{STATUS_BADGE[d.status.toLowerCase()] || d.status}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(prevUrl || nextUrl) && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs theme-text-faint">Page {page} · {count} total</p>
                <div className="flex gap-2">
                  <button onClick={() => fetchDeliveries(page - 1)} disabled={!prevUrl} className="btn-secondary btn-sm disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={13} /> Previous</button>
                  <button onClick={() => fetchDeliveries(page + 1)} disabled={!nextUrl} className="btn-secondary btn-sm disabled:opacity-30 disabled:cursor-not-allowed">Next <ChevronRight size={13} /></button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <NewDeliveryModal 
            onClose={() => setShowModal(false)} 
            onCreated={() => { setShowModal(false); fetchDeliveries(1) }} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}