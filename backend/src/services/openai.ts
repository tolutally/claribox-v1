
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
// Only initialize if we have a non-empty key
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export interface EmailAnalysis {
    category: 'IMPORTANT' | 'FOLLOW_UP' | 'NOISE' | 'FYI';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    summary: string;
    actionRequired: boolean;
    actionItem?: string;
    confidence: number;
}

export class OpenAIService {
    async analyzeEmail(subject: string, body: string, sender: string): Promise<EmailAnalysis> {
        if (!openai) {
            console.warn('OPENAI_API_KEY is missing or empty. Returning mock analysis.');
            return this.getMockAnalysis();
        }

        try {
            const prompt = `
        You are an intelligent email assistant.Analyze the following email and categorize it.

    Sender: ${sender}
Subject: ${subject}
Body: ${body.substring(0, 1000)}... (truncated)

Categories:
- IMPORTANT: High value, urgent, or from key stakeholders.
        - FOLLOW_UP: Requires a response or action from the user.
        - NOISE: Newsletters, promotions, automated notifications.
        - FYI: Informational, no action needed, low priority.

        Return a JSON object with the following fields:
- category: One of the categories above.
        - priority: HIGH, MEDIUM, or LOW.
        - summary: A one - sentence summary of the email.
        - actionRequired: boolean.
        - actionItem: If action is required, describe it briefly.
        - confidence: A number between 0 and 1 indicating your confidence.
      `;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a helpful email assistant that outputs JSON.' },
                    { role: 'user', content: prompt },
                ],
                response_format: { type: 'json_object' },
            });

            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error('No content in OpenAI response');
            }

            return JSON.parse(content) as EmailAnalysis;
        } catch (error) {
            console.error('Error analyzing email with OpenAI:', error);
            return this.getMockAnalysis();
        }
    }

    private getMockAnalysis(): EmailAnalysis {
        return {
            category: 'FYI',
            priority: 'LOW',
            summary: 'Analysis failed or API key missing.',
            actionRequired: false,
            confidence: 0,
        };
    }
}

export const openAIService = new OpenAIService();
