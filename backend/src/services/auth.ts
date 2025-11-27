
import { google } from 'googleapis';
import { supabaseAdmin } from './supabase';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export class AuthService {
    getAuthUrl(state?: string) {
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/gmail.readonly'
        ];

        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
            state: state
        });
    }

    async handleCallback(code: string) {
        try {
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);

            // Get user profile
            const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
            const { data: profile } = await oauth2.userinfo.get();


            if (!profile.email) {
                throw new Error('No email found in Google profile');
            }

            const userData = {
                email: profile.email as string,
                name: profile.name || null,
                picture_url: profile.picture || null,
                google_access_token: tokens.access_token || null,
                google_refresh_token: tokens.refresh_token || null,
                updated_at: new Date().toISOString()
            };

            // Upsert user in Supabase
            const { data: user, error } = await supabaseAdmin
                .from('users')
                // @ts-ignore
                .upsert(userData, {
                    onConflict: 'email'
                })
                .select()
                .single();

            if (error) {
                console.error('Supabase upsert error:', error);
                throw error;
            }

            return {
                user: user as any,
                tokens
            };
        } catch (error) {
            console.error('Auth callback error:', error);
            throw error;
        }
    }
}

export const authService = new AuthService();
