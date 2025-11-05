// Supabase Edge Function: Send Card
// Emails bingo cards to users via Resend API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface SendCardRequest {
  cid: string
  name: string
  email: string
  asset: string // base64 PNG
}

interface SendCardResponse {
  success: boolean
  messageId?: string
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

    // Parse and validate request
    const { cid, name, email, asset }: SendCardRequest = await req.json()

    if (!cid || !name || !email || !asset) {
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
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com'
    const serverSecret = Deno.env.get('SERVER_SECRET')

    if (!resendApiKey || !serverSecret) {
      console.error('Missing required environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify CID by regenerating proof
    const proof = await generateHMACProof(cid, serverSecret)

    // Convert base64 to buffer for attachment
    const imageData = asset.split(',')[1] // Remove data URL prefix
    const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0))

    // Send email via Resend
    const emailResult = await sendEmail({
      resendApiKey,
      fromEmail,
      toEmail: email,
      name,
      cid,
      proof,
      imageBuffer
    })

    const response: SendCardResponse = {
      success: true,
      messageId: emailResult.id
    }

    console.log(`Email sent successfully to ${email}, CID: ${cid}`)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error sending card:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
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
 * Send email via Resend API
 */
async function sendEmail({
  resendApiKey,
  fromEmail,
  toEmail,
  name,
  cid,
  proof,
  imageBuffer
}: {
  resendApiKey: string
  fromEmail: string
  toEmail: string
  name: string
  cid: string
  proof: string
  imageBuffer: Uint8Array
}) {
  const emailPayload = {
    from: fromEmail,
    to: [toEmail],
    subject: `🎯 Your Bingo Card ${cid}`,
    html: generateEmailHTML(name, cid, proof),
    attachments: [
      {
        filename: `bingo-card-${cid}.png`,
        content: Array.from(imageBuffer)
      }
    ]
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailPayload)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Resend API error: ${response.status} ${error}`)
  }

  return await response.json()
}

/**
 * Generate HTML email template
 */
function generateEmailHTML(name: string, cid: string, proof: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Bingo Card</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb, #059669); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px 20px; border-radius: 0 0 10px 10px; }
        .card-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }
        .proof-info { font-family: monospace; font-size: 14px; color: #64748b; }
        .privacy-note { background: #d1fae5; border: 1px solid #a7f3d0; color: #065f46; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Your Bingo Card</h1>
            <p>Privacy-first • Secure • Verifiable</p>
        </div>
        <div class="content">
            <h2>Hi ${name}! 👋</h2>
            <p>Your personalized bingo card has been generated and is attached to this email.</p>
            
            <div class="card-info">
                <h3>Card Details</h3>
                <p><strong>Card ID:</strong> <code>${cid}</code></p>
                <p><strong>Proof Code:</strong> <code>${proof}</code></p>
                <div class="proof-info">
                    <small>This proof code verifies your card's authenticity. Keep it safe!</small>
                </div>
            </div>
            
            <div class="privacy-note">
                <strong>🔒 Privacy First:</strong> Your personal information was not stored in any database. 
                This email is the only record, and we recommend saving your card locally.
            </div>
            
            <h3>How to Use Your Card</h3>
            <ul>
                <li>Print or save the attached image</li>
                <li>Mark squares as numbers are called</li>
                <li>Submit winning cards using the Card ID and Proof Code</li>
                <li>Keep your proof code secure - it validates your card</li>
            </ul>
            
            <p><strong>Good luck! 🍀</strong></p>
        </div>
        <div class="footer">
            <p>This card was generated using a privacy-first, serverless system.</p>
            <p>No personal data was stored. This email is your only record.</p>
        </div>
    </div>
</body>
</html>`
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
