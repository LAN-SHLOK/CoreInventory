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

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />

  // ── Not logged in → only public pages ────────────
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

  // ── Logged in → only protected pages ─────────────
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}