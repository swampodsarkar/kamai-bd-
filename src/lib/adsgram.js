const ADSGRAM_BLOCK_ID = '30739'

function isAdsgramReady() {
  return typeof window !== 'undefined' && typeof window.Adsgram !== 'undefined'
}

function initController() {
  if (!isAdsgramReady()) return null
  try {
    return window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID })
  } catch (e) {
    console.warn('AdsGram init error:', e)
    return null
  }
}

export function showRewardedAd() {
  return new Promise((resolve) => {
    const controller = initController()
    if (!controller) {
      resolve({ done: true, demo: true })
      return
    }

    controller
      .show()
      .then((result) => {
        resolve({ done: true, ...result })
      })
      .catch((result) => {
        resolve({ done: false, ...result })
      })
  })
}

export default { showRewardedAd }
