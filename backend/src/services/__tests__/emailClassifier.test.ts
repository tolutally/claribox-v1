/**
 * Tests for Email Classification Core Logic
 */

import { 
  applyRules, 
  classifyWithLLM,
  ClassifyEmailRequest
} from '../emailClassifier';

// Mock fetch for Node.js environment
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Email Classification Core Logic', () => {

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up environment
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('Rule-Based Classification', () => {
    const baseRequest: ClassifyEmailRequest = {
      subject: 'Test Subject',
      snippet: 'Test content',
      from: 'sender@example.com',
      to: ['user@example.com'],
      cc: [],
      labels: [],
      isNewsletter: false,
      userEmail: 'user@example.com',
      userWasLastSender: false,
      daysSinceLastMessage: 0,
      threadLength: 1
    };

    it('should classify newsletters as NOISE', () => {
      const result = applyRules({
        ...baseRequest,
        isNewsletter: true
      });

      expect(result.category).toBe('NOISE');
      expect(result.skipLLM).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should classify promotional emails as NOISE', () => {
      const result = applyRules({
        ...baseRequest,
        labels: ['CATEGORY_PROMOTIONS']
      });

      expect(result.category).toBe('NOISE');
      expect(result.skipLLM).toBe(true);
    });

    it('should classify automated emails as NOISE', () => {
      const result = applyRules({
        ...baseRequest,
        from: 'noreply@example.com'
      });

      expect(result.category).toBe('NOISE');
      expect(result.skipLLM).toBe(true);
    });

    it('should classify follow-ups correctly', () => {
      const result = applyRules({
        ...baseRequest,
        userWasLastSender: true,
        daysSinceLastMessage: 3
      });

      expect(result.category).toBe('FOLLOW_UP');
      expect(result.skipLLM).toBe(false); // Should confirm with LLM
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should classify CC-only emails as FYI', () => {
      const result = applyRules({
        ...baseRequest,
        to: ['other@example.com'],
        cc: ['user@example.com'],
        subject: 'Regular update'
      });

      expect(result.category).toBe('FYI');
      expect(result.skipLLM).toBe(false);
    });

    it('should detect urgent emails as IMPORTANT', () => {
      const result = applyRules({
        ...baseRequest,
        subject: 'URGENT: Action Required'
      });

      expect(result.category).toBe('IMPORTANT');
      expect(result.skipLLM).toBe(false);
    });

    it('should require LLM for ambiguous cases', () => {
      const result = applyRules(baseRequest);

      expect(result.category).toBeNull();
      expect(result.skipLLM).toBe(false);
      expect(result.confidence).toBe(0.0);
    });
  });

  describe('LLM Integration', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.LLM_API_KEY;

      const request: ClassifyEmailRequest = {
        subject: 'Test',
        snippet: 'Test',
        from: 'test@example.com',
        to: ['user@example.com'],
        cc: [],
        labels: [],
        isNewsletter: false,
        userEmail: 'user@example.com',
        userWasLastSender: false,
        daysSinceLastMessage: 0,
        threadLength: 1
      };

      await expect(classifyWithLLM(request)).rejects.toThrow('LLM_API_KEY');
    });

    it('should handle successful LLM response', async () => {
      const mockResponse = {
        category: 'IMPORTANT',
        importanceScore: 0.8,
        requiresReply: true,
        waitingForReply: false,
        hasDeadline: true,
        deadlineISO: '2025-11-27T10:00:00Z',
        summary: 'Meeting request for tomorrow',
        reason: 'Contains meeting request with specific time'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify(mockResponse)
            }
          }]
        })
      } as Response);

      const request: ClassifyEmailRequest = {
        subject: 'Meeting Tomorrow',
        snippet: 'Can we meet tomorrow at 10 AM?',
        from: 'colleague@example.com',
        to: ['user@example.com'],
        cc: [],
        labels: [],
        isNewsletter: false,
        userEmail: 'user@example.com',
        userWasLastSender: false,
        daysSinceLastMessage: 0,
        threadLength: 1
      };

      const result = await classifyWithLLM(request);

      expect(result.category).toBe('IMPORTANT');
      expect(result.importanceScore).toBe(0.8);
      expect(result.hasDeadline).toBe(true);
      expect(result.summary).toBe('Meeting request for tomorrow');
    });

    it('should handle LLM API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      } as Response);

      const request: ClassifyEmailRequest = {
        subject: 'Test',
        snippet: 'Test',
        from: 'test@example.com',
        to: ['user@example.com'],
        cc: [],
        labels: [],
        isNewsletter: false,
        userEmail: 'user@example.com',
        userWasLastSender: false,
        daysSinceLastMessage: 0,
        threadLength: 1
      };

      const result = await classifyWithLLM(request);

      // Should return fallback classification
      expect(result.category).toBe('FYI');
      expect(result.reason).toContain('LLM classification failed');
    });

    it('should validate LLM response structure', async () => {
      // Mock invalid LLM response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({ invalid: 'response' })
            }
          }]
        })
      } as Response);

      const request: ClassifyEmailRequest = {
        subject: 'Test',
        snippet: 'Test',
        from: 'test@example.com',
        to: ['user@example.com'],
        cc: [],
        labels: [],
        isNewsletter: false,
        userEmail: 'user@example.com',
        userWasLastSender: false,
        daysSinceLastMessage: 0,
        threadLength: 1
      };

      const result = await classifyWithLLM(request);

      // Should fallback when LLM response is invalid
      expect(result.category).toBe('FYI');
      expect(result.reason).toContain('LLM classification failed');
    });

    it('should handle network timeouts', async () => {
      // Mock network timeout
      mockFetch.mockRejectedValueOnce(new Error('fetch timeout'));

      const request: ClassifyEmailRequest = {
        subject: 'Test',
        snippet: 'Test',
        from: 'test@example.com',
        to: ['user@example.com'],
        cc: [],
        labels: [],
        isNewsletter: false,
        userEmail: 'user@example.com',
        userWasLastSender: false,
        daysSinceLastMessage: 0,
        threadLength: 1
      };

      const result = await classifyWithLLM(request);

      expect(result.category).toBe('FYI');
      expect(result.reason).toContain('fetch timeout');
    });
  });

  describe('Edge Cases', () => {
    const baseRequest: ClassifyEmailRequest = {
      subject: 'Test Subject',
      snippet: 'Test content',
      from: 'sender@example.com',
      to: ['user@example.com'],
      cc: [],
      labels: [],
      isNewsletter: false,
      userEmail: 'user@example.com',
      userWasLastSender: false,
      daysSinceLastMessage: 0,
      threadLength: 1
    };

    it('should handle empty subject lines', () => {
      const result = applyRules({
        ...baseRequest,
        subject: ''
      });

      // Should not crash and should fall back to LLM
      expect(result.skipLLM).toBe(false);
    });

    it('should handle multiple conflicting signals', () => {
      const result = applyRules({
        ...baseRequest,
        subject: 'URGENT Newsletter Update',
        isNewsletter: true,
        labels: ['CATEGORY_PROMOTIONS']
      });

      // Newsletter signal should take precedence
      expect(result.category).toBe('NOISE');
      expect(result.skipLLM).toBe(true);
    });

    it('should handle very long threads', () => {
      const result = applyRules({
        ...baseRequest,
        threadLength: 50,
        userWasLastSender: true,
        daysSinceLastMessage: 1
      });

      // Should still detect follow-up pattern
      expect(result.category).toBe('FOLLOW_UP');
    });
  });
});