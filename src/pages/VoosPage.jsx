import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Plane, Trash2 } from 'lucide-react'
import { useTrip } from '../hooks/useTrip'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Select, Textarea } from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { formatTime, calcHorarioSaida } from '../utils/dates'

export default function VoosPage() {
  const { tripId } = useParams()
  const { flights, loading, refetch } = useTrip(tripId)
  const [modal, setModal] = useState(false)

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>

  const handleDelete = async (id) => {
    if (!confirm('Excluir voo?')) return
    await supabase.from('flights').delete().eq('id', id)
    refetch()
  }

  return (
    <div className="px-4 pt-8 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Voos</h1>
        <Button onClick={() => setModal(true)} className="gap-1.5">
          <Plus size={16} /> Voo
        </Button>
      </div>

      {flights.length === 0 ? (
        <div className="text-center py-16">
          <Plane size={40} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum voo cadastrado.</p>
        </div>
      ) : (
        flights.map(fl => {
          const saida = calcHorarioSaida(fl.horario_voo?.slice(0, 5), fl.tipo_voo, fl.tempo_deslocamento_min)
          return (
            <div key={fl.id} className="bg-surface border border-white/8 rounded-2xl p-4 mb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Plane size={16} className="text-accent" />
                    <p className="font-semibold text-white">{fl.origem} → {fl.destino}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fl.tipo_voo === 'internacional' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {fl.tipo_voo}
                    </span>
                  </div>
                  {fl.aeroporto && <p className="text-gray-500 text-sm">{fl.aeroporto}</p>}

                  <div className="mt-3 space-y-1.5">
                    <InfoRow label="Horário do voo" value={formatTime(fl.horario_voo)} />
                    {fl.tempo_deslocamento_min && (
                      <InfoRow label="Deslocamento até aeroporto" value={`${fl.tempo_deslocamento_min} min`} />
                    )}
                    {saida && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/8">
                        <p className="text-gray-400 text-sm">Sair da hospedagem</p>
                        <p className="text-accent font-semibold text-lg">{saida}</p>
                      </div>
                    )}
                  </div>

                  {fl.observacoes && <p className="text-gray-500 text-xs mt-3 italic">{fl.observacoes}</p>}
                </div>
                <button onClick={() => handleDelete(fl.id)} className="p-2 rounded-lg hover:bg-white/10 text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })
      )}

      <FlightModal open={modal} onClose={() => setModal(false)} tripId={tripId} onSaved={refetch} />
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-white text-sm font-medium">{value}</p>
    </div>
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
        <Input label="Deslocamento ao aeroporto (min)" type="number" placeholder="45" value={form.tempo_deslocamento_min} onChange={set('tempo_deslocamento_min')} />
        {saida && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">Sair da hospedagem às</p>
            <p className="text-accent font-bold text-2xl">{saida}</p>
          </div>
        )}
        <Textarea label="Observações" value={form.observacoes} onChange={set('observacoes')} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button type="submit" loading={saving} className="w-full">Salvar</Button>
      </form>
    </Modal>
  )
}
