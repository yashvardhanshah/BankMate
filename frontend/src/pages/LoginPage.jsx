import { useState, useEffect } from 'react'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
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
      className="min-h-screen relative flex items-end justify-end gap-16 px-6 lg:px-24 py-16"
      style={{
        backgroundImage:
          "linear-gradient(120deg, rgba(2,6,23,0.8), rgba(30,10,60,0.6)), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Top-left logo */}
      <div className="absolute top-8 left-8 flex items-center gap-2 z-10">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg">
          B
        </div>
        <span className="text-lg font-bold text-white drop-shadow">BankMate</span>
      </div>

      {/* Left-side headline, bottom-aligned with the card */}
      <div
        className={`relative z-10 max-w-md mr-auto mb-2 hidden md:block transition-all duration-700 ${

          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h1 className="text-3xl lg:text-4xl font-bold text-white leading-[1.15] mb-4 whitespace-nowrap">
          Banking, reimagined
          <br />
          with AI.
        </h1>
        <p className="text-slate-200/80 text-base leading-relaxed max-w-[15rem]">
          Check balances, review transactions, and manage your cards — just by asking.
        </p>
      </div>

      {/* Floating card */}
      <form
        onSubmit={handleLogin}
        className={`relative z-10 bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Hello again!</h2>
        <p className="text-slate-500 text-sm mb-6">Welcome back to BankMate</p>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm p-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-xl p-3.5 mb-7 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          placeholder="you@example.com"
          required
        />

        <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-xl p-3.5 mb-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          placeholder="••••••••"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-slate-500 mt-7">
          Don't have an account?{' '}
          <a href="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign up
          </a>
        </p>
      </form>
    </div>
  )
}

export default LoginPage