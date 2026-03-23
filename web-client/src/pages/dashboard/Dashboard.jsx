import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CustomDropdown } from '../../components/common/Motion'
import { useAuth } from '../../services/AuthContext'
import api, { dashboardAPI } from '../../api'
import {
  PackageOpen, Truck, History, Boxes,
  TrendingUp, TrendingDown, RefreshCw,
  AlertCircle, ArrowRight, Clock, CheckCircle2,
  ArrowRightLeft, Filter, ChevronDown
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color, onClick, variants }) {
  const colors = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    blue:    'bg-blue-500/10 border-blue-500/20 text-blue-400',
    purple:  'bg-purple-500/10 border-purple-500/20 text-purple-400',
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
  }

  return (
    <motion.button
      variants={variants}
      whileHover={{ 
        y: -10, 
        scale: 1.02,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="card p-5 text-left w-full group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 border-white/5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-lg ${colors[color]}`}>
          <Icon size={19} />
        </div>
        <div className="w-8 h-8 rounded-full theme-bg-active flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300">
          <ArrowRight size={14} className="theme-text" />
        </div>
      </div>

      <div className="relative z-10">
        <div className="mb-2">
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black theme-text tabular-nums tracking-tight"
          >
            {value ?? <span className="theme-text-faint">0</span>}
          </motion.span>
        </div>
        <p className="text-sm font-bold theme-text-muted mb-1 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-[11px] theme-text-faint font-medium leading-relaxed opacity-80">{sub}</p>}
      </div>

      {/* Dynamic Aura */}
      <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-40 transition-all duration-1000 ${
        color === 'emerald' ? 'bg-emerald-500' : 
        color === 'blue' ? 'bg-blue-500' :
        color === 'purple' ? 'bg-purple-500' : 'bg-amber-500'
      }`} />
    </motion.button>
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
    <div className="flex items-center gap-4 py-3 border-b theme-border-subtle last:border-0 overflow-hidden">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
        type === 'RECEIPT' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
      }`}>
        {type === 'RECEIPT' ? <PackageOpen size={12} /> : <Truck size={12} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium theme-text-secondary mono truncate">{reference}</p>
        <p className="text-xs theme-text-faint">{date}</p>
      </div>
      {badge[status.toLowerCase()] || <span className="badge-draft">{status}</span>}
    </div>
  )
}

function HealthBarChart({ data }) {
  const metrics = [
    { label: 'Receipts',   val: data?.receipts   || 0, color: 'blue' },
    { label: 'Deliveries', val: data?.deliveries || 0, color: 'emerald' },
    { label: 'Stock',      val: data?.stock      || 0, color: 'amber' },
  ]
  const colors = {
    blue:    'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.2)]',
    emerald: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    amber:   'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
  }

  return (
    <div className="flex items-end justify-around h-28 gap-4 px-2 pt-2">
      {metrics.map((m) => (
        <div key={m.label} className="flex-1 flex flex-col items-center h-full group">
          <div className="flex-1 w-full max-w-[40px] theme-bg-active rounded-xl relative overflow-hidden flex flex-col justify-end">
             <motion.div 
               initial={{ height: 0 }}
               animate={{ height: `${m.val}%` }}
               transition={{ type: 'spring', stiffness: 50, damping: 15, delay: 0.2 }}
               className={`w-full rounded-t-xl relative transform scale-x-95 origin-bottom ${colors[m.color]}`}
             >
               <div className="absolute inset-x-0 top-0 h-1 bg-white/20" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
             </motion.div>
          </div>
          <span className="text-[9px] theme-text-faint mt-2.5 font-bold uppercase tracking-widest">{m.label}</span>
          <span className="text-[10px] theme-text mt-0.5 font-mono">{m.val}%</span>
        </div>
      ))}
    </div>
  )
}

