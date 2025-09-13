#!/bin/bash

# Development Startup Script
echo "🚀 Starting MedusaVR Development Environment..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [ -f "env.template" ]; then
        cp env.template .env
        echo "✅ Created .env from template. Please edit it with your actual values."
    else
        echo "❌ No env.template found. Please create a .env file manually."
        exit 1
    fi
fi

# Check if client/.env file exists
if [ ! -f "client/.env" ]; then
    echo "⚠️  No client/.env file found. Creating from template..."
    if [ -f "client/env.template" ]; then
        cp client/env.template client/.env
        echo "✅ Created client/.env from template. Please edit it with your actual values."
    else
        echo "❌ No client/env.template found. Please create a client/.env file manually."
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if MongoDB is running (optional check)
echo "🔍 Checking if MongoDB is accessible..."
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand('ping')" --quiet &> /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB might not be running. Please start MongoDB if you're using a local instance."
    fi
else
    echo "ℹ️  MongoDB client not found. Make sure MongoDB is running if you're using a local instance."
fi

echo ""
echo "🎯 Starting development servers..."
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5002"
echo "   Health:   http://localhost:5002/health"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both frontend and backend
npm run dev