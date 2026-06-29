import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [agreed, setAgreed] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, signup } = useApp()
  const navigate = useNavigate()

  const isSignup = mode === 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (isSignup) await signup(name, email, password)
      else await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.code?.replace('auth/', '').replaceAll('-', ' ') || 'Something went wrong')
    }
  }

  return (
    <div className="login-bg fixed inset-0 flex items-center justify-center px-6" style={{ color: 'var(--text-primary)' }}>
      {/* Brand mark, pinned top-center */}
      <div className="fixed top-[34px] left-1/2 -translate-x-1/2 flex items-center gap-[11px]">
        <div
          className="qc-grad w-[34px] h-[34px] rounded-[10px] flex items-center justify-center"
          style={{ boxShadow: '0 8px 20px rgba(109, 74, 224, 0.4)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-4 4v-4H6.5A2.5 2.5 0 0 1 4 12.5v-7Z"
              fill="#fff"
            />
          </svg>
        </div>
        <span className="font-display font-bold text-[18px]">QuickChat</span>
      </div>

      {/* dusk aurora behind the card */}
      <div className="relative">
        <div className="glass-glow" />

        {/* soft light card */}
        <form
          onSubmit={handleSubmit}
          className="glass-card w-[400px] max-w-[calc(100vw-3rem)] px-[40px] py-[44px]"
        >
          <h1 className="font-display font-semibold text-[26px] tracking-[-0.02em] text-center mb-2">
            {isSignup ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="text-[14px] text-center mb-[30px]" style={{ color: 'var(--text-secondary)' }}>
            {isSignup ? 'Join QuickChat in seconds' : 'Sign in to your QuickChat account'}
          </p>

          {isSignup && (
            <>
              <label className="block font-semibold text-[13px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                Full name
              </label>
              <input
                type="text"
                placeholder="Alex Carter"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="glass-input mb-[18px]"
              />
            </>
          )}

          <label className="block font-semibold text-[13px] mb-2" style={{ color: 'var(--text-secondary)' }}>
            Email
          </label>
          <input
            type="email"
            placeholder="alex@quickchat.io"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="glass-input mb-[18px]"
          />

          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            {!isSignup && (
              <a href="#" className="font-semibold text-[13px]" style={{ color: 'var(--violet)' }}>
                Forgot?
              </a>
            )}
          </div>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="glass-input mb-[22px]"
          />

          <label className="flex items-start gap-2 text-xs mb-[22px]" style={{ color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-[#6d4ae0]"
            />
            <span>Agree to the terms of use &amp; privacy policy.</span>
          </label>

          {error && (
            <p
              className="text-[13px] mb-4 capitalize rounded-[11px] px-3 py-2.5"
              style={{ background: '#ffecef', color: 'var(--end-call)' }}
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={!agreed} className="amber-btn">
            {isSignup ? 'Create account' : 'Sign in'}
          </button>

          <p className="text-center text-[13px] mt-6" style={{ color: 'var(--text-secondary)' }}>
            {isSignup ? 'Already have an account? ' : 'New here? '}
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? 'login' : 'signup')
                setError('')
              }}
              className="font-semibold"
              style={{ color: 'var(--violet)' }}
            >
              {isSignup ? 'Sign in' : 'Create account'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
