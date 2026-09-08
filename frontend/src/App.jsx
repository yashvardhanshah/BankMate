import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'

import SignupPage from './pages/SignupPage'

function DashboardPage() {
  return <h1 className="text-2xl font-bold p-8">Dashboard Page</h1>
}

function ChatPage() {
  return <h1 className="text-2xl font-bold p-8">Chat Page</h1>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App