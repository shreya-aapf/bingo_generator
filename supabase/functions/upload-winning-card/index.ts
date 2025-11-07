// Supabase Edge Function: Upload Winning Card
// Uploads winning bingo cards to Supabase Storage bucket

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface UploadWinningCardRequest {
  name: string
  email: string
  image: string // base64 image with data URI prefix
  timestamp?: string
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

  console.log('📨 Incoming request:', req.method, req.url)
  console.log('📋 Headers:', Object.fromEntries(req.headers.entries()))

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
    const { name, email, image, timestamp }: UploadWinningCardRequest = await req.json()

    console.log('Received claim submission:', { name, email, hasImage: !!image, timestamp })

    if (!name || !email || !image) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, and image are required' }),
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

    // Validate that image is a valid image file (accept PNG, JPEG, JPG, WEBP)
    const validImagePrefixes = [
      'data:image/png;base64,',
      'data:image/jpeg;base64,',
      'data:image/jpg;base64,',
      'data:image/webp;base64,'
    ]
    
    const isValidImage = validImagePrefixes.some(prefix => image.startsWith(prefix))
    if (!isValidImage) {
      return new Response(
        JSON.stringify({ error: 'Only image files (PNG, JPEG, JPG, WEBP) are allowed' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing required environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey
      })
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Convert base64 to buffer for upload
    const imageData = image.split(',')[1] // Remove data URI prefix
    const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0))
    
    // Detect image type from data URI
    const imageType = image.split(';')[0].split('/')[1] // Extract 'png', 'jpeg', etc.

    // Generate claim reference
    const claimRef = generateClaimReference()

    // Upload to Supabase Storage with name and email as metadata
    const uploadResult = await uploadWinningCardToBucket({
      supabase,
      claimRef,
      name,
      email,
      imageBuffer,
      imageType,
      timestamp: timestamp || new Date().toISOString()
    })

    const response: UploadWinningCardResponse = {
      success: true,
      bucketUrl: uploadResult.publicUrl,
      fileName: uploadResult.fileName,
      claimRef: claimRef
    }

    console.log(`✅ Winning card uploaded successfully:`)
    console.log(`   - Claimant: ${name} (${email})`)
    console.log(`   - File: ${uploadResult.fileName}`)
    console.log(`   - Claim Reference: ${claimRef}`)

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
 * Upload winning card to Supabase Storage bucket
 * Name and email are stored as metadata in the image file itself
 */
async function uploadWinningCardToBucket({
  supabase,
  claimRef,
  name,
  email,
  imageBuffer,
  imageType,
  timestamp
}: {
  supabase: any
  claimRef: string
  name: string
  email: string
  imageBuffer: Uint8Array
  imageType: string
  timestamp: string
}) {
  // Generate filename with timestamp and claim reference
  const timestampForFile = timestamp.replace(/[:.]/g, '-')
  const fileExtension = imageType === 'jpeg' ? 'jpg' : imageType
  const fileName = `winning-card-${claimRef}-${timestampForFile}.${fileExtension}`
  
  // Determine content type
  const contentType = `image/${imageType}`

  console.log(`Uploading file: ${fileName} (${imageBuffer.length} bytes)`)

  // Upload to the bingo_cards bucket with name and email as metadata
  const { data, error } = await supabase.storage
    .from('bingo_cards')
    .upload(fileName, imageBuffer, {
      contentType: contentType,
      metadata: {
        type: 'winning_claim',
        claimRef: claimRef,
        claimantName: name,
        claimantEmail: email,
        submittedAt: timestamp,
        imageType: imageType
      }
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw new Error(`Failed to upload to storage: ${error.message}`)
  }

  console.log('✅ File uploaded successfully to storage')

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
  const timestamp = Date.now().toString(36).toUpperCase()
  const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase()
  return `CLAIM-${timestamp}-${randomPart}`
}
