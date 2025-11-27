#!/bin/bash

# Claribox Development Startup Script
# Starts backend and extension in development mode

set -e

echo "🚀 Starting Claribox Development Environment..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from the project root directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if extension dependencies are installed
if [ ! -d "extension/node_modules" ]; then
    echo "📦 Installing extension dependencies..."
    cd extension && npm install && cd ..
fi

echo ""
echo "✅ All dependencies installed"
echo ""
echo "🔧 Starting development servers..."
echo ""
echo "📍 Backend API: http://localhost:3000"
echo "📍 API Docs: http://localhost:3000/docs"
echo "📍 Extension: Building in watch mode..."
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both backend and extension in parallel
npm run dev
