import { format, parseISO, differenceInDays, isToday, isBefore, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export const formatDateLong = (dateStr) => {
  if (!dateStr) return ''
  const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
  return format(d, "EEEE, d 'de' MMMM", { locale: ptBR })
}

export const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.slice(0, 5) // HH:MM
}

export const tripStatus = (dataInicio, dataFim) => {
  const hoje = new Date()
  const inicio = parseISO(dataInicio)
  const fim = parseISO(dataFim)
  if (isBefore(hoje, inicio)) return 'futura'
  if (isAfter(hoje, fim)) return 'concluida'
  return 'ativa'
}

export const tripDuration = (dataInicio, dataFim) => {
  return differenceInDays(parseISO(dataFim), parseISO(dataInicio)) + 1
}

export const calcHorarioSaida = (horarioVoo, tipoVoo, deslocamentoMin) => {
  if (!horarioVoo) return null
  const [h, m] = horarioVoo.split(':').map(Number)
  const antecedenciaMin = tipoVoo === 'internacional' ? 180 : 120
  const totalMin = h * 60 + m - antecedenciaMin - (deslocamentoMin || 0)
  const hSaida = Math.floor(((totalMin % 1440) + 1440) % 1440 / 60)
  const mSaida = ((totalMin % 1440) + 1440) % 1440 % 60
  return `${String(hSaida).padStart(2, '0')}:${String(mSaida).padStart(2, '0')}`
}

export { isToday, parseISO, format }
