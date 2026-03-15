import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../services/AuthContext'
import { api } from '../../api'
import { productsAPI, locationsAPI } from '../../api'
import {
  Search, Plus, CheckCircle2, XCircle, ChevronLeft,
  ChevronRight, AlertCircle, RefreshCw, RefreshCcw, ArrowRightLeft,
  Filter, ArrowUpDown, X, ArrowRight, Calendar, Hash,
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
  source:        m.source,
  destination:   m.destination,
  from_location: m.source_warehouse || m.source_name || '—',
  to_location:   m.dest_warehouse   || m.dest_name   || '—',
  source_warehouse: m.source_warehouse,
  dest_warehouse:   m.dest_warehouse,
  contact:       m.contact       || '—',
  schedule_date: m.schedule_date
    ? new Date(m.schedule_date).toLocaleDateString('en-IN')
    : '—',
  status:        m.status?.toLowerCase(),
  remarks:       m.remarks       || '',
  user_name:     m.user_name     || '—',
})

// ── Shared Transfer API Helpers ────────────────────────
const transfersAPI = {
  getAll: (params) =>
    api.get('/movements/', {
      params: { movement_type: 'TRANSFER', ...params }
    }).then(res => ({
      ...res, data: { ...res.data, results: (res.data.results || res.data).map(mapMovement) }
    })),
  getOne: (id) => api.get(`/movements/${id}/`).then(res => ({ data: mapMovement(res.data) })),
  create: (data) => api.post('/movements/', { ...data, movement_type: 'TRANSFER' }),
  validate: (id) => api.patch(`/movements/${id}/`, { status: 'DONE' }),
  cancel:   (id) => api.patch(`/movements/${id}/`, { status: 'CANCELLED' }),
}

// ── New Transfer Modal ────────────────────────────────
function NewTransferModal({ onClose, onCreated }) {
  const [products,  setProducts]  = useState([])
  const [locations, setLocations] = useState([])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const [form, setForm] = useState({
    product:       '',
    quantity:      '',
    source:        '',
    destination:   '',
    status:        'DRAFT',
    remarks:       '',
  })

  useEffect(() => {
    Promise.all([
      productsAPI.getAll({ page_size: 100 }), 
      locationsAPI.getAll({ page_size: 100 })
    ])
      .then(([p, l]) => {
        setProducts(p.data.results || p.data)
        setLocations(l.data.results || l.data)
      }).catch(() => {})
  }, [])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const destinationOptions = useMemo(() => 
    locations.filter(l => l.id !== Number(form.source)).map(l => ({ id: l.id, name: l.name })),
    [locations, form.source]
  )

  const handleSubmit = async () => {
    if (!form.product || !form.quantity || !form.source || !form.destination) 
      return setError('Product, Quantity, Source and Destination are required')
    if (form.source === form.destination)
      return setError('Source and Destination cannot be the same')

    setSaving(true); setError('')
    try {
      await transfersAPI.create({
        product:     Number(form.product),
        quantity:    Number(form.quantity),
        source:      Number(form.source),
        destination: Number(form.destination),
        status:      form.status,
        remarks:     form.remarks || null,
      })
      onCreated()
      onClose()
    } catch (e) {
      if (e.response?.status !== 403) {
        setError(e.response?.data?.detail || 'Failed to create transfer')
      }
    } finally { setSaving(false) }
  }

  return (
    <SpringModal
      isOpen={true}
      onClose={onClose}
      title="Internal Transfer"
      subtitle="Move stock between warehouse locations"
      footer={(
        <>
          <button onClick={onClose} className="btn-ghost btn-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary btn-sm px-6">
            {saving ? <RefreshCw size={12} className="animate-spin" /> : 'Execute Transfer'}
          </button>
        </>
      )}
    >
      <div className="space-y-4">
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Product Asset *</label>
            <CustomDropdown 
              fullWidth
              icon={<PackageOpen size={16} />}
              value={form.product}
              setter={(v) => set('product', v)}
              options={products.map(p => ({ id: p.id, name: `${p.name} (${p.sku})` }))}
              placeholder="Select product asset..."
            />
          </div>
          
          <div className="col-span-2">
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Transfer Volume <span className="text-red-400 font-bold">*</span></label>
            <div className="relative">
              <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-faint" />
              <input type="number" className="input w-full pl-9" placeholder="Enter units..." value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
            </div>
          </div>

          <div className="col-span-2 p-4 theme-bg-hover rounded-2xl border theme-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] theme-text-faint mb-1.5 font-black uppercase">Origin Warehouse</label>
                <CustomDropdown 
                  fullWidth
                  icon={<MapPin size={14} />}
                  value={form.source}
                  setter={(v) => set('source', v)}
                  options={locations.map(l => ({ id: l.id, name: l.name }))}
                  placeholder="Source..."
                />
              </div>
              <div>
                <label className="block text-[10px] theme-text-faint mb-1.5 font-black uppercase">Target Node</label>
                <CustomDropdown 
                  fullWidth
                  icon={<MapPin size={14} />}
                  value={form.destination}
                  setter={(v) => set('destination', v)}
                  options={destinationOptions}
                  placeholder="Destination..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SpringModal>
  )
}

