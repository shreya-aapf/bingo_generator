#!/bin/bash

# Test script for upload-winning-card endpoint
# Usage: ./test-upload.sh

# Configuration - UPDATE THESE VALUES
SUPABASE_URL="https://jnsfslmcowcefhpszrfx.supabase.co"
SERVER_SECRET="your_server_secret_here"

# Test data
TEST_CID="ABCDEFGH1234"
TEST_NAME="Test User"
TEST_EMAIL="test@example.com"
TEST_MARKS='["0-0", "1-1", "2-2", "3-3", "4-4"]'  # Diagonal pattern

# Minimal 1x1 pixel PNG (base64 encoded)
# This is a valid PNG data URL for a 1x1 transparent pixel
TEST_PNG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

# Generate HMAC proof (you'll need to implement this or get it from your app)
# For now, using a placeholder - replace with actual proof generation
TEST_PROOF="DEV-PROOF-ABCDEF"

echo "🧪 Testing upload-winning-card endpoint..."
echo "📡 URL: ${SUPABASE_URL}/functions/v1/upload-winning-card"
echo "🎯 CID: ${TEST_CID}"
echo ""

# Create JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "cid": "${TEST_CID}",
  "proof": "${TEST_PROOF}",
  "name": "${TEST_NAME}",
  "email": "${TEST_EMAIL}",
  "marks": ${TEST_MARKS},
  "asset": "${TEST_PNG}"
}
EOF
)

echo "📤 Sending request..."
echo "Payload preview:"
echo "${JSON_PAYLOAD}" | jq . 2>/dev/null || echo "${JSON_PAYLOAD}"
echo ""

# Make the curl request
response=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d "${JSON_PAYLOAD}" \
  "${SUPABASE_URL}/functions/v1/upload-winning-card")

# Parse response
http_code=$(echo "${response}" | tail -n1)
response_body=$(echo "${response}" | sed '$d')

echo "📥 Response:"
echo "Status Code: ${http_code}"
echo "Body: ${response_body}" | jq . 2>/dev/null || echo "${response_body}"

# Interpret results
if [ "${http_code}" -eq 200 ]; then
    echo ""
    echo "✅ SUCCESS: Upload test passed!"
    
    # Extract file info from response
    file_name=$(echo "${response_body}" | jq -r '.fileName // "unknown"')
    bucket_url=$(echo "${response_body}" | jq -r '.bucketUrl // "none"')
    
    echo "📁 File: ${file_name}"
    echo "🔗 URL: ${bucket_url}"
    
elif [ "${http_code}" -eq 400 ]; then
    echo ""
    echo "❌ BAD REQUEST: Check your test data format"
    
elif [ "${http_code}" -eq 404 ]; then
    echo ""
    echo "❌ NOT FOUND: Edge function not deployed"
    echo "💡 Run: supabase functions deploy upload-winning-card"
    
elif [ "${http_code}" -eq 500 ]; then
    echo ""
    echo "❌ SERVER ERROR: Check environment variables and logs"
    echo "💡 Required env vars: SUPABASE_ANON_KEY, SERVER_SECRET"
    
else
    echo ""
    echo "❌ UNEXPECTED STATUS: ${http_code}"
fi

echo ""
echo "🔍 Debug info:"
echo "- Check Supabase Functions logs for detailed error messages"
echo "- Verify environment variables are set correctly"
echo "- Ensure storage bucket 'bingo_cards' exists"
