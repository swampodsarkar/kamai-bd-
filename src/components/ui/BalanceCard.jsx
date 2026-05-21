export default function BalanceCard({ balance = 0 }) {
  return (
    <div className="glass-card rounded-2xl p-6 gold-border gold-glow animate-fade-in">
      <p className="text-gray-400 text-sm font-medium mb-1">Total Balance</p>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold gold-gradient-text">
          {balance.toFixed(2)}
        </span>
        <span className="text-lg font-semibold text-gold-400">Tk</span>
      </div>
      <div className="mt-4 h-1.5 bg-dark-700 rounded-full overflow-hidden">
        <div
          className="h-full gold-gradient rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.min((balance / 1000) * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">Next milestone: 1,000 Tk</p>
    </div>
  )
}
