import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../../api'
import {
  Boxes, Eye, EyeOff, AlertCircle,
  ArrowRight, Lock, User, Mail
} from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '', last_name: '',
    username: '', email: '', password: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Step 1: Register
      await authAPI.register(form)

      // Step 2: Auto-login with same credentials
      const { data } = await authAPI.login({
        username: form.username,
        password: form.password,
      })

      // Step 3: Save tokens
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)

      // Step 4: Go straight to dashboard
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const first = Object.values(data)[0]
        setError(Array.isArray(first) ? first[0] : first)
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen theme-bg-body flex bg-grid">

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col w-[480px] flex-shrink-0 theme-bg-surface border-r theme-border p-12 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Boxes size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-base font-semibold theme-text">CoreInventory</p>
            <p className="text-xs theme-text-muted">Warehouse Management System</p>
          </div>
        </div>

        <div className="mb-auto">
          <h2 className="text-3xl font-bold theme-text mb-4 leading-tight">
            Join your team,<br />
            <span className="text-emerald-500">start managing.</span>
          </h2>
          <p className="theme-text-muted text-sm leading-relaxed">
            Create your account to access real-time stock tracking,
            receipts, deliveries, and warehouse operations.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Stock Tracked', val: '100%' },
            { label: 'Real-time Sync', val: '24/7'  },
            { label: 'Uptime',        val: '99.9%'  },
          ].map(({ label, val }) => (
            <div key={label} className="theme-bg-body border theme-border rounded-xl p-3">
              <p className="text-lg font-bold text-emerald-500">{val}</p>
              <p className="text-[10px] theme-text-muted mt-0.5">{label}</p>
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
            <p className="text-base font-semibold theme-text">CoreInventory</p>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold theme-text mb-1.5">Create account</h1>
            <p className="text-sm theme-text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-500 hover:text-emerald-400 transition-colors font-medium">
                Sign in
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

            {/* First + Last name in ONE row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium theme-text-muted mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="John"
                  value={form.first_name}
                  onChange={set('first_name')}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium theme-text-muted mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Doe"
                  value={form.last_name}
                  onChange={set('last_name')}
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-medium theme-text-muted mb-1.5">
                Username
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-faint" />
                <input
                  type="text"
                  className="input pl-9"
                  placeholder="johndoe"
                  value={form.username}
                  onChange={set('username')}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium theme-text-muted mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-faint" />
                <input
                  type="email"
                  className="input pl-9"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={set('email')}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium theme-text-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-faint" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-faint hover:theme-text transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-theme-bg-active border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs theme-text-faint mt-8">
            CoreInventory © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}