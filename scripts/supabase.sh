#!/bin/bash

# Claribox Supabase Management Script
# Usage: ./scripts/supabase.sh [command]

set -e

SUPABASE_PROJECT_DIR="/Users/tobitowoju/claribox-v1"

cd "$SUPABASE_PROJECT_DIR"

case "$1" in
  "setup")
    echo "🚀 Setting up Supabase project..."
    echo "1. First, create your project at https://supabase.com"
    echo "2. Then run: ./scripts/supabase.sh link YOUR_PROJECT_REF"
    echo "3. Finally run: ./scripts/supabase.sh deploy"
    ;;
  
  "link")
    if [ -z "$2" ]; then
      echo "❌ Please provide your project reference"
      echo "Usage: ./scripts/supabase.sh link YOUR_PROJECT_REF"
      exit 1
    fi
    echo "🔗 Linking to Supabase project: $2"
    supabase link --project-ref "$2"
    ;;
  
  "deploy")
    echo "📦 Deploying migrations to Supabase..."
    supabase db push
    echo "✅ Database migrations deployed!"
    ;;
  
  "reset")
    echo "🗑️  Resetting database (this will delete all data)..."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      supabase db reset
      echo "✅ Database reset complete!"
    else
      echo "❌ Reset cancelled"
    fi
    ;;
  
  "status")
    echo "📊 Supabase project status..."
    supabase status
    ;;
  
  "logs")
    echo "📝 Recent Supabase logs..."
    supabase functions logs
    ;;
  
  "types")
    echo "🔧 Generating TypeScript types..."
    supabase gen types typescript --local > backend/src/types/supabase.ts
    echo "✅ Types generated in backend/src/types/supabase.ts"
    ;;
  
  "new-migration")
    if [ -z "$2" ]; then
      echo "❌ Please provide migration name"
      echo "Usage: ./scripts/supabase.sh new-migration migration_name"
      exit 1
    fi
    echo "📝 Creating new migration: $2"
    supabase migration new "$2"
    ;;
  
  "local-start")
    echo "🐳 Starting local Supabase (requires Docker)..."
    supabase start
    ;;
  
  "local-stop")
    echo "🛑 Stopping local Supabase..."
    supabase stop
    ;;
  
  "help"|*)
    echo "🔧 Claribox Supabase Management"
    echo ""
    echo "Available commands:"
    echo "  setup           - Show setup instructions"
    echo "  link PROJECT    - Link to Supabase project"
    echo "  deploy          - Deploy migrations to Supabase"
    echo "  reset           - Reset database (destructive)"
    echo "  status          - Show project status"
    echo "  types           - Generate TypeScript types"
    echo "  new-migration   - Create new migration file"
    echo "  local-start     - Start local development (requires Docker)"
    echo "  local-stop      - Stop local development"
    echo "  help            - Show this help"
    echo ""
    echo "Examples:"
    echo "  ./scripts/supabase.sh setup"
    echo "  ./scripts/supabase.sh link abcdefghijklmnop"
    echo "  ./scripts/supabase.sh deploy"
    echo "  ./scripts/supabase.sh new-migration add_user_preferences"
    ;;
esac