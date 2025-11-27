/**
 * Email Classification Microservice for Claribox
 * 
 * Provides intelligent email categorization using rule-based pre-filtering
 * and LLM fallback for complex cases. Optimized for busy professionals.
 */

import { z } from 'zod';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// ===== TYPE DEFINITIONS =====

/**
 * Email classification categories
 */
export type EmailCategory = "IMPORTANT" | "FOLLOW_UP" | "NOISE" | "FYI";

/**
 * Request payload schema for email classification
 */
export const ClassifyEmailRequestSchema = z.object({
  subject: z.string().min(1),
  snippet: z.string().min(1),
  fullBody: z.string().optional(),
  from: z.string().email(),
  to: z.array(z.string().email()),
  cc: z.array(z.string().email()).default([]),
  labels: z.array(z.string()).default([]),
  isNewsletter: z.boolean().default(false),
  userEmail: z.string().email(),
  userWasLastSender: z.boolean().default(false),
  daysSinceLastMessage: z.number().min(0),
  threadLength: z.number().min(1)
});

export type ClassifyEmailRequest = z.infer<typeof ClassifyEmailRequestSchema>;

/**
 * Complete classification response
 */
export interface ClassifyEmailResponse {
  category: EmailCategory;
  importanceScore: number; // 0-1 scale
  requiresReply: boolean;
  waitingForReply: boolean;
  hasDeadline: boolean;
  deadlineISO: string | null;
  summary: string;
  reason: string;
  modelUsed: string;
}

/**
 * LLM response part (without modelUsed field)
 */
export type ClassifyEmailResponsePart = Omit<ClassifyEmailResponse, "modelUsed">;

/**
 * Rule-based classification result
 */
interface RuleResult {
  category: EmailCategory | null;
  confidence: number; // 0-1, how confident we are in this classification
  reason: string;
  skipLLM: boolean; // if true, don't call LLM
}

// ===== RULE-BASED CLASSIFICATION ENGINE =====

/**
 * Apply rule-based pre-classification to avoid unnecessary LLM calls
 */
function applyRules(input: ClassifyEmailRequest): RuleResult {
  const { 
    labels, 
    isNewsletter, 
    userEmail, 
    to, 
    cc, 
    userWasLastSender, 
    daysSinceLastMessage,
    from,
    subject
  } = input;

  // Rule 1: Clear noise signals
  if (isNewsletter || 
      labels.includes('CATEGORY_PROMOTIONS') || 
      labels.includes('CATEGORY_SOCIAL') ||
      labels.includes('CATEGORY_UPDATES') ||
      labels.includes('SPAM')) {
    return {
      category: 'NOISE',
      confidence: 0.95,
      reason: 'Newsletter, promotion, or social notification detected',
      skipLLM: true
    };
  }

  // Rule 2: Automated/system emails (common patterns)
  const automaticSenders = [
    'noreply',
    'no-reply', 
    'donotreply',
    'automated',
    'notification',
    'support@',
    'help@',
    'system@'
  ];
  
  const isAutomated = automaticSenders.some(pattern => 
    from.toLowerCase().includes(pattern)
  );
  
  if (isAutomated && !subject.toLowerCase().includes('urgent')) {
    return {
      category: 'NOISE',
      confidence: 0.8,
      reason: 'Automated system email detected',
      skipLLM: true
    };
  }

  // Rule 3: Follow-up detection
  if (userWasLastSender && daysSinceLastMessage >= 2) {
    return {
      category: 'FOLLOW_UP',
      confidence: 0.85,
      reason: `User sent last message ${daysSinceLastMessage} days ago, likely waiting for response`,
      skipLLM: false // Send to LLM for confirmation and detail extraction
    };
  }

  // Rule 4: FYI classification (CC-only, not urgent)
  const userInTo = to.includes(userEmail);
  const userInCc = cc.includes(userEmail);
  const urgentKeywords = ['urgent', 'asap', 'immediate', 'deadline', 'action required'];
  const hasUrgentSignal = urgentKeywords.some(keyword => 
    subject.toLowerCase().includes(keyword)
  );

  if (!userInTo && userInCc && !hasUrgentSignal) {
    return {
      category: 'FYI',
      confidence: 0.75,
      reason: 'User only in CC without urgent signals',
      skipLLM: false // Let LLM refine this classification
    };
  }

  // Rule 5: Direct important signals
  if (hasUrgentSignal || subject.toLowerCase().includes('meeting') && daysSinceLastMessage <= 1) {
    return {
      category: 'IMPORTANT',
      confidence: 0.8,
      reason: 'Urgent keywords or recent meeting-related email detected',
      skipLLM: false // Get LLM to extract deadlines and refine
    };
  }

  // No clear rule match - needs LLM analysis
  return {
    category: null,
    confidence: 0.0,
    reason: 'No clear rule match, requires LLM analysis',
    skipLLM: false
  };
}

