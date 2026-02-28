#!/bin/bash

# Cosmic Runner - Local Development Server
# This script starts a local web server for testing the game

PORT=8000

echo "🚀 Cosmic Runner - Local Development Server"
echo "============================================"
echo ""
echo "Starting server on port $PORT..."
echo ""
echo "🎮 Open in your browser:"
echo "   http://localhost:$PORT"
echo ""
echo "📱 For mobile testing, use your computer's IP:"
echo "   http://$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}'):$PORT"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Try different Python versions
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
else
    echo "❌ Python not found. Please install Python or use another server."
    echo ""
    echo "Alternatives:"
    echo "  npx serve . -l $PORT"
    echo "  php -S localhost:$PORT"
    exit 1
fi
