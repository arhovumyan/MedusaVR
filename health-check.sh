#!/bin/bash
# Health check script for MedusaVR signup fixes

echo "🏥 MedusaVR Health Check - Signup Fixes"
echo "======================================"

# Check if containers are running
echo "1️⃣ Checking Docker containers..."
if docker compose ps | grep -q "Up"; then
    echo "✅ Docker containers are running"
else
    echo "❌ Docker containers are not running"
    echo "Run: docker compose up -d"
    exit 1
fi

# Check backend health
echo "2️⃣ Checking backend health..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5002/api/health || echo "000")
if [ "$BACKEND_HEALTH" = "200" ]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed (status: $BACKEND_HEALTH)"
fi

# Check frontend
echo "3️⃣ Checking frontend..."
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "000")
if [ "$FRONTEND_HEALTH" = "200" ]; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend health check failed (status: $FRONTEND_HEALTH)"
fi

# Check CSRF endpoint
echo "4️⃣ Checking CSRF endpoint..."
CSRF_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5002/api/csrf-token || echo "000")
if [ "$CSRF_HEALTH" = "200" ]; then
    echo "✅ CSRF endpoint is working"
else
    echo "❌ CSRF endpoint failed (status: $CSRF_HEALTH)"
fi

# Check auth registration endpoint (should return 400 for empty body)
echo "5️⃣ Checking registration endpoint..."
REG_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "{}" http://localhost:5002/api/auth/register || echo "000")
if [ "$REG_HEALTH" = "400" ]; then
    echo "✅ Registration endpoint is responding correctly to validation"
else
    echo "⚠️  Registration endpoint status: $REG_HEALTH (expected 400 for validation error)"
fi

echo ""
echo "🎯 Health check completed!"
echo "If all checks pass, try signing up in the browser."