// ===== LLM CLIENT HELPER =====

/**
 * Call external LLM for email classification when rules are insufficient
 */
async function classifyWithLLM(input: ClassifyEmailRequest): Promise<ClassifyEmailResponsePart> {
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('LLM_API_KEY or OPENAI_API_KEY environment variable is required');
  }

  // Build compact but informative prompt
  const systemPrompt = `You are the Claribox inbox clarity engine. You classify emails for a busy professional.

Categories:
- IMPORTANT: directly impacts user's work, deadlines, decisions, or key relationships
- FOLLOW_UP: user previously responded/committed, waiting for reply, or needs to ping again  
- NOISE: newsletters, promotions, bulk mail, automated notifications that don't need action
- FYI: information-only emails that may be useful but don't require reply

Return valid JSON only with these exact fields:
{
  "category": "IMPORTANT|FOLLOW_UP|NOISE|FYI",
  "importanceScore": 0.0-1.0,
  "requiresReply": boolean,
  "waitingForReply": boolean, 
  "hasDeadline": boolean,
  "deadlineISO": "ISO date or null",
  "summary": "1-2 line plain English summary",
  "reason": "why you chose this category"
}`;

  const userPrompt = `Classify this email:

Subject: ${input.subject}
From: ${input.from}
Snippet: ${input.snippet}
Labels: ${input.labels.join(', ') || 'none'}
User was last sender: ${input.userWasLastSender}
Days since last message: ${input.daysSinceLastMessage}
Thread length: ${input.threadLength}
User in TO: ${input.to.includes(input.userEmail)}
User in CC: ${input.cc.includes(input.userEmail)}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-1106-preview', // Use gpt-4-turbo for better JSON mode
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 500,
        timeout: 10000 // 10 second timeout
      }),
      signal: AbortSignal.timeout(15000) // 15 second total timeout
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from OpenAI API');
    }

    // Parse and validate LLM response
    const parsed = JSON.parse(content);
    
    // Basic validation of required fields
    if (!parsed.category || !parsed.summary || !parsed.reason) {
      throw new Error('LLM response missing required fields');
    }

    // Ensure proper types
    return {
      category: parsed.category as EmailCategory,
      importanceScore: Math.max(0, Math.min(1, parsed.importanceScore || 0.5)),
      requiresReply: Boolean(parsed.requiresReply),
      waitingForReply: Boolean(parsed.waitingForReply),
      hasDeadline: Boolean(parsed.hasDeadline),
      deadlineISO: parsed.deadlineISO || null,
      summary: String(parsed.summary).slice(0, 200), // Limit summary length
      reason: String(parsed.reason).slice(0, 200)
    };

  } catch (error: any) {
    console.error('[EmailClassifier] LLM call failed:', error);
    
    // Fallback classification when LLM fails
    return {
      category: 'FYI',
      importanceScore: 0.5,
      requiresReply: false,
      waitingForReply: false,
      hasDeadline: false,
      deadlineISO: null,
      summary: `Email from ${input.from}: ${input.subject}`,
      reason: `LLM classification failed: ${error.message || 'Unknown error'}`
    };
  }
}

// ===== EXPRESS ROUTE HANDLER =====

/**
 * Main classification endpoint handler
 */
async function classifyEmailHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    // Validate input
    const validationResult = ClassifyEmailRequestSchema.safeParse(request.body);
    
    if (!validationResult.success) {
      return reply.status(400).send({
        error: 'Invalid request format',
        details: validationResult.error.errors
      });
    }

    const input = validationResult.data;
    
    console.log(`[EmailClassifier] Processing email: "${input.subject}" from ${input.from}`);

    // Step 1: Apply rule-based classification
    const ruleResult = applyRules(input);
    console.log(`[EmailClassifier] Rule result: ${ruleResult.category} (confidence: ${ruleResult.confidence})`);

    let finalResult: ClassifyEmailResponse;

    // Step 2: Determine if LLM call is needed
    if (ruleResult.skipLLM && ruleResult.category) {
      // High-confidence rule classification - no LLM needed
      finalResult = {
        category: ruleResult.category,
        importanceScore: ruleResult.category === 'IMPORTANT' ? 0.9 : 
                        ruleResult.category === 'FOLLOW_UP' ? 0.7 :
                        ruleResult.category === 'FYI' ? 0.4 : 0.1,
        requiresReply: ruleResult.category === 'IMPORTANT' || ruleResult.category === 'FOLLOW_UP',
        waitingForReply: ruleResult.category === 'FOLLOW_UP',
        hasDeadline: false,
        deadlineISO: null,
        summary: `${ruleResult.category.toLowerCase()} email from ${input.from}`,
        reason: ruleResult.reason,
        modelUsed: 'rules-only'
      };
    } else {
      // Need LLM analysis
      console.log('[EmailClassifier] Calling LLM for classification');
      const llmResult = await classifyWithLLM(input);
      
      // Merge rule hints with LLM result if we had a rule suggestion
      finalResult = {
        ...llmResult,
        // Override category if rule had high confidence
        category: (ruleResult.confidence > 0.8 && ruleResult.category) ? 
                 ruleResult.category : llmResult.category,
        modelUsed: 'gpt-4-1106-preview'
      };
    }

    console.log(`[EmailClassifier] Final classification: ${finalResult.category} (${finalResult.modelUsed})`);
    
    return reply.status(200).send(finalResult);

  } catch (error: any) {
    console.error('[EmailClassifier] Classification error:', error);
    
    return reply.status(500).send({
      error: 'Internal classification error',
      message: error.message || 'Unknown error occurred'
    });
  }
}

// ===== FASTIFY PLUGIN =====

/**
 * Fastify plugin for email classification routes
 */
export async function emailClassifierPlugin(fastify: FastifyInstance) {
  // Main classification endpoint
  fastify.post('/internal/ai/classify-email', classifyEmailHandler);
  
  // Health check endpoint
  fastify.get('/internal/ai/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ 
      status: 'healthy', 
      service: 'email-classifier',
      timestamp: new Date().toISOString(),
      llmConfigured: !!(process.env.LLM_API_KEY || process.env.OPENAI_API_KEY)
    });
  });
}

/**
 * Classify a single email using the core logic (for direct usage)
 */
export async function classifyEmail(input: ClassifyEmailRequest): Promise<ClassifyEmailResponse> {
  // Apply rule-based classification
  const ruleResult = applyRules(input);
  
  let finalResult: ClassifyEmailResponse;

  if (ruleResult.skipLLM && ruleResult.category) {
    // High-confidence rule classification - no LLM needed
    finalResult = {
      category: ruleResult.category,
      importanceScore: ruleResult.category === 'IMPORTANT' ? 0.9 : 
                      ruleResult.category === 'FOLLOW_UP' ? 0.7 :
                      ruleResult.category === 'FYI' ? 0.4 : 0.1,
      requiresReply: ruleResult.category === 'IMPORTANT' || ruleResult.category === 'FOLLOW_UP',
      waitingForReply: ruleResult.category === 'FOLLOW_UP',
      hasDeadline: false,
      deadlineISO: null,
      summary: `${ruleResult.category.toLowerCase()} email from ${input.from}`,
      reason: ruleResult.reason,
      modelUsed: 'rules-only'
    };
  } else {
    // Need LLM analysis
    const llmResult = await classifyWithLLM(input);
    
    // Merge rule hints with LLM result if we had a rule suggestion
    finalResult = {
      ...llmResult,
      // Override category if rule had high confidence
      category: (ruleResult.confidence > 0.8 && ruleResult.category) ? 
               ruleResult.category : llmResult.category,
      modelUsed: 'gpt-4-1106-preview'
    };
  }

  return finalResult;
}

// Export for testing
export { applyRules, classifyWithLLM };