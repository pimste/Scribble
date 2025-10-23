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
  messageIds: string[]
}

interface SafetyAnalysisResult {
  bullying: boolean
  swearing: boolean
  unsafe: boolean
  explanation: string
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with cookies for auth
    const supabase = await createServerClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a parent
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'parent') {
      return NextResponse.json({ error: 'Forbidden - Parent access only' }, { status: 403 })
    }

    const body: AnalysisRequest = await request.json()
    const { messageIds } = body

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'Invalid message IDs' }, { status: 400 })
    }

    // Check which messages already have analysis
    const { data: existingAnalyses } = await supabase
      .from('message_safety_analysis')
      .select('*')
      .in('message_id', messageIds)

    const analyzedMessageIds = new Set(existingAnalyses?.map(a => a.message_id) || [])
    const messageIdsToAnalyze = messageIds.filter(id => !analyzedMessageIds.has(id))

    // Fetch messages that need analysis
    const newAnalyses = []
    if (messageIdsToAnalyze.length > 0) {
      const { data: messages } = await supabase
        .from('messages')
        .select('id, content, sender_id, receiver_id')
        .in('id', messageIdsToAnalyze)

      if (messages && messages.length > 0) {
        // Verify parent has access to these messages (security check)
        const { data: children } = await supabase
          .from('profiles')
          .select('id')
          .eq('parent_id', user.id)

        const childrenIds = new Set(children?.map(c => c.id) || [])
        
        // Filter messages to only those involving the parent's children
        const authorizedMessages = messages.filter(msg => 
          childrenIds.has(msg.sender_id) || childrenIds.has(msg.receiver_id)
        )

        // Use admin client for inserting analysis (bypasses RLS)
        const supabaseAdmin = createAdminClient()

        // Analyze each message with OpenAI
        for (const message of authorizedMessages) {
          try {
            const analysis = await analyzeMessageWithOpenAI(message.content)
            
            const { data: insertedAnalysis, error: insertError } = await supabaseAdmin
              .from('message_safety_analysis')
              .insert({
                message_id: message.id,
                is_safe: !analysis.bullying && !analysis.swearing && !analysis.unsafe,
                concerns: [
                  ...(analysis.bullying ? ['bullying'] : []),
                  ...(analysis.swearing ? ['swearing'] : []),
                  ...(analysis.unsafe ? ['unsafe'] : []),
                ],
                analysis_details: analysis,
              })
              .select()
              .single()

            if (!insertError && insertedAnalysis) {
              newAnalyses.push(insertedAnalysis)
            } else if (insertError) {
              console.error(`Error inserting analysis for message ${message.id}:`, insertError)
            }
          } catch (error) {
            console.error(`Error analyzing message ${message.id}:`, error)
            // Continue with other messages even if one fails
          }
        }
      }
    }

    // Combine existing and new analyses
    const allAnalyses = [
      ...(existingAnalyses || []),
      ...newAnalyses,
    ]

    return NextResponse.json({
      success: true,
      analyses: allAnalyses,
      newAnalysesCount: newAnalyses.length,
    })
  } catch (error) {
    console.error('Error in analyze-messages API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function analyzeMessageWithOpenAI(content: string): Promise<SafetyAnalysisResult> {
  const openai = getOpenAIClient()
  
  const systemPrompt = `You are a content safety analyzer for a children's messaging app. 
Analyze the following message for safety concerns. You must check for:

1. BULLYING: Any form of harassment, intimidation, threats, mean comments, or hurtful behavior
2. SWEARING: Profanity, curse words, or inappropriate language
3. UNSAFE: Content that is not PG-rated, including sexual content, violence, drug references, or anything inappropriate for children

Respond ONLY with a JSON object in this exact format:
{
  "bullying": true/false,
  "swearing": true/false,
  "unsafe": true/false,
  "explanation": "Brief explanation of any concerns found"
}

Be strict but fair. Context matters - friendly banter between friends is different from actual bullying.`

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this message: "${content}"` },
    ],
    temperature: 0.3, // Lower temperature for more consistent analysis
    max_tokens: 200,
  })

  const responseText = response.choices[0]?.message?.content || '{}'
  
  try {
    const analysis = JSON.parse(responseText)
    return {
      bullying: analysis.bullying || false,
      swearing: analysis.swearing || false,
      unsafe: analysis.unsafe || false,
      explanation: analysis.explanation || 'No concerns detected',
    }
  } catch (error) {
    console.error('Error parsing OpenAI response:', responseText)
    // Default to safe if parsing fails
    return {
      bullying: false,
      swearing: false,
      unsafe: false,
      explanation: 'Analysis parsing error',
    }
  }
}

