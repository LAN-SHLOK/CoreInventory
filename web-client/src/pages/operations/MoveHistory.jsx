import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { movesAPI } from '../../api'
import { AnimatedCard, StaggerContainer, StaggerItem } from '../../components/common/Motion'
import { Search, RefreshCw, History, AlertCircle, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_BADGE = {
  draft:     <span className="badge-draft"><span className="w-1.5 h-1.5 bg-gray-500 rounded-full" />Draft</span>,
  ready:     <span className="badge-ready"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />Ready</span>,
  done:      <span className="badge-done"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />Done</span>,
  cancelled: <span className="badge-cancelled"><span className="w-1.5 h-1.5 bg-red-400 rounded-full" />Cancelled</span>,
}

export default function MoveHistory() {
  const [moves, setMoves]       = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [page, setPage]         = useState(1)
  const [nextUrl, setNextUrl]   = useState(null)
  const [prevUrl, setPrevUrl]   = useState(null)
  const [count, setCount]       = useState(0)

  const fetchMoves = async (pageNum = 1) => {
    setLoading(true); setError('')
    try {
      const { data } = await movesAPI.getAll({
        ...(search ? { search } : {}),
        page: pageNum,
      })
      setMoves(data.results || data)
      setNextUrl(data.next     || null)
      setPrevUrl(data.previous || null)
      setCount(data.count      || 0)
      setPage(pageNum)
    } catch { setError('Failed to load move history') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMoves(1) }, [])

  const doneCount = moves.filter(m => m.status === 'done').length
  const processingCount = moves.filter(m => m.status === 'ready' || m.status === 'draft').length

  return (
    <div className="page-container">
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Inventory Ledger</h1>
          <p className="page-subtitle">Historical log of all internal stock movements · {count} total</p>
        </div>
        <button onClick={() => fetchMoves(page)} className="p-2 theme-text-faint hover:theme-text-primary transition-colors">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Operations', value: count, color: 'text-blue-500' },
          { label: 'Completed', value: doneCount, color: 'text-emerald-500' },
          { label: 'Processing', value: processingCount, color: 'text-amber-500' },
        ].map((stat, i) => (
          <AnimatedCard key={stat.label} delay={i * 0.1} className="p-4 flex flex-col justify-center items-center text-center">
            <span className={`text-2xl font-black ${stat.color} mb-1 tabular-nums`}>{stat.value}</span>
            <span className="text-[10px] theme-text-faint uppercase font-bold tracking-widest">{stat.label}</span>
          </AnimatedCard>
        ))}
      </div>

      <div className="flex gap-2 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-faint" />
          <input
            className="input pl-10 h-10"
            placeholder="Search by reference, product, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMoves(1)}
          />
        </div>
        <button onClick={() => fetchMoves(1)} className="btn-secondary h-10 px-6">
          <Filter size={14} />
        </button>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/15 text-red-400 text-sm rounded-xl px-4 py-3 mb-8">
          <AlertCircle size={14} /> {error}
        </motion.div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="border-b theme-border-subtle bg-gray-500/5">
                <th className="table-head py-4">Reference</th>
                <th className="table-head py-4">Origins</th>
                <th className="table-head py-4">Destination</th>
                <th className="table-head py-4">Item Catalog</th>
                <th className="table-head py-4">Volume</th>
                <th className="table-head py-4 text-right">Activity Status</th>
              </tr>
            </thead>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.tbody key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <tr><td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-24 gap-3 theme-text-muted">
                      <RefreshCw size={32} className="animate-spin opacity-20" />
                      <p className="text-sm font-medium">Syncing history...</p>
                    </div>
                  </td></tr>
                </motion.tbody>
              ) : moves.length === 0 ? (
                <motion.tbody key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <tr><td colSpan={6}>
                    <div className="text-center py-24">
                      <History size={48} className="theme-text-faint mx-auto mb-4 opacity-10" />
                      <p className="text-sm theme-text-muted font-medium">No movement records found</p>
                      <p className="text-xs theme-text-faint mt-1">Stock ledger entries appear after inventory operations</p>
                    </div>
                  </td></tr>
                </motion.tbody>
              ) : (
                <StaggerContainer component="tbody">
                  {moves.map((m) => (
                    <StaggerItem key={m.id} component="tr" className="table-row group hover:theme-bg-hover transition-colors">
                      <td className="table-cell font-black text-emerald-500 mono py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 group-hover:bg-emerald-500 transition-colors" />
                           {m.reference}
                        </div>
                      </td>
                      <td className="table-cell theme-text text-xs font-bold uppercase tracking-tight py-4">{m.from_location || 'EXTERNAL'}</td>
                      <td className="table-cell theme-text text-xs font-bold uppercase tracking-tight py-4">{m.to_location || 'EXTERNAL'}</td>
                      <td className="table-cell py-4">
                        <div className="flex flex-col">
                          <span className="theme-text-secondary font-bold text-sm tracking-tight">{m.product_name}</span>
                          <span className="text-[10px] theme-text-faint font-medium">System SKU ID: {m.product}</span>
                        </div>
                      </td>
                      <td className="table-cell py-4">
                         <span className={`mono font-black bg-gray-500/10 px-3 py-1 rounded-lg ${m.quantity > 0 ? 'text-emerald-500' : m.quantity < 0 ? 'text-red-500' : 'theme-text'}`}>
                           {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                         </span>
                      </td>
                      <td className="table-cell text-right py-4">
                        <div className="inline-block transform active:scale-95 transition-transform">
                          {STATUS_BADGE[m.status] || m.status}
                        </div>
                      </td>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </AnimatePresence>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {(prevUrl || nextUrl) && (
        <div className="flex items-center justify-between mt-6 px-1">
          <p className="text-[10px] theme-text-faint font-bold uppercase tracking-widest">
            Page {page} · {count} total records
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchMoves(page - 1)}
              disabled={!prevUrl}
              className="btn-secondary btn-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={13} /> Previous
            </button>
            <button
              onClick={() => fetchMoves(page + 1)}
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