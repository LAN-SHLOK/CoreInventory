import { useState, useEffect } from 'react'
import { stockAPI } from '../../api'
import {
  Search, RefreshCw, Boxes, AlertCircle,
  Edit2, Check, X, TrendingDown, TrendingUp, Filter
} from 'lucide-react'

function StockLevel({ onHand }) {
  if (onHand === undefined || onHand === null) return <span className="text-gray-700">—</span>
  const level = onHand > 50 ? 'high' : onHand > 10 ? 'mid' : 'low'
  const bar = { high: 'bg-emerald-500', mid: 'bg-amber-500', low: 'bg-red-500' }
  const pct = Math.min(100, (onHand / 100) * 100)
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm text-gray-200 mono tabular-nums w-10 text-right">{onHand}</span>
      <div className="flex-1 h-1.5 bg-[#1a1d24] rounded-full overflow-hidden w-16">
        <div className={`h-full rounded-full transition-all ${bar[level]}`} style={{ width: `${pct}%` }} />
      </div>
      {level === 'low' && <TrendingDown size={11} className="text-red-400 flex-shrink-0" />}
      {level === 'high' && <TrendingUp size={11} className="text-emerald-400 flex-shrink-0" />}
    </div>
  )
}

function EditableCell({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  const save = async () => {
    try { await onSave(Number(val)); setEditing(false) }
    catch { alert('Failed to update') }
  }

  if (editing) return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        className="input-sm w-20"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        autoFocus
        min={0}
      />
      <button onClick={save} className="text-emerald-400 hover:text-emerald-300 p-0.5">
        <Check size={12} />
      </button>
      <button onClick={() => setEditing(false)} className="text-gray-600 hover:text-gray-400 p-0.5">
        <X size={12} />
      </button>
    </div>
  )

  return (
    <div className="flex items-center gap-2 group">
      <StockLevel onHand={value} />
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-gray-400 transition-all p-0.5"
        title="Edit stock"
      >
        <Edit2 size={11} />
      </button>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [stock, setStock] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const [pRes, sRes] = await Promise.all([
        stockAPI.getProducts(),
        stockAPI.getStockEntries(),
      ])
      setProducts(pRes.data.results || pRes.data)
      setStock(sRes.data.results || sRes.data)
    } catch { setError('Failed to load stock data') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const merged = products
    .filter(p => !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    )
    .map(p => ({ ...p, entry: stock.find(s => s.product === p.id) || {} }))

  const totalValue = merged.reduce((acc, p) => acc + ((p.entry?.on_hand || 0) * (p.unit_cost || 0)), 0)
  const lowStock = merged.filter(p => (p.entry?.on_hand || 0) <= 10).length

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Stock</h1>
          <p className="page-subtitle">Products and inventory levels · hover a row to edit qty</p>
        </div>
        <button onClick={fetchData} className="btn-secondary btn-sm">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Products', value: merged.length, color: 'text-white' },
          { label: 'Low Stock',      value: lowStock,       color: 'text-red-400' },
          { label: 'Total Value',    value: `₹${totalValue.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
          { label: 'In Stock',       value: merged.filter(p => (p.entry?.on_hand || 0) > 0).length, color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-4 py-3">
            <p className={`text-lg font-bold ${color} tabular-nums`}>{value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            className="input pl-9"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary btn-sm">
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
              <th className="table-head">Product</th>
              <th className="table-head">SKU</th>
              <th className="table-head">Unit Cost</th>
              <th className="table-head">On Hand</th>
              <th className="table-head">Free to Use</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>
                <div className="flex items-center justify-center py-16 gap-2 text-gray-600 text-sm">
                  <RefreshCw size={14} className="animate-spin" /> Loading stock...
                </div>
              </td></tr>
            ) : merged.length === 0 ? (
              <tr><td colSpan={5}>
                <div className="text-center py-16">
                  <Boxes size={32} className="text-gray-800 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No products found</p>
                  <p className="text-xs text-gray-700 mt-1">Connect the backend to see stock data</p>
                </div>
              </td></tr>
            ) : merged.map((p) => (
              <tr key={p.id} className="border-b border-[#1a1d24] hover:bg-[#13151c] transition-colors">
                <td className="table-cell font-medium text-gray-200">{p.name}</td>
                <td className="table-cell mono text-xs text-gray-500">{p.sku || '—'}</td>
                <td className="table-cell text-gray-300 mono">
                  {p.unit_cost != null ? `₹${Number(p.unit_cost).toLocaleString('en-IN')}` : '—'}
                </td>
                <td className="table-cell">
                  {p.entry?.id
                    ? <EditableCell
                        value={p.entry.on_hand}
                        onSave={(val) => stockAPI.updateStock(p.entry.id, { on_hand: val }).then(fetchData)}
                      />
                    : <span className="text-gray-700 text-sm">—</span>
                  }
                </td>
                <td className="table-cell mono text-gray-400">{p.entry?.free_to_use ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}