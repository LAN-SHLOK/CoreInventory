import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../api'
import {
  Boxes, AlertCircle, ArrowRight,
  Mail, ArrowLeft, CheckCircle2
} from 'lucide-react'

export default function ForgotPassword() {
  const navigate  = useNavigate()
  const [step,     setStep]    = useState('request')
  const [email,    setEmail]   = useState('')
  const [code,     setCode]    = useState('')
  const [newPass,  setNewPass] = useState('')
  const [confPass, setConfPass]= useState('')
  const [loading,  setLoading] = useState(false)
  const [error,    setError]   = useState('')
  const [token,    setToken]   = useState('')

  // ── Step 1: Send reset email ──────────────────────
  const handleRequest = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authAPI.forgotPassword({ email })
      setStep('verify')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const first = Object.values(data)[0]
        setError(Array.isArray(first) ? first[0] : first)
      } else {
        setError('Could not send reset email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Verify OTP code ───────────────────────
  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.verifyResetCode({ email, code })
      setToken(data.token)
      setStep('reset')
    } catch (err) {
      setError('Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Set new password ──────────────────────
  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    if (newPass !== confPass) {
      setError('Passwords do not match.')
      return
    }
    if (newPass.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await authAPI.resetPassword({ token, password: newPass })
      setStep('done')
    } catch (err) {
      setError('Could not reset password. Your link may have expired.')
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
            Forgot your<br />
            <span className="text-emerald-500">password?</span>
          </h2>
          <p className="theme-text-muted text-sm leading-relaxed">
            No worries. Enter your email and we'll send you
            a code to reset your password securely.
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

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Boxes size={17} className="text-emerald-400" />
            </div>
            <p className="text-base font-semibold theme-text">CoreInventory</p>
          </div>

          {/* ── STEP 1: Enter email ── */}
          {step === 'request' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold theme-text mb-1.5">Reset password</h1>
                <p className="text-sm theme-text-muted">
                  Enter your account email and we'll send a verification code.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium theme-text-muted mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-faint" />
                    <input
                      type="email"
                      className="input pl-9"
                      placeholder="john@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
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
                      Sending code...
                    </>
                  ) : (
                    <>Send Reset Code <ArrowRight size={14} /></>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-400 transition-colors"
                >
                  <ArrowLeft size={12} /> Back to Sign In
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Enter OTP code ── */}
          {step === 'verify' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold theme-text mb-1.5">Check your email</h1>
                <p className="text-sm theme-text-muted">
                  We sent a 6-digit code to{' '}
                  <span className="text-emerald-500 font-medium">{email}</span>
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium theme-text-muted mb-1.5">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    className="input text-center tracking-[0.5em] text-lg font-bold"
                    placeholder="000000"
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="btn-primary w-full justify-center py-2.5 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-theme-bg-active border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>Verify Code <ArrowRight size={14} /></>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => { setStep('request'); setError('') }}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-400 transition-colors"
                >
                  <ArrowLeft size={12} /> Use a different email
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: New password ── */}
          {step === 'reset' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold theme-text mb-1.5">Set new password</h1>
                <p className="text-sm theme-text-muted">
                  Choose a strong password for your account.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 bg-red-500/5 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium theme-text-muted mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Min. 8 characters"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium theme-text-muted mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Repeat your password"
                    value={confPass}
                    onChange={e => setConfPass(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-2.5 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-theme-bg-active border-t-transparent rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>Reset Password <ArrowRight size={14} /></>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 4: Done ── */}
          {step === 'done' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold theme-text mb-2">Password reset!</h1>
              <p className="text-sm theme-text-muted mb-8">
                Your password has been updated successfully.
                You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full justify-center py-2.5"
              >
                Back to Sign In <ArrowRight size={14} />
              </button>
            </div>
          )}

          <p className="text-center text-xs theme-text-faint mt-8">
            CoreInventory © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}