import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase-server'
import OpenAI from 'openai'

// Lazy-load OpenAI client to avoid build-time errors
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

interface AnalysisRequest {
  childId: string
  contactId: string
  sinceTimestamp?: string // Optional: only analyze messages after this timestamp
}

interface ConversationSafetyResult {
  isSafe: boolean
  concerns: string[]
  explanation: string
}

const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const FALLBACK_OPENAI_MODEL = 'gpt-4o-mini'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI configuratie ontbreekt (OPENAI_API_KEY)' },
        { status: 500 }
      )
    }

    // Create Supabase client with cookies for auth
    const supabase = await createServerClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    // Verify user is a parent
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'parent') {
      return NextResponse.json({ error: 'Verboden - Alleen toegang voor ouders' }, { status: 403 })
    }

    const body: AnalysisRequest = await request.json()
    const { childId, contactId, sinceTimestamp } = body

    if (!childId || !contactId) {
      return NextResponse.json({ error: 'childId of contactId ontbreekt' }, { status: 400 })
    }

    // Verify parent has access to this child
    const { data: child } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', childId)
      .eq('parent_id', user.id)
      .single()

    if (!child) {
      return NextResponse.json({ error: 'Verboden - Niet jouw kind' }, { status: 403 })
    }

    // Fetch messages in the conversation (optionally filtered by timestamp)
    let query = supabase
      .from('messages')
      .select('id, content, content_type, media_url, sender_id, created_at')
      .or(`and(sender_id.eq.${childId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${childId})`)
    
    // If sinceTimestamp is provided, only get messages after that time
    if (sinceTimestamp) {
      query = query.gt('created_at', sinceTimestamp)
    }
    
    const { data: messages } = await query.order('created_at', { ascending: true })

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        success: true,
        isSafe: true,
        concerns: [],
        message: sinceTimestamp ? 'Geen nieuwe berichten om te analyseren' : 'Geen berichten om te analyseren',
        messageCount: 0,
        analyzedNewOnly: !!sinceTimestamp,
      })
    }

    // Analyze the conversation (either all or just new messages)
    const analysis = await analyzeConversationWithOpenAI(messages, childId)

    return NextResponse.json({
      success: true,
      isSafe: analysis.isSafe,
      concerns: analysis.concerns,
      explanation: analysis.explanation,
      messageCount: messages.length,
      analyzedNewOnly: !!sinceTimestamp,
    })
  } catch (error) {
    console.error('Error in analyze-messages API:', error)
    const message = error instanceof Error ? error.message : 'Interne serverfout'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

async function analyzeConversationWithOpenAI(
  messages: Array<{ id: string; content: string; content_type?: string; media_url?: string; sender_id: string; created_at: string }>,
  childId: string
): Promise<ConversationSafetyResult> {
  const openai = getOpenAIClient()
  
  // Format the conversation
  const conversationText = messages
    .map((msg, idx) => {
      const sender = msg.sender_id === childId ? 'Child' : 'Contact'
      const contentType = msg.content_type || 'text'
      
      if (contentType === 'gif' && msg.media_url) {
        return `${idx + 1}. [${sender}]: [Shared a GIF: ${msg.content}]`
      }
      if (contentType === 'image' && msg.media_url) {
        return `${idx + 1}. [${sender}]: [Shared an image: ${msg.content}]`
      }

      return `${idx + 1}. [${sender}]: ${msg.content}`
    })
    .join('\n')
  
  const systemPrompt = `You are a content safety analyzer for a children's messaging app. 
Analyze the ENTIRE CONVERSATION for safety concerns. You must check for:

1. BULLYING: Any form of harassment, intimidation, threats, mean comments, or hurtful behavior
2. SWEARING: Profanity, curse words, or inappropriate language
3. UNSAFE: Content that is not PG-rated, including sexual content, violence, drug references, or anything inappropriate for children

IMPORTANT: 
- Conversations can be in ANY LANGUAGE (English, Dutch, Spanish, French, etc.). This is perfectly normal and acceptable.
- DO NOT flag a conversation as unsafe just because it's not in English.
- You should detect bullying, swearing, and unsafe content in ALL languages.
- Normal greetings, friendly conversations, and casual chat in any language are SAFE.
- GIF messages will appear as "[Shared a GIF: description]" - evaluate the GIF description for appropriateness.
- GIFs are filtered to G-rated content only, so they are generally safe unless the description suggests otherwise.
- Respond in DUTCH. The "explanation" and "concerns" values must be in Dutch.

Respond ONLY with a JSON object in this exact format:
{
  "isSafe": true/false,
  "concerns": ["pesten", "schelden", "onveilig"],
  "explanation": "Korte uitleg van de algehele gespreksveiligheid in het Nederlands"
}

The "concerns" array should only include the types of concerns found (in Dutch). If the conversation is safe, return an empty array.
Be strict but fair. Context matters - friendly banter between friends is different from actual bullying.`

  const runAnalysis = async (model: string) => {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this conversation:\n\n${conversationText}` },
      ],
      temperature: 0.3,
      max_tokens: 300,
    })
    return response.choices[0]?.message?.content || '{}'
  }

  let responseText = '{}'
  try {
    responseText = await runAnalysis(DEFAULT_OPENAI_MODEL)
  } catch (primaryError: any) {
    const primaryMessage = primaryError?.message || ''
    const shouldFallback =
      DEFAULT_OPENAI_MODEL !== FALLBACK_OPENAI_MODEL &&
      (primaryMessage.toLowerCase().includes('model') ||
        primaryMessage.toLowerCase().includes('not found') ||
        primaryMessage.toLowerCase().includes('does not exist'))

    if (!shouldFallback) {
      throw primaryError
    }

    responseText = await runAnalysis(FALLBACK_OPENAI_MODEL)
  }
  
  try {
    const cleaned = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    const analysis = JSON.parse(cleaned)
    return {
      isSafe: analysis.isSafe ?? true,
      concerns: Array.isArray(analysis.concerns) ? analysis.concerns : [],
      explanation: analysis.explanation || 'Conversation appears safe',
    }
  } catch (error) {
    console.error('Error parsing OpenAI response:', responseText)
    // Default to safe if parsing fails
    return {
      isSafe: true,
      concerns: [],
      explanation: 'Analysefout - standaard veilig',
    }
  }
}

