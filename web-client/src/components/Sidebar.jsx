import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../services/AuthContext'
import { useTheme } from '../services/ThemeContext'
import {
  LayoutDashboard, PackageOpen, Truck, History,
  Boxes, LogOut, ChevronRight, Settings, 
  MapPin, ArrowRightLeft, SlidersHorizontal, User,
  PanelLeftClose, PanelLeftOpen, X,
  ExternalLink, ShieldCheck, Sun, Moon
} from 'lucide-react'

const navItems = [
  { to: '/',             icon: LayoutDashboard,   label: 'Dashboard', roles: ['admin', 'manager', 'staff'] },
  { to: '/receipts',     icon: PackageOpen,       label: 'Receipts',     roles: ['admin', 'manager'] },
  { to: '/deliveries',   icon: Truck,             label: 'Deliveries',   roles: ['admin', 'manager'] },
  { to: '/transfers',    icon: ArrowRightLeft,    label: 'Transfers',    roles: ['admin', 'manager', 'staff'] },
  { to: '/adjustments',  icon: SlidersHorizontal, label: 'Adjustments',  roles: ['admin', 'manager', 'staff'] },
  { to: '/move-history', icon: History,           label: 'Move History', roles: ['admin', 'manager', 'staff'] },
  { to: '/products',     icon: Boxes,             label: 'Products',     roles: ['admin', 'manager'] },
  { to: '/warehouses',   icon: MapPin,            label: 'Warehouses',   roles: ['admin', 'manager'] },
]

const bottomNavItems = [
  { to: 'http://localhost:8000/admin/', icon: ShieldCheck, label: 'Admin Panel', adminOnly: true, external: true },
  { to: '/settings', icon: Settings, label: 'Settings', adminOnly: true },
  { to: '/profile',  icon: User,     label: 'Profile' },
]

const containerVariants = {
  expanded: { width: 256, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  collapsed: { width: 80, transition: { type: 'spring', stiffness: 300, damping: 30 } },
}

const navContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.05,
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -5 },
  show: { opacity: 1, x: 0, transition: { duration: 0.15 } },
}