function ActivityChart({ data = [] }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.count), 5)
  
  return (
    <div className="mt-2 mb-8 h-48 flex items-end justify-between gap-1.5 px-1 relative">
      {/* Grid Lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border-t border-white w-full h-0" />
        ))}
      </div>

      {data.map((d, i) => {
        const h = (d.count / max) * 100
        return (
          <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.05 }}
              whileHover={{ backgroundColor: 'rgb(16, 185, 129)' }}
              className="w-full bg-emerald-500/20 rounded-t-sm relative cursor-help"
            >
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 theme-bg-surface-active theme-text text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border theme-border">
                {d.count} moves
              </div>
              <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            </motion.div>
            <span className="text-[9px] theme-text-muted mt-2 truncate w-full text-center">{d.date}</span>
          </div>
        )
      })}
    </div>
  )
}


export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [locationFilter, setLocationFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter]         = useState('')
  const [statusFilter, setStatusFilter]     = useState('')
  const [locations, setLocations]           = useState([])
  const [categories, setCategories]         = useState([])

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const [dashRes, locRes] = await Promise.all([
        dashboardAPI.getSummary({ 
          location: locationFilter, 
          category: categoryFilter,
          type: typeFilter, 
          status: statusFilter 
        }),
        api.get('/locations/')
      ])
      setData(dashRes.data)
      setLocations(locRes.data.results || locRes.data)
      setCategories(dashRes.data.categories || [])
    } catch {
      setError('Could not connect to server. Check if Django is running.')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [locationFilter, categoryFilter, typeFilter, statusFilter])

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const stats = [
    { icon: PackageOpen,    label: 'Pending Receipts',    value: data?.pending_receipts,    sub: 'Awaiting validation', color: 'blue',    path: '/receipts' },
    { icon: Truck,          label: 'Pending Deliveries',  value: data?.pending_deliveries,  sub: 'Awaiting dispatch',   color: 'emerald', path: '/deliveries' },
    { icon: ArrowRightLeft, label: 'Scheduled Transfers', value: data?.scheduled_transfers, sub: 'Internal movements', color: 'purple',  path: '/transfers' },
    { icon: Boxes,          label: 'Total Products',      value: data?.total_products,      sub: `${data?.low_stock_count || 0} below reorder level`, color: 'amber',   path: '/products' },
  ]

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle flex items-center gap-1.5">
            <Clock size={12} className="theme-text-muted" />
            {today}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>
          <span className="text-sm theme-text-muted">
            Welcome back, <span className="theme-text-secondary font-medium">{user?.username}</span>
          </span>
          <button onClick={fetchData} className="btn-secondary btn-sm">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-10 flex-wrap items-center">
        <CustomDropdown 
          icon={<Clock size={15} />}
          value={locationFilter} 
          setter={setLocationFilter} 
          options={locations} 
          placeholder="All Locations" 
        />
        <CustomDropdown 
          icon={<Filter size={15} />}
          value={categoryFilter} 
          setter={setCategoryFilter} 
          options={categories.map(c => ({ id: c, name: c }))} 
          placeholder="All Categories" 
        />
        <CustomDropdown 
          icon={<TrendingUp size={15} />}
          value={typeFilter} 
          setter={setTypeFilter} 
          options={[
            { id: 'RECEIPT', name: 'Receipts' },
            { id: 'DELIVERY', name: 'Deliveries' },
            { id: 'TRANSFER', name: 'Transfers' },
            { id: 'ADJUSTMENT', name: 'Adjustments' }
          ]} 
          placeholder="All Doc Types" 
        />
        <CustomDropdown 
          icon={<CheckCircle2 size={15} />}
          value={statusFilter} 
          setter={setStatusFilter} 
          options={[
            { id: 'DRAFT', name: 'Draft' },
            { id: 'READY', name: 'Ready' },
            { id: 'PACKED', name: 'Packed' },
            { id: 'DONE', name: 'Done' },
            { id: 'CANCELLED', name: 'Cancelled' }
          ]} 
          placeholder="All Statuses" 
        />
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/15 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((s) => (
          <StatCard 
            key={s.label} 
            {...s} 
            onClick={() => navigate(s.path)}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
          />
        ))}
      </motion.div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2 card p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold theme-text">Recent Activity</h2>
              <p className="text-xs theme-text-muted mt-0.5">Latest operations</p>
            </div>
            <button onClick={() => navigate('/move-history')} className="btn-ghost btn-sm text-xs">
              View all <ArrowRight size={11} />
            </button>
          </div>
          
          <ActivityChart data={data?.activity_data} />

          <div>
            {(data?.recent_moves || []).length > 0
              ? data.recent_moves.map((m, i) => <RecentRow key={i} {...m} />)
              : (
                <div className="text-center py-10">
                  <History size={28} className="theme-bg-active theme-text-faint mx-auto mb-3" />
                  <p className="text-sm theme-text-muted">No recent activity</p>
                  <p className="text-xs theme-text-faint mt-1">Activity will appear here once backend is connected</p>
                </div>
              )
            }
          </div>
        </div>

        {/* Operations status */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold theme-text mb-5">Operations Schedule</h2>
          <div className="space-y-3">
            {[
              { icon: CheckCircle2, label: 'Pending Receipts', val: data?.pending_receipts || 0, color: 'text-emerald-400' },
              { icon: CheckCircle2, label: 'Pending Deliveries', val: data?.pending_deliveries || 0, color: 'text-blue-400' },
              { icon: CheckCircle2, label: 'Scheduled Transfers', val: data?.scheduled_transfers || 0, color: 'text-purple-400' },
              { icon: Clock,        label: 'Out of Stock Items', val: data?.out_of_stock_count || 0, color: 'text-red-400' },
            ].map(({ icon: Icon, label, val, color }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b theme-border-subtle last:border-0">
                <div className="flex items-center gap-2.5">
                  <Icon size={13} className={color} />
                  <span className="text-xs theme-text-muted">{label}</span>
                </div>
                <span className={`text-xs font-semibold ${color}`}>{val}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t theme-border-subtle">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-emerald-400" />
              <p className="text-xs font-medium theme-text-muted">Stock Health</p>
            </div>
            <HealthBarChart data={data?.stock_health} />
          </div>
        </div>
      </div>
    </div>
  )
}