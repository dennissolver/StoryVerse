import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { 
  getEmpatheticDiscoveryPrompt,
  EMPATHETIC_OPENERS,
  EMPATHETIC_RESPONSES,
  NATURAL_TRANSITIONS,
  getChildRedirect,
} from '@/lib/voice/empathetic-discovery';
import { 
  STATE_PROMPTS, 
  EXTRACTION_PROMPT,
  determineNextState,
  type OnboardingState,
  type OnboardingSession,
  type ExtractedPreferences
} from '@/lib/voice/onboarding-agent';
import { type LanguageCode } from '@/lib/translation';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// POST - Process voice agent conversation turn
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { 
    sessionId, 
    userMessage, 
    language = 'en',
    audioTranscript // If coming from voice, this is the transcribed text
  } = await request.json();

  const messageContent = audioTranscript || userMessage;

  // Get or create onboarding session
  let session: OnboardingSession;
  
  if (sessionId) {
    const { data: existingSession } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    session = existingSession as OnboardingSession;
  } else {
    // Get user's family
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (!profile?.family_id) {
      return NextResponse.json({ error: 'No family found' }, { status: 404 });
    }

    // Create new session
    session = {
      id: crypto.randomUUID(),
      family_id: profile.family_id,
      state: 'greeting',
      language: language as LanguageCode,
      guardian_verified: false,
      children: [],
      discovered_preferences: {},
      conversation_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Add user message to history
  if (messageContent) {
    session.conversation_history.push({
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    });
  }

  // Build conversation context for Claude
  const conversationMessages = session.conversation_history.map(msg => ({
    role: msg.role === 'agent' ? 'assistant' as const : 'user' as const,
    content: msg.content
  }));

  // Get state-specific guidance
  const stateGuidance = STATE_PROMPTS[session.state];
  
  // Get example openers for current state (for Claude's reference)
  const stateKey = session.state.replace('_', '_') as keyof typeof EMPATHETIC_OPENERS;
  const exampleOpeners = EMPATHETIC_OPENERS[stateKey] || [];

  // Build the enhanced empathetic prompt
  const systemPrompt = getEmpatheticDiscoveryPrompt(session.language);
  
  // Build context about what we've learned so far
  const learnedContext = buildLearnedContext(session);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    system: `${systemPrompt}

CURRENT CONVERSATION STATE: ${session.state}
GUIDANCE FOR THIS STATE: ${stateGuidance}

EXAMPLE OPENERS YOU MIGHT USE (adapt naturally, don't read verbatim):
${exampleOpeners.slice(0, 2).map(o => `- "${o}"`).join('\n')}

WHAT WE'VE LEARNED SO FAR:
${learnedContext}

NATURAL TRANSITIONS YOU CAN USE:
${NATURAL_TRANSITIONS.slice(0, 3).join('\n')}

REMEMBER:
- Keep responses warm and conversational (2-4 sentences)
- Ask ONE main question at a time
- Reflect back what they share before moving on
- If they seem like a child, use the child redirect
- Never make them feel judged
- Everything connects back to creating wonderful stories for their children`,
    messages: conversationMessages.length > 0 ? conversationMessages : [
      { role: 'user', content: '[Conversation starting - give your warm greeting]' }
    ]
  });

  const agentMessage = response.content.find(block => block.type === 'text');
  const agentResponse = agentMessage?.type === 'text' ? agentMessage.text : '';

  // Add agent response to history
  session.conversation_history.push({
    role: 'agent',
    content: agentResponse,
    timestamp: new Date().toISOString()
  });

  // Check for child speaker patterns and handle appropriately
  const mightBeChild = await detectChildSpeaker(messageContent, session);
  if (mightBeChild && !session.guardian_verified) {
    // Override response with gentle redirect
    const childRedirect = getChildRedirect(session.language);
    session.conversation_history[session.conversation_history.length - 1].content = childRedirect;
  }

  // Extract preferences from conversation periodically
  if (session.conversation_history.length % 4 === 0 || session.state === 'confirmation') {
    const extractedPrefs = await extractPreferencesFromConversation(session);
    updateSessionWithExtractedPrefs(session, extractedPrefs);
  }

  // Determine if we should advance to next state
  const nextState = determineNextState(session.state, session);
  if (nextState !== session.state && shouldAdvanceState(session)) {
    session.state = nextState;
  }

  session.updated_at = new Date().toISOString();

  // Save session
  await supabase
    .from('onboarding_sessions')
    .upsert(session);

  // If complete, save preferences to family
  if (session.state === 'complete') {
    await savePreferencesToFamily(supabase, session);
  }

  return NextResponse.json({
    sessionId: session.id,
    agentResponse: mightBeChild && !session.guardian_verified 
      ? getChildRedirect(session.language) 
      : agentResponse,
    state: session.state,
    isComplete: session.state === 'complete',
    language: session.language,
    // Include a summary of what's been learned (for UI display)
    progress: {
      guardianVerified: session.guardian_verified,
      childrenCount: session.children.length,
      culturalInfoGathered: !!session.cultural_background?.length,
      valuesGathered: !!session.family_values?.length,
    }
  });
}

