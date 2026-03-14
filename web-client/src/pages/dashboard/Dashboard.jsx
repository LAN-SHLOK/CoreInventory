import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../services/AuthContext'
import { dashboardAPI } from '../../api'
import {
  PackageOpen, Truck, History, Boxes,
  TrendingUp, TrendingDown, RefreshCw,
  AlertCircle, ArrowRight, Clock, CheckCircle2
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, trend, color, onClick }) {
  const colors = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    blue:    'bg-blue-500/10 border-blue-500/20 text-blue-400',
    purple:  'bg-purple-500/10 border-purple-500/20 text-purple-400',
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
  }
  return (
    <button
      onClick={onClick}
      className="card-hover p-5 text-left w-full group transition-all duration-200 animate-fade-in"
    >
      <div className="flex items-start justify-between mb-5">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colors[color]}`}>
          <Icon size={17} />
        </div>
        <ArrowRight size={13} className="text-gray-700 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
      </div>
      <div className="mb-1">
        <span className="text-3xl font-bold text-white tabular-nums">
          {value ?? <span className="text-gray-700">—</span>}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-400 mb-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-600">{sub}</p>}
    </button>
  )
}

function RecentRow({ reference, type, status, date }) {
  const badge = {
    draft:     <span className="badge-draft">Draft</span>,
    ready:     <span className="badge-ready">Ready</span>,
    done:      <span className="badge-done">Done</span>,
    cancelled: <span className="badge-cancelled">Cancelled</span>,
  }
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#1a1d24] last:border-0">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
        type === 'receipt' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
      }`}>
        {type === 'receipt' ? <PackageOpen size={12} /> : <Truck size={12} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-300 mono truncate">{reference}</p>
        <p className="text-xs text-gray-600">{date}</p>
      </div>
      {badge[status] || <span className="badge-draft">{status}</span>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const { data: res } = await dashboardAPI.getSummary()
      setData(res)
    } catch {
      setError('Could not connect to server. Check if Django is running.')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const stats = [
    { icon: PackageOpen, label: 'Pending Receipts',   value: data?.pending_receipts,   sub: 'Awaiting validation', color: 'blue',    path: '/receipts' },
    { icon: Truck,       label: 'Pending Deliveries', value: data?.pending_deliveries, sub: 'Awaiting dispatch',   color: 'emerald', path: '/deliveries' },
    { icon: History,     label: 'Moves Today',        value: data?.total_moves_today,  sub: 'Stock movements',     color: 'purple',  path: '/move-history' },
    { icon: Boxes,       label: 'Total Products',     value: data?.total_products,     sub: 'In catalogue',        color: 'amber',   path: '/products' },
  ]

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle flex items-center gap-1.5">
            <Clock size={12} className="text-gray-600" />
            {today}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>
          <span className="text-sm text-gray-500">
            Welcome back, <span className="text-gray-300 font-medium">{user?.username}</span>
          </span>
          <button onClick={fetchData} className="btn-secondary btn-sm">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/15 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} onClick={() => navigate(s.path)} />
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
              <p className="text-xs text-gray-600 mt-0.5">Latest operations</p>
            </div>
            <button onClick={() => navigate('/move-history')} className="btn-ghost btn-sm text-xs">
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div>
            {(data?.recent_moves || []).length > 0
              ? data.recent_moves.map((m, i) => <RecentRow key={i} {...m} />)
              : (
                <div className="text-center py-10">
                  <History size={28} className="text-gray-800 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No recent activity</p>
                  <p className="text-xs text-gray-700 mt-1">Activity will appear here once backend is connected</p>
                </div>
              )
            }
          </div>
        </div>

        {/* Operations status */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-5">Operations Schedule</h2>
          <div className="space-y-3">
            {[
              { icon: CheckCircle2, label: 'Lots schedule date', val: 'Today', color: 'text-emerald-400' },
              { icon: CheckCircle2, label: 'Operations date', val: 'Today', color: 'text-emerald-400' },
              { icon: Clock,        label: 'Picking status', val: 'Waiting', color: 'text-amber-400' },
            ].map(({ icon: Icon, label, val, color }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-[#1a1d24] last:border-0">
                <div className="flex items-center gap-2.5">
                  <Icon size={13} className={color} />
                  <span className="text-xs text-gray-400">{label}</span>
                </div>
                <span className={`text-xs font-medium ${color}`}>{val}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[#1a1d24]">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-emerald-400" />
              <p className="text-xs font-medium text-gray-400">Stock Health</p>
            </div>
            <div className="space-y-2">
              {['Receipts', 'Deliveries', 'Stock'].map((item, i) => (
                <div key={item}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{item}</span>
                    <span>{[85, 60, 92][i]}%</span>
                  </div>
                  <div className="h-1 bg-[#1a1d24] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${[85, 60, 92][i]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}