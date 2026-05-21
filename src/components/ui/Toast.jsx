import { useEffect, useState } from 'react'

let toastId = 0
let addToastFn = null

export function showToast(message, type = 'success', duration = 3000) {
  if (addToastFn) {
    addToastFn({ id: ++toastId, message, type, duration })
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    addToastFn = (toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, toast.duration)
    }
    return () => { addToastFn = null }
  }, [])

  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-amber-600',
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${colors[toast.type] || colors.success} text-white px-4 py-3 rounded-xl text-sm font-medium animate-slide-up shadow-lg`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
