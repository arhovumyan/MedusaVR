#!/bin/bash

# MedusaVR Development Environment Starter
# This script helps start both client and server for testing

echo "🎨 MedusaVR Development Environment"
echo "================================="
echo ""

# Check if we're in the right directory
if [ ! -d "client" ] || [ ! -d "server" ]; then
    echo "❌ Please run this from the MedusaVR root directory"
    exit 1
fi

echo "🔧 Starting development environment..."
echo ""

# Function to start server in background
start_server() {
    echo "🖥️ Starting server (port 5002)..."
    cd server
    npm run dev &
    SERVER_PID=$!
    cd ..
    echo "   Server PID: $SERVER_PID"
}

# Function to start client in background  
start_client() {
    echo "🌐 Starting client (port 3000)..."
    cd client
    npm run dev &
    CLIENT_PID=$!
    cd ..
    echo "   Client PID: $CLIENT_PID"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development environment..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        echo "   ✅ Server stopped"
    fi
    if [ ! -z "$CLIENT_PID" ]; then
        kill $CLIENT_PID 2>/dev/null
        echo "   ✅ Client stopped"
    fi
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

# Start both services
start_server
sleep 3
start_client

echo ""
echo "🚀 Development environment started!"
echo ""
echo "📍 URLs:"
echo "   Client: http://localhost:3000"
echo "   Server: http://localhost:5002"
echo "   Character Creator: http://localhost:3000/create-character-enhanced"
echo ""
echo "🧪 To test character generation:"
echo "   1. Visit: http://localhost:3000/create-character-enhanced"
echo "   2. Login with: testuser / password"
echo "   3. Create a character with comprehensive details"
echo "   4. Watch the AI generation process"
echo ""
echo "💡 ComfyUI URLs configured:"
echo "   Anime/Fantasy: https://q6y70ohkj2gyyj-7861.proxy.runpod.net"
echo "   Realistic: https://q6y70ohkj2gyyj-7860.proxy.runpod.net"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait
