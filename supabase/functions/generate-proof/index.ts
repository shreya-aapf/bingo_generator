// Supabase Edge Function: Generate Proof
// Generates HMAC proof for bingo card CID

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts"

interface ProofRequest {
  cid: string
}

interface ProofResponse {
  proof: string
  cid: string
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
    const { cid }: ProofRequest = await req.json()

    // Validate CID
    if (!cid || typeof cid !== 'string' || cid.length !== 12) {
      return new Response(
        JSON.stringify({ error: 'Invalid CID format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get server secret
    const serverSecret = Deno.env.get('SERVER_SECRET')
    if (!serverSecret) {
      console.error('SERVER_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate HMAC proof
    const proof = await generateHMACProof(cid, serverSecret)

    const response: ProofResponse = {
      proof,
      cid
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error generating proof:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Generate HMAC-SHA256 proof for CID
 */
async function generateHMACProof(cid: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  
  // Import secret key
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  // Generate HMAC
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(cid)
  )
  
  // Convert to base32 and truncate to 10 chars
  const hashArray = Array.from(new Uint8Array(signature))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  const base32 = toBase32(hashHex).substring(0, 10)
  
  return base32
}

/**
 * Convert hex string to base32
 */
function toBase32(hex: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let binary = ''
  
  // Convert hex to binary
  for (let i = 0; i < hex.length; i += 2) {
    const hexPair = hex.substr(i, 2)
    const decimal = parseInt(hexPair, 16)
    binary += decimal.toString(2).padStart(8, '0')
  }
  
  // Convert binary to base32
  let base32 = ''
  for (let i = 0; i < binary.length; i += 5) {
    const chunk = binary.substr(i, 5).padEnd(5, '0')
    const index = parseInt(chunk, 2)
    base32 += alphabet[index]
  }
  
  return base32
}
