import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractActionItems,
  generateSampleMeetingNotes,
  resetClient,
  type ExtractionResponse,
  type SampleMeetingNote,
} from './claude.js';
import { ExtractionError, RateLimitError } from '../utils/errors.js';

// Mock create function - needs to be defined before vi.mock
const mockCreate = vi.fn();

// Store the MockAPIError class for use in tests
let MockAPIError: new (status: number, message: string) => Error & { status: number };

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  // Define MockAPIError inside the factory since vi.mock is hoisted
  class APIError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'APIError';
    }
  }

  const MockAnthropic = vi.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  }));

  return {
    default: MockAnthropic,
    APIError,
  };
});

// Mock environment
vi.mock('../config/env.js', () => ({
  env: {
    ANTHROPIC_API_KEY: 'test-api-key',
  },
}));

// Import the mocked APIError after mock setup
beforeEach(async () => {
  const sdk = await import('@anthropic-ai/sdk');
  MockAPIError = sdk.APIError as unknown as new (status: number, message: string) => Error & { status: number };
});

describe('claude service', () => {
  beforeEach(() => {
    resetClient();
    mockCreate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('extractActionItems', () => {
    it('should extract action items from meeting notes', async () => {
      const expectedResponse: ExtractionResponse = {
        action_items: [
          {
            title: 'Review the Q4 budget proposal',
            priority: 'high',
            due_date: '2024-12-15',
            description: 'Assigned to John',
          },
          {
            title: 'Schedule follow-up meeting with design team',
            priority: 'medium',
            due_date: null,
            description: null,
          },
        ],
        confidence: 'high',
      };

      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify(expectedResponse),
          },
        ],
      });

      const result = await extractActionItems(
        'Meeting notes: John needs to review the Q4 budget proposal by Dec 15. We should also schedule a follow-up with design.'
      );

      expect(result).toEqual(expectedResponse);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          temperature: 0.1,
        })
      );
    });

    it('should handle empty action items (valid outcome)', async () => {
      const expectedResponse: ExtractionResponse = {
        action_items: [],
        confidence: 'high',
      };

      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify(expectedResponse),
          },
        ],
      });

      const result = await extractActionItems(
        'This was just a general discussion about the weather.'
      );

      expect(result.action_items).toHaveLength(0);
      expect(result.confidence).toBe('high');
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      const expectedResponse: ExtractionResponse = {
        action_items: [
          {
            title: 'Send report',
            priority: 'medium',
            due_date: null,
            description: null,
          },
        ],
        confidence: 'medium',
      };

      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: '```json\n' + JSON.stringify(expectedResponse) + '\n```',
          },
        ],
      });

      const result = await extractActionItems('Send the report when ready.');

      expect(result).toEqual(expectedResponse);
    });

    it('should throw RateLimitError on 429 status', async () => {
      mockCreate.mockRejectedValueOnce(new MockAPIError(429, 'Rate limited'));

      await expect(
        extractActionItems('Some meeting notes')
      ).rejects.toThrow(RateLimitError);
    });

    it('should throw ExtractionError on 401 status (invalid API key)', async () => {
      mockCreate.mockRejectedValueOnce(new MockAPIError(401, 'Invalid API key'));

      await expect(
        extractActionItems('Some meeting notes')
      ).rejects.toThrow(ExtractionError);
    });

    it('should throw ExtractionError on timeout', async () => {
      mockCreate.mockRejectedValueOnce(new MockAPIError(408, 'Request timeout'));

      await expect(
        extractActionItems('Some meeting notes')
      ).rejects.toThrow(ExtractionError);
    });

    it('should throw ExtractionError on invalid JSON response', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON',
          },
        ],
      });

      await expect(
        extractActionItems('Some meeting notes')
      ).rejects.toThrow(ExtractionError);
    });

    it('should throw ExtractionError on invalid response structure', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              items: [], // Wrong field name
              confidence: 'high',
            }),
          },
        ],
      });

      await expect(
        extractActionItems('Some meeting notes')
      ).rejects.toThrow(ExtractionError);
    });

    it('should throw ExtractionError when no text content in response', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [],
      });

      await expect(
        extractActionItems('Some meeting notes')
      ).rejects.toThrow(ExtractionError);
    });
  });

  describe('generateSampleMeetingNotes', () => {
    it('should generate sample meeting notes with title and body', async () => {
      const expectedResponse: SampleMeetingNote = {
        title: 'Weekly Team Standup - Feb 7',
        body: 'Team discussed current progress on the Q1 roadmap...',
      };

      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify(expectedResponse),
          },
        ],
      });

      const result = await generateSampleMeetingNotes('weekly-standup');

      expect(result).toEqual(expectedResponse);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          temperature: 0.7,
        })
      );
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      const expectedResponse: SampleMeetingNote = {
        title: '1:1 Meeting Notes',
        body: 'Discussed career growth and current project status...',
      };

      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: '```json\n' + JSON.stringify(expectedResponse) + '\n```',
          },
        ],
      });

      const result = await generateSampleMeetingNotes('one-on-one');

      expect(result).toEqual(expectedResponse);
    });

    it('should throw RateLimitError on 429 status', async () => {
      mockCreate.mockRejectedValueOnce(new MockAPIError(429, 'Rate limited'));

      await expect(
        generateSampleMeetingNotes('weekly-standup')
      ).rejects.toThrow(RateLimitError);
    });

    it('should throw ExtractionError on invalid JSON response', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON',
          },
        ],
      });

      await expect(
        generateSampleMeetingNotes('sprint-retro')
      ).rejects.toThrow(ExtractionError);
    });

    it('should throw ExtractionError on invalid response structure', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              heading: 'Wrong field',
              content: 'Wrong field',
            }),
          },
        ],
      });

      await expect(
        generateSampleMeetingNotes('weekly-standup')
      ).rejects.toThrow(ExtractionError);
    });
  });
});
