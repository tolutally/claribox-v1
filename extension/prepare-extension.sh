#!/bin/bash

# Quick setup script to prepare extension for testing

echo "📦 Preparing Claribox extension for Chrome..."

cd extension

# Copy manifest to dist
echo "✅ Copying manifest.json..."
cp manifest.json dist/manifest.json

# Copy content script (if not built by vite)
if [ -f "entrypoints/content.ts" ]; then
  echo "✅ Copying content script..."
  mkdir -p dist/entrypoints
  cp entrypoints/content.ts dist/entrypoints/content.js
fi

# Copy background script (if exists)
if [ -f "entrypoints/background.ts" ]; then
  echo "✅ Copying background script..."
  cp entrypoints/background.ts dist/entrypoints/background.js
fi

echo ""
echo "✅ Extension ready!"
echo ""
echo "📍 Extension location: $(pwd)/dist"
echo ""
echo "Next steps:"
echo "1. Open Chrome and go to: chrome://extensions/"
echo "2. Enable 'Developer mode' (top-right toggle)"
echo "3. Click 'Load unpacked'"
echo "4. Select: $(pwd)/dist"
echo ""
