import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../../assets/assets.js'
import { useApp } from '../context/AppContext.jsx'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [agreed, setAgreed] = useState(false)
  const { login } = useApp()
  const navigate = useNavigate()

  const isSignup = mode === 'signup'

  const handleSubmit = (e) => {
    e.preventDefault()
    // DRAFT: no real auth. Later -> Firebase signInWithEmailAndPassword /
    // createUserWithEmailAndPassword, then redirect on success.
    login()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-evenly gap-10 px-6">
      {/* Brand */}
      <img src={assets.logo_big} alt="QuickChat" className="w-[min(60vw,260px)]" />

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-5 bg-white/8 backdrop-blur-xl border border-white/15 text-white p-7 rounded-2xl shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-medium">{isSignup ? 'Create account' : 'Login'}</h2>
          {isSignup && (
            <img
              src={assets.arrow_icon}
              alt="back"
              onClick={() => setMode('login')}
              className="w-5 cursor-pointer rotate-180"
            />
          )}
        </div>

        {isSignup && (
          <input
            type="text"
            placeholder="Full name"
            required
            className="rounded-md bg-transparent border border-white/30 px-4 py-2.5 outline-none placeholder-white/50 focus:border-violet-300"
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          required
          className="rounded-md bg-transparent border border-white/30 px-4 py-2.5 outline-none placeholder-white/50 focus:border-violet-300"
        />
        <input
          type="password"
          placeholder="Password"
          required
          className="rounded-md bg-transparent border border-white/30 px-4 py-2.5 outline-none placeholder-white/50 focus:border-violet-300"
        />

        <label className="flex items-start gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-violet-500"
          />
          <span>Agree to the terms of use &amp; privacy policy.</span>
        </label>

        <button
          type="submit"
          disabled={!agreed}
          className="rounded-md py-2.5 font-medium bg-gradient-to-r from-violet-500 to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
        >
          {isSignup ? 'Create account' : 'Login now'}
        </button>

        <p className="text-sm text-white/70 text-center">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => setMode(isSignup ? 'login' : 'signup')}
            className="text-violet-300 font-medium hover:underline"
          >
            {isSignup ? 'Login here' : 'Sign up'}
          </button>
        </p>
      </form>
    </div>
  )
}
