import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { auth, db, ref, onValue, off, set, get, update } from '../lib/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import useTelegram from '../hooks/useTelegram'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const { user: tgUser, ready: tgReady } = useTelegram()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const listenerRef = useRef(null)

  const telegramAuth = useCallback(async (telegramId) => {
    const email = `tg_${telegramId}@kamai.app`
    const password = `kamai_${telegramId}_2026`

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      return cred
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        return cred
      }
      throw e
    }
  }, [])

  const createOrUpdateUser = useCallback(async (firebaseUser) => {
    if (!firebaseUser?.uid) return

    const userRef = ref(db, `users/${firebaseUser.uid}`)
    const snapshot = await get(userRef)

    if (!snapshot.exists()) {
      const now = Date.now()
      const newUser = {
        balance: 0,
        adsWatched: 0,
        referrals: 0,
        referralEarnings: 0,
        lastBonusClaim: 0,
        lastAdTime: 0,
        dailyLimit: 20,
        createdAt: now,
        telegramId: tgUser?.id || 0,
        username: tgUser?.username || '',
        firstName: tgUser?.firstName || '',
        isBanned: false,
        isAdmin: false,
      }

      await set(userRef, newUser)

      const params = new URLSearchParams(window.location.search)
      const refParam = params.get('ref')
      if (refParam && refParam !== String(tgUser?.id)) {
        try {
          await set(ref(db, `referrals/${firebaseUser.uid}/referredBy`), refParam)
          await update(ref(db, `users/${refParam}`), {
            referrals: (snapshot.val()?.referrals || 0) + 1,
          })
        } catch (e) { console.warn('Referral setup failed:', e) }
      }

      setUserData(newUser)
    } else {
      const data = snapshot.val()
      if (data.isBanned) {
        setError('Your account has been banned.')
        return
      }
      setUserData(data)
    }
  }, [tgUser])

  const startRealtimeListener = useCallback((uid) => {
    if (listenerRef.current) off(ref(db, `users/${listenerRef.current}`))
    listenerRef.current = uid

    const userRef = ref(db, `users/${uid}`)
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        if (data.isBanned) {
          setUserData(data)
          setError('Your account has been banned.')
        } else {
          setUserData(data)
        }
      }
    })
  }, [])

  useEffect(() => {
    if (!tgReady) return

    const doAuth = async () => {
      try {
        if (tgUser?.id) {
          console.log('Telegram login:', tgUser.id, tgUser.firstName)
          const cred = await telegramAuth(tgUser.id)
          setUser(cred.user)
          await createOrUpdateUser(cred.user)
          startRealtimeListener(cred.user.uid)
          setLoading(false)
        } else {
          setLoading(false)
        }
      } catch (e) {
        console.error('Auth error:', e)
        setError('Failed to authenticate.')
        setLoading(false)
      }
    }

    doAuth()

    return () => {
      if (listenerRef.current) off(ref(db, `users/${listenerRef.current}`))
    }
  }, [tgReady, tgUser, telegramAuth, createOrUpdateUser, startRealtimeListener])

  const updateUserData = useCallback((updates) => {
    if (!user?.uid) return
    setUserData((prev) => {
      const next = { ...prev, ...updates }
      update(ref(db, `users/${user.uid}`), updates).catch(() => {})
      return next
    })
  }, [user?.uid])

  const refreshUserData = useCallback(async () => {
    if (!user?.uid) return
    const snapshot = await get(ref(db, `users/${user.uid}`))
    if (snapshot.exists()) setUserData(snapshot.val())
  }, [user?.uid])

  const logout = useCallback(async () => {
    setUser(null)
    setUserData(null)
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        userData,
        loading,
        error,
        updateUserData,
        refreshUserData,
        logout,
        tgUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}
