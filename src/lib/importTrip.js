import { supabase } from './supabase'

/**
 * Importa dados completos de uma viagem a partir de um arquivo JSON
 * Insere viagem, hospedagens, voos, aluguel de carro e atividades
 *
 * @param {Object} data - Dados da viagem em formato JSON
 * @param {string} userId - ID do usuário autenticado
 * @returns {Promise<Object>} Resultado da importação com IDs e contadores
 */
export async function importTrip(data, userId) {
  try {
    const result = {
      tripId: null,
      accommodationsCount: 0,
      flightsCount: 0,
      carRentalId: null,
      activitiesCount: 0,
      errors: []
    }

    // ==================
    // 1. Inserir viagem
    // ==================
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .insert({
        user_id: userId,
        nome: data.trip.nome,
        destino: data.trip.destino,
        data_inicio: data.trip.data_inicio,
        data_fim: data.trip.data_fim,
        orcamento_total: data.trip.orcamento_total || null,
        moeda_principal: data.trip.moeda_principal || 'BRL',
        observacoes: data.trip.observacoes || ''
      })
      .select()

    if (tripError) throw new Error(`Erro ao inserir viagem: ${tripError.message}`)
    result.tripId = tripData[0].id

    console.log(`✓ Viagem criada: ${result.tripId}`)

    // ==================
    // 2. Inserir hospedagens
    // ==================
    if (data.accommodations && data.accommodations.length > 0) {
      const accommodationsToInsert = data.accommodations.map(acc => ({
        trip_id: result.tripId,
        nome: acc.nome,
        bairro: acc.bairro || '',
        endereco: acc.endereco || '',
        checkin: acc.checkin,
        checkout: acc.checkout,
        valor: acc.valor || null,
        moeda: acc.moeda || 'BRL',
        status: acc.status || 'confirmada',
        observacoes: acc.observacoes || ''
      }))

      const { error: accError } = await supabase
        .from('accommodations')
        .insert(accommodationsToInsert)

      if (accError) {
        result.errors.push(`Erro ao inserir hospedagens: ${accError.message}`)
      } else {
        result.accommodationsCount = accommodationsToInsert.length
        console.log(`✓ ${result.accommodationsCount} hospedagens inseridas`)
      }
    }

    // ==================
    // 3. Inserir voos
    // ==================
    if (data.flights && data.flights.length > 0) {
      const flightsToInsert = data.flights.map(fl => ({
        trip_id: result.tripId,
        origem: fl.origem,
        destino: fl.destino,
        aeroporto: fl.aeroporto_destino || '',
        horario_voo: fl.horario_saida ? fl.horario_saida.slice(0, 5) : null,
        tipo_voo: fl.tipo_voo || 'nacional',
        tempo_deslocamento_min: fl.tempo_deslocamento_min || null,
        observacoes: fl.observacoes || `${fl.companhia || ''} ${fl.numero_voo || ''}`.trim()
      }))

      const { error: flError } = await supabase
        .from('flights')
        .insert(flightsToInsert)

      if (flError) {
        result.errors.push(`Erro ao inserir voos: ${flError.message}`)
      } else {
        result.flightsCount = flightsToInsert.length
        console.log(`✓ ${result.flightsCount} voos inseridos`)
      }
    }

    // ==================
    // 4. Inserir aluguel de carro
    // ==================
    if (data.car_rental) {
      const { data: carData, error: carError } = await supabase
        .from('car_rental')
        .insert({
          trip_id: result.tripId,
          locadora: data.car_rental.locadora,
          plataforma: data.car_rental.plataforma,
          voucher: data.car_rental.voucher,
          codigo_rentcars: data.car_rental.codigo_rentcars,
          codigo_reserva: data.car_rental.codigo_reserva,
          condutor: data.car_rental.condutor,
          retirada_data: data.car_rental.retirada_data,
          retirada_hora: data.car_rental.retirada_hora,
          retirada_local: data.car_rental.retirada_local,
          devolucao_data: data.car_rental.devolucao_data,
          devolucao_hora: data.car_rental.devolucao_hora,
          devolucao_local: data.car_rental.devolucao_local,
          valor_total: data.car_rental.valor_total,
          moeda: data.car_rental.moeda || 'USD',
          valor_pago_online: data.car_rental.valor_pago_online,
          valor_no_destino: data.car_rental.valor_no_destino,
          caucao_garantia: data.car_rental.caucao_garantia,
          telefone_locadora: data.car_rental.telefone_locadora,
          observacoes: data.car_rental.observacoes
        })
        .select()

      if (carError) {
        result.errors.push(`Erro ao inserir aluguel de carro: ${carError.message}`)
      } else {
        result.carRentalId = carData[0].id
        console.log(`✓ Aluguel de carro inserido: ${result.carRentalId}`)
      }
    }

    // ==================
    // 5. Inserir atividades
    // ==================
    if (data.activities && data.activities.length > 0) {
      // Primeiro, buscar os trip_day_ids para cada data
      const { data: tripDaysData, error: tripDaysError } = await supabase
        .from('trip_days')
        .select('id, data')
        .eq('trip_id', result.tripId)

      if (tripDaysError) {
        result.errors.push(`Erro ao buscar trip_days: ${tripDaysError.message}`)
      } else {
        const activitiesToInsert = data.activities
          .map(act => {
            const tripDay = tripDaysData.find(td => td.data === act.trip_day)
            if (!tripDay) return null

            return {
              trip_day_id: tripDay.id,
              nome: act.nome,
              horario_inicio: act.horario_inicio || null,
              horario_fim: act.horario_fim || null,
              categoria: act.categoria || 'passeios',
              custo_previsto: act.custo_previsto || null,
              custo_real: act.custo_real || null,
              status: act.status || 'planejada',
              observacoes: act.observacoes || ''
            }
          })
          .filter(a => a !== null)

        if (activitiesToInsert.length > 0) {
          const { error: actError } = await supabase
            .from('activities')
            .insert(activitiesToInsert)

          if (actError) {
            result.errors.push(`Erro ao inserir atividades: ${actError.message}`)
          } else {
            result.activitiesCount = activitiesToInsert.length
            console.log(`✓ ${result.activitiesCount} atividades inseridas`)
          }
        }
      }
    }

    return result
  } catch (err) {
    console.error('Erro geral na importação:', err)
    throw err
  }
}

/**
 * Lê arquivo JSON escolhido pelo usuário
 * @param {File} file - Arquivo JSON selecionado
 * @returns {Promise<Object>} Dados do JSON
 */
export async function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(data)
      } catch (err) {
        reject(new Error(`Erro ao fazer parse do JSON: ${err.message}`))
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
    reader.readAsText(file)
  })
}
