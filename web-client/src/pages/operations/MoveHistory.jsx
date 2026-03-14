import { useState, useEffect } from 'react'
import { movesAPI } from '../../api'
import { Search, RefreshCw, History, AlertCircle, ArrowRight, Filter, ArrowUpDown } from 'lucide-react'

const STATUS_BADGE = {
  draft:     <span className="badge-draft"><span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />Draft</span>,
  ready:     <span className="badge-ready"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />Ready</span>,
  done:      <span className="badge-done"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />Done</span>,
  cancelled: <span className="badge-cancelled"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" />Cancelled</span>,
}

export default function MoveHistory() {
  const [moves, setMoves] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchMoves = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await movesAPI.getAll({ search })
      setMoves(data.results || data)
    } catch { setError('Failed to load move history') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMoves() }, [])

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Move History</h1>
          <p className="page-subtitle">All stock movements between locations</p>
        </div>
        <button onClick={fetchMoves} className="btn-secondary btn-sm">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Moves', value: moves.length },
          { label: 'Done', value: moves.filter(m => m.status === 'done').length },
          { label: 'Pending', value: moves.filter(m => m.status === 'ready' || m.status === 'draft').length },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3 flex items-center gap-3">
            <span className="text-xl font-bold text-white tabular-nums">{value}</span>
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            className="input pl-9"
            placeholder="Search by reference or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMoves()}
          />
        </div>
        <button onClick={fetchMoves} className="btn-secondary btn-sm">
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
              <th className="table-head">From</th>
              <th className="table-head"></th>
              <th className="table-head">To</th>
              <th className="table-head">Product</th>
              <th className="table-head">Qty</th>
              <th className="table-head">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>
                <div className="flex items-center justify-center py-16 gap-2 text-gray-600 text-sm">
                  <RefreshCw size={14} className="animate-spin" /> Loading moves...
                </div>
              </td></tr>
            ) : moves.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="text-center py-16">
                  <History size={32} className="text-gray-800 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No moves found</p>
                  <p className="text-xs text-gray-700 mt-1">Stock movements appear here after validation</p>
                </div>
              </td></tr>
            ) : moves.map((m) => (
              <tr key={m.id} className="border-b border-[#1a1d24] hover:bg-[#13151c] transition-colors">
                <td className="table-cell font-medium text-emerald-400 mono">{m.reference}</td>
                <td className="table-cell text-gray-400 text-xs">{m.from_location || '—'}</td>
                <td className="table-cell text-gray-700"><ArrowRight size={12} /></td>
                <td className="table-cell text-gray-400 text-xs">{m.to_location || '—'}</td>
                <td className="table-cell text-gray-200">{m.product_name}</td>
                <td className="table-cell text-gray-300 mono">{m.quantity}</td>
                <td className="table-cell">{STATUS_BADGE[m.status] || m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}