import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/watch', label: 'Watch', icon: '📺' },
  { path: '/referral', label: 'Refer', icon: '👥' },
  { path: '/withdraw', label: 'Cashout', icon: '💳' },
  { path: '/bonus', label: 'Bonus', icon: '🎁' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-900/95 backdrop-blur-lg border-t border-white/10">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-gold-400 scale-105'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className={`text-[10px] font-medium ${isActive ? 'gold-gradient-text' : ''}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
