import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Hotel, Plane, MapPin, Calendar, DollarSign } from 'lucide-react'
import { useTrip } from '../hooks/useTrip'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Select, Textarea } from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { formatDate, formatTime, calcHorarioSaida } from '../utils/dates'
import { formatCurrency, MOEDAS, CATEGORIAS } from '../utils/currency'

export default function TripOverviewPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { trip, accommodations, flights, expenses, loading, refetch } = useTrip(tripId)
  const [accModal, setAccModal] = useState(false)
  const [flightModal, setFlightModal] = useState(false)

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>
  if (!trip) return <p className="text-center text-gray-500 pt-20">Viagem não encontrada</p>

  const totalReal = expenses.reduce((s, e) => s + (e.valor || 0), 0)
  const totalPrevisto = trip.orcamento_total || 0

  return (
    <div className="px-4 pt-10 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{trip.nome}</h1>
          <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5">
            <MapPin size={12} />{trip.destino}
          </p>
        </div>
      </div>

      {/* Datas e orçamento */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={<Calendar size={16} />} label="Datas">
          <p className="text-sm text-white">{formatDate(trip.data_inicio)}</p>
          <p className="text-sm text-white">{formatDate(trip.data_fim)}</p>
        </StatCard>
        <StatCard icon={<DollarSign size={16} />} label="Orçamento">
          {totalPrevisto > 0 ? (
            <>
              <p className="text-sm text-white">{formatCurrency(totalReal, trip.moeda_principal)} gasto</p>
              <p className="text-xs text-gray-500">de {formatCurrency(totalPrevisto, trip.moeda_principal)}</p>
              <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${totalReal > totalPrevisto ? 'bg-red-400' : 'bg-accent'}`}
                  style={{ width: `${Math.min(100, (totalReal / totalPrevisto) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Sem orçamento definido</p>
          )}
        </StatCard>
      </div>

      {/* Hospedagens */}
      <Section
        title="Hospedagens"
        icon={<Hotel size={16} />}
        onAdd={() => setAccModal(true)}
      >
        {accommodations.length === 0 ? (
          <EmptyItem label="Nenhuma hospedagem cadastrada" />
        ) : (
          accommodations.map(acc => (
            <div key={acc.id} className="bg-white/5 rounded-xl p-3 mb-2">
              <p className="font-medium text-white text-sm">{acc.nome}</p>
              {acc.bairro && <p className="text-gray-500 text-xs mt-0.5">{acc.bairro}</p>}
              <p className="text-gray-500 text-xs mt-1">
                {formatDate(acc.checkin)} → {formatDate(acc.checkout)}
                {acc.valor ? <> · {formatCurrency(acc.valor, acc.moeda)}</> : ''}
              </p>
            </div>
          ))
        )}
      </Section>

      {/* Voos */}
      <Section
        title="Voos"
        icon={<Plane size={16} />}
        onAdd={() => setFlightModal(true)}
      >
        {flights.length === 0 ? (
          <EmptyItem label="Nenhum voo cadastrado" />
        ) : (
          flights.map(fl => {
            const saida = calcHorarioSaida(fl.horario_voo?.slice(0, 5), fl.tipo_voo, fl.tempo_deslocamento_min)
            return (
              <div key={fl.id} className="bg-white/5 rounded-xl p-3 mb-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white text-sm">{fl.origem} → {fl.destino}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${fl.tipo_voo === 'internacional' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {fl.tipo_voo}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-1">Voo: {formatTime(fl.horario_voo)}</p>
                {saida && <p className="text-accent text-xs mt-0.5 font-medium">Sair da hospedagem às {saida}</p>}
              </div>
            )
          })
        )}
      </Section>

      {/* Links rápidos */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <Link to={`/trip/${tripId}/roteiro`} className="bg-surface border border-white/8 rounded-2xl p-4 text-center hover:border-accent/50 transition-colors">
          <p className="text-2xl mb-1">🗺️</p>
          <p className="text-white font-medium text-sm">Roteiro</p>
        </Link>
        <Link to={`/trip/${tripId}/financeiro`} className="bg-surface border border-white/8 rounded-2xl p-4 text-center hover:border-accent/50 transition-colors">
          <p className="text-2xl mb-1">💰</p>
          <p className="text-white font-medium text-sm">Financeiro</p>
        </Link>
      </div>

      <AccommodationModal open={accModal} onClose={() => setAccModal(false)} tripId={tripId} onSaved={refetch} />
      <FlightModal open={flightModal} onClose={() => setFlightModal(false)} tripId={tripId} onSaved={refetch} />
    </div>
  )
}

function StatCard({ icon, label, children }) {
  return (
    <div className="bg-surface border border-white/8 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-gray-500 mb-2 text-xs">
        {icon}<span>{label}</span>
      </div>
      {children}
    </div>
  )
}

function Section({ title, icon, onAdd, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium">
          {icon}<span>{title}</span>
        </div>
        <button onClick={onAdd} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
          <Plus size={16} />
        </button>
      </div>
      {children}
    </div>
  )
}

function EmptyItem({ label }) {
  return <p className="text-gray-600 text-sm py-2">{label}</p>
}

function AccommodationModal({ open, onClose, tripId, onSaved }) {
  const empty = { nome: '', bairro: '', endereco: '', checkin: '', checkout: '', valor: '', moeda: 'BRL', status: 'confirmada', observacoes: '' }
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.nome || !form.checkin || !form.checkout) { setError('Preencha nome e datas'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('accommodations').insert({
        ...form, trip_id: tripId,
        valor: form.valor ? Number(form.valor) : null
      })
      if (error) throw error
      onSaved(); onClose(); setForm(empty); setError('')
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova Hospedagem">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input label="Nome *" placeholder="ex: Hotel Lisboa Centro" value={form.nome} onChange={set('nome')} />
        <Input label="Bairro" placeholder="ex: Chiado" value={form.bairro} onChange={set('bairro')} />
        <Input label="Endereço" placeholder="Rua..." value={form.endereco} onChange={set('endereco')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Check-in *" type="date" value={form.checkin} onChange={set('checkin')} />
          <Input label="Check-out *" type="date" value={form.checkout} onChange={set('checkout')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Valor total" type="number" placeholder="0" value={form.valor} onChange={set('valor')} />
          <Select label="Moeda" value={form.moeda} onChange={set('moeda')}>
            {MOEDAS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
        <Textarea label="Observações" value={form.observacoes} onChange={set('observacoes')} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button type="submit" loading={saving} className="w-full">Salvar</Button>
      </form>
    </Modal>
  )
}

function FlightModal({ open, onClose, tripId, onSaved }) {
  const empty = { origem: '', destino: '', aeroporto: '', horario_voo: '', tipo_voo: 'nacional', tempo_deslocamento_min: '', observacoes: '' }
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))
  const saida = calcHorarioSaida(form.horario_voo, form.tipo_voo, Number(form.tempo_deslocamento_min) || 0)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.origem || !form.destino || !form.horario_voo) { setError('Preencha origem, destino e horário'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('flights').insert({
        ...form, trip_id: tripId,
        tempo_deslocamento_min: form.tempo_deslocamento_min ? Number(form.tempo_deslocamento_min) : null
      })
      if (error) throw error
      onSaved(); onClose(); setForm(empty); setError('')
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Voo">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Origem *" placeholder="GRU" value={form.origem} onChange={set('origem')} />
          <Input label="Destino *" placeholder="LIS" value={form.destino} onChange={set('destino')} />
        </div>
        <Input label="Aeroporto" placeholder="Aeroporto de Lisboa" value={form.aeroporto} onChange={set('aeroporto')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Horário do voo *" type="time" value={form.horario_voo} onChange={set('horario_voo')} />
          <Select label="Tipo" value={form.tipo_voo} onChange={set('tipo_voo')}>
            <option value="nacional">Nacional</option>
            <option value="internacional">Internacional</option>
          </Select>
        </div>
        <Input label="Deslocamento até aeroporto (min)" type="number" placeholder="45" value={form.tempo_deslocamento_min} onChange={set('tempo_deslocamento_min')} />
        {saida && <p className="text-accent text-sm font-medium">Sair da hospedagem às {saida}</p>}
        <Textarea label="Observações" value={form.observacoes} onChange={set('observacoes')} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button type="submit" loading={saving} className="w-full">Salvar</Button>
      </form>
    </Modal>
  )
}
