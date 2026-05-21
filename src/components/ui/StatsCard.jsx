export default function StatsCard({ icon, label, value, subtext, color = 'gold' }) {
  const colors = {
    gold: 'text-gold-400',
    blue: 'text-blue-400',
    green: 'text-emerald-400',
    purple: 'text-purple-400',
  }

  return (
    <div className="glass-card rounded-xl p-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-lg">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-xs">{label}</p>
          <p className={`font-semibold text-lg ${colors[color] || colors.gold}`}>
            {value}
          </p>
        </div>
      </div>
      {subtext && (
        <p className="text-gray-500 text-xs mt-2 pl-[52px]">{subtext}</p>
      )}
    </div>
  )
}
