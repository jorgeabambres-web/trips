import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, MapPin, Sparkles, Clock, ChevronDown, ChevronUp, Trash2, ExternalLink } from 'lucide-react'
import { useTrip } from '../hooks/useTrip'
import { supabase } from '../lib/supabase'
import { sugerirRestaurantes, sugerirAtividades } from '../lib/openai'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Select, Textarea } from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { formatDateLong, formatTime, isToday, parseISO } from '../utils/dates'
import { CATEGORIAS } from '../utils/currency'

const STATUS_COLORS = {
  planejada: 'text-blue-400 bg-blue-500/15',
  concluida: 'text-green-400 bg-green-500/15',
  cancelada: 'text-gray-500 bg-gray-500/15'
}

export default function RoteiroPage() {
  const { tripId } = useParams()
  const { trip, tripDays, accommodations, loading, refetch } = useTrip(tripId)
  const [openDayId, setOpenDayId] = useState(null)
  const [actModal, setActModal] = useState({ open: false, dayId: null })
  const [iaModal, setIaModal] = useState({ open: false, type: null, day: null })

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>

  const getAccForDay = (dateStr) => {
    return accommodations.find(acc => acc.checkin <= dateStr && acc.checkout > dateStr)
  }

  return (
    <div className="px-4 pt-8 pb-4">
      <h1 className="text-xl font-bold text-white mb-6">Roteiro</h1>

      {tripDays.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">Nenhum dia cadastrado.</p>
          <p className="text-gray-600 text-sm mt-1">Os dias são criados automaticamente ao cadastrar a viagem com datas.</p>
        </div>
      ) : (
        tripDays.map((day, idx) => {
          const acc = getAccForDay(day.data)
          const isOpen = openDayId === day.id
          const today = isToday(parseISO(day.data))
          const activities = day.activities || []

          return (
            <div key={day.id} className={`mb-3 bg-surface border rounded-2xl overflow-hidden ${today ? 'border-accent/50' : 'border-white/8'}`}>
              <button
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                onClick={() => setOpenDayId(isOpen ? null : day.id)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Dia {idx + 1}</span>
                    {today && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">Hoje</span>}
                  </div>
                  <p className="text-white font-medium mt-0.5">{formatDateLong(day.data)}</p>
                  {acc && (
                    <div className="flex items-center gap-1 mt-0.5 text-gray-500 text-xs">
                      <MapPin size={11} /><span>{acc.bairro || acc.nome}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">{activities.length} ativ.</span>
                  {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-white/8 px-4 pb-4 pt-3">
                  {activities.length === 0 ? (
                    <p className="text-gray-600 text-sm mb-3">Nenhuma atividade ainda.</p>
                  ) : (
                    activities
                      .sort((a, b) => (a.horario_inicio || '').localeCompare(b.horario_inicio || ''))
                      .map(act => (
                        <ActivityItem key={act.id} activity={act} onDelete={() => deleteActivity(act.id, refetch)} />
                      ))
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button variant="secondary" className="text-sm py-2 flex-1" onClick={() => setActModal({ open: true, dayId: day.id })}>
                      <Plus size={15} /> Atividade
                    </Button>
                    <Button variant="ghost" className="text-sm py-2 flex-1 text-purple-400 hover:text-purple-300"
                      onClick={() => setIaModal({ open: true, type: 'restaurantes', day, acc })}>
                      <Sparkles size={15} /> Restaurantes IA
                    </Button>
                    {activities.length < 2 && (
                      <Button variant="ghost" className="text-sm py-2 w-full text-blue-400 hover:text-blue-300"
                        onClick={() => setIaModal({ open: true, type: 'atividades', day, acc })}>
                        <Sparkles size={15} /> Sugerir atividades com IA
                      </Button>
                    )}
                    {acc && (
                      <a
                        href={`https://www.google.com/maps/search/restaurantes/@${encodeURIComponent(acc.bairro || acc.nome)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors py-1"
                      >
                        <ExternalLink size={13} /> Ver restaurantes no Maps
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      <ActivityModal
        open={actModal.open}
        dayId={actModal.dayId}
        onClose={() => setActModal({ open: false, dayId: null })}
        onSaved={refetch}
      />

      <IaModal
        open={iaModal.open}
        type={iaModal.type}
        day={iaModal.day}
        acc={iaModal.acc}
        trip={trip}
        onClose={() => setIaModal({ open: false, type: null, day: null })}
        onAddActivity={(act) => {
          setActModal({ open: true, dayId: iaModal.day?.id, prefill: act })
          setIaModal({ open: false, type: null, day: null })
        }}
      />
    </div>
  )
}

async function deleteActivity(id, refetch) {
  if (!confirm('Excluir atividade?')) return
  await supabase.from('activities').delete().eq('id', id)
  refetch()
}

function ActivityItem({ activity, onDelete }) {
  const { label, icon } = CATEGORIAS.find(c => c.value === activity.categoria) || {}
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-lg mt-0.5">{icon || '📌'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white text-sm font-medium truncate">{activity.nome}</p>
          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[activity.status] || STATUS_COLORS.planejada}`}>
            {activity.status}
          </span>
        </div>
        {activity.horario_inicio && (
          <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
            <Clock size={11} />
            {formatTime(activity.horario_inicio)}{activity.horario_fim ? ` – ${formatTime(activity.horario_fim)}` : ''}
          </p>
        )}
      </div>
      <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-600 hover:text-red-400 transition-colors shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function ActivityModal({ open, dayId, onClose, onSaved, prefill }) {
  const empty = { nome: '', horario_inicio: '', horario_fim: '', custo_previsto: '', custo_real: '', categoria: 'passeios', status: 'planejada', observacoes: '' }
  const [form, setForm] = useState({ ...empty, ...(prefill || {}) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  useState(() => { if (prefill) setForm(p => ({ ...p, ...prefill })) }, [prefill])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.nome) { setError('Nome é obrigatório'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('activities').insert({
        ...form, trip_day_id: dayId,
        custo_previsto: form.custo_previsto ? Number(form.custo_previsto) : null,
        custo_real: form.custo_real ? Number(form.custo_real) : null
      })
      if (error) throw error
      onSaved(); onClose(); setForm(empty); setError('')
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova Atividade">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input label="Nome *" placeholder="ex: Visita ao museu" value={form.nome} onChange={set('nome')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Início" type="time" value={form.horario_inicio} onChange={set('horario_inicio')} />
          <Input label="Fim" type="time" value={form.horario_fim} onChange={set('horario_fim')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Categoria" value={form.categoria} onChange={set('categoria')}>
            {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={set('status')}>
            <option value="planejada">Planejada</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Custo previsto" type="number" placeholder="0" value={form.custo_previsto} onChange={set('custo_previsto')} />
          <Input label="Custo real" type="number" placeholder="0" value={form.custo_real} onChange={set('custo_real')} />
        </div>
        <Textarea label="Observações" value={form.observacoes} onChange={set('observacoes')} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button type="submit" loading={saving} className="w-full">Salvar</Button>
      </form>
    </Modal>
  )
}

function IaModal({ open, type, day, acc, trip, onClose, onAddActivity }) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const fetch = async () => {
    setLoading(true); setError(''); setResults(null)
    try {
      if (type === 'restaurantes') {
        const data = await sugerirRestaurantes({
          cidade: day?.cidade || trip?.destino,
          bairro: acc?.bairro,
          endereco: acc?.endereco,
          orcamentoMedio: trip?.orcamento_total ? `${trip.moeda_principal} ${Math.round(trip.orcamento_total / 20)}/refeição` : null,
          atividades: day?.activities,
          horarioJantar: '20h'
        })
        setResults(data.restaurantes)
      } else {
        const data = await sugerirAtividades({
          cidade: day?.cidade || trip?.destino,
          bairro: acc?.bairro,
          atividades: day?.activities,
          estiloViagem: trip?.observacoes
        })
        setResults(data.atividades)
      }
    } catch (err) {
      setError(err.message || 'Erro ao consultar IA')
    } finally {
      setLoading(false)
    }
  }

  const title = type === 'restaurantes' ? '🍽️ Sugestões de Restaurantes' : '✨ Sugestões de Atividades'

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {!results && !loading && (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm mb-4">
              {type === 'restaurantes'
                ? 'A IA vai sugerir restaurantes baseados na sua hospedagem e roteiro do dia.'
                : 'A IA vai sugerir atividades para completar seu dia.'}
            </p>
            <Button onClick={fetch} className="gap-2">
              <Sparkles size={16} /> Gerar sugestões
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Spinner size="lg" />
            <p className="text-gray-500 text-sm">Consultando IA...</p>
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {results && (
          <div className="flex flex-col gap-3">
            {results.map((item, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/8">
                <p className="text-white font-medium">{item.nome}</p>
                <p className="text-gray-400 text-sm mt-1">{item.descricao}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.faixaPreco && <Tag>{item.faixaPreco}</Tag>}
                  {item.melhorHorario && <Tag>⏰ {item.melhorHorario}</Tag>}
                  {item.custoEstimado && <Tag>💰 {item.custoEstimado}</Tag>}
                  {item.duracao && <Tag>⏱ {item.duracao}</Tag>}
                </div>
                {item.motivo && <p className="text-gray-500 text-xs mt-2 italic">{item.motivo}</p>}
                {type === 'atividades' && (
                  <Button variant="ghost" className="text-xs mt-2 text-accent" onClick={() => onAddActivity({ nome: item.nome, observacoes: item.descricao, custo_previsto: '' })}>
                    <Plus size={13} /> Adicionar ao roteiro
                  </Button>
                )}
                {type === 'restaurantes' && (
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(item.nome + ' ' + (day?.cidade || ''))}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors mt-2"
                  >
                    <ExternalLink size={13} /> Ver no Maps
                  </a>
                )}
              </div>
            ))}
            <Button variant="ghost" onClick={fetch} className="text-sm">Gerar novamente</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

function Tag({ children }) {
  return <span className="text-xs px-2 py-0.5 bg-white/8 rounded-full text-gray-400">{children}</span>
}
