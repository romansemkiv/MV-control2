import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const authLogin = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await authLogin(login, password)
      navigate('/main')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-neutral-800 p-8 rounded-lg w-80 border border-neutral-700">
        <h1 className="text-xl font-bold text-neutral-100 mb-6 text-center">MV-Control</h1>
        <input
          type="text"
          placeholder="Login"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          className="w-full mb-3 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-neutral-100 placeholder-neutral-400 outline-none focus:border-amber-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-neutral-100 placeholder-neutral-400 outline-none focus:border-amber-500"
        />
        <button type="submit" className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium transition-colors">
          Sign In
        </button>
        {error && <p className="mt-3 text-red-400 text-sm text-center">{error}</p>}
        <p className="mt-4 text-neutral-500 text-xs text-center">First login creates admin account</p>
      </form>
    </div>
  )
}

export default Login
