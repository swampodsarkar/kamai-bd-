import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db, ref, set, get, signInWithCustomToken } from '../../lib/firebase'
import Button from '../ui/Button'
import { showToast } from '../ui/Toast'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [adminKey, setAdminKey] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!adminKey.trim()) {
      showToast('Enter admin key', 'warning')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_CLOUD_FUNCTIONS_URL}/adminAuth`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminKey: adminKey.trim() }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid admin key')
      }

      await signInWithCustomToken(auth, data.token)
      showToast('Admin login successful', 'success')
      navigate('/admin')
    } catch (e) {
      showToast(e.message || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-dark-950">
      <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mb-4">
        <span className="text-2xl font-bold text-dark-950">A</span>
      </div>
      <h1 className="text-2xl font-bold gold-gradient-text mb-1">Admin Panel</h1>
      <p className="text-gray-400 text-sm mb-8">Kamai BD Administration</p>

      <div className="glass-card rounded-2xl p-6 w-full max-w-sm space-y-4">
        <div>
          <label className="text-gray-400 text-sm block mb-2">Admin Secret Key</label>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Enter admin key"
            className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <Button variant="gold" onClick={handleLogin} loading={loading}>
          Login as Admin
        </Button>
      </div>
    </div>
  )
}
