#!/bin/bash

echo "🚀 Starting Awareness Reporting App with PostgreSQL..."
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    
    # Check if PostgreSQL container is running
    if docker ps | grep -q awareness-postgres; then
        echo "✅ PostgreSQL container already running"
    else
        echo "📦 Starting PostgreSQL with Docker Compose..."
        docker-compose up -d
        
        echo "⏳ Waiting for database to be ready..."
        sleep 5
    fi
else
    echo "⚠️  Docker not found. Make sure PostgreSQL is running locally."
    echo "   Database URL: postgresql://awareness:awareness123@localhost:5432/awareness_db"
fi

echo ""
echo "🔧 Starting backend server..."
npm run server &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 3

echo ""
echo "🎨 Starting frontend dev server..."
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
