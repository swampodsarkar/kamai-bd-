const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')

admin.initializeApp()

const db = admin.database()
const corsHandler = cors({ origin: true })

const ADMIN_SECRET_KEY = functions.config().admin?.key || process.env.ADMIN_SECRET_KEY || 'change-me-in-production'
const AD_REWARD_BASE = 0.05
const REFERRAL_REWARD_INVITER = 0.10
const REFERRAL_REWARD_INVITEE = 0.10
const DAILY_BONUS_BASE = 0.25
const AD_COOLDOWN_MS = 30000
const MIN_WITHDRAWAL = 50

const STREAK_BONUSES = {
  7: 2.00,
  14: 5.00,
  30: 15.00,
}

function validateTelegramAuth(data) {
  return data && data.id && typeof data.id === 'number'
}

// ==========================================
// AUTH: Generate custom token for Telegram user
// ==========================================
exports.authTelegram = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }

      const { id, username, firstName, lastName } = req.body

      if (!validateTelegramAuth(req.body)) {
        return res.status(400).json({ error: 'Invalid Telegram user data' })
      }

      const uid = `tg_${id}`
      const customToken = await admin.auth().createCustomToken(uid, {
        telegramId: id,
        username: username || '',
        firstName: firstName || '',
      })

      const userRef = db.ref(`users/${uid}`)
      const snapshot = await userRef.once('value')

      if (!snapshot.exists()) {
        await userRef.set({
          balance: 0,
          adsWatched: 0,
          referrals: 0,
          referralEarnings: 0,
          lastBonusClaim: 0,
          createdAt: Date.now(),
          telegramId: id,
          username: username || '',
          firstName: firstName || '',
          isBanned: false,
          isAdmin: false,
        })
      }

      return res.json({ token: customToken })
    } catch (e) {
      console.error('Auth error:', e)
      return res.status(500).json({ error: 'Authentication failed' })
    }
  })
})

// ==========================================
// REWARD: Process ad watch reward
// ==========================================
exports.rewardAd = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }

      const { userId, adType, multiplier } = req.body

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' })
      }

      const userRef = db.ref(`users/${userId}`)
      const snapshot = await userRef.once('value')

      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'User not found' })
      }

      const userData = snapshot.val()

      if (userData.isBanned) {
        return res.status(403).json({ error: 'Account is banned' })
      }

      const now = Date.now()
      const lastAdRef = db.ref(`ad_logs`)

      const logsSnapshot = await lastAdRef.orderByChild('userId').equalTo(userId).limitToLast(1).once('value')

      let lastAdTime = 0
      logsSnapshot.forEach((child) => {
        lastAdTime = child.val().timestamp || 0
      })

      if (now - lastAdTime < AD_COOLDOWN_MS) {
        return res.status(429).json({
          error: 'Please wait before watching another ad',
          cooldownRemaining: AD_COOLDOWN_MS - (now - lastAdTime),
        })
      }

      const reward = AD_REWARD_BASE * (multiplier || 1)

      const updates = {}
      updates[`users/${userId}/balance`] = admin.database.ServerValue.increment(reward)
      updates[`users/${userId}/adsWatched`] = admin.database.ServerValue.increment(1)

      const adLogRef = db.ref('ad_logs').push()
      updates[`ad_logs/${adLogRef.key}`] = {
        userId,
        timestamp: now,
        reward,
        adType: adType || 'rewarded',
      }

      // Check if user has a referrer and reward if this is their first ad
      const referralRef = db.ref(`referrals/${userId}/referredBy`)
      const referredBySnapshot = await referralRef.once('value')

      if (referredBySnapshot.exists() && (userData.adsWatched || 0) === 0) {
        const referrerUid = referredBySnapshot.val()
        const referrerSnapshot = await db.ref(`users/${referrerUid}`).once('value')

        if (referrerSnapshot.exists() && !referrerSnapshot.val().isBanned) {
          updates[`users/${referrerUid}/balance`] = admin.database.ServerValue.increment(REFERRAL_REWARD_INVITER)
          updates[`users/${referrerUid}/referralEarnings`] = admin.database.ServerValue.increment(REFERRAL_REWARD_INVITER)
          updates[`users/${userId}/balance`] = admin.database.ServerValue.increment(REFERRAL_REWARD_INVITEE)
        }
      }

      await db.ref().update(updates)

      const updatedSnapshot = await userRef.once('value')
      const updatedBalance = updatedSnapshot.val().balance

      return res.json({
        success: true,
        reward,
        newBalance: updatedBalance,
        adsWatched: (userData.adsWatched || 0) + 1,
      })
    } catch (e) {
      console.error('Reward error:', e)
      return res.status(500).json({ error: 'Failed to process reward' })
    }
  })
})

// ==========================================
// BONUS: Claim daily bonus
// ==========================================
exports.claimBonus = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }

      const { userId, streak } = req.body

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' })
      }

      const userRef = db.ref(`users/${userId}`)
      const snapshot = await userRef.once('value')

      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'User not found' })
      }

      const userData = snapshot.val()

      if (userData.isBanned) {
        return res.status(403).json({ error: 'Account is banned' })
      }

      const now = Date.now()

      if (userData.lastBonusClaim && now - userData.lastBonusClaim < 24 * 60 * 60 * 1000) {
        return res.status(429).json({ error: 'Bonus already claimed today' })
      }

      const currentStreak = streak || 1
      const bonusAmount = STREAK_BONUSES[currentStreak] || DAILY_BONUS_BASE

      await userRef.update({
        balance: admin.database.ServerValue.increment(bonusAmount),
        lastBonusClaim: now,
      })

      return res.json({
        success: true,
        reward: bonusAmount,
        streak: currentStreak,
      })
    } catch (e) {
      console.error('Bonus error:', e)
      return res.status(500).json({ error: 'Failed to claim bonus' })
    }
  })
})

