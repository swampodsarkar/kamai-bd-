import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth, db, ref, onValue, off, set, get, child, update, signInWithCustomToken, signOut } from '../lib/firebase'
import useTelegram from '../hooks/useTelegram'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const { user: tgUser, ready: tgReady } = useTelegram()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState(null)

  const createOrUpdateUser = useCallback(async (firebaseUser) => {
    if (!firebaseUser?.uid || !tgUser?.id) return

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
        telegramId: tgUser.id,
        username: tgUser.username || '',
        firstName: tgUser.firstName || '',
        isBanned: false,
        isAdmin: false,
      }

      await set(userRef, newUser)

      const params = new URLSearchParams(window.location.search)
      const refParam = params.get('ref')
      if (refParam && refParam !== String(tgUser.id)) {
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
        } catch (e) {
          console.warn('Referral processing failed:', e)
        }
      }

      setUserData(newUser)
    } else {
      setUserData(snapshot.val())
    }
  }, [tgUser])

  useEffect(() => {
    if (!tgReady) return

    const initAuth = async () => {
      try {
        setAuthLoading(true)

        if (!tgUser?.id) {
          const params = new URLSearchParams(window.location.search)
          const uid = params.get('uid')
          const token = params.get('token')

          if (uid && token) {
            await signInWithCustomToken(auth, token)
          } else {
            setLoading(false)
            setAuthLoading(false)
            return
          }
        }

        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            setUser(firebaseUser)
            await createOrUpdateUser(firebaseUser)

            const userRef = ref(db, `users/${firebaseUser.uid}`)
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

            setLoading(false)
          } else {
            if (tgUser?.id) {
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
                }
              } catch (e) {
                console.error('Auth error:', e)
                setError('Authentication failed. Please try again.')
                setLoading(false)
              }
            } else {
              setLoading(false)
            }
          }
        })

        return () => {
          unsubscribe()
          if (user) {
            off(ref(db, `users/${user.uid}`))
          }
        }
      } catch (e) {
        console.error('Auth init error:', e)
        setError('Failed to initialize.')
        setLoading(false)
        setAuthLoading(false)
      }
    }

    initAuth()
  }, [tgReady, tgUser, createOrUpdateUser])

  const updateUserData = useCallback((updates) => {
    if (!user?.uid) return
    setUserData((prev) => ({ ...prev, ...updates }))
  }, [user])

  const refreshUserData = useCallback(async () => {
    if (!user?.uid) return
    const snapshot = await get(ref(db, `users/${user.uid}`))
    if (snapshot.exists()) {
      setUserData(snapshot.val())
    }
  }, [user])

  const logout = useCallback(async () => {
    await signOut(auth)
    setUser(null)
    setUserData(null)
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        userData,
        loading: loading || authLoading,
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
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
