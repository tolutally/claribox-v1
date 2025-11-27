import { z } from 'zod';

// User types
export const UserSchema = z.object({
  id: z.string(),
  googleUserId: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
  updatedAt: z.string(),
  onboardedAt: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

// Google Account Connection types
export const GoogleAccountConnectionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  provider: z.literal('google'),
  accessToken: z.string(),
  refreshToken: z.string(),
  scope: z.string(),
  tokenType: z.string(),
  expiryDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GoogleAccountConnection = z.infer<typeof GoogleAccountConnectionSchema>;

// Email Thread types  
export const EmailThreadSchema = z.object({
  id: z.string(),
  userId: z.string(),
  gmailThreadId: z.string(),
  lastMessageId: z.string(),
  subject: z.string(),
  participants: z.array(z.string()),
  lastTimestamp: z.string(),
  lastSnippet: z.string(),
  lastFrom: z.string(),
  lastTo: z.array(z.string()),
  lastCc: z.array(z.string()),
  lastLabels: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EmailThread = z.infer<typeof EmailThreadSchema>;

// Email Classification types
export const EmailCategorySchema = z.enum(['IMPORTANT', 'FOLLOW_UP', 'NOISE', 'FYI']);
export type EmailCategory = z.infer<typeof EmailCategorySchema>;

export const EmailInsightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  threadId: z.string(),
  gmailThreadId: z.string(),
  category: EmailCategorySchema,
  importanceScore: z.number().min(0).max(1),
  requiresReply: z.boolean(),
  waitingForReply: z.boolean(),
  hasDeadline: z.boolean(),
  deadlineAt: z.string().optional(),
  lastEvaluatedAt: z.string(),
});

export type EmailInsight = z.infer<typeof EmailInsightSchema>;

// Daily Digest types
export const DailyDigestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  generatedAt: z.string(),
  importantThreadIds: z.array(z.string()),
  followUpThreadIds: z.array(z.string()),
  missedImportantThreadIds: z.array(z.string()),
  noiseCount: z.number(),
  emailSent: z.boolean(),
  emailSentAt: z.string().optional(),
});

export type DailyDigest = z.infer<typeof DailyDigestSchema>;

// User Preferences types
export const UserPreferencesSchema = z.object({
  id: z.string(),
  userId: z.string(),
  timezone: z.string(),
  digestTimeLocal: z.string(),
  followUpThresholdDays: z.number(),
  noiseLabels: z.array(z.string()),
  autoCollapseSidebar: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;