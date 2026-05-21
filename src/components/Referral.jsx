import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { db, ref, get } from '../lib/firebase'
import Button from './ui/Button'
import { showToast } from './ui/Toast'

export default function Referral() {
  const { user, userData } = useUser()
  const navigate = useNavigate()
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [referralList, setReferralList] = useState([])
  const [referredBy, setReferredBy] = useState(null)

  useEffect(() => {
    if (user?.uid) {
      const link = `https://t.me/KamaiBDBot?start=ref_${user.uid}`
      setReferralLink(link)

      const fetchReferrals = async () => {
        try {
          const refSnapshot = await get(ref(db, `referrals/${user.uid}`))
          if (refSnapshot.exists()) {
            const data = refSnapshot.val()
            setReferredBy(data.referredBy || null)
            if (data.referralsList) {
              setReferralList(Object.values(data.referralsList))
            }
          }
        } catch (e) {
          console.warn('Failed to fetch referrals:', e)
        }
      }
      fetchReferrals()
    }
  }, [user?.uid])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      showToast('Referral link copied!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = referralLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      showToast('Referral link copied!', 'success')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareReferral = () => {
    const text = `Join Kamai BD and start earning! Watch ads, earn Taka. Use my referral link: ${referralLink}`

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join Kamai BD and earn money by watching ads! 🎉')}`
      )
    } else if (navigator.share) {
      navigator.share({ title: 'Kamai BD', text, url: referralLink })
    } else {
      copyLink()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold gold-gradient-text">Refer & Earn</h1>
        <p className="text-gray-400 text-sm mt-1">Invite friends and earn rewards</p>
      </div>

      <div className="glass-card rounded-2xl p-6 gold-border text-center">
        <div className="text-6xl mb-4">👥</div>
        <p className="text-3xl font-bold gold-gradient-text">
          {userData?.referrals || 0}
        </p>
        <p className="text-gray-400 text-sm mt-1">Total Referrals</p>
        <p className="text-gold-400 font-semibold text-lg mt-2">
          +{userData?.referralEarnings?.toFixed(2) || '0.00'} Tk earned
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-2">How it works</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex gap-2">
            <span className="text-gold-400">1.</span>
            Share your referral link with friends
          </li>
          <li className="flex gap-2">
            <span className="text-gold-400">2.</span>
            They join and watch their first ad
          </li>
          <li className="flex gap-2">
            <span className="text-gold-400">3.</span>
            You both earn 0.10 Tk bonus
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <Button variant="gold" size="lg" onClick={shareReferral}>
          📤 Share Referral Link
        </Button>

        <div className="glass-card rounded-xl p-3 flex items-center gap-3">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 bg-transparent text-sm text-gray-300 outline-none truncate"
          />
          <button
            onClick={copyLink}
            className="text-gold-400 text-sm font-medium whitespace-nowrap hover:text-gold-300"
          >
            {copied ? '✅ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {referredBy && (
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">
            You were invited by a friend!
          </p>
        </div>
      )}

      {referralList.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-3">Your Referrals</h3>
          <div className="space-y-2">
            {referralList.map((ref, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-gray-300 text-sm">User #{i + 1}</span>
                <span className="text-emerald-400 text-sm font-medium">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button variant="ghost" onClick={() => navigate('/')}>
        Back to Dashboard
      </Button>
    </div>
  )
}
