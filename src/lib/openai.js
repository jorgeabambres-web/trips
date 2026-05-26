import OpenAI from 'openai'

const apiKey = import.meta.env.VITE_OPENAI_API_KEY

const openai = apiKey ? new OpenAI({ apiKey, dangerouslyAllowBrowser: true }) : null

// Sugere restaurantes para um dia de roteiro
export async function sugerirRestaurantes({ cidade, bairro, endereco, orcamentoMedio, atividades, horarioJantar }) {
  if (!openai) throw new Error('VITE_OPENAI_API_KEY não configurada')

  const atividadesTexto = atividades?.length
    ? atividades.map(a => `- ${a.nome} às ${a.horario_inicio}`).join('\n')
    : 'Nenhuma atividade cadastrada ainda'

  const prompt = `Você é um especialista em viagens e gastronomia local.
Sugira 5 restaurantes para o jantar com base nas seguintes informações:
- Cidade: ${cidade}
- Bairro da hospedagem: ${bairro || 'não informado'}
- Endereço da hospedagem: ${endereco || 'não informado'}
- Orçamento médio por refeição: ${orcamentoMedio || 'moderado'}
- Horário provável do jantar: ${horarioJantar || '20h'}
- Atividades do dia:\n${atividadesTexto}

Para cada restaurante, retorne um JSON com:
{
  "restaurantes": [
    {
      "nome": "Nome do restaurante",
      "descricao": "Breve descrição (1-2 frases)",
      "faixaPreco": "$ / $$ / $$$",
      "melhorHorario": "ex: 19h-21h",
      "motivo": "Por que combina com o dia"
    }
  ]
}
Responda APENAS com o JSON, sem markdown.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1200
  })

  return JSON.parse(response.choices[0].message.content)
}

// Sugere atividades para um dia com poucas atividades
export async function sugerirAtividades({ cidade, bairro, orcamentoRestante, atividades, estiloViagem }) {
  if (!openai) throw new Error('VITE_OPENAI_API_KEY não configurada')

  const atividadesTexto = atividades?.length
    ? atividades.map(a => `- ${a.nome} às ${a.horario_inicio}`).join('\n')
    : 'Nenhuma atividade ainda'

  const prompt = `Você é um guia de viagens especializado.
Sugira 4 atividades para o dia com base nas seguintes informações:
- Cidade: ${cidade}
- Bairro da hospedagem: ${bairro || 'não informado'}
- Orçamento restante estimado: ${orcamentoRestante || 'moderado'}
- Estilo da viagem: ${estiloViagem || 'turismo geral'}
- Atividades já planejadas:\n${atividadesTexto}

Para cada atividade, retorne um JSON com:
{
  "atividades": [
    {
      "nome": "Nome da atividade",
      "descricao": "Breve descrição (1-2 frases)",
      "custoEstimado": "ex: €15 por pessoa",
      "melhorHorario": "ex: 10h",
      "duracao": "ex: 2h",
      "motivo": "Por que é uma boa opção"
    }
  ]
}
Responda APENAS com o JSON, sem markdown.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1200
  })

  return JSON.parse(response.choices[0].message.content)
}
