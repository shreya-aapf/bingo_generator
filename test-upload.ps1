# PowerShell test script for upload-winning-card endpoint
# Usage: .\test-upload.ps1

# Configuration - UPDATE THESE VALUES
$SUPABASE_URL = "https://jnsfslmcowcefhpszrfx.supabase.co"
$SERVER_SECRET = "your_server_secret_here"

# Test data
$TEST_CID = "ABCDEFGH1234"
$TEST_NAME = "Test User"
$TEST_EMAIL = "test@example.com"
$TEST_MARKS = @("0-0", "1-1", "2-2", "3-3", "4-4")  # Diagonal pattern

# Minimal 1x1 pixel PNG (base64 encoded)
# This is a valid PNG data URL for a 1x1 transparent pixel
$TEST_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

# Generate HMAC proof (you'll need to implement this or get it from your app)
# For now, using a placeholder - replace with actual proof generation
$TEST_PROOF = "DEV-PROOF-ABCDEF"

Write-Host "🧪 Testing upload-winning-card endpoint..." -ForegroundColor Yellow
Write-Host "📡 URL: $SUPABASE_URL/functions/v1/upload-winning-card" -ForegroundColor Cyan
Write-Host "🎯 CID: $TEST_CID" -ForegroundColor Cyan
Write-Host ""

# Create JSON payload
$payload = @{
    cid = $TEST_CID
    proof = $TEST_PROOF
    name = $TEST_NAME
    email = $TEST_EMAIL
    marks = $TEST_MARKS
    asset = $TEST_PNG
} | ConvertTo-Json -Depth 10

Write-Host "📤 Sending request..." -ForegroundColor Yellow
Write-Host "Payload preview:" -ForegroundColor Gray
Write-Host $payload -ForegroundColor Gray
Write-Host ""

try {
    # Make the request
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/upload-winning-card" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -UseBasicParsing

    $statusCode = $response.StatusCode
    $responseBody = $response.Content

    Write-Host "📥 Response:" -ForegroundColor Yellow
    Write-Host "Status Code: $statusCode" -ForegroundColor Cyan
    
    # Try to format JSON response
    try {
        $jsonResponse = $responseBody | ConvertFrom-Json
        Write-Host "Body: $(($jsonResponse | ConvertTo-Json -Depth 10))" -ForegroundColor Gray
        
        if ($statusCode -eq 200) {
            Write-Host ""
            Write-Host "✅ SUCCESS: Upload test passed!" -ForegroundColor Green
            Write-Host "📁 File: $($jsonResponse.fileName)" -ForegroundColor Green
            Write-Host "🔗 URL: $($jsonResponse.bucketUrl)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Body: $responseBody" -ForegroundColor Gray
    }

} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    $errorBody = ""
    
    try {
        $errorBody = $_.Exception.Response | Get-Content
    } catch {
        $errorBody = $_.Exception.Message
    }

    Write-Host "📥 Response:" -ForegroundColor Yellow
    Write-Host "Status Code: $statusCode" -ForegroundColor Red
    Write-Host "Body: $errorBody" -ForegroundColor Red

    # Interpret errors
    switch ($statusCode) {
        400 { 
            Write-Host ""
            Write-Host "❌ BAD REQUEST: Check your test data format" -ForegroundColor Red
        }
        404 { 
            Write-Host ""
            Write-Host "❌ NOT FOUND: Edge function not deployed" -ForegroundColor Red
            Write-Host "💡 Run: supabase functions deploy upload-winning-card" -ForegroundColor Yellow
        }
        500 { 
            Write-Host ""
            Write-Host "❌ SERVER ERROR: Check environment variables and logs" -ForegroundColor Red
            Write-Host "💡 Required env vars: SUPABASE_ANON_KEY, SERVER_SECRET" -ForegroundColor Yellow
        }
        default {
            Write-Host ""
            Write-Host "❌ UNEXPECTED STATUS: $statusCode" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "🔍 Debug info:" -ForegroundColor Yellow
Write-Host "- Check Supabase Functions logs for detailed error messages" -ForegroundColor Gray
Write-Host "- Verify environment variables are set correctly" -ForegroundColor Gray
Write-Host "- Ensure storage bucket 'bingo_cards' exists" -ForegroundColor Gray
