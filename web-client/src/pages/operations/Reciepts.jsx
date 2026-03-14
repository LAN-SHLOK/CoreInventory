import { useState, useEffect } from 'react'
import { receiptsAPI, productsAPI, locationsAPI } from '../../api'
import {
  Search, Plus, CheckCircle2, XCircle, ChevronLeft,
  ChevronRight, AlertCircle, RefreshCw, PackageOpen,
  Calendar, User, Filter, ArrowUpDown, X
} from 'lucide-react'

const STATUS_BADGE = {
  draft:     <span className="badge-draft"><span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />Draft</span>,
  done:      <span className="badge-done"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />Done</span>,
  cancelled: <span className="badge-cancelled"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" />Cancelled</span>,
}

// ── New Receipt Modal ─────────────────────────────────
function NewReceiptModal({ onClose, onCreated }) {
  const [products,  setProducts]  = useState([])
  const [locations, setLocations] = useState([])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const [form, setForm] = useState({
    product:       '',
    quantity:      '',
    destination:   '',
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
      // POST /api/movements/ — movement_type=RECEIPT added by receiptsAPI.create
      // Staff users get 403 → api.js interceptor fires global 'access-denied' event
      await receiptsAPI.create({
        product:       Number(form.product),
        quantity:      Number(form.quantity),
        destination:   form.destination   ? Number(form.destination) : null,
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
        setError(e.response?.data?.detail || 'Failed to create receipt')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f1117] border border-[#1a1d24] rounded-2xl w-full max-w-lg mx-4 shadow-2xl animate-fade-in">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1d24]">
          <div>
            <h2 className="text-sm font-semibold text-white">New Receipt</h2>
            <p className="text-xs text-gray-600 mt-0.5">Incoming stock movement</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/15 text-red-400 text-xs rounded-lg px-3 py-2">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Product <span className="text-red-400">*</span></label>
            <select className="input w-full" value={form.product} onChange={(e) => set('product', e.target.value)}>
              <option value="">Select a product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.sku}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Quantity <span className="text-red-400">*</span></label>
            <input
              type="number" min={1} className="input w-full" placeholder="e.g. 100"
              value={form.quantity} onChange={(e) => set('quantity', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Destination Location</label>
            <select className="input w-full" value={form.destination} onChange={(e) => set('destination', e.target.value)}>
              <option value="">Select location...</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Vendor / Contact</label>
            <input
              type="text" className="input w-full" placeholder="e.g. Tata Steel Ltd"
              value={form.contact} onChange={(e) => set('contact', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Schedule Date</label>
            <input
              type="date" className="input w-full"
              value={form.schedule_date} onChange={(e) => set('schedule_date', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Remarks</label>
            <textarea
              className="input w-full resize-none" rows={2} placeholder="Optional notes..."
              value={form.remarks} onChange={(e) => set('remarks', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#1a1d24]">
          <button onClick={onClose} className="btn-ghost btn-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary btn-sm">
            {saving
              ? <><RefreshCw size={12} className="animate-spin" /> Saving...</>
              : <><Plus size={12} /> Create Receipt</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Receipt detail view ───────────────────────────────
function ReceiptDetail({ receipt, onBack, onRefresh }) {
  const [loading, setLoading] = useState(false)

  const act = async (fn, label) => {
    if (!window.confirm(`${label} this receipt?`)) return
    setLoading(true)
    try   { await fn(receipt.id); onRefresh() }
    catch (e) { alert(e.response?.data?.detail || `${label} failed`) }
    finally   { setLoading(false) }
  }

  const canAct = receipt.status === 'draft'

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-ghost btn-sm"><ChevronLeft size={14} /> Back</button>
        <span className="text-gray-700">/</span>
        <span className="text-sm text-gray-400">Receipts</span>
        <span className="text-gray-700">/</span>
        <span className="text-sm text-gray-300 mono">{receipt.reference}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h2 className="text-lg font-semibold text-white mono">{receipt.reference}</h2>
                  {STATUS_BADGE[receipt.status] || <span className="badge-draft">{receipt.status}</span>}
                </div>
                <p className="text-sm text-gray-600">Receipt #{receipt.id}</p>
              </div>
              {canAct && (
                <div className="flex gap-2">
                  <button onClick={() => act(receiptsAPI.validate, 'Validate')} disabled={loading} className="btn-primary btn-sm">
                    <CheckCircle2 size={13} /> Validate
                  </button>
                  <button onClick={() => act(receiptsAPI.cancel, 'Cancel')} disabled={loading} className="btn-danger btn-sm">
                    <XCircle size={13} /> Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-6">
              {[
                { label: 'Vendor / Contact', value: receipt.contact,       icon: User     },
                { label: 'Scheduled Date',   value: receipt.schedule_date, icon: Calendar },
                { label: 'From Location',    value: receipt.from_location, icon: null     },
                { label: 'To Location',      value: receipt.to_location,   icon: null     },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3 py-3 border-b border-[#1a1d24] last:border-0">
                  {Icon && <Icon size={13} className="text-gray-600 mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">{label}</p>
                    <p className="text-sm text-gray-200">{value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
            {receipt.remarks && (
              <div className="mt-4 p-3 bg-[#1a1d24] rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Notes / Remarks</p>
                <p className="text-sm text-gray-300">{receipt.remarks}</p>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1d24]">
              <h3 className="text-sm font-semibold text-white">Product Lines</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1d24]">
                  <th className="table-head">Product</th>
                  <th className="table-head">SKU</th>
                  <th className="table-head">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {(receipt.lines || []).length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8 text-sm text-gray-600">No product lines</td></tr>
                ) : receipt.lines.map((l, i) => (
                  <tr key={i} className="border-b border-[#1a1d24] last:border-0">
                    <td className="table-cell text-gray-300">{l.product_name}</td>
                    <td className="table-cell mono text-xs text-gray-500">{l.product_sku || '—'}</td>
                    <td className="table-cell text-gray-400">{l.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5 h-fit">
          <h3 className="text-sm font-semibold text-white mb-4">Status</h3>
          {['Draft', 'Done'].map((s, i) => {
            const order = ['draft', 'done']
            const curr  = order.indexOf(receipt.status)
            const isDone = i < curr, isActive = i === curr
            return (
              <div key={s} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-xs ${
                  isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                  isActive ? 'bg-blue-500/20 border-blue-500 text-blue-400' :
                  'bg-[#1a1d24] border-[#2a2d35] text-gray-700'
                }`}>{isDone ? '✓' : i + 1}</div>
                <span className={`text-sm ${isActive ? 'text-white font-medium' : isDone ? 'text-gray-400' : 'text-gray-700'}`}>{s}</span>
              </div>
            )
          })}
          {receipt.status === 'cancelled' && (
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

// ── Receipts list page ────────────────────────────────
export default function Receipts() {
  const [receipts, setReceipts]   = useState([])
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [selected, setSelected]   = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [nextUrl, setNextUrl]     = useState(null)
  const [prevUrl, setPrevUrl]     = useState(null)
  const [count, setCount]         = useState(0)
  const [page, setPage]           = useState(1)

  const fetchReceipts = async (pageNum = 1) => {
    setLoading(true); setError('')
    try {
      const { data } = await receiptsAPI.getAll({
        ...(search       ? { search }               : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        page: pageNum,
      })
      setReceipts(data.results || data)
      setNextUrl(data.next     || null)
      setPrevUrl(data.previous || null)
      setCount(data.count      || 0)
      setPage(pageNum)
    } catch { setError('Failed to load receipts') }
    finally   { setLoading(false) }
  }

  useEffect(() => { fetchReceipts(1) }, [])

  const openDetail = async (id) => {
    try { const { data } = await receiptsAPI.getOne(id); setSelected(data) }
    catch { alert('Could not load receipt') }
  }

  const refreshDetail = async () => {
    if (!selected) return
    try { const { data } = await receiptsAPI.getOne(selected.id); setSelected(data); fetchReceipts(page) }
    catch {}
  }

  if (selected) return (
    <ReceiptDetail receipt={selected} onBack={() => { setSelected(null); fetchReceipts(page) }} onRefresh={refreshDetail} />
  )

  return (
    <div className="page-container animate-fade-in">
      {showModal && <NewReceiptModal onClose={() => setShowModal(false)} onCreated={() => fetchReceipts(1)} />}

      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Receipts</h1>
          <p className="page-subtitle">Incoming stock operations · {count} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchReceipts(page)} className="btn-secondary btn-sm">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary btn-sm">
            <Plus size={13} /> New Receipt
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input className="input pl-9" placeholder="Search by reference or contact..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReceipts(1)} />
        </div>
        <select className="input w-36" value={statusFilter}
          onChange={(e) => { setStatus(e.target.value); fetchReceipts(1) }}>
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button onClick={() => fetchReceipts(1)} className="btn-secondary btn-sm">
          <Filter size={12} /> Apply
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/15 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1a1d24]">
              <th className="table-head"><span className="flex items-center gap-1">Reference <ArrowUpDown size={10} /></span></th>
              <th className="table-head">Contact</th>
              <th className="table-head">Product</th>
              <th className="table-head">Qty</th>
              <th className="table-head">Schedule Date</th>
              <th className="table-head">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="flex items-center justify-center py-16 gap-2 text-gray-600 text-sm"><RefreshCw size={14} className="animate-spin" /> Loading receipts...</div></td></tr>
            ) : receipts.length === 0 ? (
              <tr><td colSpan={6}><div className="text-center py-16"><PackageOpen size={32} className="text-gray-800 mx-auto mb-3" /><p className="text-sm text-gray-600">No receipts found</p><p className="text-xs text-gray-700 mt-1">Click "New Receipt" to create one</p></div></td></tr>
            ) : receipts.map((r) => (
              <tr key={r.id} className="table-row" onClick={() => openDetail(r.id)}>
                <td className="table-cell font-medium text-emerald-400 mono">{r.reference}</td>
                <td className="table-cell text-gray-300">{r.contact}</td>
                <td className="table-cell text-gray-300">{r.product_name}</td>
                <td className="table-cell mono text-gray-400">{r.quantity}</td>
                <td className="table-cell text-gray-500">{r.schedule_date}</td>
                <td className="table-cell">{STATUS_BADGE[r.status] || r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(prevUrl || nextUrl) && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-gray-600">Page {page} · {count} total</p>
          <div className="flex gap-2">
            <button onClick={() => fetchReceipts(page - 1)} disabled={!prevUrl} className="btn-secondary btn-sm disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={13} /> Previous</button>
            <button onClick={() => fetchReceipts(page + 1)} disabled={!nextUrl} className="btn-secondary btn-sm disabled:opacity-30 disabled:cursor-not-allowed">Next <ChevronRight size={13} /></button>
          </div>
        </div>
      )}
    </div>
  )
}