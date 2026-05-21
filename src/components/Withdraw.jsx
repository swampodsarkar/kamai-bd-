import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { db, ref, push, set } from '../lib/firebase'
import Button from './ui/Button'
import { showToast } from './ui/Toast'

const MIN_WITHDRAWAL = 50
const METHODS = ['bKash', 'Nagad', 'Rocket']

export default function Withdraw() {
  const { user, userData, refreshUserData } = useUser()
  const navigate = useNavigate()
  const [method, setMethod] = useState('bKash')
  const [amount, setAmount] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user?.uid || !userData) return

    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount < MIN_WITHDRAWAL) {
      showToast(`Minimum withdrawal is ${MIN_WITHDRAWAL} Tk`, 'warning')
      return
    }
    if (numAmount > userData.balance) {
      showToast('Insufficient balance', 'error')
      return
    }
    if (!accountNumber || accountNumber.length < 5) {
      showToast('Enter a valid account number', 'warning')
      return
    }

    setSubmitting(true)
    try {
      const newRef = push(ref(db, 'withdrawals'))
      await set(newRef, {
        userId: user.uid,
        amount: numAmount,
        method,
        accountNumber,
        status: 'pending',
        createdAt: Date.now(),
        username: userData.username || userData.firstName || 'Unknown',
      })

      showToast('Withdrawal request submitted!', 'success')
      setAmount('')
      setAccountNumber('')
      await refreshUserData()
    } catch (e) {
      showToast('Failed to submit withdrawal', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold gold-gradient-text">Withdraw</h1>
        <p className="text-gray-400 text-sm mt-1">Cash out your earnings</p>
      </div>

      <div className="glass-card rounded-2xl p-6 gold-border text-center">
        <div className="text-6xl mb-4">💳</div>
        <p className="text-3xl font-bold gold-gradient-text">
          {userData?.balance?.toFixed(2) || '0.00'} Tk
        </p>
        <p className="text-gray-500 text-sm mt-1">Available Balance</p>
        {userData && userData.balance < MIN_WITHDRAWAL && (
          <p className="text-amber-400 text-xs mt-2">
            Min: {MIN_WITHDRAWAL} Tk ({(MIN_WITHDRAWAL - userData.balance).toFixed(2)} Tk more)
          </p>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="text-white font-semibold">Request Withdrawal</h3>

        <div>
          <label className="text-gray-400 text-sm block mb-2">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  method === m ? 'gold-gradient text-dark-950 font-bold' : 'bg-dark-700 text-gray-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-2">{method} Account Number</label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="01XXXXXXXXX"
            className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-2">Amount (Tk)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min ${MIN_WITHDRAWAL} Tk`}
            min={MIN_WITHDRAWAL}
            step="0.01"
            className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500"
          />
        </div>

        <Button
          variant="gold"
          size="lg"
          onClick={handleSubmit}
          loading={submitting}
          disabled={submitting || !amount || !accountNumber || (userData && userData.balance < MIN_WITHDRAWAL)}
        >
          💳 Request Withdrawal
        </Button>
      </div>

      <Button variant="ghost" onClick={() => navigate('/')}>
        Back to Dashboard
      </Button>
    </div>
  )
}
