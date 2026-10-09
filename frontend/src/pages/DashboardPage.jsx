import { useEffect, useRef, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'
import { API_URL } from '../config'

const CATEGORIES = {
  salary:        { label: 'Salary',        icon: '💰', color: '#059669', tint: 'bg-emerald-50' },
  groceries:     { label: 'Groceries',     icon: '🛒', color: '#d97706', tint: 'bg-amber-50' },
  transport:     { label: 'Transport',     icon: '🚗', color: '#2563eb', tint: 'bg-blue-50' },
  entertainment: { label: 'Entertainment', icon: '🎬', color: '#db2777', tint: 'bg-pink-50' },
  utilities:     { label: 'Utilities',     icon: '💡', color: '#7c3aed', tint: 'bg-violet-50' },
  other:         { label: 'Other',         icon: '📦', color: '#64748b', tint: 'bg-slate-100' }
}
const FORM_CATEGORIES = ['salary', 'groceries', 'transport', 'entertainment', 'utilities', 'other']

const CARD = 'bg-white rounded-2xl border border-slate-200 shadow-sm'
const TOOLTIP_STYLE = { borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }

function getCategory(key) {
  return CATEGORIES[(key || 'other').toLowerCase()] || CATEGORIES.other
}

function formatAmount(value) {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`
  return `${sign}₹${abs.toLocaleString('en-IN')}`
}

function formatFull(value) {
  return `${value < 0 ? '-' : ''}₹${Math.abs(value).toLocaleString('en-IN')}`
}

function EmptyState({ title, hint }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs text-slate-500 mt-1 max-w-[16rem] mx-auto">{hint}</p>
    </div>
  )
}

function DashboardPage() {
  const [fullName, setFullName] = useState('')
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(false)
  const [notice, setNotice] = useState(null)

  const [amount, setAmount] = useState('')
  const [txnType, setTxnType] = useState('credit')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('other')
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef(null)

  function handleLogout() {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  function showNotice(type, text) {
    setNotice({ type, text })
    setTimeout(() => setNotice(null), 3500)
  }

  async function loadData() {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    try {
      // limit=500: the endpoint returns only the 5 most recent per account by default,
      // which would make the totals and charts below incomplete.
      const [accountsRes, txnRes] = await Promise.all([
        fetch(`${API_URL}/me/accounts`, { headers }),
        fetch(`${API_URL}/me/transactions?limit=500`, { headers })
      ])

      if (accountsRes.status === 401) {
        handleLogout()
        return
      }

      const accountsData = await accountsRes.json()
      const txnData = await txnRes.json()
      setFullName(accountsData.full_name || '')
      setAccounts(accountsData.accounts || [])
      setTransactions(txnData.transactions || [])
    } catch (err) {
      console.error('Failed to load dashboard data', err)
    }

    try {
      const cardsRes = await fetch(`${API_URL}/me/cards`, { headers })
      const cardsData = await cardsRes.json()
      setCards(cardsData.cards || [])
    } catch (err) {
      setCards([])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleTransact(e) {
    e.preventDefault()
    setSubmitting(true)
    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`${API_URL}/me/transact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: txnType, amount: parseFloat(amount), description, category })
      })
      const data = await res.json()

      if (data.error) {
        showNotice('error', data.error)
      } else {
        setAmount('')
        setDescription('')
        showNotice('success', txnType === 'credit' ? 'Money added' : 'Money withdrawn')
        await loadData()
      }
    } catch (err) {
      showNotice('error', 'Could not reach the server. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function startAction(type) {
    setTxnType(type)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // ---------- derived data ----------
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const primary = accounts[0]

  // Oldest first. The API returns newest first, so ties on the same timestamp are reversed.
  const chronological = transactions
    .map((t, i) => ({ ...t, _i: i }))
    .sort((a, b) => new Date(a.date) - new Date(b.date) || b._i - a._i)
  const newestFirst = [...chronological].reverse()

  const credits = transactions.filter((t) => t.type === 'credit')
  const debits = transactions.filter((t) => t.type === 'debit')
  const totalIncome = credits.reduce((sum, t) => sum + t.amount, 0)
  const totalSpending = debits.reduce((sum, t) => sum + t.amount, 0)
  const netFlow = totalIncome - totalSpending
  const savingsRate = totalIncome > 0 ? Math.round((netFlow / totalIncome) * 100) : 0
  const spendPct = totalIncome > 0 ? Math.min(100, Math.round((totalSpending / totalIncome) * 100)) : 0

  // Balance trend ends at the real current balance, so it starts from (balance - net flow).
  let running = totalBalance - netFlow
  const trendData = [
    { index: 0, label: 'Start', balance: running },
    ...chronological.map((t, i) => {
      running += t.type === 'credit' ? t.amount : -t.amount
      return {
        index: i + 1,
        label: new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        balance: running
      }
    })
  ]

  const categoryMap = {}
  debits.forEach((t) => {
    const meta = getCategory(t.category)
    if (!categoryMap[meta.label]) {
      categoryMap[meta.label] = { name: meta.label, value: 0, color: meta.color }
    }
    categoryMap[meta.label].value += t.amount
  })
  const categoryData = Object.values(categoryMap).sort((a, b) => b.value - a.value)
  const topCategory = categoryData[0]

  const monthlyMap = {}
  transactions.forEach((t) => {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    if (!monthlyMap[key]) {
      monthlyMap[key] = {
        key,
        month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        Income: 0,
        Spending: 0
      }
    }
    if (t.type === 'credit') monthlyMap[key].Income += t.amount
    else monthlyMap[key].Spending += t.amount
  })
  const monthlyData = Object.values(monthlyMap).sort((a, b) => a.key.localeCompare(b.key))

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = fullName.split(' ')[0]
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const stats = [
    {
      label: 'Income',
      value: formatAmount(totalIncome),
      note: `${credits.length} ${credits.length === 1 ? 'deposit' : 'deposits'}`,
      valueColor: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700',
      glyph: '↓'
    },
    {
      label: 'Spending',
      value: formatAmount(totalSpending),
      note: `${spendPct}% of income`,
      valueColor: 'text-rose-600',
      badge: 'bg-rose-100 text-rose-700',
      glyph: '↑',
      bar: spendPct
    },
    {
      label: 'Net flow',
      value: `${netFlow >= 0 ? '+' : ''}${formatAmount(netFlow)}`,
      note: netFlow >= 0 ? 'More coming in than going out' : 'More going out than coming in',
      valueColor: netFlow >= 0 ? 'text-slate-900' : 'text-rose-600',
      badge: 'bg-indigo-100 text-indigo-700',
      glyph: '⇄'
    },
    {
      label: 'Savings rate',
      value: `${savingsRate}%`,
      note: topCategory ? `Biggest expense: ${topCategory.name}` : 'No spending yet',
      valueColor: savingsRate >= 0 ? 'text-slate-900' : 'text-rose-600',
      badge: 'bg-amber-100 text-amber-700',
      glyph: '%'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" />
        <p className="text-sm">Loading your accounts</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-6 lg:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white">
            B
          </div>
          <span className="text-lg font-bold">BankMate</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
            {fullName?.[0] || 'U'}
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700">{fullName}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-900 px-2 py-1 rounded-md transition focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            Log out
          </button>
        </div>
      </header>

      {notice && (
        <div
          role="status"
          className={`fixed top-16 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
            notice.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {notice.text}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-6 pb-28 flex flex-col gap-6">
        {/* Hero: balance + bank card */}
        <section className="relative overflow-hidden rounded-3xl bg-indigo-700 text-white p-7 lg:p-9 shadow-lg">
          <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-indigo-500/40" />
          <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-violet-600/30" />

          <div className="relative grid gap-8 lg:grid-cols-5 items-center">
            <div className="lg:col-span-3">
              <h1 className="text-xl font-semibold">{greeting}, {firstName}</h1>
              <p className="text-indigo-200 text-sm mt-0.5">{today}</p>

              <p className="text-indigo-100 text-sm mt-8">Total balance</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-4xl lg:text-5xl font-semibold tracking-tight tabular-nums">
                  {showBalance ? formatFull(totalBalance) : '₹ ••••••'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                  title={showBalance ? 'Hide balance' : 'Show balance'}
                  className="w-6 h-6 shrink-0 rounded-full border border-white/40 text-xs font-semibold text-white/90 hover:bg-white/15 transition focus-visible:outline-2 focus-visible:outline-white"
                >
                  i
                </button>
              </div>
              <p className="text-indigo-200 text-sm mt-2">
                Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
              </p>

              <div className="flex flex-wrap gap-3 mt-7">
                <button
                  onClick={() => startAction('credit')}
                  className="bg-white text-indigo-700 font-medium text-sm px-5 py-2.5 rounded-full hover:bg-indigo-50 transition focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                >
                  Add money
                </button>
                <button
                  onClick={() => startAction('debit')}
                  className="border border-white/40 text-white font-medium text-sm px-5 py-2.5 rounded-full hover:bg-white/10 transition focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                >
                  Withdraw
                </button>
              </div>
            </div>

            {primary && (
              <div className="lg:col-span-2">
                <div className="relative w-full max-w-sm mx-auto lg:ml-auto rounded-2xl bg-slate-900 p-5 shadow-xl ring-1 ring-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">BankMate</span>
                    <span className="text-xs text-slate-400 capitalize">{primary.account_type} account</span>
                  </div>
                  <div className="mt-8 w-10 h-7 rounded bg-amber-300/90" />
                  <p className="mt-5 text-lg tracking-widest tabular-nums">
                    •••• •••• {primary.account_number.slice(-4)}
                  </p>
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-slate-400">Account holder</p>
                      <p className="text-sm">{fullName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Currency</p>
                      <p className="text-sm">{primary.currency}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Stats strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          {stats.map((s) => (
            <div key={s.label} className="bg-white p-5">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${s.badge}`}>
                  {s.glyph}
                </span>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
              <p className={`mt-3 text-2xl font-semibold tabular-nums ${s.valueColor}`}>{s.value}</p>
              {s.bar !== undefined && (
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-rose-500" style={{ width: `${s.bar}%` }} />
                </div>
              )}
              <p className="mt-1.5 text-xs text-slate-500">{s.note}</p>
            </div>
          ))}
        </section>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: analytics */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className={`${CARD} p-5`}>
              <h2 className="text-sm font-semibold">Balance over time</h2>
              <p className="text-xs text-slate-500 mb-3">Ends at your current balance</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData} margin={{ left: 0, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="index"
                    tickFormatter={(i) => trendData[i]?.label}
                    interval="preserveStartEnd"
                    minTickGap={30}
                    stroke="#94a3b8"
                    fontSize={11}
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} width={64} tickFormatter={(v) => formatAmount(v)} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelFormatter={(i) => trendData[i]?.label}
                    formatter={(value) => [formatFull(value), 'Balance']}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={2} fill="url(#balanceFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${CARD} p-5`}>
                <h2 className="text-sm font-semibold">Where your money goes</h2>
                {categoryData.length === 0 ? (
                  <EmptyState
                    title="No spending yet"
                    hint="Withdraw money with a category and the breakdown will appear here."
                  />
                ) : (
                  <>
                    <div className="relative mt-2">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {categoryData.map((c) => (
                              <Cell key={c.name} fill={c.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatFull(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-xs text-slate-500">Spent</p>
                        <p className="text-base font-semibold tabular-nums">{formatAmount(totalSpending)}</p>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {categoryData.map((c) => (
                        <li key={c.name} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                            {c.name}
                          </span>
                          <span className="text-slate-600 tabular-nums">
                            {formatAmount(c.value)}
                            <span className="text-slate-400 ml-1.5">{Math.round((c.value / totalSpending) * 100)}%</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className={`${CARD} p-5`}>
                <h2 className="text-sm font-semibold">Income and spending by month</h2>
                {monthlyData.length === 0 ? (
                  <EmptyState
                    title="No activity yet"
                    hint="Add money to start building your monthly picture."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={290}>
                    <BarChart data={monthlyData} margin={{ left: 0, right: 8, top: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} width={64} tickFormatter={(v) => formatAmount(v)} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ fill: '#f1f5f9' }}
                        formatter={(value) => formatFull(value)}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Income" fill="#059669" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Spending" fill="#e11d48" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {cards.length > 0 && (
              <div className={`${CARD} p-5`}>
                <h2 className="text-sm font-semibold">Your cards</h2>
                <p className="text-xs text-slate-500 mb-3">Ask the assistant to freeze or unfreeze any card.</p>
                <div className="flex flex-wrap gap-3">
                  {cards.map((c) => (
                    <div
                      key={c.card_number_last4}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm">
                        💳
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {c.card_type} card ending {c.card_number_last4}
                        </p>
                        <span
                          className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                            c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: move money + activity */}
          <div className="relative">
              <div className="flex flex-col gap-6 lg:absolute lg:inset-0">
                        <form ref={formRef} onSubmit={handleTransact} className={`${CARD} p-4 flex flex-col justify-between lg:min-h-[330px]`}>
              <h2 className="text-sm font-semibold mb-2">Move money</h2>

              <div className="grid grid-cols-2 bg-slate-100 rounded-lg p-0.5 mb-3">
                <button
                  type="button"
                  onClick={() => setTxnType('credit')}
                  className={`py-1.5 text-sm font-medium rounded-md transition ${
                    txnType === 'credit' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Add money
                </button>
                <button
                  type="button"
                  onClick={() => setTxnType('debit')}
                  className={`py-1.5 text-sm font-medium rounded-md transition ${
                    txnType === 'debit' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Withdraw
                </button>
              </div>

              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  aria-label="Amount"
                  className="w-full border border-slate-300 rounded-lg py-2 pl-7 pr-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <p className="text-xs text-slate-500 mb-1">
                Category: <span className="font-medium text-slate-700">{CATEGORIES[category].label}</span>
              </p>
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {FORM_CATEGORIES.map((key) => (
                  <button
                    type="button"
                    key={key}
                    title={CATEGORIES[key].label}
                    aria-label={CATEGORIES[key].label}
                    onClick={() => setCategory(key)}
                    className={`py-1.5 text-base leading-none rounded-lg border transition ${
                      category === key
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {CATEGORIES[key].icon}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Remark, for example monthly salary"
                aria-label="Remark"
                className="w-full border border-slate-300 rounded-lg py-2 px-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />

              <button
                type="submit"
                disabled={submitting}
                className={`w-full text-white text-sm font-medium rounded-lg py-2 transition disabled:opacity-50 ${
                  txnType === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? 'Working on it' : txnType === 'credit' ? 'Add money' : 'Withdraw money'}
              </button>
            </form>

            <div className={`${CARD} p-5 flex flex-col lg:flex-1 lg:min-h-0`}>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-sm font-semibold">Recent activity</h2>
                <span className="text-xs text-slate-500">{transactions.length} total</span>
              </div>
              <div className="flex flex-col max-h-[30rem] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto -mx-1 px-1">
                {newestFirst.length === 0 && (
                  <EmptyState title="No transactions yet" hint="Add money above and it will show up here." />
                )}
                {newestFirst.map((t, index) => {
                  const meta = getCategory(t.category)
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0"
                    >
                      <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${meta.tint}`}>
                        {meta.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {t.description || t.merchant || 'Transaction'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {meta.label}, {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-semibold whitespace-nowrap tabular-nums ${
                          t.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {t.type === 'credit' ? '+' : '-'}{formatAmount(t.amount)}
                      </p>
                    </div>
                  )
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>

      {/* Floating chat button */}
      <a
        href="/chat"
        className="fixed bottom-6 right-6 z-20 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3.5 font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        💬 Chat with AI
      </a>
    </div>
  )
}

export default DashboardPage