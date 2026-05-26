import { NavLink, useParams } from 'react-router-dom'
import { Home, Map, DollarSign, Plane, List } from 'lucide-react'

export default function BottomNav() {
  const { tripId } = useParams()

  if (!tripId) return null

  const items = [
    { to: `/trip/${tripId}/hoje`, icon: Home, label: 'Hoje' },
    { to: `/trip/${tripId}/roteiro`, icon: Map, label: 'Roteiro' },
    { to: `/trip/${tripId}/financeiro`, icon: DollarSign, label: 'Gasto' },
    { to: `/trip/${tripId}/voos`, icon: Plane, label: 'Voos' },
    { to: `/trip/${tripId}`, icon: List, label: 'Visão', end: true },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-white/10 safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2">
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                isActive ? 'text-accent' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
