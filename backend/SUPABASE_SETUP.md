# Supabase Setup for Claribox

## Quick Setup Steps

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for it to be ready (usually 2-3 minutes)

2. **Get Your Project Details**:
   - Project URL: `https://[your-project-ref].supabase.co`
   - Anon/Public Key: Found in Settings > API
   - Service Role Key: Found in Settings > API (keep this secret!)
   - Database URL: Found in Settings > Database

3. **Update Environment Variables**:
   Replace the placeholders in `backend/.env`:
   ```bash
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
   SUPABASE_ANON_KEY="your_actual_anon_key"
   SUPABASE_SERVICE_ROLE_KEY="your_actual_service_role_key"
   ```

4. **Run Database Migrations**:
   ```bash
   cd backend
   npm run db:migrate
   ```

5. **Start the Server**:
   ```bash
   npm run dev
   ```

## What's Configured

- ✅ Supabase client for frontend interactions (with Row Level Security)
- ✅ Supabase admin client for backend operations (bypasses RLS)
- ✅ Health check endpoint that verifies Supabase connection
- ✅ Prisma still works for ORM operations
- ✅ Database types generated for TypeScript safety

## Benefits of Supabase

- 🚀 **Instant Setup**: No local PostgreSQL installation needed
- 🔒 **Built-in Auth**: Row Level Security policies
- 📊 **Real-time**: Built-in subscriptions for live updates
- 🌐 **Edge Functions**: Serverless functions if needed
- 📈 **Analytics**: Built-in dashboard and monitoring
- 🆓 **Free Tier**: Generous free tier for development

## Next Steps

1. Set up your Supabase project using the steps above
2. Test the connection: `curl http://localhost:3000/health`
3. The health endpoint should show Supabase as "connected"