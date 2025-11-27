
import { openAIService, EmailAnalysis } from './openai';

interface EmailInput {
    id: string;
    subject: string;
    snippet: string;
    sender: string;
    body?: string;
    labels?: string[];
}

export class ClassifierService {
    async classify(email: EmailInput): Promise<EmailAnalysis> {
        // 1. Run Rules-Based Classification
        const ruleResult = this.runRules(email);
        if (ruleResult) {
            console.log(`[Classifier] Rule matched for ${email.id}: ${ruleResult.category}`);
            return ruleResult;
        }

        // 2. Run AI Classification
        console.log(`[Classifier] Running AI analysis for ${email.id}`);
        const aiResult = await openAIService.analyzeEmail(
            email.subject,
            email.body || email.snippet,
            email.sender
        );

        return aiResult;
    }

    private runRules(email: EmailInput): EmailAnalysis | null {
        const subject = email.subject.toLowerCase();
        const sender = email.sender.toLowerCase();
        const labels = email.labels || [];

        // Rule: Promotions/Newsletters are NOISE
        if (labels.includes('CATEGORY_PROMOTIONS') || labels.includes('CATEGORY_SOCIAL')) {
            return {
                category: 'NOISE',
                priority: 'LOW',
                summary: 'Automated promotion or social update.',
                actionRequired: false,
                confidence: 0.9,
            };
        }

        // Rule: Unsubscribe link usually means NOISE
        if (email.body && email.body.toLowerCase().includes('unsubscribe')) {
            return {
                category: 'NOISE',
                priority: 'LOW',
                summary: 'Newsletter or automated email.',
                actionRequired: false,
                confidence: 0.8,
            };
        }

        // Rule: "Urgent" in subject means IMPORTANT
        if (subject.includes('urgent') || subject.includes('asap')) {
            return {
                category: 'IMPORTANT',
                priority: 'HIGH',
                summary: 'Marked as urgent in subject.',
                actionRequired: true,
                confidence: 0.8,
            };
        }

        return null;
    }
}

export const classifierService = new ClassifierService();
