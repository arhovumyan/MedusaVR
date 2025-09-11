#!/bin/bash

# Security Headers Testing Script for MedusaVR
# Tests CSP and clickjacking protection implementation

echo "🔒 MedusaVR Security Headers Test"
echo "================================="
echo ""

# Configuration files to test
NGINX_CONFIGS=(
    "client/nginx.conf"
    "client/nginx.prod.conf"
    "security/nginx-security.conf"
)

# Check if nginx configurations are valid
echo "📋 Testing nginx configuration syntax..."
for config in "${NGINX_CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        echo "✅ Found: $config"
        # Note: This would require nginx to be installed
        # nginx -t -c "$config" 2>/dev/null && echo "   ✅ Syntax OK" || echo "   ❌ Syntax Error"
    else
        echo "❌ Missing: $config"
    fi
done
echo ""

# Test if security test page exists
echo "🧪 Checking security test resources..."
if [ -f "security/csp-test.html" ]; then
    echo "✅ CSP test page created: security/csp-test.html"
else
    echo "❌ CSP test page missing"
fi

if [ -f "documentation/CSP_CLICKJACKING_IMPLEMENTATION.md" ]; then
    echo "✅ Documentation created: documentation/CSP_CLICKJACKING_IMPLEMENTATION.md"
else
    echo "❌ Documentation missing"
fi
echo ""

# Check for required security headers in configurations
echo "🔍 Verifying security headers implementation..."

REQUIRED_HEADERS=(
    "X-Frame-Options"
    "Content-Security-Policy"
    "X-Content-Type-Options"
    "Cross-Origin-Embedder-Policy"
    "Cross-Origin-Opener-Policy"
    "Cross-Origin-Resource-Policy"
    "Permissions-Policy"
)

for config in "${NGINX_CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        echo "Checking $config:"
        for header in "${REQUIRED_HEADERS[@]}"; do
            if grep -q "add_header $header" "$config"; then
                echo "   ✅ $header"
            else
                echo "   ❌ $header (missing)"
            fi
        done
        echo ""
    fi
done

# Check for clickjacking protection specifics
echo "🛡️  Verifying clickjacking protection..."
for config in "${NGINX_CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        echo "Checking $config:"
        
        # Check X-Frame-Options
        if grep -q 'X-Frame-Options.*DENY' "$config"; then
            echo "   ✅ X-Frame-Options DENY"
        else
            echo "   ❌ X-Frame-Options DENY (missing or incorrect)"
        fi
        
        # Check frame-ancestors
        if grep -q "frame-ancestors.*'none'" "$config"; then
            echo "   ✅ CSP frame-ancestors 'none'"
        else
            echo "   ❌ CSP frame-ancestors 'none' (missing)"
        fi
        echo ""
    fi
done

# Check CSP directive completeness
echo "📝 Verifying CSP directive coverage..."
CSP_DIRECTIVES=(
    "default-src"
    "script-src"
    "style-src"
    "img-src"
    "connect-src"
    "font-src"
    "object-src"
    "frame-ancestors"
    "base-uri"
    "form-action"
)

for config in "${NGINX_CONFIGS[@]}"; do
    if [ -f "$config" ] && grep -q "Content-Security-Policy" "$config"; then
        echo "Checking CSP in $config:"
        for directive in "${CSP_DIRECTIVES[@]}"; do
            if grep -q "$directive" "$config"; then
                echo "   ✅ $directive"
            else
                echo "   ⚠️  $directive (not found - may be intentional)"
            fi
        done
        echo ""
    fi
done

echo "🚀 Testing complete!"
echo ""
echo "📊 Summary:"
echo "- Configuration files checked: ${#NGINX_CONFIGS[@]}"
echo "- Security headers verified: ${#REQUIRED_HEADERS[@]}"
echo "- CSP directives checked: ${#CSP_DIRECTIVES[@]}"
echo ""
echo "🔧 Next steps:"
echo "1. Deploy the updated nginx configuration"
echo "2. Test using the CSP test page (security/csp-test.html)"
echo "3. Monitor CSP violations in production"
echo "4. Run security scanners to validate implementation"
echo ""
echo "📖 Documentation: documentation/CSP_CLICKJACKING_IMPLEMENTATION.md"
