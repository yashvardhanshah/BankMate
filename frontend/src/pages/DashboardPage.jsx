import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const CATEGORY_COLORS = ['#6366f1', '#f97316', '#10b981', '#f43f5e', '#eab308', '#06b6d4']

function DashboardPage() {
  const [fullName, setFullName] = useState('')
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const [amount, setAmount] = useState('')
  const [txnType, setTxnType] = useState('credit')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('other')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')

    async function fetchData() {
      try {
        const accountsRes = await fetch('http://127.0.0.1:8000/me/accounts', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const accountsData = await accountsRes.json()
        setFullName(accountsData.full_name)
        setAccounts(accountsData.accounts)

        const txnRes = await fetch('http://127.0.0.1:8000/me/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const txnData = await txnRes.json()
        setTransactions(txnData.transactions)
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  function handleLogout() {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  async function handleTransact(e) {
    e.preventDefault()
    setSubmitting(true)
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('http://127.0.0.1:8000/me/transact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: txnType, amount: parseFloat(amount), description, category })
      })
      const data = await res.json()

      if (!data.error) {
        setAmount('')
        setDescription('')
        window.location.reload()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const categoryTotals = transactions
    .filter((t) => t.type === 'debit')
    .reduce((acc, t) => {
      const key = t.category || 'Other'
      acc[key] = (acc[key] || 0) + t.amount
      return acc
    }, {})
  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }))

  const sortedTxns = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date))
  let running = 0
  const trendData = sortedTxns.map((t, index) => {
    running += t.type === 'credit' ? t.amount : -t.amount
    return {
      index: index,
      label: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      balance: running
    }
  })

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
        Loading your dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navbar */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white">
            B
          </div>
          <span className="text-lg font-bold text-slate-900">BankMate</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm">
            {fullName?.[0] || 'U'}
          </div>
          <span className="text-slate-700 text-sm font-medium">{fullName}</span>
          <button onClick={handleLogout} className="text-slate-400 hover:text-slate-700 text-sm transition">
            Logout
          </button>
        </div>
      </header>

            <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left: main content, spans 3 columns */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Balance card + quick action */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 text-white">
                <p className="text-slate-400 text-xs mb-1">Total Balance</p>
                <p className="text-2xl font-bold mb-4">₹{totalBalance.toLocaleString()}</p>
                {accounts.map((a) => (
                  <div key={a.account_number} className="flex justify-between text-xs py-1.5 border-t border-white/10">
                    <span className="text-slate-300 capitalize">{a.account_type} •••• {a.account_number.slice(-4)}</span>
                    <span className="font-medium">₹{a.balance.toLocaleString()}</span>
                  </div>
                ))}
              </div>

                            <form onSubmit={handleTransact} className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-slate-900 font-semibold mb-3 text-sm">Add a Transaction</p>
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                    className="border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <select
                    value={txnType}
                    onChange={(e) => setTxnType(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="credit">Add Money</option>
                    <option value="debit">Withdraw</option>
                  </select>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="salary">Salary</option>
                    <option value="groceries">Groceries</option>
                    <option value="transport">Transport</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="utilities">Utilities</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Remark (e.g. Monthly salary)"
                    className="border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-900 text-white text-sm font-medium rounded-lg py-2.5 hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Submit'}
                </button>
              </form>
            </div>

            {/* Charts side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-slate-900 font-semibold mb-2 text-sm">Balance Trend</p>
                {trendData.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-16">No trend data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="index" tickFormatter={(i) => trendData[i]?.label} stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                        labelFormatter={(i) => trendData[i]?.label}
                      />
                      <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} fill="url(#balanceGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-slate-900 font-semibold mb-2 text-sm">Spending by Category</p>
                {pieData.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-16">No spending yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={60} paddingAngle={3}>
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Right: transactions, narrow column */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col">
            <p className="text-slate-900 font-semibold mb-3 text-sm">Transactions</p>
            <div className="flex flex-col overflow-y-auto max-h-[26rem]">
              {transactions.length === 0 && (
                <p className="text-slate-400 text-xs text-center py-10">No transactions yet.</p>
              )}
              {transactions.map((t, index) => (
                <div key={index} className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{t.description || t.merchant || 'Transaction'}</p>
                    <p className="text-[10px] text-slate-400">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                  </div>
                  <p className={`text-xs font-semibold whitespace-nowrap ${t.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Floating chat button */}
        <a
        href="/chat"
        className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium px-5 py-3.5 rounded-full shadow-lg shadow-indigo-500/30 hover:opacity-90 transition flex items-center gap-2 z-20"
      >
        💬 Chat with AI
      </a>
    </div>
  )
}

export default DashboardPage