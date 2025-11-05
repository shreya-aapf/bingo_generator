// Supabase Edge Function: Deploy Card Email Automation
// Deploys an Automation Anywhere bot to send bingo card via email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface DeployCardRequest {
  cid: string
  name: string
  email: string
  asset: string // Base64 encoded card image
}

interface DeployCardResponse {
  success: boolean
  deploymentId: string
  message: string
}

// Automation Anywhere API Configuration
// TODO: Add your Automation Anywhere credentials here
interface AAConfig {
  // Control Room URL (e.g., https://your-cr.automationanywhere.digital)
  controlRoomUrl: string
  // Authentication token or username/password
  authToken?: string
  username?: string
  password?: string
  // Bot repository path
  botPath: string
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
    const { cid, name, email, asset }: DeployCardRequest = await req.json()

    // Validate required fields
    if (!cid || !name || !email || !asset) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: cid, name, email, asset' }),
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

    // Get AA configuration from environment variables
    const aaConfig: AAConfig = {
      // TODO: Set these environment variables in your Supabase project
      controlRoomUrl: Deno.env.get('AA_CONTROL_ROOM_URL') || '',
      authToken: Deno.env.get('AA_AUTH_TOKEN'),
      username: Deno.env.get('AA_USERNAME'),
      password: Deno.env.get('AA_PASSWORD'),
      botPath: Deno.env.get('AA_EMAIL_BOT_PATH') || '/Bots/EmailCardBot'
    }

    // Validate AA configuration
    if (!aaConfig.controlRoomUrl) {
      console.error('AA_CONTROL_ROOM_URL not configured')
      return new Response(
        JSON.stringify({ error: 'Automation Anywhere configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!aaConfig.authToken && (!aaConfig.username || !aaConfig.password)) {
      console.error('AA authentication credentials not configured')
      return new Response(
        JSON.stringify({ error: 'Automation Anywhere authentication not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Deploy the automation
    const deploymentResult = await deployCardEmailBot(aaConfig, {
      cid,
      name,
      email,
      asset
    })

    const response: DeployCardResponse = {
      success: true,
      deploymentId: deploymentResult.deploymentId,
      message: `Card email automation deployed successfully. Deployment ID: ${deploymentResult.deploymentId}`
    }

    console.log(`Card email automation deployed for CID: ${cid}, Email: ${email}`)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error deploying card email automation:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to deploy automation',
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
 * Deploy Automation Anywhere bot to send card email
 */
async function deployCardEmailBot(config: AAConfig, cardData: {
  cid: string
  name: string
  email: string
  asset: string
}): Promise<{ deploymentId: string }> {
  
  // Get authentication token if using username/password
  let authToken = config.authToken
  if (!authToken && config.username && config.password) {
    authToken = await authenticateWithAA(config.controlRoomUrl, config.username, config.password)
  }

  // Prepare bot deployment payload
  const deploymentPayload = {
    // Bot file path in the repository
    fileId: config.botPath,
    
    // Input variables for the bot
    // TODO: Configure these based on your bot's input variables
    runAsUserIds: [], // Run with default credentials
    poolIds: [], // Use default device pool
    
    // Bot input variables - customize based on your email bot requirements
    botInput: {
      variables: {
        // Email configuration variables
        recipientEmail: {
          type: "STRING",
          value: cardData.email
        },
        recipientName: {
          type: "STRING", 
          value: cardData.name
        },
        cardId: {
          type: "STRING",
          value: cardData.cid
        },
        cardImageBase64: {
          type: "STRING",
          value: cardData.asset
        },
        emailSubject: {
          type: "STRING",
          value: `Your Bingo Card - ${cardData.cid}`
        },
        emailBody: {
          type: "STRING",
          value: generateCardEmailBody(cardData.name, cardData.cid)
        }
      }
    }
  }

  // Deploy the bot using AA API v4
  const deployResponse = await fetch(`${config.controlRoomUrl}/v4/repository/workspaces/public/files/list`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(deploymentPayload)
  })

  if (!deployResponse.ok) {
    const errorText = await deployResponse.text()
    throw new Error(`AA Deployment API error: ${deployResponse.status} ${errorText}`)
  }

  const deployResult = await deployResponse.json()
  
  // Return deployment ID (adjust based on actual AA API response structure)
  return {
    deploymentId: deployResult.deploymentId || deployResult.id || `deploy-${Date.now()}`
  }
}

/**
 * Authenticate with Automation Anywhere Control Room
 */
async function authenticateWithAA(controlRoomUrl: string, username: string, password: string): Promise<string> {
  const authPayload = {
    username,
    password
  }

  const authResponse = await fetch(`${controlRoomUrl}/v1/authentication`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(authPayload)
  })

  if (!authResponse.ok) {
    const errorText = await authResponse.text()
    throw new Error(`AA Authentication error: ${authResponse.status} ${errorText}`)
  }

  const authResult = await authResponse.json()
  return authResult.token
}

/**
 * Generate email body for bingo card
 */
function generateCardEmailBody(name: string, cid: string): string {
  return `
Hi ${name},

Here's your personalized bingo card!

Card Details:
- Card ID: ${cid}
- Generated: ${new Date().toLocaleDateString()}

Your bingo card image is attached to this email. Print it out or save it to your device to use during the game.

Good luck and have fun!

Best regards,
The Bingo Team

---
This email was sent by an automated system. Please do not reply to this email.
`.trim()
}
