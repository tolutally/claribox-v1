
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { gmail_v1 } from 'googleapis';

const gmail = google.gmail('v1');

// TODO: Remove detailed error logging before production - currently needed for development debugging
interface ProcessedEmail {
    messageId: string;
    threadId: string;
    subject: string;
    from: string;
    to: string[];
    cc: string[];
    snippet: string;
    body: string;
    labels: string[];
    timestamp: Date;
    isUnread: boolean;
}

interface EmailFetchResult {
    emails: ProcessedEmail[];
    errors: string[];
    processedCount: number;
    skippedCount: number;
}

export class GmailService {
    private auth: OAuth2Client;
    private static readonly BATCH_SIZE = 10; // TODO: Make configurable when scaling up
    private static readonly MAX_BODY_LENGTH = 10000; // Limit email body size for AI processing

    constructor(auth: OAuth2Client) {
        this.auth = auth;
    }

    async getProfile() {
        try {
            const res = await gmail.users.getProfile({
                auth: this.auth,
                userId: 'me',
            });
            console.log('[GmailService] Profile fetched successfully:', res.data.emailAddress);
            return res.data;
        } catch (error: any) {
            // TODO: Replace with generic error handling before production
            console.error('[GmailService] Profile fetch failed:', {
                message: error.message,
                status: error.status,
                code: error.code
            });
            throw new Error(`Failed to fetch Gmail profile: ${error.message}`);
        }
    }

    async listMessages(query: string = '', maxResults: number = 10) {
        const res = await gmail.users.messages.list({
            auth: this.auth,
            userId: 'me',
            q: query,
            maxResults,
        });
        return res.data.messages || [];
    }

    async getMessage(messageId: string) {
        const res = await gmail.users.messages.get({
            auth: this.auth,
            userId: 'me',
            id: messageId,
            format: 'full',
        });
        return res.data;
    }

    async getThread(threadId: string) {
        const res = await gmail.users.threads.get({
            auth: this.auth,
            userId: 'me',
            id: threadId,
            format: 'full',
        });
        return res.data;
    }

    /**
     * Fetch recent emails with full content for AI processing
     * TODO: Add pagination support when processing larger batches
     */
    async fetchRecentEmails(maxResults: number = GmailService.BATCH_SIZE): Promise<EmailFetchResult> {
        const result: EmailFetchResult = {
            emails: [],
            errors: [],
            processedCount: 0,
            skippedCount: 0
        };

        try {
            console.log(`[GmailService] Fetching ${maxResults} recent emails...`);
            
            // Fetch recent messages from inbox (last 3 days to keep it manageable)
            const messages = await this.listMessages('newer_than:3d in:inbox', maxResults);
            
            if (!messages || messages.length === 0) {
                console.log('[GmailService] No recent messages found');
                return result;
            }

            console.log(`[GmailService] Found ${messages.length} messages to process`);

            // Process each message with full content
            for (const message of messages) {
                try {
                    if (!message.id) {
                        result.skippedCount++;
                        result.errors.push('Message ID missing');
                        continue;
                    }

                    const fullMessage = await this.getMessage(message.id);
                    const processedEmail = this.extractEmailContent(fullMessage);
                    
                    if (processedEmail) {
                        result.emails.push(processedEmail);
                        result.processedCount++;
                        console.log(`[GmailService] Processed email: "${processedEmail.subject.substring(0, 50)}..."`);
                    } else {
                        result.skippedCount++;
                        result.errors.push(`Failed to process message ${message.id}`);
                    }
                } catch (error: any) {
                    result.skippedCount++;
                    // TODO: Replace detailed error logging before production
                    const errorMsg = `Message ${message.id} processing failed: ${error.message}`;
                    result.errors.push(errorMsg);
                    console.error(`[GmailService] ${errorMsg}`, {
                        messageId: message.id,
                        error: error.message,
                        status: error.status
                    });
                }
            }

            console.log(`[GmailService] Fetch complete. Processed: ${result.processedCount}, Skipped: ${result.skippedCount}, Errors: ${result.errors.length}`);
            return result;

        } catch (error: any) {
            // TODO: Replace detailed error logging before production
            const errorMsg = `Gmail fetch failed: ${error.message}`;
            result.errors.push(errorMsg);
            console.error('[GmailService] Fatal error during email fetch:', {
                message: error.message,
                status: error.status,
                code: error.code,
                stack: error.stack
            });
            return result;
        }
    }

    /**
     * Extract and process full email content from Gmail API response
     * TODO: Add support for HTML parsing and attachment handling
     */
    private extractEmailContent(message: gmail_v1.Schema$Message): ProcessedEmail | null {
        try {
            if (!message.id || !message.threadId || !message.payload) {
                return null;
            }

            const headers = message.payload.headers || [];
            const getHeader = (name: string): string => {
                const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
                return header?.value || '';
            };

            // Extract email addresses and clean them
            const parseEmailAddresses = (headerValue: string): string[] => {
                if (!headerValue) return [];
                return headerValue.split(',').map(addr => {
                    const match = addr.match(/<([^>]+)>/) || addr.match(/([\w.-]+@[\w.-]+\.[\w]+)/);
                    return match ? match[1].trim() : addr.trim();
                }).filter(addr => addr.includes('@'));
            };

            // Extract email body with support for both plain text and HTML
            const extractBody = (payload: gmail_v1.Schema$MessagePart): string => {
                let body = '';

                // Check for direct body data
                if (payload.body?.data) {
                    body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
                }

                // Check for multipart content
                if (payload.parts && payload.parts.length > 0) {
                    for (const part of payload.parts) {
                        if (part.mimeType === 'text/plain' && part.body?.data) {
                            body += Buffer.from(part.body.data, 'base64').toString('utf-8');
                        } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
                            // Use HTML if no plain text available (TODO: Add HTML stripping)
                            const htmlContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
                            body = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                        }
                        
                        // Recursively check nested parts
                        if (part.parts) {
                            body += extractBody(part);
                        }
                    }
                }

                // Truncate body if too long for AI processing
                if (body.length > GmailService.MAX_BODY_LENGTH) {
                    body = body.substring(0, GmailService.MAX_BODY_LENGTH) + '... [truncated]';
                }

                return body;
            };

            const subject = getHeader('Subject') || 'No Subject';
            const from = getHeader('From');
            const to = parseEmailAddresses(getHeader('To'));
            const cc = parseEmailAddresses(getHeader('Cc'));
            const snippet = message.snippet || '';
            const body = extractBody(message.payload);
            const labels = message.labelIds || [];
            const timestamp = message.internalDate ? new Date(parseInt(message.internalDate)) : new Date();
            const isUnread = labels.includes('UNREAD');

            return {
                messageId: message.id,
                threadId: message.threadId,
                subject,
                from,
                to,
                cc,
                snippet,
                body: body || snippet, // Fallback to snippet if body extraction fails
                labels,
                timestamp,
                isUnread
            };

        } catch (error: any) {
            // TODO: Replace detailed error logging before production
            console.error('[GmailService] Email content extraction failed:', {
                messageId: message.id,
                error: error.message
            });
            return null;
        }
    }
}

export const createOAuthClient = (accessToken: string, refreshToken?: string) => {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    oAuth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    return oAuth2Client;
};
