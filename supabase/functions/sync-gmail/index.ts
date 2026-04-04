// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

// Standard CORS headers for frontend accessibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-google-token',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Edge Function Init: Starting Gmail Sync...")
    // 1. Authenticate Request natively via Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Edge Environment Variables')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt)
    if (authError || !user) throw new Error('Unauthorized Execution: ' + authError?.message)
    console.log("Authenticated User:", user.id)

    // 2. Fetch User Rules for Auto-Categorization
    console.log("Fetching User Rules...")
    const { data: rules, error: rulesError } = await supabaseClient
      .from('user_rules')
      .select('*')
    
    if (rulesError) console.error("Rule fetch error (falling back to defaults):", rulesError)

    // 3. Extract the Google OAuth Provider Token we passed from the Client POST Body
    const body = await req.json()
    const googleToken = body?.googleToken

    // 4. Fetch latest emails natively using Gmail REST API!
    console.log("Fetching Gmail API...")
    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5`, {
      headers: { Authorization: `Bearer ${googleToken}` }
    })

    if (!listRes.ok) throw new Error('Gmail API rejection: ' + await listRes.text())
    const listData = await listRes.json()

    const inboxInjections = []

    if (listData.messages && listData.messages.length > 0) {
      for (const msg of listData.messages) {
        // Pull specific email body/header
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${googleToken}` }
        })
        const msgData = await msgRes.json()

        // Extract Subject and Sender (From)
        const headers = msgData.payload?.headers || []
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject'
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender'
        const snippet = msgData.snippet || ''

        // Dynamic Rule Matching Logic
        let category = 'General'
        let priority = 'medium'
        
        if (rules && rules.length > 0) {
          for (const rule of rules) {
            const regex = new RegExp(rule.keyword, 'i')
            if (regex.test(subject) || regex.test(snippet) || regex.test(from)) {
              category = rule.target_category
              priority = rule.target_priority
              break; // Stop at first matching rule
            }
          }
        } else {
          // Legacy Fallbacks if no rules exist
          if (snippet.toLowerCase().includes('exam') || snippet.toLowerCase().includes('assignment')) category = 'Study'
          if (snippet.toLowerCase().includes('urgent') || snippet.toLowerCase().includes('asap')) priority = 'urgent'
        }

        inboxInjections.push({
          user_id: user.id,
          source: 'gmail',
          sender: from,
          original_text: `${subject}: ${snippet}`,
          parsed_name: subject,
          parsed_category: category,
          parsed_priority: priority,
          parsed_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        })
      }
    }

    console.log(`Injecting ${inboxInjections.length} items to Supabase...`)
    // 5. Push to Inbox table queue
    const { error: insertError } = await supabaseClient
      .from('inbox_items')
      .insert(inboxInjections)

    if (insertError) throw insertError

    console.log("Sync Complete.")
    return new Response(JSON.stringify({ success: true, count: inboxInjections.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("Function Error:", errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
