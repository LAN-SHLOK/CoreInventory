import { useState } from 'react'
import { useAuth } from '../../services/AuthContext'
import { Save, Settings2, Bell, Shield, Database, LayoutTemplate } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const isAdmin = user?.username === 'AdminID' || user?.role === 'admin' || user?.isStaff

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      alert("Settings saved successfully!")
    }, 800)
  }

  const tabs = [
    { id: 'general', icon: Settings2, label: 'General' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'system', icon: Database, label: 'System' },
  ]

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage application preferences and configurations</p>
        </div>
        {isAdmin && (
          <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
            {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={13} />}
            Save Changes
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-56 flex-shrink-0">
          <div className="card overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2 ${
                    isActive
                      ? 'theme-bg-active border-emerald-500 text-emerald-500'
                      : 'border-transparent theme-text-muted hover:theme-bg-hover hover:theme-text'
                  }`}
                >
                  <Icon size={16} /> {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 space-y-6">
          {activeTab === 'general' && (
            <div className="card p-6">
              <h2 className="text-base font-semibold theme-text mb-5 flex items-center gap-2">
                <LayoutTemplate size={16} className="text-emerald-500" /> General Information
              </h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-medium theme-text-muted mb-1.5">Company Name</label>
                  <input type="text" className="input w-full" defaultValue="CoreInventory Operations Ltd." />
                </div>
                <div>
                  <label className="block text-xs font-medium theme-text-muted mb-1.5">Default Currency</label>
                  <select className="input w-full">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium theme-text-muted mb-1.5">Date Format</label>
                  <select className="input w-full">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-base font-semibold theme-text mb-5 flex items-center gap-2">
                <Bell size={16} className="text-emerald-500" /> Alerts & Notifications
              </h2>
              <div className="space-y-4 max-w-lg">
                {[
                  { id: 'low_stock', label: 'Low Stock Alerts', desc: 'Get notified when items drop below reorder level' },
                  { id: 'new_receipts', label: 'New Receipts', desc: 'Alert when a new stock receipt is created' },
                  { id: 'pending_deliveries', label: 'Pending Deliveries', desc: 'Daily summary of unfulfilled deliveries' },
                ].map((item) => (
                  <label key={item.id} className="flex items-start gap-3 p-3 theme-bg-active border theme-border rounded-lg cursor-pointer hover:border-emerald-500/30 transition-colors">
                    <div className="pt-0.5">
                      <input type="checkbox" defaultChecked className="rounded border-theme-border theme-bg-surface text-emerald-500 focus:ring-emerald-500 focus:ring-offset-theme-bg-body" />
                    </div>
                    <div>
                      <p className="text-sm font-medium theme-text-secondary">{item.label}</p>
                      <p className="text-xs theme-text-muted mt-0.5">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6">
              <h2 className="text-base font-semibold theme-text mb-5 flex items-center gap-2">
                <Shield size={16} className="text-emerald-500" /> Security
              </h2>
              <p className="text-sm theme-text-muted mb-4">Security settings are managed via the Django administration panel.</p>
              <a href="http://127.0.0.1:8000/admin/auth/user/" target="_blank" rel="noreferrer" className="btn-secondary btn-sm inline-flex">
                Open Django Admin
              </a>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="card p-6">
              <h2 className="text-base font-semibold theme-text mb-5 flex items-center gap-2">
                <Database size={16} className="text-emerald-500" /> System Data
              </h2>
              <div className="theme-bg-active border theme-border rounded-lg p-4 max-w-lg">
                <div className="flex justify-between items-center py-2 border-b theme-border">
                  <span className="text-sm theme-text-muted">Database Engine</span>
                  <span className="text-sm font-mono text-emerald-500">django.db.backends.sqlite3</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b theme-border">
                  <span className="text-sm theme-text-muted">Django Version</span>
                  <span className="text-sm font-mono text-blue-500">5.x.x</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm theme-text-muted">Frontend</span>
                  <span className="text-sm font-mono text-purple-500">React + Vite + Tailwind</span >
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