// ── Transfer detail view ──────────────────────────────
function TransferDetail({ transfer, onBack, onRefresh, isAdmin }) {
  const [loading, setLoading] = useState(false)

  const act = async (fn, label) => {
    if (!isAdmin && (label === 'Validate' || label === 'Cancel')) return
    if (!window.confirm(`${label} this transfer?`)) return
    setLoading(true)
    try   { await fn(transfer.id); onRefresh() }
    catch (e) { alert(e.response?.data?.detail || `${label} failed`) }
    finally   { setLoading(false) }
  }

  const canAct = transfer.status === 'draft' && isAdmin

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="page-container"
    >
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 theme-text-faint hover:theme-text hover:bg-emerald-500/10 rounded-lg transition-all"><ChevronLeft size={16} /></button>
        <span className="text-sm theme-text-faint">Transfers</span>
        <span className="theme-text-faint">/</span>
        <span className="text-sm theme-text mono">{transfer.reference}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h2 className="text-lg font-semibold theme-text mono">{transfer.reference}</h2>
                  {STATUS_BADGE[transfer.status] || <span className="badge-draft">{transfer.status}</span>}
                </div>
                <p className="text-sm theme-text-muted">Transfer #{transfer.id}</p>
              </div>
              {canAct && (
                <div className="flex gap-2">
                  <button onClick={() => act(transfersAPI.validate, 'Validate')} disabled={loading} className="btn-primary btn-sm"><CheckCircle2 size={13} /> Validate</button>
                  <button onClick={() => act(transfersAPI.cancel, 'Cancel')} disabled={loading} className="btn-danger btn-sm"><XCircle size={13} /> Cancel</button>
                </div>
              )}
            </div>
            
            <div className="p-4 theme-bg-hover rounded-lg border theme-border mb-5">
              {[
                { label: 'Scheduled Date',   value: transfer.schedule_date, icon: Calendar },
                { label: 'From Location',    value: transfer.from_location, icon: null     },
                { label: 'To Location',      value: transfer.to_location,   icon: null     },
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

            <table className="w-full border-t theme-border mt-2">
              <thead>
                <tr className="border-b theme-border"><th className="table-head">Product</th><th className="table-head">SKU</th><th className="table-head">Quantity</th></tr>
              </thead>
              <tbody>
                {(transfer.lines || []).length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8 text-sm theme-text-muted">No product lines</td></tr>
                ) : transfer.lines.map((l, i) => (
                  <tr key={i} className="theme-border-subtle hover:bg-emerald-500/[0.02]">
                    <td className="table-cell theme-text font-medium">{l.product_name}</td>
                    <td className="table-cell theme-text-faint mono text-xs">{l.product_sku}</td>
                    <td className="table-cell theme-text font-semibold">{l.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5 h-fit">
          <h3 className="text-sm font-semibold theme-text mb-4">Status</h3>
          {['Draft', 'Done'].map((s, i) => {
            const order = ['draft', 'done']
            const curr  = order.indexOf(transfer.status)
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
          {transfer.status === 'cancelled' && (
            <div className="mt-3 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-xs text-red-400">✕</div>
              <span className="text-sm text-red-400 font-medium">Cancelled</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Transfers list page ──────────────────────────────
export default function Transfers() {
  const { user } = useAuth()
  const isAdmin = user?.username === 'AdminID' || user?.role === 'admin' || user?.isStaff

  const [transfers, setTransfers] = useState([])
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [nextUrl, setNextUrl]     = useState(null)
  const [prevUrl, setPrevUrl]     = useState(null)
  const [count, setCount]         = useState(0)
  const [page, setPage]           = useState(1)
  const doneCount = transfers.filter(t => t.status === 'done').length
  const draftCount = transfers.filter(t => t.status === 'draft').length

  const fetchTransfers = async (pageNum = 1) => {
    setLoading(true); setError('')
    try {
      const { data } = await transfersAPI.getAll({
        ...(search       ? { search }               : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        page: pageNum,
      })
      setTransfers(data.results || data)
      setNextUrl(data.next     || null)
      setPrevUrl(data.previous || null)
      setCount(data.count      || 0)
      setPage(pageNum)
    } catch { setError('Failed to load transfers') }
    finally   { setLoading(false) }
  }

  useEffect(() => { fetchTransfers(1) }, [])

  const openDetail = async (id) => {
    try { const { data } = await transfersAPI.getOne(id); setSelectedTransfer(data) }
    catch { alert('Could not load transfer') }
  }

  const refreshDetail = async () => {
    if (!selectedTransfer) return
    try { const { data } = await transfersAPI.getOne(selectedTransfer.id); setSelectedTransfer(data); fetchTransfers(page) }
    catch {}
  }

  return (
    <div className="page-container">
      <AnimatePresence mode="wait">
        {selectedTransfer ? (
          <TransferDetail 
            key="detail"
            transfer={selectedTransfer} 
            onBack={() => { setSelectedTransfer(null); fetchTransfers(page) }}
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
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card p-4 text-center">
                <p className="text-2xl font-black text-emerald-500">{count}</p>
                <p className="text-[10px] font-bold theme-text-faint uppercase tracking-widest mt-1">Total Transfers</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-black text-emerald-400">{doneCount}</p>
                <p className="text-[10px] font-bold theme-text-faint uppercase tracking-widest mt-1">Completed</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-black text-amber-400">{draftCount}</p>
                <p className="text-[10px] font-bold theme-text-faint uppercase tracking-widest mt-1">Processing</p>
              </div>
            </div>

            <div className="page-header flex-wrap gap-4">
              <div>
                <h1 className="page-title">Internal Transfers</h1>
                <p className="page-subtitle">Move stock between locations · {count} total</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => fetchTransfers(page)} className="btn-secondary btn-sm">
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                </button>
                {isAdmin && (
                  <button onClick={() => setShowModal(true)} className="btn-primary btn-sm">
                    <Plus size={13} /> New Transfer
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-faint" />
                <input className="input pl-9" placeholder="Search by reference, product, or location..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTransfers(1)} />
              </div>
              <CustomDropdown 
                icon={<TrendingUp size={14} />}
                value={statusFilter} 
                setter={(v) => { setStatus(v); fetchTransfers(1) }} 
                options={[
                  { id: 'DRAFT',     name: 'Draft' },
                  { id: 'DONE',      name: 'Done' },
                  { id: 'CANCELLED', name: 'Cancelled' }
                ]} 
                placeholder="All Status" 
              />
              <button onClick={() => fetchTransfers(1)} className="btn-secondary btn-sm h-11 px-4"><Filter size={12} /> Apply</button>
            </div>

            {error && <div className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/15 text-red-400 text-sm rounded-xl px-4 py-3 mb-5"><AlertCircle size={13} /> {error}</div>}

            <div className="card overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="border-b theme-border-subtle">
                    <th className="table-head"><span className="flex items-center gap-1">Reference</span></th>
                    <th className="table-head">Origins</th>
                    <th className="table-head">Destination</th>
                    <th className="table-head">Item Catalog</th>
                    <th className="table-head text-right">Volume</th>
                    <th className="table-head text-right">Activity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border-subtle">
                  {loading ? (
                    <tr><td colSpan={6}><div className="flex items-center justify-center py-16 gap-2 theme-text-muted text-sm"><RefreshCw size={14} className="animate-spin" /> Loading...</div></td></tr>
                  ) : transfers.length === 0 ? (
                    <tr><td colSpan={6}><div className="text-center py-16"><ArrowRightLeft size={32} className="theme-text-faint mx-auto mb-3 opacity-30" /><p className="text-sm theme-text-muted">No transfers found</p><p className="text-xs theme-text-faint mt-1">Click "New Transfer" to create one</p></div></td></tr>
                  ) : transfers.map((t) => (
                    <motion.tr 
                      key={t.id} 
                      whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.03)' }}
                      className="cursor-pointer transition-colors" 
                      onClick={() => openDetail(t.id)}
                    >
                      <td className="px-5 py-3.5 text-sm">
                        <span className="text-emerald-400 font-bold mono">● </span>
                        <span className="text-blue-400 font-semibold mono">{t.reference}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold theme-text uppercase tracking-tight">{t.from_location || '—'}</td>
                      <td className="px-5 py-3.5 text-xs font-bold theme-text uppercase tracking-tight">{t.to_location || '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="theme-text-secondary font-semibold text-sm">{t.product_name}</span>
                          <span className="theme-text-faint text-[10px]">System SKU ID: {t.product}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`mono font-black bg-gray-500/10 px-3 py-1 rounded-lg ${t.quantity > 0 ? 'text-emerald-500' : t.quantity < 0 ? 'text-red-500' : 'theme-text'}`}>
                          {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">{STATUS_BADGE[t.status] || t.status}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(prevUrl || nextUrl) && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs theme-text-faint">Page {page} · {count} total</p>
                <div className="flex gap-2">
                  <button onClick={() => fetchTransfers(page - 1)} disabled={!prevUrl} className="btn-secondary btn-sm disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={13} /> Previous</button>
                  <button onClick={() => fetchTransfers(page + 1)} disabled={!nextUrl} className="btn-secondary btn-sm disabled:opacity-30 disabled:cursor-not-allowed">Next <ChevronRight size={13} /></button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <NewTransferModal 
            onClose={() => setShowModal(false)} 
            onCreated={() => { setShowModal(false); fetchTransfers(1) }} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}
