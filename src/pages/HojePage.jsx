import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Navigation, Sparkles, Clock, MapPin } from 'lucide-react'
import { useTrip } from '../hooks/useTrip'
import { sugerirAtividades } from '../lib/openai'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Select, Textarea } from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { formatDateLong, formatTime, isToday, parseISO } from '../utils/dates'
import { formatCurrency, MOEDAS, CATEGORIAS, getCategoriaIcon } from '../utils/currency'

export default function HojePage() {
  const { tripId } = useParams()
  const { trip, tripDays, accommodations, expenses, loading, refetch } = useTrip(tripId)
  const [expModal, setExpModal] = useState(false)
  const [iaModal, setIaModal] = useState(false)

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>

  const hoje = new Date().toISOString().slice(0, 10)
  const diaHoje = tripDays.find(d => d.data === hoje)
  const accHoje = accommodations.find(acc => acc.checkin <= hoje && acc.checkout > hoje)
  const atividadesHoje = (diaHoje?.activities || []).sort((a, b) => (a.horario_inicio || '').localeCompare(b.horario_inicio || ''))
  const gastosHoje = expenses.filter(e => e.data === hoje)
  const totalHoje = gastosHoje.reduce((s, e) => s + (e.valor || 0), 0)
  const previstosHoje = atividadesHoje.reduce((s, a) => s + (a.custo_previsto || 0), 0)

  const openMapsGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => window.open(`https://www.google.com/maps/search/restaurantes/@${coords.latitude},${coords.longitude},15z`, '_blank'),
        () => window.open('https://www.google.com/maps/search/restaurantes', '_blank')
      )
    } else {
      window.open('https://www.google.com/maps/search/restaurantes', '_blank')
    }
  }

  return (
    <div className="px-4 pt-10 pb-24">
      {/* Header */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm">{trip?.nome}</p>
        <h1 className="text-2xl font-bold text-white mt-0.5">{formatDateLong(hoje)}</h1>
        {accHoje && (
          <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-sm">
            <MapPin size={14} />
            <span>{accHoje.bairro ? `${accHoje.bairro} · ` : ''}{accHoje.nome}</span>
          </div>
        )}
        {!diaHoje && (
          <p className="text-gray-500 text-sm mt-2 italic">Hoje não está no roteiro da viagem.</p>
        )}
      </div>

      {/* Resumo financeiro do dia */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-surface border border-white/8 rounded-2xl p-4">
          <p className="text-gray-500 text-xs mb-1">Previsto hoje</p>
          <p className="text-white font-bold text-lg">{formatCurrency(previstosHoje, trip?.moeda_principal)}</p>
        </div>
        <div className="bg-surface border border-white/8 rounded-2xl p-4">
          <p className="text-gray-500 text-xs mb-1">Gasto hoje</p>
          <p className={`font-bold text-lg ${totalHoje > previstosHoje && previstosHoje > 0 ? 'text-red-400' : 'text-white'}`}>
            {formatCurrency(totalHoje, trip?.moeda_principal)}
          </p>
        </div>
      </div>

      {/* Atividades do dia */}
      {atividadesHoje.length > 0 && (
        <div className="mb-6">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Programação de hoje</p>
          {atividadesHoje.map(act => (
            <div key={act.id} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
              <span className="text-xl mt-0.5">{getCategoriaIcon(act.categoria)}</span>
              <div className="flex-1">
                <p className="text-white font-medium">{act.nome}</p>
                {act.horario_inicio && (
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                    <Clock size={12} /> {formatTime(act.horario_inicio)}
                    {act.horario_fim ? ` – ${formatTime(act.horario_fim)}` : ''}
                  </p>
                )}
              </div>
              {act.custo_previsto > 0 && (
                <p className="text-gray-400 text-sm shrink-0">{formatCurrency(act.custo_previsto, trip?.moeda_principal)}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Gastos de hoje */}
      {gastosHoje.length > 0 && (
        <div className="mb-6">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Gastos de hoje</p>
          {gastosHoje.map(exp => (
            <div key={exp.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
              <span className="text-lg">{getCategoriaIcon(exp.categoria)}</span>
              <p className="text-white text-sm flex-1 truncate">{exp.descricao || exp.categoria}</p>
              <p className="text-white font-medium text-sm">{formatCurrency(exp.valor, exp.moeda)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ações de IA */}
      <div className="flex flex-col gap-3 mb-6">
        <Button variant="secondary" className="w-full justify-start gap-3 py-3" onClick={openMapsGps}>
          <Navigation size={18} className="text-accent" />
          <span>Restaurantes perto de mim</span>
        </Button>
        <Button variant="secondary" className="w-full justify-start gap-3 py-3" onClick={() => setIaModal(true)}>
          <Sparkles size={18} className="text-purple-400" />
          <span>Sugestão de atividade com IA</span>
        </Button>
      </div>

      {/* FAB: Adicionar gasto */}
      <button
        onClick={() => setExpModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-accent rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
      >
        <Plus size={24} className="text-white" />
      </button>

      <ExpenseModal open={expModal} onClose={() => setExpModal(false)} tripId={tripId} onSaved={refetch} defaultDate={hoje} defaultMoeda={trip?.moeda_principal} />

      <IaAtividadeModal
        open={iaModal}
        onClose={() => setIaModal(false)}
        day={diaHoje}
        acc={accHoje}
        trip={trip}
      />
    </div>
  )
}

function ExpenseModal({ open, onClose, tripId, onSaved, defaultDate, defaultMoeda }) {
  const [form, setForm] = useState({ data: defaultDate || '', categoria: 'alimentacao', descricao: '', valor: '', moeda: defaultMoeda || 'BRL', observacao: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.valor) { setError('Informe o valor'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('expenses').insert({ ...form, trip_id: tripId, valor: Number(form.valor) })
      if (error) throw error
      onSaved(); onClose()
      setForm(p => ({ ...p, descricao: '', valor: '', observacao: '' }))
      setError('')
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Lançar Gasto">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Select label="Categoria" value={form.categoria} onChange={set('categoria')}>
          {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </Select>
        <Input label="Descrição" placeholder="ex: Almoço" value={form.descricao} onChange={set('descricao')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Valor *" type="number" step="0.01" placeholder="0.00" value={form.valor} onChange={set('valor')} autoFocus />
          <Select label="Moeda" value={form.moeda} onChange={set('moeda')}>
            {MOEDAS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
        <Input label="Data" type="date" value={form.data} onChange={set('data')} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button type="submit" loading={saving} className="w-full">Salvar</Button>
      </form>
    </Modal>
  )
}

function IaAtividadeModal({ open, onClose, day, acc, trip }) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const fetch = async () => {
    setLoading(true); setError(''); setResults(null)
    try {
      const data = await sugerirAtividades({
        cidade: day?.cidade || trip?.destino,
        bairro: acc?.bairro,
        atividades: day?.activities,
        estiloViagem: trip?.observacoes
      })
      setResults(data.atividades)
    } catch (err) { setError(err.message || 'Erro ao consultar IA') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="✨ Sugestão de Atividades">
      <div className="flex flex-col gap-4">
        {!results && !loading && (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm mb-4">Sugestões baseadas na sua hospedagem e roteiro.</p>
            <Button onClick={fetch}><Sparkles size={16} /> Gerar sugestões</Button>
          </div>
        )}
        {loading && <div className="flex flex-col items-center py-8 gap-3"><Spinner size="lg" /><p className="text-gray-500 text-sm">Consultando IA...</p></div>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {results && (
          <div className="flex flex-col gap-3">
            {results.map((item, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/8">
                <p className="text-white font-medium">{item.nome}</p>
                <p className="text-gray-400 text-sm mt-1">{item.descricao}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.custoEstimado && <span className="text-xs px-2 py-0.5 bg-white/8 rounded-full text-gray-400">💰 {item.custoEstimado}</span>}
                  {item.duracao && <span className="text-xs px-2 py-0.5 bg-white/8 rounded-full text-gray-400">⏱ {item.duracao}</span>}
                </div>
              </div>
            ))}
            <Button variant="ghost" onClick={fetch} className="text-sm">Gerar novamente</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
