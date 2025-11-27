#!/bin/bash

# Build Chrome extension

echo "🔨 Building Claribox Chrome Extension..."

# Clean previous build
rm -rf dist

# Build React components
echo "📦 Building React components..."
npx vite build

# Copy manifest
echo "📋 Copying manifest..."
cp manifest.json dist/

# Copy and rename entrypoints  
echo "🎯 Processing entrypoints..."
cp entrypoints/background.ts dist/background.js
cp entrypoints/content.ts dist/content.js

# Create icons directory
echo "🎨 Setting up icons..."
mkdir -p dist/icons
# Note: Add your icon files to src/icons/ directory

echo "✅ Build complete!"
echo "📂 Extension files are in ./dist/"
echo "🎯 Load the ./dist folder in Chrome Developer Mode"