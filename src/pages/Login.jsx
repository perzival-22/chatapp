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
    <div className="login-bg fixed inset-0 flex items-center justify-center px-6 text-white">
      {/* Brand mark, pinned top-center */}
      <div className="fixed top-[34px] left-1/2 -translate-x-1/2 flex items-center gap-[11px]">
        <div
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #ffb14e, #ff8a3d)',
            boxShadow: '0 8px 20px rgba(255, 138, 61, 0.4)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-4 4v-4H6.5A2.5 2.5 0 0 1 4 12.5v-7Z"
              fill="#1a0e04"
            />
          </svg>
        </div>
        <span className="font-display font-bold text-[18px]">QuickChat</span>
      </div>

      {/* warm glow behind the glass */}
      <div className="relative">
        <div className="glass-glow" />

        {/* liquid glass card */}
        <form
          onSubmit={handleSubmit}
          className="glass-card w-[400px] max-w-[calc(100vw-3rem)] px-[40px] py-[44px]"
        >
          <h1 className="font-display font-semibold text-[26px] tracking-[-0.02em] text-center mb-2">
            {isSignup ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="text-[14px] text-center mb-[30px]" style={{ color: '#8a7f72' }}>
            {isSignup ? 'Join QuickChat in seconds' : 'Sign in to your QuickChat account'}
          </p>

          {isSignup && (
            <>
              <label className="block font-semibold text-[13px] mb-2" style={{ color: '#bcb0a2' }}>
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

          <label className="block font-semibold text-[13px] mb-2" style={{ color: '#bcb0a2' }}>
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
            <label className="font-semibold text-[13px]" style={{ color: '#bcb0a2' }}>
              Password
            </label>
            {!isSignup && (
              <a href="#" className="font-medium text-[13px]" style={{ color: '#ffb14e' }}>
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

          <label className="flex items-start gap-2 text-xs mb-[22px]" style={{ color: '#8a7f72' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-[#ff8a3d]"
            />
            <span>Agree to the terms of use &amp; privacy policy.</span>
          </label>

          {error && <p className="text-red-300 text-sm mb-4 capitalize">{error}</p>}

          <button type="submit" disabled={!agreed} className="amber-btn">
            {isSignup ? 'Create account' : 'Sign in'}
          </button>

          <p className="text-center text-[13px] mt-6" style={{ color: '#6f655a' }}>
            {isSignup ? 'Already have an account? ' : 'New here? '}
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? 'login' : 'signup')
                setError('')
              }}
              className="font-semibold"
              style={{ color: '#ffc375' }}
            >
              {isSignup ? 'Sign in' : 'Create account'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