export default function Sidebar({ isMobileOpen, onCloseMobile, isCollapsed, setIsCollapsed }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  
  const isAdmin = user?.role === 'admin' || user?.isStaff || user?.username === 'AdminID'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onCloseMobile}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        variants={containerVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        initial={false}
        className={`
          fixed inset-y-0 left-0 z-50
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300
          theme-bg-surface border-r theme-border-subtle flex flex-col h-screen
        `}
      >
        {/* Logo Section */}
        <div className={`py-6 border-b theme-border-subtle flex items-center ${isCollapsed ? 'px-0 justify-center' : 'px-5 justify-between'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <img src="/logo.svg" alt="Logo" className="w-9 h-9 flex-shrink-0 logo-glow" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  <p className="text-sm font-bold theme-text tracking-tight">CoreInventory</p>
                  <p className="text-[10px] theme-text-faint font-medium">Warehouse System</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!isCollapsed && (
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 theme-text-faint hover:theme-text hover:theme-bg-hover rounded-lg transition-colors"
            >
              <PanelLeftClose size={16} />
            </motion.button>
          )}
          <button 
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 theme-text-faint hover:theme-text rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Floating Toggle for Collapsed State */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center py-2 absolute right-0 top-20 z-50">
            <motion.button 
              whileHover={{ x: 2 }}
              onClick={() => setIsCollapsed(false)}
              className="theme-bg-surface-active border-l border-y theme-border p-1 rounded-l-full theme-text-faint hover:text-emerald-400 shadow-xl transition-all"
            >
              <PanelLeftOpen size={14} />
            </motion.button>
          </div>
        )}

      {/* Nav */}
      <motion.nav 
        variants={navContainerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar"
      >
        {!isCollapsed && (
          <motion.p 
            variants={itemVariants}
            className="text-[10px] font-bold theme-text-faint uppercase tracking-[0.1em] px-4 pb-3"
          >
            Operations
          </motion.p>
        )}
        {navItems.map(({ to, icon: Icon, label, roles }) => {
          if (roles && !roles.includes(user?.role)) return null
          
          return (
          <motion.div key={to} variants={itemVariants}>
            <NavLink
              to={to}
              end={to === '/'}
              onClick={() => { if (window.innerWidth < 1024) onCloseMobile() }}
              className={({ isActive }) =>
                `flex items-center gap-3.5 ${isCollapsed ? 'justify-center px-2' : 'px-3.5'} py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-emerald-600/10 text-emerald-500 font-semibold'
                    : 'theme-text-muted hover:theme-bg-hover hover:theme-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-emerald-500' : 'theme-text-faint group-hover:theme-text'} />
                  {!isCollapsed && <span className="flex-1 truncate">{label}</span>}
                  {isActive && !isCollapsed && (
                    <motion.div 
                      layoutId="active-nav-dot"
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                    />
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-2 py-1 theme-bg-app theme-text text-xs rounded invisible opacity-0 group-hover:visible group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50 border theme-border shadow-xl">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        )})}
      </motion.nav>

      <nav className="px-3 pb-4 space-y-1.5 border-t theme-border-subtle pt-4">
        {bottomNavItems.map(({ to, icon: Icon, label, adminOnly, external }) => {
          if (adminOnly && !isAdmin) return null
          
          if (external) {
            return (
              <a
                key={label}
                href={to}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3.5 ${isCollapsed ? 'justify-center px-2' : 'px-3.5'} py-2.5 rounded-xl text-sm transition-all duration-200 group relative theme-text-muted hover:theme-bg-hover hover:text-emerald-500`}
              >
                <Icon size={18} className="theme-text-faint group-hover:text-emerald-500" />
                {!isCollapsed && <span className="flex-1 truncate">{label}</span>}
                {!isCollapsed && <ExternalLink size={12} className="theme-text-faint group-hover:text-emerald-500" />}
              </a>
            )
          }
          
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => { if (window.innerWidth < 1024) onCloseMobile() }}
              className={({ isActive }) =>
                `flex items-center gap-3.5 ${isCollapsed ? 'justify-center px-2' : 'px-3.5'} py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-emerald-600/10 text-emerald-400 font-semibold'
                    : 'theme-text-muted hover:theme-bg-hover hover:theme-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-emerald-400' : 'theme-text-faint group-hover:theme-text'} />
                  {!isCollapsed && <span className="flex-1 truncate">{label}</span>}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User & Settings Section */}
      <div className="px-3 py-5 border-t theme-border-subtle space-y-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3.5 ${isCollapsed ? 'px-0 justify-center' : 'px-3.5'} py-2.5 rounded-xl text-sm transition-all duration-200 theme-text-muted hover:theme-bg-hover hover:theme-text group relative`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {!isCollapsed && <span className="flex-1 truncate capitalize">{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>}
        </motion.button>

        <div className={`flex items-center gap-3 py-2.5 rounded-xl transition-all ${isCollapsed ? 'px-0 justify-center' : 'px-3'}`}>
          <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-xs font-bold text-emerald-500 shadow-inner flex-shrink-0">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm theme-text font-semibold truncate leading-tight">{user?.username || 'User'}</p>
              <p className="text-[10px] theme-text-faint font-medium truncate mt-0.5">{user?.email || 'admin@core.com'}</p>
            </div>
          )}
          {!isCollapsed && (
            <button 
              onClick={handleLogout} 
              className="p-1.5 theme-text-faint hover:text-red-400 hover:theme-bg-hover rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
        {isCollapsed && (
          <button 
            onClick={handleLogout} 
            className="w-full mt-2 flex justify-center p-2 theme-text-faint hover:text-red-400 hover:theme-bg-hover rounded-lg transition-all"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </motion.aside>
    </>
  )
}