import { z } from 'zod';
import { EmailCategorySchema } from './models';

// Authentication API types
export const AuthCallbackRequestSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

export const AuthCallbackResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
  }),
});

export type AuthCallbackRequest = z.infer<typeof AuthCallbackRequestSchema>;
export type AuthCallbackResponse = z.infer<typeof AuthCallbackResponseSchema>;

// Summary API types
export const SummaryResponseSchema = z.object({
  date: z.string(),
  importantCount: z.number(),
  followUpCount: z.number(),
  noiseCount: z.number(),
  missedImportantCount: z.number(),
});

export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;

// Email Lists API types
export const EmailItemSchema = z.object({
  threadId: z.string(),
  gmailThreadId: z.string(),
  subject: z.string(),
  from: z.string(),
  snippet: z.string(),
  lastTimestamp: z.string(),
  importanceScore: z.number().optional(),
  hasDeadline: z.boolean().optional(),
  deadlineAt: z.string().optional(),
  waitingForReply: z.boolean().optional(),
  daysSinceLastMessage: z.number().optional(),
});

export type EmailItem = z.infer<typeof EmailItemSchema>;

export const EmailListResponseSchema = z.object({
  items: z.array(EmailItemSchema),
  nextOffset: z.number().optional(),
});

export type EmailListResponse = z.infer<typeof EmailListResponseSchema>;

// Noise Summary API types
export const NoiseSourceSchema = z.object({
  sender: z.string(),
  count: z.number(),
});

export const NoiseSummaryResponseSchema = z.object({
  count: z.number(),
  topSources: z.array(NoiseSourceSchema),
});

export type NoiseSource = z.infer<typeof NoiseSourceSchema>;
export type NoiseSummaryResponse = z.infer<typeof NoiseSummaryResponseSchema>;

// Digest API types
export const DigestResponseSchema = z.object({
  date: z.string(),
  generatedAt: z.string(),
  importantThreads: z.array(EmailItemSchema),
  followUpThreads: z.array(EmailItemSchema),
  missedImportantThreads: z.array(EmailItemSchema),
  noiseCount: z.number(),
});

export type DigestResponse = z.infer<typeof DigestResponseSchema>;

// User Preferences API types
export const UpdatePreferencesRequestSchema = z.object({
  timezone: z.string().optional(),
  digestTimeLocal: z.string().optional(),
  followUpThresholdDays: z.number().optional(),
  noiseLabels: z.array(z.string()).optional(),
  autoCollapseSidebar: z.boolean().optional(),
});

export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesRequestSchema>;

// Common query parameters
export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const DateQuerySchema = z.object({
  date: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type DateQuery = z.infer<typeof DateQuerySchema>;

// Error responses
export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;