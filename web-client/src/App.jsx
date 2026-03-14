import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './services/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/dashboard/Dashboard'
import Receipts from './pages/operations/Reciepts'
import Deliveries from './pages/operations/Deliveries'
import MoveHistory from './pages/operations/MoveHistory'
import Products from './pages/products/Products'
import { ShieldX } from 'lucide-react'

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
    <div className="flex h-screen items-center justify-center bg-[#0a0c10]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-xs text-gray-600 tracking-wider uppercase">Loading</p>
      </div>
    </div>
  )
}

// ── Routes ────────────────────────────────────────────
function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />

  if (!user) {
    return (
      <Routes>
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*"                element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="flex h-screen bg-[#0a0c10] text-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-grid">
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/receipts"     element={<Receipts />} />
          <Route path="/deliveries"   element={<Deliveries />} />
          <Route path="/move-history" element={<MoveHistory />} />
          <Route path="/products"     element={<Products />} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

// ── App Root ──────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Toast sits outside routes so it shows on every page */}
        <AccessDeniedToast />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}