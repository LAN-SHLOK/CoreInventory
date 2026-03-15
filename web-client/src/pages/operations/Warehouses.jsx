import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../services/AuthContext'
import { warehouseAPI, locationsAPI } from '../../api'
import { AnimatedCard, SpringModal, StaggerContainer, StaggerItem } from '../../components/common/Motion'
import {
  Search, Plus, MapPin, Building2, CheckCircle2,
  AlertCircle, RefreshCw, Filter, ArrowUpDown, X, Edit2
} from 'lucide-react'

// ── New Location Modal ────────────────────────────────
function NewLocationModal({ onClose, onCreated, warehouses }) {
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [form,   setForm]   = useState({
    name: '', warehouse: '', short_code: '', is_internal: true
  })

  const set = (f, v) => setForm(curr => ({ ...curr, [f]: v }))

  const save = async () => {
    if (!form.name || !form.warehouse || !form.short_code) {
      return setError('Name, Warehouse, and Short Code are required')
    }
    setSaving(true); setError('')
    try {
      await locationsAPI.create(form)
      onCreated()
      onClose()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create location')
    } finally { setSaving(false) }
  }

  return (
    <SpringModal
      isOpen={true}
      onClose={onClose}
      title="Create Facility Location"
      subtitle="Define a new zone, aisle, or bin within your warehouses"
      footer={(
        <>
          <button onClick={onClose} className="btn-ghost btn-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary btn-sm px-6">
            {saving ? <RefreshCw size={12} className="animate-spin" /> : 'Register Location'}
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
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Location Name *</label>
            <input className="input w-full" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Aisle A-01" />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Warehouse *</label>
            <select className="input w-full" value={form.warehouse} onChange={e => set('warehouse', e.target.value)}>
              <option value="">Select Facility...</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Short Code *</label>
            <input className="input w-full mono uppercase" value={form.short_code} onChange={e => set('short_code', e.target.value.toUpperCase())} placeholder="A-01" />
          </div>
          <div className="col-span-2 py-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" checked={form.is_internal} onChange={e => set('is_internal', e.target.checked)} />
                <div className="w-10 h-5 bg-gray-500/20 rounded-full peer peer-checked:bg-emerald-500 transition-colors" />
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:left-6 transition-all" />
              </div>
              <span className="text-xs theme-text font-medium">Internal Storage Zone</span>
            </label>
          </div>
        </div>
      </div>
    </SpringModal>
  )
}

// ── Edit Location Modal ────────────────────────────────
function EditLocationModal({ location, onClose, onUpdated, warehouses }) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error,  setError]  = useState('')
  const [form,   setForm]   = useState({
    name: location.name,
    warehouse: location.warehouse,
    short_code: location.short_code,
    is_internal: location.is_internal
  })

  const set = (f, v) => setForm(curr => ({ ...curr, [f]: v }))

  const save = async () => {
    if (!form.name || !form.warehouse || !form.short_code) {
      return setError('Name, Warehouse, and Short Code are required')
    }
    setSaving(true); setError('')
    try {
      await locationsAPI.update(location.id, form)
      onUpdated()
      onClose()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to update location')
    } finally { setSaving(false) }
  }

  const remove = async () => {
    if (!window.confirm('Are you sure you want to delete this location?')) return
    setDeleting(true); setError('')
    try {
      await locationsAPI.delete(location.id)
      onUpdated()
      onClose()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to delete location')
    } finally { setDeleting(false) }
  }

  return (
    <SpringModal
      isOpen={true}
      onClose={onClose}
      title="Edit Facility Location"
      subtitle={`Update details for ${location.name}`}
      footer={(
        <div className="flex justify-between w-full">
          <button onClick={remove} disabled={deleting || saving} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 btn-sm">
            {deleting ? <RefreshCw size={12} className="animate-spin" /> : 'Delete'}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost btn-sm">Cancel</button>
            <button onClick={save} disabled={saving || deleting} className="btn-primary btn-sm px-6">
              {saving ? <RefreshCw size={12} className="animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    >
      <div className="space-y-4">
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Location Name *</label>
            <input className="input w-full" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Aisle A-01" />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Warehouse *</label>
            <select className="input w-full" value={form.warehouse} onChange={e => set('warehouse', e.target.value)}>
              <option value="">Select Facility...</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Short Code *</label>
            <input className="input w-full mono uppercase" value={form.short_code} onChange={e => set('short_code', e.target.value.toUpperCase())} placeholder="A-01" />
          </div>
          <div className="col-span-2 py-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" checked={form.is_internal} onChange={e => set('is_internal', e.target.checked)} />
                <div className="w-10 h-5 bg-gray-500/20 rounded-full peer peer-checked:bg-emerald-500 transition-colors" />
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:left-6 transition-all" />
              </div>
              <span className="text-xs theme-text font-medium">Internal Storage Zone</span>
            </label>
          </div>
        </div>
      </div>
    </SpringModal>
  )
}
// ── Main Warehouses Page ──────────────────────────────
export default function Warehouses() {
  const { user } = useAuth()
  const isAdmin = user?.username === 'AdminID' || user?.role === 'admin' || user?.isStaff

  const [warehouses, setWarehouses] = useState([])
  const [locations,  setLocations]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [activeTab,  setActiveTab]  = useState('locations') // 'locations' or 'overview'
  const [showAddModal, setShowAddModal] = useState(false)
  const [editLocation, setEditLocation] = useState(null)

  const fetchData = async () => {
    setLoading(true); setError('')
    try {
      const [{ data: wData }, { data: lData }] = await Promise.all([
        warehouseAPI.getAll(),
        locationsAPI.getAll()
      ])
      setWarehouses(wData.results || wData)
      setLocations(lData.results || lData)
    } catch {
      setError('Failed to sync warehouse data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filteredLocations = locations.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.short_code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-container">
      <AnimatePresence>
        {showAddModal && (
          <NewLocationModal 
            onClose={() => setShowAddModal(false)} 
            onCreated={fetchData} 
            warehouses={warehouses}
          />
        )}
        {editLocation && (
          <EditLocationModal 
            location={editLocation}
            onClose={() => setEditLocation(null)} 
            onUpdated={fetchData} 
            warehouses={warehouses}
          />
        )}
      </AnimatePresence>

      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Warehouse Infra</h1>
          <p className="page-subtitle">Manage storage facilities and granular bin locations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 theme-text-faint hover:theme-text-primary transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          {isAdmin && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm px-4">
              <Plus size={16} /> New Location
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-500/5 theme-border border rounded-2xl mb-8 w-fit">
        <button 
          onClick={() => setActiveTab('locations')} 
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'locations' ? 'theme-bg-surface theme-text shadow-sm' : 'theme-text-faint hover:theme-text'}`}
        >
          Facility Locations ({locations.length})
        </button>
        <button 
          onClick={() => setActiveTab('warehouses')} 
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'warehouses' ? 'theme-bg-surface theme-text shadow-sm' : 'theme-text-faint hover:theme-text'}`}
        >
          Warehouse Overview ({warehouses.length})
        </button>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/15 text-red-400 text-sm rounded-xl px-4 py-3 mb-8">
          <AlertCircle size={14} /> {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'locations' ? (
          <motion.div 
            key="locations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="relative max-w-md mb-8">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-faint" />
              <input 
                className="input pl-10 h-10 w-full" 
                placeholder="Search zones, bins, or facility codes..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => <div key={i} className="card h-40 animate-pulse bg-gray-500/5 theme-border" />)}
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-24 bg-gray-500/5 rounded-3xl border theme-border border-dashed">
                <MapPin size={48} className="mx-auto theme-text-faint mb-4 opacity-20" />
                <p className="theme-text-muted font-medium">No locations found</p>
              </div>
            ) : (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLocations.map((l) => (
                  <StaggerItem key={l.id}>
                    <AnimatedCard className="p-5 h-full flex flex-col group relative overflow-hidden">
                      <div className="flex items-start justify-between mb-6 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10 group-hover:scale-110 transition-transform">
                          <MapPin size={20} />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] theme-text-faint font-extrabold uppercase tracking-widest mb-1">{l.warehouse_name}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-tighter ${l.is_internal ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {l.is_internal ? 'INTERNAL' : 'EXTERNAL'}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold theme-text text-base mb-1 truncate group-hover:text-blue-500 transition-colors relative z-10">{l.name}</h3>
                      <div className="flex items-center gap-2 mb-4 relative z-10">
                        <span className="theme-text text-[10px] font-black mono bg-gray-500/10 px-2 py-0.5 rounded">{l.short_code}</span>
                      </div>

                      <div className="mt-auto pt-4 border-t theme-border-subtle flex justify-between items-center group-hover:border-blue-500/20 transition-colors relative z-10">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} className="theme-text-faint" />
                          <span className="text-[10px] theme-text-faint font-bold uppercase tracking-widest">Zone Infra</span>
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditLocation(l); }}
                            className="theme-text-faint hover:theme-text-primary transition-colors opacity-0 group-hover:opacity-100 p-1"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    </AnimatedCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {warehouses.map((w) => (
                <StaggerItem key={w.id}>
                  <AnimatedCard className="p-6 relative overflow-hidden group">
                    <Building2 size={140} className="absolute -right-8 -bottom-8 theme-text-faint opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-5 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/10 group-hover:rotate-6 transition-transform">
                          <Building2 size={28} />
                        </div>
                        <div>
                          <h3 className="font-black theme-text text-xl mb-0.5">{w.name}</h3>
                          <p className="text-[10px] theme-text-faint font-bold uppercase tracking-[0.2em]">{w.short_code || 'FACILITY-WH'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-gray-500/5 rounded-2xl border theme-border-subtle group-hover:border-amber-500/20 transition-colors">
                          <p className="text-[10px] theme-text-faint font-bold uppercase tracking-wider mb-1.5">Managed Locations</p>
                          <p className="text-2xl font-black theme-text tabular-nums">{locations.filter(l => l.warehouse === w.id).length}</p>
                        </div>
                        <div className="p-4 bg-gray-500/5 rounded-2xl border theme-border-subtle group-hover:border-emerald-500/20 transition-colors">
                          <p className="text-[10px] theme-text-faint font-bold uppercase tracking-wider mb-1.5">Operations</p>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-xs font-black theme-text uppercase italic">Optimized</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs theme-text-faint group-hover:theme-text transition-colors">
                        <div className="w-6 h-6 rounded-lg bg-gray-500/10 flex items-center justify-center">
                           <MapPin size={12} />
                        </div>
                        <span className="font-medium">{w.address || 'Standard Logistics Terminal · Global Network'}</span>
                      </div>
                    </div>
                  </AnimatedCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
