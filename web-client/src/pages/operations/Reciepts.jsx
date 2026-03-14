import { useState, useEffect } from 'react'
import { receiptsAPI } from '../../api'
import {
  Search, Plus, CheckCircle2, XCircle, ChevronLeft,
  AlertCircle, RefreshCw, PackageOpen, Calendar,
  User, Hash, Filter, ArrowUpDown
} from 'lucide-react'

const STATUS_BADGE = {
  draft:     <span className="badge-draft"><span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />Draft</span>,
  ready:     <span className="badge-ready"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />Ready</span>,
  done:      <span className="badge-done"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />Done</span>,
  cancelled: <span className="badge-cancelled"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" />Cancelled</span>,
}

function DetailRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#1a1d24] last:border-0">
      {Icon && <Icon size={13} className="text-gray-600 mt-0.5 flex-shrink-0" />}
      <div className="flex-1">
        <p className="text-xs text-gray-600 mb-0.5">{label}</p>
        <p className="text-sm text-gray-200">{value || '—'}</p>
      </div>
    </div>
  )
}

function ReceiptDetail({ receipt, onBack, onRefresh }) {
  const [loading, setLoading] = useState(false)

  const act = async (fn, label) => {
    if (!window.confirm(`${label} this receipt?`)) return
    setLoading(true)
    try { await fn(receipt.id); onRefresh() }
    catch (e) { alert(e.response?.data?.detail || `${label} failed`) }
    finally { setLoading(false) }
  }

  const canAct = receipt.status === 'draft' || receipt.status === 'ready'

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-ghost btn-sm">
          <ChevronLeft size={14} /> Back
        </button>
        <span className="text-gray-700">/</span>
        <span className="text-sm text-gray-400">Receipts</span>
        <span className="text-gray-700">/</span>
        <span className="text-sm text-gray-300 mono">{receipt.reference}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h2 className="text-lg font-semibold text-white mono">{receipt.reference}</h2>
                  {STATUS_BADGE[receipt.status]}
                </div>
                <p className="text-sm text-gray-600">Receipt #{receipt.id}</p>
              </div>
              {canAct && (
                <div className="flex gap-2">
                  <button
                    onClick={() => act(receiptsAPI.validate, 'Validate')}
                    disabled={loading}
                    className="btn-primary btn-sm"
                  >
                    <CheckCircle2 size={13} /> Validate
                  </button>
                  <button
                    onClick={() => act(receiptsAPI.cancel, 'Cancel')}
                    disabled={loading}
                    className="btn-danger btn-sm"
                  >
                    <XCircle size={13} /> Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-6">
              <DetailRow label="Vendor" value={receipt.vendor_name} icon={User} />
              <DetailRow label="Deadline" value={receipt.deadline} icon={Calendar} />
              <DetailRow label="Responsible" value={receipt.responsible_name} icon={User} />
              <DetailRow label="Scheduled Date" value={receipt.scheduled_date} icon={Calendar} />
            </div>
          </div>

          {/* Lines */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1a1d24]">
              <h3 className="text-sm font-semibold text-white">Product Lines</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1d24]">
                  <th className="table-head">Product</th>
                  <th className="table-head">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {(receipt.lines || []).length === 0 ? (
                  <tr><td colSpan={2} className="text-center py-8 text-sm text-gray-600">No product lines</td></tr>
                ) : receipt.lines.map((l, i) => (
                  <tr key={i} className="border-b border-[#1a1d24] last:border-0">
                    <td className="table-cell text-gray-300">{l.product_name}</td>
                    <td className="table-cell text-gray-400">{l.quantity} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side info */}
        <div className="card p-5 h-fit">
          <h3 className="text-sm font-semibold text-white mb-4">Status Timeline</h3>
          {['Draft', 'Ready', 'Done'].map((s, i) => {
            const statusOrder = ['draft', 'ready', 'done']
            const current = statusOrder.indexOf(receipt.status)
            const isDone = i < current
            const isActive = i === current
            return (
              <div key={s} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-xs ${
                  isDone    ? 'bg-emerald-500 border-emerald-500 text-white' :
                  isActive  ? 'bg-blue-500/20 border-blue-500 text-blue-400' :
                              'bg-[#1a1d24] border-[#2a2d35] text-gray-700'
                }`}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${isActive ? 'text-white font-medium' : isDone ? 'text-gray-400' : 'text-gray-700'}`}>{s}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Receipts() {
  const [receipts, setReceipts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  const fetchReceipts = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await receiptsAPI.getAll({ search })
      setReceipts(data.results || data)
    } catch { setError('Failed to load receipts') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReceipts() }, [])

  const openDetail = async (id) => {
    try {
      const { data } = await receiptsAPI.getOne(id)
      setSelected(data)
    } catch { alert('Could not load receipt') }
  }

  const refreshDetail = async () => {
    if (!selected) return
    try {
      const { data } = await receiptsAPI.getOne(selected.id)
      setSelected(data)
      fetchReceipts()
    } catch {}
  }

  if (selected) return (
    <ReceiptDetail receipt={selected} onBack={() => { setSelected(null); fetchReceipts() }} onRefresh={refreshDetail} />
  )

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Receipts</h1>
          <p className="page-subtitle">Incoming stock operations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchReceipts} className="btn-secondary btn-sm">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="btn-primary btn-sm">
            <Plus size={13} /> New Receipt
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            className="input pl-9"
            placeholder="Search by reference or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReceipts()}
          />
        </div>
        <button onClick={fetchReceipts} className="btn-secondary btn-sm">
          <Filter size={12} /> Filter
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/15 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1a1d24]">
              <th className="table-head"><span className="flex items-center gap-1">Reference <ArrowUpDown size={10} /></span></th>
              <th className="table-head">Vendor</th>
              <th className="table-head">Deadline</th>
              <th className="table-head">Scheduled</th>
              <th className="table-head">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>
                <div className="flex items-center justify-center py-16 gap-2 text-gray-600 text-sm">
                  <RefreshCw size={14} className="animate-spin" /> Loading receipts...
                </div>
              </td></tr>
            ) : receipts.length === 0 ? (
              <tr><td colSpan={5}>
                <div className="text-center py-16">
                  <PackageOpen size={32} className="text-gray-800 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No receipts found</p>
                  <p className="text-xs text-gray-700 mt-1">Connect the backend to see data</p>
                </div>
              </td></tr>
            ) : receipts.map((r) => (
              <tr key={r.id} className="table-row" onClick={() => openDetail(r.id)}>
                <td className="table-cell font-medium text-emerald-400 mono">{r.reference}</td>
                <td className="table-cell text-gray-300">{r.vendor_name || '—'}</td>
                <td className="table-cell text-gray-500">{r.deadline || '—'}</td>
                <td className="table-cell text-gray-500">{r.scheduled_date || '—'}</td>
                <td className="table-cell">{STATUS_BADGE[r.status] || r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}