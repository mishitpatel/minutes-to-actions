import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { env } from '../config/env.js';
import { ExtractionError, RateLimitError } from '../utils/errors.js';

// Schema for a single extracted action item
export const extractedActionItemSchema = z.object({
  title: z.string().min(1),
  priority: z.enum(['high', 'medium', 'low']),
  due_date: z.string().nullable(),
  description: z.string().nullable(),
});

// Schema for the full extraction response
export const extractionResponseSchema = z.object({
  action_items: z.array(extractedActionItemSchema),
  confidence: z.enum(['high', 'medium', 'low']),
});

export type ExtractedActionItem = z.infer<typeof extractedActionItemSchema>;
export type ExtractionResponse = z.infer<typeof extractionResponseSchema>;

// Singleton client instance
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }
  return client;
}

const SYSTEM_PROMPT = `You are an expert at extracting action items from meeting notes. Your task is to identify all actionable tasks mentioned in the text.

For each action item, extract:
1. title: A clear, actionable task description (imperative form, e.g., "Review the proposal", "Schedule follow-up meeting")
2. priority: Assess based on urgency words, deadlines, or importance indicators
   - high: urgent, ASAP, critical, blocking, today, tomorrow
   - medium: this week, soon, important but not urgent
   - low: nice to have, when possible, backlog items
3. due_date: Extract any mentioned dates and convert to ISO format (YYYY-MM-DD). Handle relative dates based on the current date provided. Return null if no date mentioned.
4. description: Additional context if available (assignee mentions, dependencies, notes). Return null if none.

Rules:
- Only extract genuine action items (tasks someone needs to do)
- Skip discussion points, decisions made, or FYI items unless they imply an action
- If no action items found, return an empty array
- Be conservative - only extract clear action items

Respond ONLY with valid JSON matching this exact structure:
{
  "action_items": [
    {
      "title": "string",
      "priority": "high" | "medium" | "low",
      "due_date": "YYYY-MM-DD" | null,
      "description": "string" | null
    }
  ],
  "confidence": "high" | "medium" | "low"
}

Set confidence to:
- high: Clear, well-structured notes with obvious action items
- medium: Some ambiguity but reasonable extraction
- low: Unstructured text, many assumptions made`;

export async function extractActionItems(
  meetingNotesContent: string
): Promise<ExtractionResponse> {
  const anthropic = getClient();
  const currentDate = new Date().toISOString().split('T')[0];

  const userPrompt = `Current date: ${currentDate}

Meeting Notes:
${meetingNotesContent}

Extract all action items from these meeting notes.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.1,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract text content from response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new ExtractionError('No text content in response');
    }

    const responseText = textContent.text;

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonString = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch?.[1]) {
      jsonString = jsonMatch[1].trim();
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new ExtractionError('Invalid JSON in response');
    }

    // Validate against schema
    const result = extractionResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new ExtractionError(
        `Invalid response structure: ${result.error.message}`
      );
    }

    return result.data;
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof ExtractionError || error instanceof RateLimitError) {
      throw error;
    }

    // Handle Anthropic API errors (use duck typing for better testability)
    if (isAPIError(error)) {
      if (error.status === 429) {
        throw new RateLimitError('AI service temporarily unavailable');
      }
      if (error.status === 401) {
        throw new ExtractionError('AI service configuration error');
      }
      if (error.status === 408 || error.message.includes('timeout')) {
        throw new ExtractionError('Request timed out');
      }
      throw new ExtractionError(`API error: ${error.message}`);
    }

    // Unknown errors
    throw new ExtractionError('Failed to extract action items');
  }
}

// Type guard for API errors (duck typing for better testability)
interface APIErrorLike {
  status: number;
  message: string;
  name: string;
}

function isAPIError(error: unknown): error is APIErrorLike {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as APIErrorLike).status === 'number' &&
    'message' in error &&
    typeof (error as APIErrorLike).message === 'string' &&
    'name' in error &&
    (error as APIErrorLike).name === 'APIError'
  );
}

// For testing - allows resetting the client
export function resetClient(): void {
  client = null;
}
