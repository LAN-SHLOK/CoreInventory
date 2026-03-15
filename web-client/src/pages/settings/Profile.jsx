import { useAuth } from '../../services/AuthContext'
import { User, Mail, Shield, LogOut, Clock, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header flex-wrap gap-4">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account information</p>
        </div>
        <button onClick={handleLogout} className="btn-danger btn-sm">
          <LogOut size={13} />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg shadow-emerald-500/20">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <h2 className="text-xl font-bold theme-text">{user?.username || 'User'}</h2>
            <p className="text-sm theme-text-muted mb-4">{user?.email || 'No email provided'}</p>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium capitalize">
              <Shield size={12} />
              {user?.role === 'admin' ? 'Super Admin' : user?.role === 'manager' ? 'Inventory Manager' : 'Staff Member'}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-semibold theme-text mb-5 flex items-center gap-2">
              <User size={16} className="text-emerald-500" /> Personal Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium theme-text-muted mb-1.5">Username</label>
                <div className="p-2.5 theme-bg-active border theme-border rounded-lg flex items-center gap-3">
                  <User size={14} className="theme-text-muted" />
                  <span className="text-sm theme-text-secondary">{user?.username || '—'}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium theme-text-muted mb-1.5">Email Address</label>
                <div className="p-2.5 theme-bg-active border theme-border rounded-lg flex items-center gap-3">
                  <Mail size={14} className="theme-text-muted" />
                  <span className="text-sm theme-text-secondary">{user?.email || '—'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium theme-text-muted mb-1.5">Role / Permission Level</label>
                <div className="p-2.5 theme-bg-active border theme-border rounded-lg flex items-center gap-3">
                  <Shield size={14} className="theme-text-muted" />
                <span className="text-sm text-emerald-500 capitalize">
                  {user?.role === 'admin' ? 'Super Admin' : user?.role === 'manager' ? 'Inventory Manager' : 'Staff Member'}
                </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium theme-text-muted mb-1.5">Account Status</label>
                <div className="p-2.5 theme-bg-active border theme-border rounded-lg flex items-center gap-3">
                  <Activity size={14} className="text-emerald-500" />
                  <span className="text-sm text-emerald-500 capitalize">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
