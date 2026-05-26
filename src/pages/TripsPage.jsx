import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Plane, LogOut, MapPin, Calendar } from 'lucide-react'
import { useTrips } from '../hooks/useTrips'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Select, Textarea } from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { formatDate, tripStatus, tripDuration } from '../utils/dates'
import { MOEDAS } from '../utils/currency'

const STATUS_LABELS = {
  ativa: { label: 'Em andamento', cls: 'bg-green-500/20 text-green-400' },
  futura: { label: 'Próxima', cls: 'bg-blue-500/20 text-blue-400' },
  concluida: { label: 'Concluída', cls: 'bg-gray-500/20 text-gray-400' }
}

const EMPTY_FORM = { nome: '', destino: '', data_inicio: '', data_fim: '', orcamento_total: '', moeda_principal: 'BRL', observacoes: '' }

export default function TripsPage() {
  const { trips, loading, createTrip } = useTrips()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.nome || !form.destino || !form.data_inicio || !form.data_fim) {
      setError('Preencha os campos obrigatórios')
      return
    }
    setSaving(true)
    try {
      const trip = await createTrip({
        ...form,
        orcamento_total: form.orcamento_total ? Number(form.orcamento_total) : null
      })
      setModal(false)
      setForm(EMPTY_FORM)
      navigate(`/trip/${trip.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const active = trips.filter(t => tripStatus(t.data_inicio, t.data_fim) === 'ativa')

  return (
    <div className="px-4 pt-10 pb-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Minhas Viagens</h1>
          <p className="text-gray-500 text-sm mt-0.5">{trips.length} viagem{trips.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={signOut} className="p-2">
            <LogOut size={18} />
          </Button>
          <Button onClick={() => setModal(true)} className="gap-1.5">
            <Plus size={18} /> Nova
          </Button>
        </div>
      </div>

      {active.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Em andamento</p>
          {active.map(trip => <TripCard key={trip.id} trip={trip} onClick={() => navigate(`/trip/${trip.id}/hoje`)} />)}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div>
          {active.length < trips.length && (
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Outras viagens</p>
          )}
          {trips.filter(t => tripStatus(t.data_inicio, t.data_fim) !== 'ativa').map(trip => (
            <TripCard key={trip.id} trip={trip} onClick={() => navigate(`/trip/${trip.id}`)} />
          ))}
          {trips.length === 0 && (
            <div className="text-center py-16">
              <Plane size={40} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma viagem ainda.</p>
              <p className="text-gray-600 text-sm mt-1">Crie sua primeira viagem!</p>
            </div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setError('') }} title="Nova Viagem">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Nome da viagem *" placeholder="ex: Europa 2025" value={form.nome} onChange={set('nome')} />
          <Input label="Destino *" placeholder="ex: Lisboa, Porto" value={form.destino} onChange={set('destino')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Início *" type="date" value={form.data_inicio} onChange={set('data_inicio')} />
            <Input label="Fim *" type="date" value={form.data_fim} onChange={set('data_fim')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Orçamento" type="number" placeholder="5000" value={form.orcamento_total} onChange={set('orcamento_total')} />
            <Select label="Moeda" value={form.moeda_principal} onChange={set('moeda_principal')}>
              {MOEDAS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <Textarea label="Observações" placeholder="Notas gerais sobre a viagem..." value={form.observacoes} onChange={set('observacoes')} />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" loading={saving} className="w-full mt-2">Criar viagem</Button>
        </form>
      </Modal>
    </div>
  )
}

function TripCard({ trip, onClick }) {
  const status = tripStatus(trip.data_inicio, trip.data_fim)
  const { label, cls } = STATUS_LABELS[status]
  const days = tripDuration(trip.data_inicio, trip.data_fim)

  return (
    <div onClick={onClick} className="bg-surface border border-white/8 rounded-2xl p-4 mb-3 cursor-pointer hover:border-white/20 active:scale-98 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{trip.nome}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin size={13} className="text-gray-500 shrink-0" />
            <p className="text-gray-400 text-sm truncate">{trip.destino}</p>
          </div>
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${cls}`}>{label}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-gray-500 text-xs">
        <Calendar size={12} />
        <span>{formatDate(trip.data_inicio)} – {formatDate(trip.data_fim)}</span>
        <span className="mx-1">·</span>
        <span>{days} dia{days !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
