import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useTrips() {
  const { user } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTrips = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('data_inicio', { ascending: false })
    if (error) setError(error.message)
    else setTrips(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  const createTrip = async (trip) => {
    const { data, error } = await supabase
      .from('trips')
      .insert({ ...trip, user_id: user.id })
      .select()
      .single()
    if (error) throw error
    setTrips(prev => [data, ...prev])
    return data
  }

  const updateTrip = async (id, updates) => {
    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setTrips(prev => prev.map(t => t.id === id ? data : t))
    return data
  }

  const deleteTrip = async (id) => {
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (error) throw error
    setTrips(prev => prev.filter(t => t.id !== id))
  }

  return { trips, loading, error, createTrip, updateTrip, deleteTrip, refetch: fetchTrips }
}
