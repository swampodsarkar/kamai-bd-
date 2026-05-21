import { useEffect, useState } from 'react'

export default function useTelegram() {
  const [tg, setTg] = useState(null)
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const tgApp = window.Telegram?.WebApp
      if (tgApp) {
        tgApp.ready()
        tgApp.expand()

        setTg(tgApp)

        const initData = tgApp.initDataUnsafe
        if (initData?.user) {
          setUser({
            id: initData.user.id,
            username: initData.user.username || '',
            firstName: initData.user.first_name || '',
            lastName: initData.user.last_name || '',
            languageCode: initData.user.language_code || 'en',
            photoUrl: initData.user.photo_url || '',
          })
        }

        tgApp.onEvent('viewportChanged', () => {
          tgApp.expand()
        })

        setReady(true)

        return () => {
          tgApp.offEvent('viewportChanged')
        }
      } else {
        setReady(true)
      }
    } catch (e) {
      console.warn('Telegram WebApp not available:', e)
      setReady(true)
    }
  }, [])

  const showAlert = (message) => {
    if (tg?.showAlert) {
      tg.showAlert(message)
    } else {
      alert(message)
    }
  }

  const showConfirm = (message) => {
    if (tg?.showConfirm) {
      return tg.showConfirm(message)
    }
    return Promise.resolve(window.confirm(message))
  }

  const hapticFeedback = (type = 'medium') => {
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(type)
    }
  }

  return { tg, user, ready, showAlert, showConfirm, hapticFeedback }
}
