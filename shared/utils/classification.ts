import type { EmailCategory } from '../types/models';

/**
 * Classification utilities for email processing
 */

/**
 * Detects if an email is likely a newsletter based on headers and content
 */
export function isNewsletter(headers: Record<string, string>, from: string): boolean {
  // Check for unsubscribe headers
  if (headers['List-Unsubscribe'] || headers['list-unsubscribe']) {
    return true;
  }

  // Check sender patterns
  const newsletterPatterns = [
    /no-?reply/i,
    /newsletter/i,
    /mailer/i,
    /notifications?/i,
    /updates?/i,
  ];

  return newsletterPatterns.some(pattern => pattern.test(from));
}

/**
 * Detects if an email is promotional based on labels and content
 */
export function isPromotion(labels: string[], from: string, subject: string): boolean {
  // Check Gmail labels
  if (labels.includes('CATEGORY_PROMOTIONS') || labels.includes('CATEGORY_SOCIAL')) {
    return true;
  }

  // Check sender patterns
  const promoPatterns = [
    /promo/i,
    /deals?/i,
    /sale/i,
    /offer/i,
    /discount/i,
  ];

  const fromOrSubject = `${from} ${subject}`;
  return promoPatterns.some(pattern => pattern.test(fromOrSubject));
}

/**
 * Detects if an email is a system notification
 */
export function isSystemNotification(from: string): boolean {
  const notificationPatterns = [
    /do-not-reply/i,
    /noreply/i,
    /system/i,
    /automated?/i,
    /notification/i,
    /alert/i,
  ];

  return notificationPatterns.some(pattern => pattern.test(from));
}

/**
 * Detects if the user was directly addressed (vs CC'd)
 */
export function isDirectlyAddressed(userEmail: string, to: string[], cc: string[]): boolean {
  return to.some(email => email.toLowerCase() === userEmail.toLowerCase());
}

/**
 * Detects if user was only CC'd
 */
export function isCcOnly(userEmail: string, to: string[], cc: string[]): boolean {
  const isInTo = to.some(email => email.toLowerCase() === userEmail.toLowerCase());
  const isInCc = cc.some(email => email.toLowerCase() === userEmail.toLowerCase());
  return !isInTo && isInCc;
}

/**
 * Detects if an email contains action requests
 */
export function hasActionRequest(subject: string, snippet: string): boolean {
  const actionPatterns = [
    /can you/i,
    /could you/i,
    /please\s+(review|check|confirm|send|provide)/i,
    /need\s+you\s+to/i,
    /waiting\s+for/i,
    /follow\s*up/i,
    /action\s+required/i,
    /please\s+respond/i,
  ];

  const content = `${subject} ${snippet}`;
  return actionPatterns.some(pattern => pattern.test(content));
}

/**
 * Detects deadline mentions in email content
 */
export function hasDeadlineMention(subject: string, snippet: string): { hasDeadline: boolean; deadlineAt?: string } {
  const deadlinePatterns = [
    /by\s+(today|tomorrow|this\s+week|next\s+week)/i,
    /due\s+(today|tomorrow|this\s+week|next\s+week)/i,
    /deadline/i,
    /urgent/i,
    /asap/i,
    /as\s+soon\s+as\s+possible/i,
  ];

  const content = `${subject} ${snippet}`;
  const hasDeadline = deadlinePatterns.some(pattern => pattern.test(content));
  
  // This is a simplified version - in practice, you'd want more sophisticated date parsing
  return { hasDeadline, deadlineAt: undefined };
}

/**
 * Calculates importance score based on various factors
 */
export function calculateImportanceScore(factors: {
  isDirectlyAddressed: boolean;
  hasActionRequest: boolean;
  hasDeadline: boolean;
  fromImportantSender: boolean;
  isNewsletter: boolean;
  isPromotion: boolean;
  isSystemNotification: boolean;
  isCcOnly: boolean;
}): number {
  let score = 0.3; // Base score

  // Positive factors
  if (factors.isDirectlyAddressed) score += 0.3;
  if (factors.hasActionRequest) score += 0.2;
  if (factors.hasDeadline) score += 0.3;
  if (factors.fromImportantSender) score += 0.4;

  // Negative factors
  if (factors.isNewsletter) score -= 0.4;
  if (factors.isPromotion) score -= 0.3;
  if (factors.isSystemNotification) score -= 0.2;
  if (factors.isCcOnly) score -= 0.2;

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Determines email category based on classification factors
 */
export function determineCategory(factors: {
  importanceScore: number;
  waitingForReply: boolean;
  isNoise: boolean;
}): EmailCategory {
  if (factors.waitingForReply) {
    return 'FOLLOW_UP';
  }
  
  if (factors.isNoise) {
    return 'NOISE';
  }
  
  if (factors.importanceScore >= 0.7) {
    return 'IMPORTANT';
  }
  
  return 'FYI';
}