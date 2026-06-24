import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useConversations(leadId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!leadId) return
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)
  }, [leadId])

  useEffect(() => { fetch() }, [fetch])

  // Realtime subscription
  useEffect(() => {
    if (!leadId) return
    const channel = supabase
      .channel(`conv:${leadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `lead_id=eq.${leadId}`
      }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [leadId])

  return { messages, loading, refetch: fetch }
}
