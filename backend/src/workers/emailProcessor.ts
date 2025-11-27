import { createOAuthClient, GmailService } from '../services/gmail';
import { classifyEmail, ClassifyEmailRequest } from '../services/emailClassifier';
import { supabase } from '../services/supabase';
import { Database } from '../types/database';

// TODO: Remove detailed error logging before production - currently needed for development debugging

interface ProcessingResult {
    success: boolean;
    processedCount: number;
    classifiedCount: number;
    storedCount: number;
    errors: string[];
    summary: {
        important: number;
        followUp: number;
        noise: number;
        fyi: number;
    };
}

interface UserTokens {
    userId: string;
    email: string;
    accessToken: string;
    refreshToken: string;
}

export class EmailProcessor {
    private static readonly BATCH_SIZE = 10; // TODO: Make configurable when scaling up
    private static readonly RETRY_ATTEMPTS = 3;

    /**
     * Process emails for a specific user with full content analysis
     * TODO: Add support for incremental processing based on last sync timestamp
     */
    async processUserEmails(userTokens: UserTokens): Promise<ProcessingResult> {
        const result: ProcessingResult = {
            success: false,
            processedCount: 0,
            classifiedCount: 0,
            storedCount: 0,
            errors: [],
            summary: {
                important: 0,
                followUp: 0,
                noise: 0,
                fyi: 0
            }
        };

        try {
            console.log(`[EmailProcessor] Starting email processing for user: ${userTokens.email}`);

            // Initialize Gmail service with user tokens
            const auth = createOAuthClient(userTokens.accessToken, userTokens.refreshToken);
            const gmailService = new GmailService(auth);

            // Test authentication first
            try {
                await gmailService.getProfile();
            } catch (error: any) {
                // TODO: Replace detailed error logging before production
                const errorMsg = `Gmail authentication failed: ${error.message}`;
                result.errors.push(errorMsg);
                console.error('[EmailProcessor] Auth failed:', {
                    userId: userTokens.userId,
                    error: error.message,
                    status: error.status
                });
                return result;
            }

            // Fetch recent emails with full content
            const fetchResult = await gmailService.fetchRecentEmails(EmailProcessor.BATCH_SIZE);
            result.processedCount = fetchResult.processedCount;
            result.errors.push(...fetchResult.errors);

            if (fetchResult.emails.length === 0) {
                console.log('[EmailProcessor] No emails to process');
                result.success = true;
                return result;
            }

            console.log(`[EmailProcessor] Processing ${fetchResult.emails.length} emails through AI classification`);

            // Process each email through classification
            for (const email of fetchResult.emails) {
                try {
                    // Prepare classification request with fallback values for development
                    const classificationRequest: ClassifyEmailRequest = {
                        subject: email.subject || '',
                        snippet: email.snippet || '',
                        fullBody: email.body,
                        from: email.from || '',
                        to: Array.isArray(email.to) ? email.to : (email.to ? [email.to] : []),
                        cc: Array.isArray(email.cc) ? email.cc : (email.cc ? [email.cc] : []),
                        labels: email.labels || [],
                        isNewsletter: false, // TODO: Implement newsletter detection
                        userEmail: 'user@example.com', // TODO: Get from user context
                        userWasLastSender: false, // TODO: Implement thread analysis
                        daysSinceLastMessage: 0, // TODO: Implement date calculation
                        threadLength: 1 // TODO: Implement thread counting
                    };

                    // Run AI classification on full email content
                    const classification = await classifyEmail(classificationRequest);

                    result.classifiedCount++;
                    
                    // Map classification to database categories
                    const category = this.mapClassificationCategory(classification.category);
                    result.summary[category]++;

                    // Store email thread and insight in database
                    const stored = await this.storeEmailInsight(userTokens.userId, email, classification);
                    if (stored) {
                        result.storedCount++;
                    }

                    console.log(`[EmailProcessor] Classified "${email.subject.substring(0, 40)}..." as ${classification.category} (confidence: ${classification.importanceScore})`);

                } catch (error: any) {
                    // TODO: Replace detailed error logging before production
                    const errorMsg = `Classification failed for email ${email.messageId}: ${error.message}`;
                    result.errors.push(errorMsg);
                    console.error('[EmailProcessor] Classification error:', {
                        messageId: email.messageId,
                        subject: email.subject.substring(0, 50),
                        error: error.message
                    });
                }
            }

            result.success = result.classifiedCount > 0;
            console.log(`[EmailProcessor] Processing complete. Classified: ${result.classifiedCount}, Stored: ${result.storedCount}, Errors: ${result.errors.length}`);

            return result;

        } catch (error: any) {
            // TODO: Replace detailed error logging before production
            const errorMsg = `Email processing failed: ${error.message}`;
            result.errors.push(errorMsg);
            console.error('[EmailProcessor] Fatal error:', {
                userId: userTokens.userId,
                error: error.message,
                stack: error.stack
            });
            return result;
        }
    }

