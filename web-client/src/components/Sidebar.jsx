import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import {
  LayoutDashboard, PackageOpen, Truck, History,
  Boxes, LogOut, ChevronRight
} from 'lucide-react'

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/receipts',     icon: PackageOpen,     label: 'Receipts' },
  { to: '/deliveries',   icon: Truck,           label: 'Deliveries' },
  { to: '/move-history', icon: History,         label: 'Move History' },
  { to: '/products',     icon: Boxes,           label: 'Products' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Boxes size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">CoreInventory</p>
            <p className="text-xs text-gray-500 mt-0.5">Warehouse System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 pb-2">
          Operations
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={13} className="text-emerald-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-7 h-7 bg-emerald-700 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-200 font-medium truncate">{user?.username || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-600 hover:text-red-400 transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}