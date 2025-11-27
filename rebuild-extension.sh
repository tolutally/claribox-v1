#!/bin/bash

# Final extension setup script
# Run this after making changes to rebuild everything

echo "🔧 Rebuilding Claribox Extension..."

cd extension

# Build with vite
echo "📦 Building with Vite..."
npm run build

# Copy manifest
echo "📄 Copying manifest..."
cp manifest.json dist/manifest.json

# Create icons directory if it doesn't exist
mkdir -p dist/icons

# Copy icons (if they exist in source)
if [ -d "icons" ]; then
  echo "🎨 Copying icons..."
  cp -r icons/* dist/icons/
fi

cd ..

echo ""
echo "✅ Extension built successfully!"
echo ""
echo "📍 Extension location: $(pwd)/extension/dist"
echo ""
echo "🔄 Next steps:"
echo "1. Go to chrome://extensions/"
echo "2. Click the refresh icon on the Claribox extension"
echo "3. Or remove and re-add the extension"
echo ""