// ==========================================
// REFERRAL: Process referral relationship
// ==========================================
exports.processReferral = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }

      const { userId, referredBy } = req.body

      if (!userId || !referredBy) {
        return res.status(400).json({ error: 'userId and referredBy required' })
      }

      if (userId === referredBy) {
        return res.status(400).json({ error: 'Cannot refer yourself' })
      }

      const referrerSnapshot = await db.ref(`users/${referredBy}`).once('value')
      if (!referrerSnapshot.exists()) {
        return res.status(404).json({ error: 'Referrer not found' })
      }

      if (referrerSnapshot.val().isBanned) {
        return res.status(403).json({ error: 'Referrer is banned' })
      }

      const existingRef = await db.ref(`referrals/${userId}/referredBy`).once('value')
      if (existingRef.exists()) {
        return res.json({ success: false, message: 'Already referred by someone' })
      }

      const updates = {}
      updates[`referrals/${userId}/referredBy`] = referredBy
      updates[`referrals/${referredBy}/referralsList/${userId}`] = {
        joinedAt: Date.now(),
        username: '',
      }
      updates[`users/${referredBy}/referrals`] = admin.database.ServerValue.increment(1)

      await db.ref().update(updates)

      return res.json({ success: true })
    } catch (e) {
      console.error('Referral error:', e)
      return res.status(500).json({ error: 'Failed to process referral' })
    }
  })
})

// ==========================================
// ADMIN: Authenticate admin
// ==========================================
exports.adminAuth = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }

      const { adminKey } = req.body

      if (!adminKey || adminKey !== ADMIN_SECRET_KEY) {
        return res.status(401).json({ error: 'Invalid admin key' })
      }

      const adminUid = `admin_${Date.now()}`
      const token = await admin.auth().createCustomToken(adminUid, {
        isAdmin: true,
        role: 'admin',
      })

      await db.ref(`users/${adminUid}`).update({
        isAdmin: true,
        isBanned: false,
        createdAt: Date.now(),
        firstName: 'Admin',
      })

      return res.json({ token, uid: adminUid })
    } catch (e) {
      console.error('Admin auth error:', e)
      return res.status(500).json({ error: 'Authentication failed' })
    }
  })
})

// ==========================================
// ADMIN: Update user balance
// ==========================================
exports.adminUpdateBalance = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }

      const { adminUid, targetUid, newBalance } = req.body

      if (!adminUid || !targetUid || newBalance === undefined) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const adminSnapshot = await db.ref(`users/${adminUid}/isAdmin`).once('value')
      if (!adminSnapshot.val()) {
        return res.status(403).json({ error: 'Unauthorized' })
      }

      if (typeof newBalance !== 'number' || newBalance < 0) {
        return res.status(400).json({ error: 'Invalid balance' })
      }

      await db.ref(`users/${targetUid}/balance`).set(newBalance)

      return res.json({ success: true, newBalance })
    } catch (e) {
      console.error('Admin update error:', e)
      return res.status(500).json({ error: 'Failed to update balance' })
    }
  })
})

// ==========================================
// ADMIN: Process withdrawal (approve/reject)
// ==========================================
exports.adminProcessWithdrawal = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
      }

      const { adminUid, withdrawId, userId, amount, status } = req.body

      if (!adminUid || !withdrawId || !userId || !amount || !status) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const adminSnapshot = await db.ref(`users/${adminUid}/isAdmin`).once('value')
      if (!adminSnapshot.val()) {
        return res.status(403).json({ error: 'Unauthorized' })
      }

      if (status === 'approved') {
        const userSnapshot = await db.ref(`users/${userId}`).once('value')
        const userBalance = userSnapshot.val().balance || 0

        if (userBalance < amount) {
          return res.status(400).json({ error: 'Insufficient balance' })
        }

        await db.ref(`users/${userId}/balance`).set(admin.database.ServerValue.increment(-amount))
      }

      await db.ref(`withdrawals/${withdrawId}`).update({
        status,
        processedAt: Date.now(),
        processedBy: adminUid,
      })

      return res.json({ success: true, status })
    } catch (e) {
      console.error('Withdrawal process error:', e)
      return res.status(500).json({ error: 'Failed to process withdrawal' })
    }
  })
})

// ==========================================
// ANALYTICS: Get platform stats
// ==========================================
exports.getPlatformStats = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const usersSnapshot = await db.ref('users').once('value')
      const withdrawalsSnapshot = await db.ref('withdrawals').once('value')

      let totalUsers = 0
      let totalBalance = 0
      let totalAdsWatched = 0
      let bannedUsers = 0

      usersSnapshot.forEach((child) => {
        const data = child.val()
        totalUsers++
        totalBalance += data.balance || 0
        totalAdsWatched += data.adsWatched || 0
        if (data.isBanned) bannedUsers++
      })

      let pendingWithdrawals = 0
      let totalWithdrawn = 0

      withdrawalsSnapshot.forEach((child) => {
        const data = child.val()
        if (data.status === 'pending') pendingWithdrawals++
        if (data.status === 'approved') totalWithdrawn += data.amount || 0
      })

      return res.json({
        totalUsers,
        totalBalance,
        totalAdsWatched,
        bannedUsers,
        pendingWithdrawals,
        totalWithdrawn,
      })
    } catch (e) {
      console.error('Stats error:', e)
      return res.status(500).json({ error: 'Failed to get stats' })
    }
  })
})
