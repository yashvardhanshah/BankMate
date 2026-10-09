import { useState, useEffect } from 'react'
import { API_URL } from '../config'

function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(   API_URL + '/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          phone_number: phoneNumber
        })
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        localStorage.setItem('token', data.access_token)
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen relative flex items-end justify-end gap-16 px-6 lg:px-24 py-8"
      style={{
        backgroundImage:
          "linear-gradient(120deg, rgba(2,6,23,0.8), rgba(30,10,60,0.6)), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Top-left logo */}
      <div className="absolute top-6 left-8 flex items-center gap-2 z-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg">
          B
        </div>
        <span className="text-base font-bold text-white drop-shadow">BankMate</span>
      </div>

      {/* Left-side headline */}
      <div
        className={`relative z-10 max-w-md mr-auto mb-2 hidden md:block transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h1 className="text-3xl lg:text-4xl font-bold text-white leading-[1.15] mb-3 whitespace-nowrap">
          Join the future
          <br />
          of banking.
        </h1>
        <p className="text-slate-200/80 text-base leading-relaxed max-w-[15rem]">
          Open an account in seconds and let AI handle the rest, securely.
        </p>
      </div>

      {/* Floating card */}
      <form
        onSubmit={handleSignup}
        className={`relative z-10 bg-white/95 backdrop-blur-xl p-7 rounded-3xl shadow-2xl w-full max-w-md transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h2 className="text-xl font-bold text-slate-900 mb-0.5">Create your account</h2>
        <p className="text-slate-500 text-xs mb-4">Join BankMate in under a minute</p>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-2.5 rounded-lg mb-3">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2.5 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Jane Doe"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="9876543210"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </button>

        <p className="text-center text-xs text-slate-500 mt-4">
          Already have an account? <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Log in</a>
        </p>
      </form>
    </div>
  )
}

export default SignupPage