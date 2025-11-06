// Supabase Edge Function: Upload Winning Card
// Uploads winning bingo cards to Supabase Storage bucket

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface UploadWinningCardRequest {
  cid: string
  proof: string
  name: string
  email: string
  marks: string[]
  asset: string // base64 PNG
  attachment?: string // optional base64 attachment
}

interface UploadWinningCardResponse {
  success: boolean
  bucketUrl?: string
  fileName?: string
  claimRef?: string
}

serve(async (req) => {
  // CORS headers - More permissive for development and testing
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept, origin, referer, user-agent',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
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

    // Parse and validate request
    const { cid, proof, name, email, marks, asset, attachment }: UploadWinningCardRequest = await req.json()

    if (!cid || !proof || !name || !email || !marks || !asset) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate CID format
    if (cid.length !== 12) {
      return new Response(
        JSON.stringify({ error: 'Invalid CID format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serverSecret = Deno.env.get('SERVER_SECRET')

    if (!supabaseUrl || !supabaseAnonKey || !serverSecret) {
      console.error('Missing required environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey,
        serverSecret: !!serverSecret
      })
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SERVER_SECRET'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with anon key (RLS disabled for simplicity)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Verify proof
    const expectedProof = await generateHMACProof(cid, serverSecret)
    if (proof !== expectedProof) {
      return new Response(
        JSON.stringify({ error: 'Invalid proof - card verification failed' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate that asset is a PNG file
    if (!asset.startsWith('data:image/png;base64,')) {
      return new Response(
        JSON.stringify({ error: 'Only PNG files are allowed' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Convert base64 to buffer for upload
    const imageData = asset.split(',')[1] // Remove data URL prefix
    const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0))

    // Generate claim reference
    const claimRef = generateClaimReference()

    // Upload to Supabase Storage
    const uploadResult = await uploadWinningCardToBucket({
      supabase,
      cid,
      claimRef,
      name,
      email,
      marks,
      imageBuffer,
      attachment
    })

    // Store claim submission in database for easy tracking (optional)
    try {
      await storeClaim({
        supabase,
        claimRef,
        cid,
        proof,
        name,
        email,
        marks,
        fileName: uploadResult.fileName,
        bucketUrl: uploadResult.publicUrl,
        hasAttachment: !!attachment
      })
    } catch (dbError) {
      // Database operations are optional - don't fail the upload if DB is unavailable
      console.warn('Database storage failed (continuing without DB):', dbError.message)
      console.log('File uploaded successfully to storage, skipping database tracking')
    }

    const response: UploadWinningCardResponse = {
      success: true,
      bucketUrl: uploadResult.publicUrl,
      fileName: uploadResult.fileName,
      claimRef: claimRef
    }

    console.log(`Winning card uploaded successfully for ${email}, CID: ${cid}, File: ${uploadResult.fileName}, Claim: ${claimRef}`)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error uploading winning card:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to upload winning card',
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
 * Store claim submission in database table
 */
async function storeClaim({
  supabase,
  claimRef,
  cid,
  proof,
  name,
  email,
  marks,
  fileName,
  bucketUrl,
  hasAttachment
}: {
  supabase: any
  claimRef: string
  cid: string
  proof: string
  name: string
  email: string
  marks: string[]
  fileName: string
  bucketUrl: string
  hasAttachment: boolean
}) {
  try {
    const { data, error } = await supabase
      .from('bingo_claims')
      .insert({
        claim_ref: claimRef,
        card_id: cid,
        proof_code: proof,
        claimant_name: name,
        claimant_email: email,
        winning_marks: marks,
        card_file_name: fileName,
        card_url: bucketUrl,
        has_attachment: hasAttachment,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })

    if (error) {
      // Provide specific error messages for common issues
      if (error.code === '42P01') {
        throw new Error(`Table 'bingo_claims' does not exist. Run the migration or disable database tracking.`)
      } else if (error.code === '42501') {
        throw new Error(`Permission denied. Check RLS policies on 'bingo_claims' table.`)
      } else {
        throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
      }
    }

    console.log(`✅ Claim stored in database: ${claimRef}`)
    return data
    
  } catch (error) {
    console.error('❌ Database operation failed:', error.message)
    throw error
  }
}

/**
 * Upload winning card to Supabase Storage bucket
 */
async function uploadWinningCardToBucket({
  supabase,
  cid,
  claimRef,
  name,
  email,
  marks,
  imageBuffer,
  attachment
}: {
  supabase: any
  cid: string
  claimRef: string
  name: string
  email: string
  marks: string[]
  imageBuffer: Uint8Array
  attachment?: string
}) {
  // Generate filename with timestamp and claim reference
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `winning-card-${cid}-${claimRef}-${timestamp}.png`

  // Upload to the bingo_cards bucket with winning- prefix
  const { data, error } = await supabase.storage
    .from('bingo_cards')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      metadata: {
        type: 'winning_card',
        cid: cid,
        claimRef: claimRef,
        name: name,
        email: email,
        marks: marks.join(','),
        uploadedAt: new Date().toISOString(),
        hasAttachment: attachment ? 'true' : 'false'
      }
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw new Error(`Failed to upload to storage: ${error.message}`)
  }

  // If there's an attachment, upload it too
  if (attachment) {
    try {
      const attachmentData = attachment.split(',')[1] // Remove data URL prefix
      const attachmentBuffer = Uint8Array.from(atob(attachmentData), c => c.charCodeAt(0))
      const attachmentFileName = `attachment-${cid}-${claimRef}-${timestamp}.jpg`
      
      await supabase.storage
        .from('bingo_cards')
        .upload(attachmentFileName, attachmentBuffer, {
          contentType: 'image/jpeg',
          metadata: {
            type: 'claim_attachment',
            cid: cid,
            claimRef: claimRef,
            relatedCard: fileName
          }
        })
      
      console.log(`Attachment uploaded: ${attachmentFileName}`)
    } catch (attachmentError) {
      console.warn('Failed to upload attachment:', attachmentError)
      // Don't fail the whole request if attachment upload fails
    }
  }

  // Get public URL for the uploaded file
  const { data: publicUrlData } = supabase.storage
    .from('bingo_cards')
    .getPublicUrl(fileName)

  return {
    fileName: fileName,
    publicUrl: publicUrlData.publicUrl,
    path: data.path
  }
}

/**
 * Generate a unique claim reference
 */
function generateClaimReference(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase()
  return `CLAIM-${timestamp}-${randomPart}`
}

/**
 * Generate HMAC-SHA256 proof for CID (same as generate-proof function)
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
