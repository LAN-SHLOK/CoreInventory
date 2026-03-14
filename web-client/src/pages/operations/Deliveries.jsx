import { useState, useEffect } from 'react'
import { deliveriesAPI } from '../../api'
import {
  Search, Plus, CheckCircle2, XCircle, ChevronLeft,
  AlertCircle, RefreshCw, Truck, Calendar,
  User, MapPin, Filter, ArrowUpDown
} from 'lucide-react'

const STATUS_BADGE = {
  draft:     <span className="badge-draft"><span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />Draft</span>,
  ready:     <span className="badge-ready"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />Ready</span>,
  done:      <span className="badge-done"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />Done</span>,
  cancelled: <span className="badge-cancelled"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" />Cancelled</span>,
}

function DeliveryDetail({ delivery, onBack, onRefresh }) {
  const [loading, setLoading] = useState(false)

  const act = async (fn, label) => {
    if (!window.confirm(`${label} this delivery?`)) return
    setLoading(true)
    try { await fn(delivery.id); onRefresh() }
    catch (e) { alert(e.response?.data?.detail || `${label} failed`) }
    finally { setLoading(false) }
  }

  const canAct = delivery.status === 'draft' || delivery.status === 'ready'

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-ghost btn-sm">
          <ChevronLeft size={14} /> Back
        </button>
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
                  <h2 className="text-lg font-semibold text-white mono">{delivery.reference}</h2>
                  {STATUS_BADGE[delivery.status]}
                </div>
                <p className="text-sm text-gray-600">Delivery #{delivery.id}</p>
              </div>
              {canAct && (
                <div className="flex gap-2">
                  <button onClick={() => act(deliveriesAPI.validate, 'Validate')} disabled={loading} className="btn-primary btn-sm">
                    <CheckCircle2 size={13} /> Validate
                  </button>
                  <button onClick={() => act(deliveriesAPI.cancel, 'Cancel')} disabled={loading} className="btn-danger btn-sm">
                    <XCircle size={13} /> Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-6">
              {[
                { label: 'Delivery Address', value: delivery.address, icon: MapPin },
                { label: 'Scheduled Date', value: delivery.scheduled_date, icon: Calendar },
                { label: 'Responsible', value: delivery.responsible_name, icon: User },
                { label: 'Operation Type', value: delivery.operation_type, icon: Truck },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3 py-3 border-b border-[#1a1d24] last:border-0">
                  <Icon size={13} className="text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">{label}</p>
                    <p className="text-sm text-gray-200">{value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                {(delivery.lines || []).length === 0 ? (
                  <tr><td colSpan={2} className="text-center py-8 text-sm text-gray-600">No product lines</td></tr>
                ) : delivery.lines.map((l, i) => (
                  <tr key={i} className="border-b border-[#1a1d24] last:border-0">
                    <td className="table-cell text-gray-300">{l.product_name}</td>
                    <td className="table-cell text-gray-400">{l.quantity} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5 h-fit">
          <h3 className="text-sm font-semibold text-white mb-4">Status Timeline</h3>
          {['Draft', 'Ready', 'Done'].map((s, i) => {
            const order = ['draft', 'ready', 'done']
            const curr = order.indexOf(delivery.status)
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
        </div>
      </div>
    </div>
  )
}

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  const fetchDeliveries = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await deliveriesAPI.getAll({ search })
      setDeliveries(data.results || data)
    } catch { setError('Failed to load deliveries') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDeliveries() }, [])

  const openDetail = async (id) => {
    try {
      const { data } = await deliveriesAPI.getOne(id)
      setSelected(data)
    } catch { alert('Could not load delivery') }
  }

  const refreshDetail = async () => {
    if (!selected) return
    try {
      const { data } = await deliveriesAPI.getOne(selected.id)
      setSelected(data); fetchDeliveries()
    } catch {}
  }

  if (selected) return (
    <DeliveryDetail delivery={selected} onBack={() => { setSelected(null); fetchDeliveries() }} onRefresh={refreshDetail} />
  )

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Deliveries</h1>
          <p className="page-subtitle">Outgoing stock operations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDeliveries} className="btn-secondary btn-sm">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="btn-primary btn-sm">
            <Plus size={13} /> New Delivery
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            className="input pl-9"
            placeholder="Search by reference or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDeliveries()}
          />
        </div>
        <button onClick={fetchDeliveries} className="btn-secondary btn-sm">
          <Filter size={12} /> Filter
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
              <th className="table-head">Address</th>
              <th className="table-head">Scheduled</th>
              <th className="table-head">Responsible</th>
              <th className="table-head">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>
                <div className="flex items-center justify-center py-16 gap-2 text-gray-600 text-sm">
                  <RefreshCw size={14} className="animate-spin" /> Loading deliveries...
                </div>
              </td></tr>
            ) : deliveries.length === 0 ? (
              <tr><td colSpan={5}>
                <div className="text-center py-16">
                  <Truck size={32} className="text-gray-800 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No deliveries found</p>
                  <p className="text-xs text-gray-700 mt-1">Connect the backend to see data</p>
                </div>
              </td></tr>
            ) : deliveries.map((d) => (
              <tr key={d.id} className="table-row" onClick={() => openDetail(d.id)}>
                <td className="table-cell font-medium text-emerald-400 mono">{d.reference}</td>
                <td className="table-cell text-gray-300">{d.address || '—'}</td>
                <td className="table-cell text-gray-500">{d.scheduled_date || '—'}</td>
                <td className="table-cell text-gray-500">{d.responsible_name || '—'}</td>
                <td className="table-cell">{STATUS_BADGE[d.status] || d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}