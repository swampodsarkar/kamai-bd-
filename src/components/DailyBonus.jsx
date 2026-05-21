import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import Button from './ui/Button'
import { showToast } from './ui/Toast'

const BONUS_AMOUNT = 0.25
const STREAK_BONUSES = { 7: 2.00, 14: 5.00, 30: 15.00 }

export default function DailyBonus() {
  const { user, userData, updateUserData } = useUser()
  const navigate = useNavigate()
  const [claiming, setClaiming] = useState(false)
  const [streak, setStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState('')

  const canClaim = useCallback(() => {
    if (!userData?.lastBonusClaim) return true
    return Date.now() - userData.lastBonusClaim >= 24 * 60 * 60 * 1000
  }, [userData])

  useEffect(() => {
    if (!userData?.lastBonusClaim) { setTimeLeft('Claim now!'); return }
    const update = () => {
      const diff = 24 * 60 * 60 * 1000 - (Date.now() - userData.lastBonusClaim)
      if (diff <= 0) { setTimeLeft('Claim now!'); return }
      const h = Math.floor(diff / (60 * 60 * 1000))
      const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
      const s = Math.floor((diff % (60 * 1000)) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [userData?.lastBonusClaim])

  useEffect(() => {
    const saved = localStorage.getItem(`bonusStreak_${user?.uid}`)
    if (saved) {
      const [date, count] = saved.split('|')
      if (new Date(date).getTime() > Date.now() - 48 * 60 * 60 * 1000) setStreak(parseInt(count))
    }
  }, [user?.uid])

  const handleClaim = async () => {
    if (!canClaim() || claiming || !user?.uid || !userData) return

    setClaiming(true)
    try {
      const newStreak = streak + 1
      const bonus = STREAK_BONUSES[newStreak] || BONUS_AMOUNT

      updateUserData({
        balance: (userData.balance || 0) + bonus,
        lastBonusClaim: Date.now(),
      })

      localStorage.setItem(`bonusStreak_${user?.uid}`, `${new Date().toDateString()}|${newStreak}`)
      setStreak(newStreak)
      showToast(`Daily bonus claimed! +${bonus.toFixed(2)} Tk`, 'success')
    } catch (e) {
      showToast('Failed to claim bonus', 'error')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold gold-gradient-text">Daily Bonus</h1>
        <p className="text-gray-400 text-sm mt-1">Claim your reward every day</p>
      </div>

      <div className="glass-card rounded-2xl p-8 gold-border text-center">
        <div className="text-7xl mb-4">{canClaim() ? '🎁' : '⏰'}</div>
        <p className="text-4xl font-bold gold-gradient-text mb-2">
          +{(STREAK_BONUSES[streak + 1] || BONUS_AMOUNT).toFixed(2)} Tk
        </p>
        <p className="text-gray-400 text-sm">Daily Bonus</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400 text-sm">Current Streak</span>
          <span className="text-gold-400 font-bold text-lg">{streak} days</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400 text-sm">Time Remaining</span>
          <span className={canClaim() ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {canClaim() ? 'Available' : timeLeft}
          </span>
        </div>
        <div className="flex gap-1 mb-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className={`flex-1 h-2 rounded-full ${i < streak ? 'gold-gradient' : 'bg-dark-700'}`} />
          ))}
        </div>
        <p className="text-center text-xs text-gray-500">
          {streak >= 7 ? `🎉 ${streak} day streak!` : `${7 - streak} more days for 7-day bonus!`}
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-3">Streak Rewards</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-gray-400 text-sm">Daily Bonus</span>
            <span className="text-gold-400 font-medium">+{BONUS_AMOUNT.toFixed(2)} Tk</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-gray-400 text-sm">7-Day Streak</span>
            <span className="text-emerald-400 font-medium">+{STREAK_BONUSES[7].toFixed(2)} Tk</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-gray-400 text-sm">14-Day Streak</span>
            <span className="text-emerald-400 font-medium">+{STREAK_BONUSES[14].toFixed(2)} Tk</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-400 text-sm">30-Day Streak</span>
            <span className="text-gold-400 font-bold">+{STREAK_BONUSES[30].toFixed(2)} Tk</span>
          </div>
        </div>
      </div>

      {canClaim() ? (
        <Button variant="gold" size="lg" onClick={handleClaim} loading={claiming} disabled={claiming}>
          🎁 Claim Daily Bonus
        </Button>
      ) : (
        <Button variant="secondary" disabled>
          ⏰ Available in {timeLeft}
        </Button>
      )}

      <Button variant="ghost" onClick={() => navigate('/')}>
        Back to Dashboard
      </Button>
    </div>
  )
}
