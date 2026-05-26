import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTrip(tripId) {
  const [trip, setTrip] = useState(null)
  const [accommodations, setAccommodations] = useState([])
  const [flights, setFlights] = useState([])
  const [tripDays, setTripDays] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!tripId) return
    setLoading(true)
    const [tripRes, accRes, flRes, daysRes, expRes] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('accommodations').select('*').eq('trip_id', tripId).order('checkin'),
      supabase.from('flights').select('*').eq('trip_id', tripId).order('horario_voo'),
      supabase.from('trip_days').select('*, activities(*)').eq('trip_id', tripId).order('data'),
      supabase.from('expenses').select('*').eq('trip_id', tripId).order('data', { ascending: false })
    ])
    if (!tripRes.error) setTrip(tripRes.data)
    if (!accRes.error) setAccommodations(accRes.data || [])
    if (!flRes.error) setFlights(flRes.data || [])
    if (!daysRes.error) setTripDays(daysRes.data || [])
    if (!expRes.error) setExpenses(expRes.data || [])
    setLoading(false)
  }, [tripId])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { trip, accommodations, flights, tripDays, expenses, loading, refetch: fetchAll }
}
