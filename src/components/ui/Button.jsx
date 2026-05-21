export default function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  fullWidth = true,
}) {
  const variants = {
    primary: 'btn-primary text-dark-950 font-bold',
    secondary: 'btn-secondary',
    danger: 'bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-97 transition-all',
    ghost: 'bg-transparent text-gray-300 hover:text-white hover:bg-white/5 transition-all',
    gold: 'gold-gradient text-dark-950 font-bold hover:opacity-90 transition-all',
  }

  const sizes = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3.5 px-6 text-base',
    lg: 'py-4 px-8 text-lg',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-xl font-semibold
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.97]
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  )
}