// Helper: Build context string of what we've learned
function buildLearnedContext(session: OnboardingSession): string {
  const parts: string[] = [];
  
  if (session.guardian_verified) {
    parts.push(`✓ Speaking with: ${session.guardian_relationship || 'verified guardian'} (${session.guardian_name || 'name unknown'})`);
  } else {
    parts.push('○ Guardian not yet verified');
  }
  
  if (session.family_name) {
    parts.push(`✓ Family name: ${session.family_name}`);
  }
  
  if (session.children.length > 0) {
    const childrenStr = session.children.map(c => 
      `${c.name}${c.age ? ` (${c.age})` : ''}${c.interests?.length ? ` - loves ${c.interests.slice(0,2).join(', ')}` : ''}`
    ).join('; ');
    parts.push(`✓ Children: ${childrenStr}`);
  } else {
    parts.push('○ Children not yet discussed');
  }
  
  if (session.cultural_background?.length) {
    parts.push(`✓ Cultural background: ${session.cultural_background.join(', ')}`);
  }
  
  if (session.religious_tradition) {
    parts.push(`✓ Faith tradition: ${session.religious_tradition} (${session.observance_level || 'level not specified'})`);
  }
  
  if (session.family_values?.length) {
    parts.push(`✓ Values: ${session.family_values.slice(0, 3).join(', ')}`);
  }
  
  if (session.topics_to_avoid?.length) {
    parts.push(`✓ Topics to avoid: ${session.topics_to_avoid.join(', ')}`);
  }

  return parts.length > 0 ? parts.join('\n') : 'Nothing gathered yet - this is the start of the conversation.';
}

