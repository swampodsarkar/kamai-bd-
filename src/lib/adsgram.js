const ADSGRAM_BLOCK_ID = '30739'
let controller = null

function initController() {
  if (controller) return controller
  if (typeof window === 'undefined' || typeof window.Adsgram === 'undefined') return null

  try {
    controller = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID })
    return controller
  } catch (e) {
    console.warn('AdsGram init error:', e)
    return null
  }
}

export function showRewardedAd() {
  return new Promise((resolve) => {
    const adCtrl = initController()
    if (!adCtrl) {
      resolve({ done: true, demo: true })
      return
    }

    let resolved = false
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolve({ done: true, demo: true, timeout: true })
      }
    }, 30000)

    adCtrl
      .show()
      .then((result) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          resolve({ done: true, ...result })
        }
      })
      .catch((result) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          resolve({ done: false, ...result })
        }
      })
  })
}

export default { showRewardedAd }
