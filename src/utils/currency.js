export const MOEDAS = ['BRL', 'USD', 'EUR', 'GBP', 'ARS', 'CLP', 'UYU', 'PYG', 'BOB', 'PEN', 'COP', 'MXN', 'JPY', 'AUD', 'CAD', 'CHF']

export const CATEGORIAS = [
  { value: 'hospedagem', label: 'Hospedagem', icon: '🏨' },
  { value: 'alimentacao', label: 'Alimentação', icon: '🍽️' },
  { value: 'transporte', label: 'Transporte', icon: '🚌' },
  { value: 'passeios', label: 'Passeios', icon: '🎟️' },
  { value: 'compras', label: 'Compras', icon: '🛍️' },
  { value: 'aluguel_carro', label: 'Aluguel de carro', icon: '🚗' },
  { value: 'combustivel', label: 'Combustível', icon: '⛽' },
  { value: 'estacionamento', label: 'Estacionamento', icon: '🅿️' },
  { value: 'outros', label: 'Outros', icon: '📦' }
]

export const getCategoriaIcon = (value) => {
  return CATEGORIAS.find(c => c.value === value)?.icon || '📦'
}

export const getCategoriaLabel = (value) => {
  return CATEGORIAS.find(c => c.value === value)?.label || value
}

export const formatCurrency = (valor, moeda = 'BRL') => {
  if (valor == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: moeda }).format(valor)
}
