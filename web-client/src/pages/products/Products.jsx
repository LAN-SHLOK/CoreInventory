import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../services/AuthContext'
import { productsAPI } from '../../api'
import {
  Filter, ChevronLeft, ChevronRight, Plus,
  TrendingDown, TrendingUp, ChevronDown,
  RefreshCw, AlertCircle, Search, Boxes, Edit2
} from 'lucide-react'
import { AnimatedCard, SpringModal, CustomDropdown, StaggerContainer, StaggerItem } from '../../components/common/Motion'

// ── Stock level bar ───────────────────────────────────
function StockLevel({ current, reorderLevel = 10 }) {
  if (current == null) return <span className="theme-text-faint">—</span>
  const isLow  = current <= reorderLevel
  const isMid  = current <= (reorderLevel * 3)
  
  const maxBarValue = Math.max(reorderLevel * 5, current, 100)
  const widthPercent = Math.min(Math.max((current / maxBarValue) * 100, 4), 100)
  const pulseClass = isLow ? 'animate-pulse' : ''

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className={`text-[10px] font-bold ${isLow ? 'text-red-400' : isMid ? 'text-amber-400' : 'text-emerald-400'}`}>
          {isLow ? 'REORDER' : isMid ? 'MODERATE' : 'HEALTHY'}
        </span>
        <span className="text-[10px] theme-text-faint mono">{current} Units</span>
      </div>
      <div className="h-1.5 w-full bg-gray-500/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${widthPercent}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className={`h-full rounded-full ${isLow ? 'bg-red-500' : isMid ? 'bg-amber-500' : 'bg-emerald-500'} ${pulseClass}`}
        />
      </div>
    </div>
  )
}

