export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-950">
      <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mb-4">
        <span className="text-2xl font-bold text-dark-950">K</span>
      </div>
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm mt-4">Loading...</p>
    </div>
  )
}
