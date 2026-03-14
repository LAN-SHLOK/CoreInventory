import { useState, useEffect } from 'react'
import { productsAPI } from '../../api'
import {
  Search, RefreshCw, Boxes, AlertCircle,
  Edit2, Check, X, TrendingDown, TrendingUp,
  Filter, ChevronLeft, ChevronRight
} from 'lucide-react'

// ── Stock level bar ───────────────────────────────────
// Uses only current_stock — backend field name
function StockLevel({ current }) {
  if (current == null) return <span className="text-gray-700">—</span>
  const isLow  = current <= 10
  const isMid  = current <= 50
  const color  = isLow ? 'bg-red-500' : isMid ? 'bg-amber-500' : 'bg-emerald-500'
  const pct    = Math.min(100, (current / 100) * 100)

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm text-gray-200 mono tabular-nums w-10 text-right">{current}</span>
      <div className="flex-1 h-1.5 bg-[#1a1d24] rounded-full overflow-hidden w-16">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {isLow && <TrendingDown size={11} className="text-red-400 flex-shrink-0" />}
      {!isLow && !isMid && <TrendingUp size={11} className="text-emerald-400 flex-shrink-0" />}
    </div>
  )
}

// ── Inline editable stock cell ────────────────────────
function EditableStock({ productId, value, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(value)

  const save = async () => {
    try {
      // FIX: backend field is current_stock, not on_hand
      await productsAPI.updateStock(productId, Number(val))
      onSaved()
      setEditing(false)
    } catch {
      alert('Failed to update stock')
    }
  }

  if (editing) return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        className="input-sm w-20"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter')  save()
          if (e.key === 'Escape') setEditing(false)
        }}
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
      <StockLevel current={value} />
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

// ── Main Products page ────────────────────────────────
export default function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // Pagination — backend sends next/previous URLs + count
  const [nextUrl, setNextUrl]   = useState(null)
  const [prevUrl, setPrevUrl]   = useState(null)
  const [count, setCount]       = useState(0)
  const [page, setPage]         = useState(1)

  const fetchProducts = async (pageNum = 1) => {
    setLoading(true); setError('')
    try {
      // search  → SearchFilter on name, sku  (backend: search_fields = ['name', 'sku'])
      // category → DjangoFilterBackend       (backend: filterset_fields = ['category'])
      // page    → PageNumberPagination       (backend: PAGE_SIZE = 20)
      const { data } = await productsAPI.getAll({
        ...(search   ? { search }   : {}),
        ...(category ? { category } : {}),
        page: pageNum,
      })

      // Paginated response shape: { results: [], next, previous, count }
      setProducts(data.results || data)
      setNextUrl(data.next     || null)
      setPrevUrl(data.previous || null)
      setCount(data.count      || 0)
      setPage(pageNum)
    } catch {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts(1) }, [])

  // Low stock threshold = 10 (fixed, since reorder_level not in serializer)
  const lowStock = products.filter(p => p.current_stock <= 10).length

  return (
    <div className="page-container animate-fade-in">

      {/* Header */}
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Inventory catalogue · hover a row to edit stock qty</p>
        </div>
        <button onClick={() => fetchProducts(page)} className="btn-secondary btn-sm">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Products', value: count,                                            color: 'text-white'     },
          { label: 'Low Stock',      value: lowStock,                                         color: 'text-red-400'   },
          { label: 'This Page',      value: products.length,                                  color: 'text-blue-400'  },
          { label: 'In Stock',       value: products.filter(p => p.current_stock > 0).length, color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-4 py-3">
            <p className={`text-lg font-bold ${color} tabular-nums`}>{value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            className="input pl-9"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts(1)}
          />
        </div>
        {/* category filter → backend: filterset_fields = ['category'] */}
        <input
          className="input w-44"
          placeholder="Category filter..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchProducts(1)}
        />
        <button onClick={() => fetchProducts(1)} className="btn-secondary btn-sm">
          <Filter size={12} /> Apply
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
              {/* Only columns for fields backend actually sends */}
              <th className="table-head">Product</th>
              <th className="table-head">SKU</th>
              <th className="table-head">Category</th>
              <th className="table-head">Unit</th>
              <th className="table-head">On Hand</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>
                <div className="flex items-center justify-center py-16 gap-2 text-gray-600 text-sm">
                  <RefreshCw size={14} className="animate-spin" /> Loading products...
                </div>
              </td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5}>
                <div className="text-center py-16">
                  <Boxes size={32} className="text-gray-800 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No products found</p>
                  <p className="text-xs text-gray-700 mt-1">Try a different search or category</p>
                </div>
              </td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="border-b border-[#1a1d24] hover:bg-[#13151c] transition-colors">
                {/* p.name — backend field ✓ */}
                <td className="table-cell font-medium text-gray-200">{p.name}</td>
                {/* p.sku — backend field ✓ */}
                <td className="table-cell mono text-xs text-gray-500">{p.sku}</td>
                {/* p.category — backend field ✓ */}
                <td className="table-cell text-gray-400 text-sm">{p.category}</td>
                {/* p.unit_of_measure — backend field ✓ */}
                <td className="table-cell text-gray-400 text-sm">{p.unit_of_measure}</td>
                {/* p.current_stock — backend field ✓, editable inline */}
                <td className="table-cell">
                  <EditableStock
                    productId={p.id}
                    value={p.current_stock}
                    onSaved={() => fetchProducts(page)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination — next/previous from paginated response */}
      {(prevUrl || nextUrl) && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-gray-600">
            Page {page} · {count} total products
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchProducts(page - 1)}
              disabled={!prevUrl}
              className="btn-secondary btn-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={13} /> Previous
            </button>
            <button
              onClick={() => fetchProducts(page + 1)}
              disabled={!nextUrl}
              className="btn-secondary btn-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}