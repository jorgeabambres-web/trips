import Spinner from './Spinner'

export default function Button({ children, loading, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent/90 px-4 py-2.5',
    secondary: 'bg-white/10 text-white hover:bg-white/20 px-4 py-2.5',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/10 px-3 py-2',
    danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-2.5'
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <Spinner size="sm" /> : children}
    </button>
  )
}
