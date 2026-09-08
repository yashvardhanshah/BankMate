import { useEffect, useState } from 'react'

function DashboardPage() {
  const [fullName, setFullName] = useState('')
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">BankMate</h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-600">Hi, {fullName}</span>
          <a href="/chat" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Open Chat
          </a>
          <button onClick={handleLogout} className="text-slate-500 hover:text-slate-800">
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-8">
        {/* Account cards */}
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Your Accounts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {accounts.map((account) => (
            <div key={account.account_number} className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-slate-500 capitalize">{account.account_type} Account</p>
              <p className="text-sm text-slate-400 mb-2">•••• {account.account_number.slice(-4)}</p>
              <p className="text-3xl font-bold text-slate-800">
                {account.currency} {account.balance.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Recent transactions */}
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Recent Transactions</h2>
        <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
          {transactions.length === 0 && (
            <p className="p-6 text-slate-400">No transactions yet.</p>
          )}
          {transactions.map((t, index) => (
            <div key={index} className="flex justify-between items-center p-4">
              <div>
                <p className="font-medium text-slate-800">{t.description || t.merchant || 'Transaction'}</p>
                <p className="text-sm text-slate-400">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
              </div>
              <p className={`font-semibold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default DashboardPage