    /**
     * Store email thread and AI classification insights in Supabase
     * TODO: Add duplicate detection and update logic for existing threads
     */
    private async storeEmailInsight(userId: string, email: any, classification: any): Promise<boolean> {
        try {
            // First, create or update email thread
            const threadData = {
                user_id: userId,
                gmail_thread_id: email.threadId,
                subject: email.subject,
                participants: [email.from, ...email.to, ...email.cc].filter(Boolean),
                last_message_date: email.timestamp.toISOString(),
                message_count: 1,
                labels: email.labels,
                is_unread: email.isUnread,
                has_attachments: false // TODO: Detect attachments from Gmail API
            };

            const { data: thread, error: threadError } = await supabase
                .from('email_threads')
                .upsert(threadData as any, {
                    onConflict: 'user_id,gmail_thread_id'
                })
                .select('id')
                .single();

            if (threadError) {
                console.error('[EmailProcessor] Thread storage error:', threadError);
                return false;
            }

            // Then store the AI classification insight
            const insightData = {
                user_id: userId,
                thread_id: (thread as any).id,
                insight_type: classification.category.toLowerCase(),
                priority_score: classification.importanceScore || 0.5,
                summary: classification.summary || `${classification.category} email`,
                key_points: [], // TODO: Extract key points from summary
                action_required: classification.requiresReply || false,
                estimated_importance: this.mapImportanceLevel(classification.importanceScore),
                created_at: new Date().toISOString()
            };

            const { error: insightError } = await supabase
                .from('email_insights')
                .upsert(insightData as any, {
                    onConflict: 'user_id,thread_id'
                });

            if (insightError) {
                console.error('[EmailProcessor] Insight storage error:', insightError);
                return false;
            }

            return true;

        } catch (error: any) {
            // TODO: Replace detailed error logging before production
            console.error('[EmailProcessor] Database storage failed:', {
                userId,
                messageId: email.messageId,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Extract email addresses from a header string
     */
    private extractEmailsFromHeader(header: string): string[] {
        if (!header) return [];
        
        // Simple email extraction - can be improved with a proper parser
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = header.match(emailRegex);
        return matches || [];
    }

    /**
     * Check if email is a newsletter based on headers
     */
    private isNewsletter(headers: Record<string, string>): boolean {
        const listUnsubscribe = headers['list-unsubscribe'] || headers['List-Unsubscribe'];
        const listId = headers['list-id'] || headers['List-Id'];
        
        return !!(listUnsubscribe || listId);
    }

    /**
     * Calculate days since last message
     */
    private calculateDaysSinceLastMessage(internalDate: string): number {
        if (!internalDate) return 0;
        
        const messageDate = new Date(parseInt(internalDate));
        const now = new Date();
        const diffMs = now.getTime() - messageDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diffDays);
    }

    /**
     * Map AI classification categories to database schema
     * TODO: Standardize classification categories across the system
     */
    private mapClassificationCategory(category: string): 'important' | 'followUp' | 'noise' | 'fyi' {
        switch (category.toUpperCase()) {
            case 'IMPORTANT':
                return 'important';
            case 'FOLLOW_UP':
                return 'followUp';
            case 'NOISE':
                return 'noise';
            default:
                return 'fyi';
        }
    }

    /**
     * Map AI priority levels to database importance levels
     */
    private mapImportanceLevel(score: number): string {
        if (score >= 0.8) {
            return 'high';
        } else if (score >= 0.5) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Get user tokens from database for email processing
     * TODO: Add token refresh logic when access tokens expire
     */
    async getUserTokens(userId: string): Promise<UserTokens | null> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('email, google_access_token, google_refresh_token')
                .eq('id', userId)
                .single();

            if (error || !user) {
                console.error('[EmailProcessor] User tokens fetch failed:', error);
                return null;
            }

            if (!(user as any).google_access_token || !(user as any).google_refresh_token) {
                console.error('[EmailProcessor] User missing OAuth tokens:', userId);
                return null;
            }

            return {
                userId,
                email: (user as any).email,
                accessToken: (user as any).google_access_token,
                refreshToken: (user as any).google_refresh_token
            };

        } catch (error: any) {
            // TODO: Replace detailed error logging before production
            console.error('[EmailProcessor] Token retrieval failed:', {
                userId,
                error: error.message
            });
            return null;
        }
    }
}

export const emailProcessor = new EmailProcessor();