// Helper: Detect if speaker might be a child
async function detectChildSpeaker(message: string, session: OnboardingSession): Promise<boolean> {
  if (!message || session.guardian_verified) return false;
  
  // Simple heuristics first
  const childIndicators = [
    /my (mom|dad|mommy|daddy|mama|papa)/i,
    /i('m| am) \d years old/i,
    /can i (play|see|get|have)/i,
    /my teacher/i,
    /at school/i,
    /homework/i,
  ];
  
  for (const pattern of childIndicators) {
    if (pattern.test(message)) {
      return true;
    }
  }
  
  return false;
}

// Helper: Update session with extracted preferences
function updateSessionWithExtractedPrefs(session: OnboardingSession, prefs: ExtractedPreferences) {
  if (prefs.guardian_verified) session.guardian_verified = true;
  if (prefs.guardian_relationship) session.guardian_relationship = prefs.guardian_relationship;
  if (prefs.cultural_background) session.cultural_background = prefs.cultural_background;
  if (prefs.religious_tradition) session.religious_tradition = prefs.religious_tradition;
  if (prefs.observance_level) session.observance_level = prefs.observance_level;
  if (prefs.family_values) session.family_values = prefs.family_values;
  if (prefs.educational_goals) session.educational_goals = prefs.educational_goals;
  if (prefs.children) {
    session.children = prefs.children.map(c => ({
      name: c.name,
      age: c.age,
      interests: c.interests,
      personality: undefined,
      learning_style: undefined
    }));
  }
  if (prefs.excluded_themes) session.topics_to_avoid = prefs.excluded_themes;
  
  session.discovered_preferences = {
    ...session.discovered_preferences,
    allow_magic: prefs.allow_magic_fantasy,
    dietary_considerations: prefs.dietary_preferences,
    modesty_preferences: prefs.modesty_level,
    conflict_comfort: prefs.conflict_level,
  };
}

// Helper: Extract preferences from conversation using Claude
async function extractPreferencesFromConversation(
  session: OnboardingSession
): Promise<ExtractedPreferences> {
  const conversationText = session.conversation_history
    .map(msg => `${msg.role === 'agent' ? 'Jillian' : 'Parent'}: ${msg.content}`)
    .join('\n\n');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}

CONVERSATION SO FAR:
${conversationText}

Extract the preferences as JSON:`
        }
      ]
    });

    const textContent = response.content.find(block => block.type === 'text');
    const text = textContent?.type === 'text' ? textContent.text : '{}';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Failed to extract preferences:', error);
  }

  return { guardian_verified: false };
}

// Helper: Determine if we should advance state
function shouldAdvanceState(session: OnboardingSession): boolean {
  const recentMessages = session.conversation_history.slice(-4);
  return recentMessages.length >= 2;
}

// Helper: Save extracted preferences to family tables
async function savePreferencesToFamily(supabase: any, session: OnboardingSession) {
  const { family_id } = session;

  await supabase
    .from('family_preferences')
    .upsert({
      family_id,
      cultural_background: session.cultural_background,
      religious_tradition: session.religious_tradition,
      religious_observance_level: session.observance_level,
      dietary_preferences: session.discovered_preferences.dietary_considerations,
      allow_magic_fantasy: session.discovered_preferences.allow_magic,
      modesty_level: session.discovered_preferences.modesty_preferences,
      conflict_level: session.discovered_preferences.conflict_comfort,
      excluded_themes: session.topics_to_avoid,
      custom_guidelines: session.cultural_notes,
      updated_at: new Date().toISOString()
    });

  for (const child of session.children) {
    const { data: existingChild } = await supabase
      .from('children')
      .select('id')
      .eq('family_id', family_id)
      .eq('name', child.name)
      .single();

    if (existingChild) {
      await supabase.from('children').update({
        interests: child.interests,
        updated_at: new Date().toISOString()
      }).eq('id', existingChild.id);
    } else {
      const { data: newChild } = await supabase.from('children').insert({
        family_id,
        name: child.name,
        interests: child.interests,
        preferred_language: session.language
      }).select().single();
    }
  }

  if (session.guardian_verified && session.guardian_relationship) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('family_members').upsert({
        family_id,
        user_id: user.id,
        role: 'admin',
        relationship: session.guardian_relationship,
        verified_adult: true,
        verified_at: new Date().toISOString(),
        can_create_books: true,
        can_modify_children: true,
        can_modify_settings: true,
        can_manage_subscription: true,
        can_invite_members: true
      });
    }
  }

  await supabase.from('parental_control_audit').insert({
    family_id,
    user_id: (await supabase.auth.getUser()).data.user?.id,
    action: 'onboarding_completed',
    details: {
      session_id: session.id,
      children_added: session.children.length,
      preferences_set: true
    }
  });
}

// GET - Get session status
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (sessionId) {
    const { data: session } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    return NextResponse.json({ session });
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!profile?.family_id) {
    return NextResponse.json({ error: 'No family found' }, { status: 404 });
  }

  const { data: existingSession } = await supabase
    .from('onboarding_sessions')
    .select('*')
    .eq('family_id', profile.family_id)
    .neq('state', 'complete')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ 
    session: existingSession,
    hasIncompleteSession: !!existingSession
  });
}
