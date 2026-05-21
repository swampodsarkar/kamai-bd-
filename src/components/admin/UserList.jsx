import { useState, useEffect } from 'react'
import { db, ref, onValue, off, update } from '../../lib/firebase'
import { useUser } from '../../context/UserContext'
import { showToast } from '../ui/Toast'

export default function UserList() {
  const { user } = useUser()
  const [users, setUsers] = useState({})
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [editBalance, setEditBalance] = useState('')

  useEffect(() => {
    if (!user?.uid) return
    const usersRef = ref(db, 'users')
    onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) setUsers(snapshot.val())
    })
    return () => off(usersRef)
  }, [user?.uid])

  const handleUpdateBalance = async (uid, newBalance) => {
    const amount = parseFloat(newBalance)
    if (isNaN(amount) || amount < 0) { showToast('Enter a valid amount', 'warning'); return }
    try {
      await update(ref(db, `users/${uid}`), { balance: amount })
      showToast('Balance updated', 'success')
      setSelectedUser(null)
      setEditBalance('')
    } catch (e) {
      showToast('Update failed', 'error')
    }
  }

  const handleToggleBan = async (uid, currentStatus) => {
    try {
      await update(ref(db, `users/${uid}`), { isBanned: !currentStatus })
      showToast(!currentStatus ? 'User banned' : 'User unbanned', !currentStatus ? 'warning' : 'success')
    } catch (e) {
      showToast('Failed to update user', 'error')
    }
  }

  const filteredUsers = Object.entries(users).filter(([uid, data]) => {
    if (!search) return true
    const q = search.toLowerCase()
    return uid.toLowerCase().includes(q) ||
      (data.username && data.username.toLowerCase().includes(q)) ||
      (data.firstName && data.firstName.toLowerCase().includes(q))
  })

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users by ID, username..."
        className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500 text-sm"
      />

      <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
        {filteredUsers.map(([uid, data]) => (
          <div key={uid} className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">{data.firstName || data.username || 'User'}</p>
                <p className="text-gray-500 text-xs truncate">{uid}</p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {data.isBanned && <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-medium">Banned</span>}
                {data.isAdmin && <span className="px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 text-[10px] font-medium">Admin</span>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
              <div><p className="text-gold-400 font-semibold">{data.balance?.toFixed(2) || '0.00'}</p><p className="text-gray-500">Balance</p></div>
              <div><p className="text-blue-400 font-semibold">{data.adsWatched || 0}</p><p className="text-gray-500">Ads</p></div>
              <div><p className="text-emerald-400 font-semibold">{data.referrals || 0}</p><p className="text-gray-500">Refs</p></div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setSelectedUser(uid); setEditBalance(String(data.balance || 0)) }} className="flex-1 py-1.5 rounded-lg bg-gold-500/10 text-gold-400 text-xs font-medium">
                Edit Balance
              </button>
              <button onClick={() => handleToggleBan(uid, data.isBanned)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${data.isBanned ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {data.isBanned ? 'Unban' : 'Ban'}
              </button>
            </div>

            {selectedUser === uid && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex gap-2">
                  <input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} step="0.01" min="0" className="flex-1 bg-dark-700 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-gold-500" autoFocus />
                  <button onClick={() => handleUpdateBalance(uid, editBalance)} className="px-3 py-1.5 rounded-lg gold-gradient text-dark-950 text-xs font-bold">Save</button>
                  <button onClick={() => setSelectedUser(null)} className="px-3 py-1.5 rounded-lg bg-dark-700 text-gray-400 text-xs">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredUsers.length === 0 && <div className="text-center py-8"><p className="text-gray-500 text-sm">No users found</p></div>}
      </div>
    </div>
  )
}