// ── New Product Modal ────────────────────────────────
function NewProductModal({ onClose, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [form,   setForm]   = useState({
    name: '', sku: '', category: '', unit_of_measure: 'pcs',
    current_stock: 0, reorder_level: 10, price: 0, description: ''
  })

  const set = (f, v) => setForm(curr => ({ ...curr, [f]: v }))

  const save = async () => {
    if (!form.name || !form.sku) return setError('Name and SKU are required')
    setSaving(true); setError('')
    try {
      await productsAPI.create(form)
      onCreated()
      onClose()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create product')
    } finally { setSaving(false) }
  }

  return (
    <SpringModal
      isOpen={true}
      onClose={onClose}
      title="Add New Product"
      subtitle="Register a new item in the inventory catalog"
      footer={(
        <>
          <button onClick={onClose} className="btn-ghost btn-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary btn-sm px-6">
            {saving ? <RefreshCw size={12} className="animate-spin" /> : 'Create Product'}
          </button>
        </>
      )}
    >
      <div className="space-y-4">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Product Name *</label>
            <input className="input w-full" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Copper Wire" />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">SKU *</label>
            <input className="input w-full" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="SKU-001" />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Category</label>
            <input className="input w-full" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Raw Material" />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Unit</label>
            <input className="input w-full" value={form.unit_of_measure} onChange={e => set('unit_of_measure', e.target.value)} placeholder="pcs" />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Opening Stock</label>
            <input type="number" className="input w-full" value={form.current_stock} onChange={e => set('current_stock', Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Reorder Level</label>
            <input type="number" className="input w-full" value={form.reorder_level} onChange={e => set('reorder_level', Number(e.target.value))} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Price per Unit ($)</label>
            <input type="number" step="0.01" className="input w-full" value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Description</label>
            <textarea className="input w-full min-h-[60px]" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Product details..." />
          </div>
        </div>
      </div>
    </SpringModal>
  )
}

// ── Edit Product Modal ───────────────────────────────
function EditProductModal({ product, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [form,   setForm]   = useState({
    name:            product.name            || '',
    sku:             product.sku             || '',
    category:        product.category        || '',
    unit_of_measure: product.unit_of_measure || 'pcs',
    current_stock:   product.current_stock   ?? 0,
    reorder_level:   product.reorder_level   ?? 10,
    price:           product.price           ?? 0,
    description:     product.description     || '',
  })

  const set = (f, v) => setForm(curr => ({ ...curr, [f]: v }))

  const save = async () => {
    if (!form.name || !form.sku) return setError('Name and SKU are required')
    setSaving(true); setError('')
    try {
      await productsAPI.update(product.id, form)
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to update product')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setSaving(true)
    try {
      await productsAPI.delete(product.id)
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to delete product')
    } finally { setSaving(false) }
  }

  return (
    <SpringModal
      isOpen={true}
      onClose={onClose}
      title="Edit Product"
      subtitle={`Editing ${product.name} (${product.sku})`}
      footer={(
        <>
          <button onClick={handleDelete} disabled={saving} className="btn-ghost btn-sm text-red-400 hover:text-red-300 mr-auto">
            Delete
          </button>
          <button onClick={onClose} className="btn-ghost btn-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary btn-sm px-6">
            {saving ? <RefreshCw size={12} className="animate-spin" /> : 'Save Changes'}
          </button>
        </>
      )}
    >
      <div className="space-y-4">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Product Name *</label>
            <input className="input w-full" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">SKU *</label>
            <input className="input w-full mono" value={form.sku} onChange={e => set('sku', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Category</label>
            <input className="input w-full" value={form.category} onChange={e => set('category', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Unit</label>
            <input className="input w-full" value={form.unit_of_measure} onChange={e => set('unit_of_measure', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Current Stock</label>
            <input type="number" className="input w-full" value={form.current_stock} onChange={e => set('current_stock', Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Reorder Level</label>
            <input type="number" className="input w-full" value={form.reorder_level} onChange={e => set('reorder_level', Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Price ($)</label>
            <input type="number" step="0.01" className="input w-full" value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs theme-text-faint mb-1.5 font-bold uppercase tracking-wider">Description</label>
            <input className="input w-full" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional..." />
          </div>
        </div>
      </div>
    </SpringModal>
  )
}

// ── Main Products page ────────────────────────────────
export default function Products() {
  const { user } = useAuth()
  const isAdmin = user?.username === 'AdminID' || user?.role === 'admin' || user?.isStaff

  const [products, setProducts] = useState([])
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [nextUrl, setNextUrl]   = useState(null)
  const [prevUrl, setPrevUrl]   = useState(null)
  const [count, setCount]       = useState(0)
  const [page, setPage]         = useState(1)

  const [categories, setCategories] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editProduct, setEditProduct]   = useState(null)

  const fetchProducts = async (pageNum = 1) => {
    setLoading(true); setError('')
    try {
      const { data } = await productsAPI.getAll({
        ...(search   ? { search }   : {}),
        ...(category ? { category } : {}),
        page: pageNum,
      })

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

  const fetchCategories = async () => {
    try {
      const { data } = await productsAPI.getCategories()
      setCategories(data)
    } catch {}
  }

  useEffect(() => { 
    fetchProducts(1)
    fetchCategories()
  }, [])

  const lowStockCount = products.filter(p => p.current_stock <= 10).length

  return (
    <div className="page-container">
      <AnimatePresence>
        {showAddModal && <NewProductModal onClose={() => setShowAddModal(false)} onCreated={() => fetchProducts(1)} />}
        {editProduct && (
          <EditProductModal
            product={editProduct}
            onClose={() => setEditProduct(null)}
            onSaved={() => { setEditProduct(null); fetchProducts(page) }}
          />
        )}
      </AnimatePresence>

      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Universal Catalog</h1>
          <p className="page-subtitle">Centralized item management and stock visibility</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchProducts(page)} className="p-2 theme-text-faint hover:theme-text-primary transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          {isAdmin && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm px-4">
              <Plus size={16} /> New Product
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Items', value: count, color: 'text-emerald-500' },
          { label: 'Low Stock', value: lowStockCount, color: 'text-red-500' },
          { label: 'Categories', value: categories.length, color: 'text-blue-500' },
          { label: 'Active Page', value: page, color: 'text-amber-500' },
        ].map((stat, i) => (
          <AnimatedCard key={stat.label} delay={i * 0.1} className="p-4 flex flex-col justify-center items-center text-center">
            <span className={`text-2xl font-black ${stat.color} mb-1 tabular-nums`}>{stat.value}</span>
            <span className="text-[10px] theme-text-faint uppercase font-bold tracking-widest">{stat.label}</span>
          </AnimatedCard>
        ))}
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-faint" />
          <input
            className="input pl-10 h-11 h-11"
            placeholder="Search items by name, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts(1)}
          />
        </div>
        <CustomDropdown 
          icon={<Filter size={14} />}
          value={category}
          setter={(v) => { setCategory(v); fetchProducts(1) }}
          options={categories.map(c => ({ id: c, name: c }))}
          placeholder="All Categories"
        />
        <button onClick={() => fetchProducts(1)} className="btn-secondary h-11 px-6">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/15 text-red-400 text-sm rounded-xl px-4 py-3 mb-8">
          <AlertCircle size={14} /> {error}
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="card h-48 animate-pulse bg-gray-500/5 theme-border" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 bg-gray-500/5 rounded-3xl border theme-border border-dashed">
          <Boxes size={48} className="mx-auto theme-text-faint mb-4 opacity-20" />
          <p className="theme-text-muted font-medium">Your catalog is empty</p>
          <p className="text-xs theme-text-faint mt-1">Try a different search or add your first product</p>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <StaggerItem key={p.id}>
              <AnimatedCard className="p-5 h-full flex flex-col group relative overflow-hidden">
                {/* Subtle Background Icon */}
                <Boxes size={120} className="absolute -right-6 -bottom-6 theme-text-faint opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10 group-hover:scale-110 transition-transform">
                    <Boxes size={20} />
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditProduct(p) }}
                      className="p-2 theme-text-faint hover:theme-text hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100 rounded-lg"
                      title="Edit product"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>

                <div className="mb-6 relative z-10">
                  <h3 className="font-bold theme-text text-base mb-1 truncate group-hover:text-emerald-500 transition-colors">{p.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-500/10 text-[10px] theme-text-faint px-2 py-0.5 rounded-full font-bold mono">{p.sku}</span>
                    <span className="text-[10px] theme-text-faint uppercase font-bold tracking-tighter">{p.category}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t theme-border-subtle relative z-10">
                  <StockLevel current={p.current_stock} reorderLevel={p.reorder_level} />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[10px] theme-text-faint font-bold uppercase tracking-widest">Unit: {p.unit_of_measure}</span>
                    <span className="text-xs font-black theme-text tabular-nums">${p.price || '0.00'}</span>
                  </div>
                </div>
              </AnimatedCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {(prevUrl || nextUrl) && (
        <div className="flex items-center justify-between mt-10">
          <p className="text-[10px] theme-text-faint font-bold uppercase tracking-widest">
            Showing {products.length} of {count} catalog items
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchProducts(page - 1)}
              disabled={!prevUrl}
              className="p-2 theme-bg-surface-active theme-text hover:theme-text-primary border theme-border rounded-xl disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => fetchProducts(page + 1)}
              disabled={!nextUrl}
              className="p-2 theme-bg-surface-active theme-text hover:theme-text-primary border theme-border rounded-xl disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}