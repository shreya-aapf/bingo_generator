bugfix: env variable// Supabase Edge Function: Claim Prize
// Validates winning bingo cards and forwards claims to community inbox

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface ClaimRequest {
  cid: string
  proof: string
  name: string
  email: string
  marks: string[] // Array of marked square positions like ["0-1", "1-2", etc.]
  attachment?: string // Optional base64 file attachment
}

interface ClaimResponse {
  success: boolean
  claimRef: string
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
    const { cid, proof, name, email, marks, attachment }: ClaimRequest = await req.json()

    if (!cid || !proof || !name || !email || !marks) {
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

    // Validate marks format and bingo
    if (!Array.isArray(marks) || marks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid marks format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get environment variables
    const serverSecret = Deno.env.get('SERVER_SECRET')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const communityEmail = Deno.env.get('COMMUNITY_EMAIL')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com'

    if (!serverSecret || !resendApiKey || !communityEmail) {
      console.error('Missing required environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify proof matches CID
    const expectedProof = await generateHMACProof(cid, serverSecret)
    if (proof !== expectedProof) {
      console.log(`Proof verification failed: expected ${expectedProof}, got ${proof}`)
      return new Response(
        JSON.stringify({ error: 'Invalid proof code' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate bingo pattern
    if (!validateBingo(marks)) {
      return new Response(
        JSON.stringify({ error: 'Marked squares do not form a valid bingo' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate claim reference
    const claimRef = generateClaimReference()

    // Prepare attachment if present
    let attachmentData: { filename: string; content: number[] } | undefined
    if (attachment) {
      try {
        const [mimeInfo, base64Data] = attachment.split(',')
        const mimeType = mimeInfo.match(/data:(.+);base64/)?.[1] || 'application/octet-stream'
        const extension = getFileExtension(mimeType)
        const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
        
        attachmentData = {
          filename: `claim-attachment-${claimRef}.${extension}`,
          content: Array.from(buffer)
        }
      } catch (error) {
        console.error('Error processing attachment:', error)
        // Continue without attachment rather than failing
      }
    }

    // Forward claim to community inbox
    await forwardClaim({
      resendApiKey,
      fromEmail,
      communityEmail,
      claimRef,
      cid,
      proof,
      name,
      email,
      marks,
      attachment: attachmentData
    })

    const response: ClaimResponse = {
      success: true,
      claimRef
    }

    console.log(`Claim ${claimRef} processed successfully for CID: ${cid}`)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error processing claim:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process claim',
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
 * Validate if marks form a valid bingo pattern
 */
function validateBingo(marks: string[]): boolean {
  const positions = marks.map(mark => {
    const [row, col] = mark.split('-').map(n => parseInt(n))
    return { row, col }
  })

  // Check rows (need 5 in same row)
  for (let row = 0; row < 5; row++) {
    const rowPositions = positions.filter(p => p.row === row)
    if (rowPositions.length === 5) return true
  }

  // Check columns (need 5 in same column)
  for (let col = 0; col < 5; col++) {
    const colPositions = positions.filter(p => p.col === col)
    if (colPositions.length === 5) return true
  }

  // Check main diagonal (top-left to bottom-right)
  const mainDiagonal = positions.filter(p => p.row === p.col)
  if (mainDiagonal.length === 5) return true

  // Check anti-diagonal (top-right to bottom-left)
  const antiDiagonal = positions.filter(p => p.row + p.col === 4)
  if (antiDiagonal.length === 5) return true

  return false
}

/**
 * Generate unique claim reference
 */
function generateClaimReference(): string {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const random = Math.random().toString(36).substr(2, 6).toUpperCase()
  return `CLAIM-${date}-${random}`
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType: string): string {
  const extensions: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
  }
  
  return extensions[mimeType] || 'bin'
}

/**
 * Forward claim to community inbox via email
 */
async function forwardClaim({
  resendApiKey,
  fromEmail,
  communityEmail,
  claimRef,
  cid,
  proof,
  name,
  email,
  marks,
  attachment
}: {
  resendApiKey: string
  fromEmail: string
  communityEmail: string
  claimRef: string
  cid: string
  proof: string
  name: string
  email: string
  marks: string[]
  attachment?: { filename: string; content: number[] }
}) {
  const emailPayload = {
    from: fromEmail,
    to: [communityEmail],
    subject: `🏆 Bingo Prize Claim - ${claimRef}`,
    html: generateClaimEmailHTML({
      claimRef,
      cid,
      proof,
      name,
      email,
      marks
    }),
    attachments: attachment ? [attachment] : undefined
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
 * Generate HTML email for claim notification
 */
function generateClaimEmailHTML({
  claimRef,
  cid,
  proof,
  name,
  email,
  marks
}: {
  claimRef: string
  cid: string
  proof: string
  name: string
  email: string
  marks: string[]
}): string {
  const marksDisplay = marks.join(', ')
  const timestamp = new Date().toISOString()
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bingo Prize Claim</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626, #f59e0b); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px 20px; border-radius: 0 0 10px 10px; }
        .claim-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }
        .verification { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .marks { font-family: monospace; background: #f1f5f9; padding: 10px; border-radius: 4px; }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 New Prize Claim</h1>
            <p>Winning bingo card submitted for verification</p>
        </div>
        <div class="content">
            <div class="claim-info">
                <h2>Claim Details</h2>
                <table>
                    <tr><th>Claim Reference</th><td><strong>${claimRef}</strong></td></tr>
                    <tr><th>Submitted</th><td>${timestamp}</td></tr>
                    <tr><th>Card ID</th><td><code>${cid}</code></td></tr>
                    <tr><th>Proof Code</th><td><code>${proof}</code></td></tr>
                    <tr><th>Claimant Name</th><td>${name}</td></tr>
                    <tr><th>Email</th><td>${email}</td></tr>
                </table>
            </div>
            
            <div class="verification">
                <strong>✅ Verification Status:</strong>
                <ul>
                    <li>Proof code validated against server secret</li>
                    <li>Bingo pattern verified as valid</li>
                    <li>Ready for manual review</li>
                </ul>
            </div>
            
            <h3>Marked Squares</h3>
            <div class="marks">
                <strong>Winning Pattern:</strong> ${marksDisplay}
            </div>
            <p><small>Format: row-column (0-indexed, e.g., "0-1" = first row, second column)</small></p>
            
            <h3>Next Steps</h3>
            <ul>
                <li>Verify the winning pattern manually if needed</li>
                <li>Check any attached supporting documentation</li>
                <li>Contact the claimant at <strong>${email}</strong></li>
                <li>Process the prize according to your game rules</li>
            </ul>
        </div>
        <div class="footer">
            <p>This claim was automatically processed and verified by the bingo system.</p>
            <p>Claim Reference: <strong>${claimRef}</strong></p>
        </div>
    </div>
</body>
</html>`
}

/**
 * Generate HMAC-SHA256 proof for CID (same as other functions)
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
