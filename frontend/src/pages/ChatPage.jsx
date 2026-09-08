import { useState, useRef, useEffect } from 'react'

function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm BankMate. Ask me about your balance, transactions, or cards." }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = { role: 'user', text: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage.text })
      })

      const data = await response.json()
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Something went wrong. Please try again.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">BankMate Chat</h1>
        <a href="/dashboard" className="text-slate-500 hover:text-slate-800">
          ← Back to Dashboard
        </a>
      </nav>

      <div className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-slate-800 shadow-sm rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-400 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                Typing...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your balance, transactions, or cards..."
            className="flex-1 border border-slate-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatPage