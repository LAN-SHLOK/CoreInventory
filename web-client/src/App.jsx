import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './services/AuthContext'
import { ThemeProvider, useTheme } from './services/ThemeContext'
import Sidebar from './components/Sidebar'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/dashboard/Dashboard'
import Receipts from './pages/operations/Receipts'
import Deliveries from './pages/operations/Deliveries'
import MoveHistory from './pages/operations/MoveHistory'
import Products from './pages/products/Products'
import Warehouses from './pages/operations/Warehouses'
import Transfers from './pages/operations/Transfers'
import Adjustments from './pages/operations/Adjustments'
import Settings from './pages/settings/Settings'
import Profile from './pages/settings/Profile'
import { ShieldX, Menu, Boxes, Moon, Sun, Search } from 'lucide-react'

// ── Access Denied Toast ───────────────────────────────
// Listens for the global 'access-denied' event fired by api.js
// when Django returns a 403 Forbidden response.
function AccessDeniedToast() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => {
      setVisible(true)
      // Auto-hide after 4 seconds
      setTimeout(() => setVisible(false), 4000)
    }
    window.addEventListener('access-denied', handler)
    return () => window.removeEventListener('access-denied', handler)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed top-5 right-5 z-[9999] flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm animate-fade-in">
      <ShieldX size={16} className="flex-shrink-0" />
      <div>
        <p className="font-medium text-red-300">Access Denied</p>
        <p className="text-xs text-red-400/80 mt-0.5">You need Manager permissions to do this.</p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="ml-2 text-red-500/60 hover:text-red-400 transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}

// ── Loading Spinner ───────────────────────────────────
function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center theme-bg-app">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-xs theme-text-faint tracking-wider uppercase">Loading</p>
      </div>
    </div>
  )
}

// ── Routes ────────────────────────────────────────────
// ── Page Transition Wrapper ──────────────────────────
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className="h-full"
  >
    {children}
  </motion.div>
)

function AppRoutes() {
  const { user, loading } = useAuth()
  const { theme } = useTheme()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center theme-bg-app">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  if (!user) return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*"                element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  )

  return (
    <div className="flex min-h-screen theme-bg-app overflow-hidden">

      <Sidebar 
        isMobileOpen={sidebarOpen} 
        onCloseMobile={() => setSidebarOpen(false)} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}
      >
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-5 py-3.5 border-b theme-border-subtle theme-bg-surface shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8 rounded-lg logo-glow" />
            <span className="text-base font-bold theme-text tracking-tight">CoreInventory</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 theme-text-faint hover:theme-text">
              <Search size={20} />
            </button>
            <button onClick={() => setSidebarOpen(true)} className="p-2 theme-text-faint hover:theme-text">
              <Menu size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/"             element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/receipts"     element={<PageWrapper><Receipts /></PageWrapper>} />
              <Route path="/deliveries"   element={<PageWrapper><Deliveries /></PageWrapper>} />
              <Route path="/transfers"    element={<PageWrapper><Transfers /></PageWrapper>} />
              <Route path="/adjustments"  element={<PageWrapper><Adjustments /></PageWrapper>} />
              <Route path="/move-history" element={<PageWrapper><MoveHistory /></PageWrapper>} />
              <Route path="/products"     element={<PageWrapper><Products /></PageWrapper>} />
              <Route path="/warehouses"   element={<PageWrapper><Warehouses /></PageWrapper>} />
              <Route path="/settings"     element={<PageWrapper><Settings /></PageWrapper>} />
              <Route path="/profile"      element={<PageWrapper><Profile /></PageWrapper>} />
              <Route path="*"             element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

// ── App Root ──────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AccessDeniedToast />
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}