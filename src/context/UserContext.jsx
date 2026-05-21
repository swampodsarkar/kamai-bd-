import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { auth, db, ref, onValue, off, set, get, update, signInWithCustomToken, signOut } from '../lib/firebase'
import { signInAnonymously } from 'firebase/auth'
import useTelegram from '../hooks/useTelegram'

const UserContext = createContext(null)

function getDemoData(uid) {
  try {
    const raw = localStorage.getItem(`demo_user_${uid}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function setDemoData(uid, data) {
  try { localStorage.setItem(`demo_user_${uid}`, JSON.stringify(data)) } catch {}
}

export function UserProvider({ children }) {
  const { user: tgUser, ready: tgReady } = useTelegram()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDemo, setIsDemo] = useState(false)
  const listenerRef = useRef(null)

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
          await fetch(
            `${import.meta.env.VITE_CLOUD_FUNCTIONS_URL}/processReferral`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: firebaseUser.uid,
                referredBy: refParam,
              }),
            }
          )
        } catch (e) { console.warn('Referral processing failed:', e) }
      }

      setUserData(newUser)
    } else {
      setUserData(snapshot.val())
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
          signOut(auth)
          setUser(null)
          setError('Your account has been banned.')
        } else {
          setUserData(data)
        }
      }
    })
  }, [])

  useEffect(() => {
    if (!tgReady) return

    const initAuth = async () => {
      try {
        if (tgUser?.id) {
          // Try Cloud Function auth first
          try {
            const resp = await fetch(
              `${import.meta.env.VITE_CLOUD_FUNCTIONS_URL}/authTelegram`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: tgUser.id,
                  username: tgUser.username,
                  firstName: tgUser.firstName,
                  lastName: tgUser.lastName,
                }),
              }
            )
            const data = await resp.json()
            if (data.token) {
              await signInWithCustomToken(auth, data.token)
              // onAuthStateChanged will handle the rest
              return
            }
          } catch (e) {
            console.warn('Cloud Function unavailable, using demo mode:', e.message)
          }

          // Fallback: demo mode with anonymous auth
          try {
            const cred = await signInAnonymously(auth)
            const uid = cred.user.uid

            setUser(cred.user)
            setIsDemo(true)

            let demoData = getDemoData(uid)
            if (!demoData) {
              demoData = {
                balance: 5,
                adsWatched: 0,
                referrals: 0,
                referralEarnings: 0,
                lastBonusClaim: 0,
                createdAt: Date.now(),
                telegramId: tgUser.id,
                username: tgUser.username || '',
                firstName: tgUser.firstName || 'Demo User',
                isBanned: false,
                isAdmin: false,
              }
              setDemoData(uid, demoData)
            }
            setUserData(demoData)
            setLoading(false)
          } catch (anonErr) {
            console.error('Anonymous auth failed:', anonErr)
            setError('Failed to authenticate. Try again.')
            setLoading(false)
          }
        } else {
          // Not opened from Telegram — check for URL auth params
          const params = new URLSearchParams(window.location.search)
          const uid = params.get('uid')
          const token = params.get('token')
          if (uid && token) {
            await signInWithCustomToken(auth, token)
            return
          }
          setLoading(false)
        }
      } catch (e) {
        console.error('Auth init error:', e)
        setError('Failed to initialize.')
        setLoading(false)
      }
    }

    const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        if (tgUser?.id || !firebaseUser.isAnonymous) {
          await createOrUpdateUser(firebaseUser)
          startRealtimeListener(firebaseUser.uid)
          setLoading(false)
        }
      }
    })

    initAuth()

    return () => {
      unsub()
      if (listenerRef.current) off(ref(db, `users/${listenerRef.current}`))
    }
  }, [tgReady, tgUser, createOrUpdateUser, startRealtimeListener])

  const updateUserData = useCallback((updates) => {
    setUserData((prev) => {
      const next = { ...prev, ...updates }
      if (user?.uid && isDemo) setDemoData(user.uid, next)
      return next
    })
  }, [user?.uid, isDemo])

  const refreshUserData = useCallback(async () => {
    if (!user?.uid) return
    if (isDemo) {
      const data = getDemoData(user.uid)
      if (data) setUserData(data)
      return
    }
    const snapshot = await get(ref(db, `users/${user.uid}`))
    if (snapshot.exists()) setUserData(snapshot.val())
  }, [user?.uid, isDemo])

  const logout = useCallback(async () => {
    await signOut(auth)
    setUser(null)
    setUserData(null)
    setIsDemo(false)
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        userData,
        loading,
        error,
        isDemo,
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
