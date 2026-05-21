/**
 * AdGram Rewarded Ad Integration
 * AdGram is a Telegram Mini Apps ad network.
 * Docs: https://docs.adgram.com
 *
 * Integration Guide:
 * 1. Sign up at https://adgram.com
 * 2. Create a placement (Rewarded Video)
 * 3. Add your placement ID in .env as VITE_ADGRAM_PLACEMENT_ID
 * 4. Add AdGram script to index.html:
 *    <script src="https://sdk.adgram.com/js/sdk.js?placement=YOUR_PLACEMENT_ID"></script>
 */

const ADGRAM_PLACEMENT_ID = import.meta.env.VITE_ADGRAM_PLACEMENT_ID || ''

export const ADGRAM_AVAILABLE = typeof window !== 'undefined' && !!window.AdGram

export function isAdGramReady() {
  return typeof window !== 'undefined' && typeof window.AdGram !== 'undefined'
}

export function initAdGram() {
  return new Promise((resolve, reject) => {
    if (isAdGramReady()) {
      resolve(window.AdGram)
      return
    }

    const checkInterval = setInterval(() => {
      if (isAdGramReady()) {
        clearInterval(checkInterval)
        resolve(window.AdGram)
      }
    }, 200)

    setTimeout(() => {
      clearInterval(checkInterval)
      resolve(null)
    }, 10000)
  })
}

export function showRewardedAd() {
  return new Promise((resolve, reject) => {
    if (!isAdGramReady()) {
      resolve(true)
      return
    }

    try {
      window.AdGram.showRewardedVideo({
        placementId: ADGRAM_PLACEMENT_ID,
        onRewarded: () => {
          resolve(true)
        },
        onError: (error) => {
          console.warn('AdGram error:', error)
          resolve(true)
        },
        onClose: () => {
          resolve(false)
        },
      })

      setTimeout(() => {
        resolve(true)
      }, 15000)
    } catch (e) {
      console.warn('AdGram show failed:', e)
      resolve(true)
    }
  })
}

export default {
  isAdGramReady,
  initAdGram,
  showRewardedAd,
  ADGRAM_AVAILABLE,
}
