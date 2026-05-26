import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useTrip } from '../hooks/useTrip'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Select, Textarea } from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { formatDate } from '../utils/dates'
import { formatCurrency, MOEDAS, CATEGORIAS, getCategoriaIcon, getCategoriaLabel } from '../utils/currency'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#f97316', '#84cc16']

export default function FinanceiroPage() {
  const { tripId } = useParams()
  const { trip, expenses, loading, refetch } = useTrip(tripId)
  const [modal, setModal] = useState(false)

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>

  const total = expenses.reduce((s, e) => s + (e.valor || 0), 0)
  const orcamento = trip?.orcamento_total || 0
  const moeda = trip?.moeda_principal || 'BRL'

  const byCat = CATEGORIAS.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.categoria === cat.value).reduce((s, e) => s + (e.valor || 0), 0)
  })).filter(c => c.total > 0)

  const byDay = expenses.reduce((acc, e) => {
    const d = e.data?.slice(5) // MM-DD
    acc[d] = (acc[d] || 0) + (e.valor || 0)
    return acc
  }, {})
  const byDayArr = Object.entries(byDay).map(([d, v]) => ({ dia: d, valor: v })).sort((a, b) => a.dia.localeCompare(b.dia))

  return (
    <div className="px-4 pt-8 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Financeiro</h1>
        <Button onClick={() => setModal(true)} className="gap-1.5">
          <Plus size={16} /> Gasto
        </Button>
      </div>

      {/* Resumo */}
      <div className="bg-surface border border-white/8 rounded-2xl p-5 mb-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-gray-500 text-xs mb-1">Total gasto</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(total, moeda)}</p>
          </div>
          {orcamento > 0 && (
            <div className="text-right">
              <p className="text-gray-500 text-xs mb-1">Orçamento</p>
              <p className={`text-lg font-semibold ${total > orcamento ? 'text-red-400' : 'text-gray-300'}`}>
                {formatCurrency(orcamento, moeda)}
              </p>
            </div>
          )}
        </div>
        {orcamento > 0 && (
          <>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${total > orcamento ? 'bg-red-400' : 'bg-accent'}`}
                style={{ width: `${Math.min(100, (total / orcamento) * 100)}%` }}
              />
            </div>
            {total > orcamento && (
              <div className="flex items-center gap-1.5 mt-2 text-red-400 text-xs">
                <AlertTriangle size={12} /> Orçamento ultrapassado em {formatCurrency(total - orcamento, moeda)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Por categoria */}
      {byCat.length > 0 && (
        <div className="mb-6">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Por categoria</p>
          <div className="bg-surface border border-white/8 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={byCat} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v, moeda)} contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {byCat.map((cat, i) => (
                <div key={cat.value} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-400 text-xs truncate">{cat.icon} {cat.label}</span>
                  <span className="text-white text-xs font-medium ml-auto">{formatCurrency(cat.total, moeda)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Por dia */}
      {byDayArr.length > 1 && (
        <div className="mb-6">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Por dia</p>
          <div className="bg-surface border border-white/8 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={byDayArr}>
                <XAxis dataKey="dia" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis hide />
                <Tooltip formatter={(v) => formatCurrency(v, moeda)} contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
                <Bar dataKey="valor" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Lista */}
      <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Todos os gastos</p>
      {expenses.length === 0 ? (
        <p className="text-gray-600 text-sm py-4">Nenhum gasto lançado.</p>
      ) : (
        expenses.map(exp => (
          <div key={exp.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
            <span className="text-xl">{getCategoriaIcon(exp.categoria)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{exp.descricao || getCategoriaLabel(exp.categoria)}</p>
              <p className="text-gray-500 text-xs">{formatDate(exp.data)} · {getCategoriaLabel(exp.categoria)}</p>
            </div>
            <p className="text-white font-medium text-sm shrink-0">{formatCurrency(exp.valor, exp.moeda)}</p>
          </div>
        ))
      )}

      <ExpenseModal open={modal} onClose={() => setModal(false)} tripId={tripId} onSaved={refetch} />
    </div>
  )
}

function ExpenseModal({ open, onClose, tripId, onSaved }) {
  const empty = { data: new Date().toISOString().slice(0, 10), categoria: 'alimentacao', descricao: '', valor: '', moeda: 'BRL', observacao: '' }
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.valor) { setError('Informe o valor'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('expenses').insert({
        ...form, trip_id: tripId, valor: Number(form.valor)
      })
      if (error) throw error
      onSaved(); onClose(); setForm(empty); setError('')
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Lançar Gasto">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input label="Data" type="date" value={form.data} onChange={set('data')} />
        <Select label="Categoria" value={form.categoria} onChange={set('categoria')}>
          {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </Select>
        <Input label="Descrição" placeholder="ex: Jantar no centro" value={form.descricao} onChange={set('descricao')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Valor *" type="number" step="0.01" placeholder="0.00" value={form.valor} onChange={set('valor')} autoFocus />
          <Select label="Moeda" value={form.moeda} onChange={set('moeda')}>
            {MOEDAS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
        <Textarea label="Observação" rows={2} value={form.observacao} onChange={set('observacao')} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button type="submit" loading={saving} className="w-full">Salvar gasto</Button>
      </form>
    </Modal>
  )
}
