#!/usr/bin/env node

// HMAC Proof Generator for Testing
// Generates valid proofs that match the Edge Function's proof verification

const crypto = require('crypto');

/**
 * Generate HMAC proof matching the Edge Function implementation
 * @param {string} cid - Card ID (12 characters)
 * @param {string} secret - Server secret key
 * @returns {string} - Base32 encoded proof (10 characters)
 */
function generateHMACProof(cid, secret) {
    // Generate HMAC-SHA256
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(cid);
    const signature = hmac.digest();
    
    // Convert to base32 (matching Edge Function implementation)
    const base32 = toBase32(signature.toString('hex'));
    
    // Truncate to 10 characters (matching Edge Function)
    return base32.substring(0, 10).toUpperCase();
}

/**
 * Convert hex string to base32 (matching frontend implementation)
 */
function toBase32(hex) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let binary = '';
    
    // Convert hex to binary
    for (let i = 0; i < hex.length; i += 2) {
        const hexPair = hex.substr(i, 2);
        const decimal = parseInt(hexPair, 16);
        binary += decimal.toString(2).padStart(8, '0');
    }
    
    // Convert binary to base32
    let base32 = '';
    for (let i = 0; i < binary.length; i += 5) {
        const chunk = binary.substr(i, 5).padEnd(5, '0');
        const index = parseInt(chunk, 2);
        base32 += alphabet[index];
    }
    
    return base32;
}

/**
 * Generate a test CID (matching frontend implementation)
 */
function generateTestCID(seed = "test123") {
    const message = "BINGO" + seed;
    const hash = crypto.createHash('sha256').update(message).digest('hex');
    const base32 = toBase32(hash);
    return base32.substring(0, 12).toUpperCase();
}

/**
 * Create a complete test payload
 */
function createTestPayload(serverSecret) {
    const cid = generateTestCID();
    const proof = generateHMACProof(cid, serverSecret);
    
    // Minimal 1x1 PNG in base64
    const testPNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    
    return {
        cid,
        proof,
        name: "Test User",
        email: "test@example.com",
        marks: ["0-0", "1-1", "2-2", "3-3", "4-4"], // Diagonal win
        asset: testPNG
    };
}

// Command line usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('HMAC Proof Generator for Bingo Upload Testing\n');
        console.log('Usage:');
        console.log('  node test-proof-generator.js <server_secret>');
        console.log('  node test-proof-generator.js <cid> <server_secret>');
        console.log('  node test-proof-generator.js --payload <server_secret>');
        console.log('\nExamples:');
        console.log('  node test-proof-generator.js mysecret123');
        console.log('  node test-proof-generator.js ABCDEFGH1234 mysecret123');
        console.log('  node test-proof-generator.js --payload mysecret123');
        process.exit(1);
    }
    
    if (args[0] === '--payload') {
        // Generate complete test payload
        const serverSecret = args[1];
        if (!serverSecret) {
            console.error('Error: Server secret is required');
            process.exit(1);
        }
        
        const payload = createTestPayload(serverSecret);
        console.log('Complete test payload:');
        console.log(JSON.stringify(payload, null, 2));
        
        console.log('\nCurl command:');
        console.log(`curl -X POST "https://your-project.supabase.co/functions/v1/upload-winning-card" \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '${JSON.stringify(payload)}'`);
        
    } else if (args.length === 1) {
        // Generate CID and proof
        const serverSecret = args[0];
        const cid = generateTestCID();
        const proof = generateHMACProof(cid, serverSecret);
        
        console.log(`Generated CID: ${cid}`);
        console.log(`Generated Proof: ${proof}`);
        
    } else if (args.length === 2) {
        // Generate proof for existing CID
        const cid = args[0];
        const serverSecret = args[1];
        
        if (cid.length !== 12) {
            console.error('Error: CID must be exactly 12 characters');
            process.exit(1);
        }
        
        const proof = generateHMACProof(cid, serverSecret);
        console.log(`CID: ${cid}`);
        console.log(`Proof: ${proof}`);
    }
}

// Export functions for use as a module
module.exports = {
    generateHMACProof,
    generateTestCID,
    createTestPayload,
    toBase32
};
