import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSuggestions(tripDayId, accommodationId) {
  const [suggestions, setSuggestions] = useState(null)
  const [loading, setLoading] = useState(false)

  // Carregar sugestões salvas
  const loadSuggestions = useCallback(async () => {
    if (!tripDayId || !accommodationId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('accommodation_suggestions')
        .select('*')
        .eq('trip_day_id', tripDayId)
        .eq('accommodation_id', accommodationId)

      if (error) throw error
      setSuggestions(data || [])
    } catch (err) {
      console.error('Erro ao carregar sugestões:', err)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [tripDayId, accommodationId])

  // Salvar sugestão de restaurante
  const saveSuggestion = async (tipo, nome, endereco, latitude, longitude, telefone, observacoes) => {
    if (!tripDayId || !accommodationId) return
    try {
      const { data, error } = await supabase
        .from('accommodation_suggestions')
        .insert({
          trip_day_id: tripDayId,
          accommodation_id: accommodationId,
          tipo, // 'almoco' ou 'jantar'
          nome_restaurante: nome,
          endereco,
          latitude: latitude || null,
          longitude: longitude || null,
          telefone,
          observacoes
        })
        .select()

      if (error) throw error

      setSuggestions(p => [...(p || []), data[0]])
      return data[0]
    } catch (err) {
      console.error('Erro ao salvar sugestão:', err)
      throw err
    }
  }

  // Remover sugestão
  const removeSuggestion = async (suggestionId) => {
    try {
      const { error } = await supabase
        .from('accommodation_suggestions')
        .delete()
        .eq('id', suggestionId)

      if (error) throw error
      setSuggestions(p => p.filter(s => s.id !== suggestionId))
    } catch (err) {
      console.error('Erro ao remover sugestão:', err)
      throw err
    }
  }

  return {
    suggestions,
    loading,
    loadSuggestions,
    saveSuggestion,
    removeSuggestion,
    hasAlmoco: suggestions?.some(s => s.tipo === 'almoco'),
    hasJantar: suggestions?.some(s => s.tipo === 'jantar'),
    almoco: suggestions?.find(s => s.tipo === 'almoco'),
    jantar: suggestions?.find(s => s.tipo === 'jantar')
  }
}
