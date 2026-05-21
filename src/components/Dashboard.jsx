import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import BalanceCard from './ui/BalanceCard'
import StatsCard from './ui/StatsCard'
import Button from './ui/Button'

export default function Dashboard() {
  const { userData, tgUser } = useUser()
  const navigate = useNavigate()

  if (!userData) {
    return (
      <div className="space-y-4">
        <div className="skeleton-pulse h-40 rounded-2xl" />
        <div className="skeleton-pulse h-20 rounded-xl" />
        <div className="skeleton-pulse h-20 rounded-xl" />
        <div className="skeleton-pulse h-20 rounded-xl" />
      </div>
    )
  }

  const canClaimBonus = () => {
    if (!userData.lastBonusClaim) return true
    const now = Date.now()
    const diff = now - userData.lastBonusClaim
    return diff >= 24 * 60 * 60 * 1000
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-gray-400 text-sm">Welcome back,</p>
          <h2 className="text-xl font-bold text-white">
            {tgUser?.firstName || userData?.firstName || 'User'}
          </h2>
        </div>
        <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
          <span className="text-sm font-bold text-dark-950">
            {(tgUser?.firstName || 'U')[0]}
          </span>
        </div>
      </div>

      <BalanceCard balance={userData.balance} />

      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          icon="📺"
          label="Ads Watched"
          value={userData.adsWatched || 0}
          subtext="Keep watching!"
          color="blue"
        />
        <StatsCard
          icon="👥"
          label="Referrals"
          value={userData.referrals || 0}
          subtext={userData.referralEarnings ? `Earned ${userData.referralEarnings.toFixed(2)} Tk` : 'Invite friends'}
          color="green"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          icon={canClaimBonus() ? '🎁' : '⏰'}
          label="Daily Bonus"
          value={canClaimBonus() ? 'Available' : 'Coming soon'}
          subtext={canClaimBonus() ? 'Claim now!' : 'Check back later'}
          color="purple"
        />
        <StatsCard
          icon="💳"
          label="Withdrawals"
          value={`${userData.balance >= 50 ? 'Eligible' : 'Min 50 Tk'}`}
          subtext={userData.balance >= 50 ? 'Ready to cashout' : `${(50 - userData.balance).toFixed(2)} Tk more`}
          color="gold"
        />
      </div>

      <div className="space-y-3 pt-2">
        <Button variant="gold" size="lg" onClick={() => navigate('/watch')}>
          📺 Watch Ad & Earn
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => navigate('/referral')}>
            👥 Invite Friends
          </Button>
          <Button variant="secondary" onClick={() => navigate('/withdraw')}>
            💳 Withdraw
          </Button>
        </div>

        {canClaimBonus() && (
          <Button variant="ghost" onClick={() => navigate('/bonus')}>
            🎁 Claim Daily Bonus
          </Button>
        )}
      </div>
    </div>
  )
}
