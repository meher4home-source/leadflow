import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useLeads(businessId) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!businessId) return
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }, [businessId])

  useEffect(() => { fetch() }, [fetch])

  async function addLead(lead) {
    const { data, error } = await supabase
      .from('leads')
      .insert({ ...lead, business_id: businessId })
      .select()
      .single()
    if (!error) setLeads(prev => [data, ...prev])
    return { data, error }
  }

  async function updateLead(id, updates) {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error) setLeads(prev => prev.map(l => l.id === id ? data : l))
    return { data, error }
  }

  async function deleteLead(id) {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (!error) setLeads(prev => prev.filter(l => l.id !== id))
    return { error }
  }

  return { leads, loading, addLead, updateLead, deleteLead, refetch: fetch }
}
