import { useState, useEffect } from 'react'
import { db, ref, onValue, off } from '../../lib/firebase'
import { useUser } from '../../context/UserContext'

export default function AdLogs() {
  const { user } = useUser()
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user?.uid) return

    const logsRef = ref(db, 'ad_logs')
    onValue(logsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const logArray = Object.entries(data)
          .map(([id, log]) => ({ id, ...log }))
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, 200)
        setLogs(logArray)
      }
    })

    return () => off(logsRef)
  }, [user?.uid])

  const filteredLogs = search
    ? logs.filter(
        (log) =>
          log.userId?.toLowerCase().includes(search.toLowerCase()) ||
          log.adType?.toLowerCase().includes(search.toLowerCase())
      )
    : logs

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by user ID..."
        className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold-500 transition-colors text-sm"
      />

      <div className="text-xs text-gray-500 flex justify-between">
        <span>Total: {logs.length} entries</span>
        <span>Showing recent 200</span>
      </div>

      <div className="space-y-1 max-h-[60vh] overflow-y-auto scrollbar-hide">
        {filteredLogs.map((log) => (
          <div key={log.id} className="glass-card rounded-lg px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-medium truncate">
                  {log.userId?.slice(0, 12)}...
                </p>
                <p className="text-gray-500 text-[10px]">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown'}
                </p>
              </div>
              <div className="text-right ml-2">
                <p className="text-gold-400 text-xs font-semibold">
                  +{log.reward?.toFixed(2) || '0.00'} Tk
                </p>
                {log.adType && (
                  <p className="text-gray-500 text-[10px] capitalize">{log.adType}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No ad logs found</p>
          </div>
        )}
      </div>
    </div>
  )
}
