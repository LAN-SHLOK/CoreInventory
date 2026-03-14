import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../services/AuthContext'
import {
  Boxes, Eye, EyeOff, AlertCircle,
  ArrowRight, Lock, User
} from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form,     setForm]     = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const first = Object.values(data)[0]
        setError(Array.isArray(first) ? first[0] : first)
      } else {
        setError('Invalid credentials. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] flex bg-grid">

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col w-[480px] flex-shrink-0 bg-[#0d0f14] border-r border-[#1a1d24] p-12 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Boxes size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">CoreInventory</p>
            <p className="text-xs text-gray-600">Warehouse Management System</p>
          </div>
        </div>

        <div className="mb-auto">
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Your warehouse,<br />
            <span className="text-emerald-400">under control.</span>
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Track stock, manage receipts and deliveries, and monitor
            every movement across your warehouse in real time.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Stock Tracked', val: '100%' },
            { label: 'Real-time Sync', val: '24/7'  },
            { label: 'Uptime',        val: '99.9%'  },
          ].map(({ label, val }) => (
            <div key={label} className="bg-[#0a0c10] border border-[#1e2028] rounded-xl p-3">
              <p className="text-lg font-bold text-emerald-400">{val}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Boxes size={17} className="text-emerald-400" />
            </div>
            <p className="text-base font-semibold text-white">CoreInventory</p>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1.5">Sign in</h1>
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              >
                Create one
              </Link>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username or Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  className="input pl-9"
                  placeholder="Enter username or email"
                  value={form.username}
                  onChange={set('username')}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-gray-500 hover:text-emerald-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-700 mt-8">
            CoreInventory © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}