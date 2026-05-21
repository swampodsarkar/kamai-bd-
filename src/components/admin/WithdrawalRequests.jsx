import { useState, useEffect } from 'react'
import { db, ref, onValue, off, update, get, child } from '../../lib/firebase'
import { useUser } from '../../context/UserContext'
import { showToast } from '../ui/Toast'

export default function WithdrawalRequests() {
  const { user } = useUser()
  const [withdrawals, setWithdrawals] = useState({})
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user?.uid) return

    const withdrawalsRef = ref(db, 'withdrawals')
    onValue(withdrawalsRef, (snapshot) => {
      if (snapshot.exists()) {
        setWithdrawals(snapshot.val())
      } else {
        setWithdrawals({})
      }
    })

    return () => off(withdrawalsRef)
  }, [user?.uid])

  const handleApprove = async (withdrawId, withdrawal) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_CLOUD_FUNCTIONS_URL}/adminProcessWithdrawal`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminUid: user.uid,
            withdrawId,
            userId: withdrawal.userId,
            amount: withdrawal.amount,
            status: 'approved',
          }),
        }
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      showToast(`Withdrawal ${withdrawal.amount.toFixed(2)} Tk approved`, 'success')
    } catch (e) {
      showToast(e.message || 'Failed to process', 'error')
    }
  }

  const handleReject = async (withdrawId) => {
    try {
      await update(ref(db, `withdrawals/${withdrawId}`), {
        status: 'rejected',
        processedAt: Date.now(),
        processedBy: user.uid,
      })
      showToast('Withdrawal rejected', 'warning')
    } catch (e) {
      showToast('Failed to reject', 'error')
    }
  }

  const filtered = Object.entries(withdrawals).filter(([, w]) => {
    if (filter === 'all') return true
    return w.status === filter
  }).sort(([, a], [, b]) => b.createdAt - a.createdAt)

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium capitalize transition-all whitespace-nowrap ${
              filter === f
                ? 'gold-gradient text-dark-950'
                : 'glass-card text-gray-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
        {filtered.map(([id, w]) => (
          <div key={id} className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-semibold">{w.amount?.toFixed(2)} Tk</p>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border capitalize ${getStatusStyle(w.status)}`}
              >
                {w.status}
              </span>
            </div>
            <div className="space-y-1 text-xs text-gray-400">
              <p>Method: {w.method} | Account: {w.accountNumber}</p>
              <p>
                User: {w.username || w.userId?.slice(0, 8) + '...'} | {new Date(w.createdAt).toLocaleString()}
              </p>
            </div>
            {w.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleApprove(id, w)}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(id)}
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No withdrawals found</p>
          </div>
        )}
      </div>
    </div>
  )
}
