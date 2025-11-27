#!/bin/bash

# Claribox Development Setup Script

set -e

echo "🚀 Setting up Claribox development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build shared types
echo "🔧 Building shared types..."
cd shared && npm run build && cd ..

# Copy environment files
echo "📋 Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from template"
else
    echo "ℹ️ backend/.env already exists"
fi

if [ ! -f extension/.env ]; then
    cp extension/.env.example extension/.env
    echo "✅ Created extension/.env from template"
else
    echo "ℹ️ extension/.env already exists"
fi

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from template"
else
    echo "ℹ️ .env already exists"
fi

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
cd backend && npm run db:generate && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Set up your PostgreSQL database"
echo "2. Update the DATABASE_URL in backend/.env"
echo "3. Configure Google OAuth credentials in backend/.env"
echo "4. Configure SendGrid API key in backend/.env"
echo "5. Run database migrations: npm run db:migrate"
echo "6. Start development: npm run dev"
echo ""
echo "📚 For more information, see README.md"