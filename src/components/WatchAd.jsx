import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { CLOUD_FUNCTIONS_URL } from '../lib/firebase'
import { showRewardedAd } from '../lib/adsgram'
import Button from './ui/Button'
import { showToast } from './ui/Toast'

const AD_COOLDOWN = 45

export default function WatchAd() {
  const { user, userData, refreshUserData } = useUser()
  const navigate = useNavigate()
  const [cooldown, setCooldown] = useState(0)
  const [isWatching, setIsWatching] = useState(false)
  const [adsWatchedToday, setAdsWatchedToday] = useState(0)
  const [lastReward, setLastReward] = useState(null)
  const cooldownRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem(`adCooldown_${user?.uid}`)
    if (saved) {
      const remaining = Math.ceil((parseInt(saved) - Date.now()) / 1000)
      if (remaining > 0) {
        setCooldown(remaining)
      } else {
        localStorage.removeItem(`adCooldown_${user?.uid}`)
      }
    }

    const today = new Date().toDateString()
    const adsToday = localStorage.getItem(`adsToday_${user?.uid}`)
    if (adsToday) {
      const [date, count] = adsToday.split('|')
      if (date === today) {
        setAdsWatchedToday(parseInt(count))
      }
    }

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [user?.uid])

  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current)
            localStorage.removeItem(`adCooldown_${user?.uid}`)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [cooldown, user?.uid])

  const handleWatchAd = useCallback(async () => {
    if (isWatching || cooldown > 0 || !user?.uid) return

    setIsWatching(true)
    setLastReward(null)

    try {
      const result = await showRewardedAd()

      if (!result.done) {
        if (!result.demo) {
          showToast('Watch the full ad to earn reward', 'warning')
        }
        setIsWatching(false)
        return
      }

      const response = await fetch(`${CLOUD_FUNCTIONS_URL}/rewardAd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          adType: 'rewarded',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process reward')
      }

      const rewardAmount = data.reward || 0.05
      setLastReward(rewardAmount)

      const cooldownEnd = Date.now() + AD_COOLDOWN * 1000
      localStorage.setItem(`adCooldown_${user.uid}`, String(cooldownEnd))
      setCooldown(AD_COOLDOWN)

      const today = new Date().toDateString()
      const newCount = adsWatchedToday + 1
      localStorage.setItem(`adsToday_${user.uid}`, `${today}|${newCount}`)
      setAdsWatchedToday(newCount)

      await refreshUserData()

      showToast(`Earned ${rewardAmount.toFixed(2)} Tk!`, 'success')
    } catch (e) {
      showToast(e.message || 'Failed to watch ad. Try again.', 'error')
    } finally {
      setIsWatching(false)
    }
  }, [isWatching, cooldown, user?.uid, refreshUserData, adsWatchedToday])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold gold-gradient-text">Watch & Earn</h1>
        <p className="text-gray-400 text-sm mt-1">Watch ads and earn Taka instantly</p>
      </div>

      <div className="glass-card rounded-2xl p-6 gold-border text-center">
        <div className="text-6xl mb-4">📺</div>
        <p className="text-3xl font-bold gold-gradient-text">
          {lastReward ? `${lastReward.toFixed(2)} Tk` : '0.05 Tk'}
        </p>
        <p className="text-gray-500 text-sm mt-1">per ad watched</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400 text-sm">Today's Ads</span>
          <span className="text-white font-semibold">{adsWatchedToday}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400 text-sm">Total Ads</span>
          <span className="text-white font-semibold">{userData?.adsWatched || 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Total Earned</span>
          <span className="text-gold-400 font-semibold">
            {userData?.balance?.toFixed(2) || '0.00'} Tk
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {cooldown > 0 ? (
          <Button variant="secondary" disabled>
            ⏳ Cooldown {formatTime(cooldown)}
          </Button>
        ) : (
          <Button
            variant="gold"
            size="lg"
            onClick={handleWatchAd}
            loading={isWatching}
            disabled={isWatching}
          >
            {isWatching ? 'Loading Ad...' : '📺 Watch Ad Now'}
          </Button>
        )}

        <Button variant="ghost" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </div>

      {lastReward && (
        <div className="glass-card rounded-xl p-4 text-center animate-slide-up border-emerald-500/20">
          <p className="text-emerald-400 font-semibold">
            +{lastReward.toFixed(2)} Tk earned!
          </p>
          <p className="text-gray-500 text-xs mt-1">Keep watching to earn more</p>
        </div>
      )}
    </div>
  )
}
