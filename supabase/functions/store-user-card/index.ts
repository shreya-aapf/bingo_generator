// Supabase Edge Function: Store User-Card Mapping
// Maps users to their generated bingo card IDs for tracking and analytics

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface StoreUserCardRequest {
  cid: string
  name?: string
  email?: string
  session_id?: string
  user_agent?: string
  ip_address?: string
}

interface StoreUserCardResponse {
  success: boolean
  mapping_id: string
  message: string
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { cid, name, email, session_id, user_agent, ip_address }: StoreUserCardRequest = await req.json()

    // Validate required field
    if (!cid || typeof cid !== 'string' || cid.length !== 12) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing CID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract additional metadata from request
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     ip_address || 
                     'unknown'
    
    const userAgent = req.headers.get('user-agent') || user_agent || 'unknown'
    
    // Generate session ID if not provided
    const sessionId = session_id || generateSessionId()

    // Prepare data for insertion
    const mappingData = {
      card_id: cid,
      user_name: name || null,
      user_email: email || null,
      session_id: sessionId,
      user_agent: userAgent,
      ip_address: clientIP,
      created_at: new Date().toISOString(),
      // Add metadata
      metadata: {
        timestamp: Date.now(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer: req.headers.get('referer') || null
      }
    }

    // Insert into database
    const { data, error } = await supabase
      .from('user_card_mappings')
      .insert([mappingData])
      .select('id')
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to store user-card mapping',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const response: StoreUserCardResponse = {
      success: true,
      mapping_id: data.id,
      message: 'User-card mapping stored successfully'
    }

    console.log(`Stored mapping for CID: ${cid}, Session: ${sessionId}`)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error storing user-card mapping:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substr(2, 9)
  return `sess_${timestamp}_${randomPart}`
}

// Optional: Function to get user's card history
export async function getUserCardHistory(email: string, supabase: any) {
  const { data, error } = await supabase
    .from('user_card_mappings')
    .select('card_id, created_at, user_name')
    .eq('user_email', email)
    .order('created_at', { ascending: false })

  return { data, error }
}

// Optional: Function to get card statistics
export async function getCardStatistics(supabase: any) {
  const { data, error } = await supabase
    .from('user_card_mappings')
    .select('card_id, created_at, user_email')
    .order('created_at', { ascending: false })

  if (error) return { error }

  const stats = {
    total_cards: data.length,
    unique_users: new Set(data.filter(d => d.user_email).map(d => d.user_email)).size,
    cards_today: data.filter(d => {
      const today = new Date().toDateString()
      const cardDate = new Date(d.created_at).toDateString()
      return today === cardDate
    }).length
  }

  return { stats, error: null }
}
