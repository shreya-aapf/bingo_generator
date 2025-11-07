// Privacy-First Bingo Card Generator
// Frontend Application Logic

class BingoCardGenerator {
    constructor() {
        this.currentCard = null;
        this.markedSquares = new Set();
        // UPDATE THIS: Use your Supabase project URL
        this.supabaseUrl = 'https://jnsfslmcowcefhpszrfx.supabase.co'; // Your Supabase project URL
        this.sessionId = this.generateSessionId();
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupUploadHandlers();
        this.showStatus('Ready to generate your first bingo card!', 'info');
    }

    bindEvents() {
        // Card generation
        document.getElementById('generateCard').addEventListener('click', () => {
            this.generateNewCard();
        });

        // Download button
        document.getElementById('downloadPng').addEventListener('click', () => {
            this.downloadCard();
        });

        // Claim form
        document.getElementById('claimForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitClaim();
        });

        // Test connection button
        document.getElementById('testConnection').addEventListener('click', () => {
            this.testConnectionAndReport();
        });
    }

    /**
     * Generate a deterministic bingo card based on CID
     */
    async generateNewCard() {
        try {
            this.showStatus('Generating new bingo card...', 'info');
            
            // Generate random seed for CID
            const seed = this.generateSeed();
            const cid = this.generateCID(seed);
            
            // Generate card numbers deterministically
            const cardNumbers = this.generateCardNumbers(seed);
            
            // Get proof from Edge Function
            const proof = await this.getCardProof(cid);
            
            // Create card object
            this.currentCard = {
                cid,
                seed,
                numbers: cardNumbers,
                proof
            };

            // Store user-card mapping (don't await to avoid blocking UI)
            this.storeUserCardMapping(cid).catch(error => {
                console.warn('Failed to store user-card mapping:', error);
                // Don't show error to user as this is background functionality
            });

            // Reset marked squares
            this.markedSquares.clear();
            
            // Render the card
            this.renderCard();
            
            // Update UI
            document.getElementById('cardId').textContent = `Card ID: ${cid}`;
            document.getElementById('cardProof').textContent = `Proof: ${proof}`;
            
            // Show action sections
            document.getElementById('downloadSection').classList.remove('hidden');
            document.getElementById('claimFormContainer').classList.remove('hidden');
            document.getElementById('claimPlaceholder').classList.add('hidden');
            document.getElementById('arcadeBackground').classList.remove('hidden');
            
            this.showStatus(`Card ${cid} generated! 🚨 DOWNLOAD IT NOW - don't wait!`, 'success');
            
        } catch (error) {
            console.error('Error generating card:', error);
            this.showStatus('Failed to generate card. Please try again.', 'error');
        }
    }

    /**
     * Generate a unique session ID for tracking
     */
    generateSessionId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substr(2, 9);
        return `sess_${timestamp}_${randomPart}`;
    }

    /**
     * Generate a random seed for card generation
     */
    generateSeed() {
        return Math.floor(Math.random() * 1000000000).toString();
    }

    /**
     * Generate CID from seed using base32(sha256("BINGO" + seed))[:12]
     */
    generateCID(seed) {
        const message = "BINGO" + seed;
        const hash = CryptoJS.SHA256(message);
        const base32 = this.toBase32(hash.toString());
        return base32.substring(0, 12).toUpperCase();
    }

    /**
     * Convert hex string to base32
     */
    toBase32(hex) {
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
     * Generate deterministic bingo card content based on seed
     */
    generateCardNumbers(seed) {
        // Use seed to create reproducible random sequence
        let random = this.seededRandom(parseInt(seed));
        
        const columns = {
            B: this.generateColumnContent('B', random),
            I: this.generateColumnContent('I', random),
            N: this.generateColumnContent('N', random),
            G: this.generateColumnContent('G', random),
            O: this.generateColumnContent('O', random)
        };
        
        // Set center as easy FREE space
        columns.N[2] = 'Join the Pathfinder\nSummit group in\nthe community';
        
        return columns;
    }

    /**
     * Seeded random number generator
     */
    seededRandom(seed) {
        return function() {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
        };
    }

    /**
     * Generate 5 unique content items for a column
     */
    generateColumnContent(columnLetter, random) {
        const content = [];
        const available = [...this.getContentPool(columnLetter)];
        
        // Select 5 random content items
        for (let i = 0; i < 5; i++) {
            const index = Math.floor(random() * available.length);
            content.push(available.splice(index, 1)[0]);
        }
        
        return content;
    }

    /**
     * Get content pool for each BINGO column
     */
    getContentPool(columnLetter) {
        const pools = {
            B: [
                'Visit HEDEHI\'s Virtual Booth',
                'Build an HR AI agent (live in session or on demand)',
                'Build an AP AI agent',
                'Book a demo session',
                'Browse the Bot Store',
                'Bookmark a session',
                'Beta test new features',
                'Brainstorm AI use cases',
                'Build your first automation',
                'Backup your project',
                'Badge collection started',
                'Business case developed',
                'Best practice shared',
                'Breakthrough moment achieved',
                'Buzz about AI agents'
            ],
            I: [
                'Visit Hexa data\'s virtual booth',
                'Integrate AI with existing systems',
                'Implement automation workflow',
                'Innovate with AI agents',
                'Install AA Desktop',
                'Identify automation opportunities',
                'Interact with AI experts',
                'Import pre-built packages',
                'Improve process efficiency',
                'Inspect automation logs',
                'Initiate digital transformation',
                'Issue resolution automated',
                'Index knowledge base',
                'Invite team collaboration',
                'Increase ROI measurement'
            ],
            N: [
                'Build an HR AI agent (live in session or on demand)',
                'Network with AI professionals',
                'Navigate the Control Room',
                'New AI skill acquired',
                'Note key insights',
                'Next-gen automation demo',
                'Notify stakeholders',
                'No-code solution built',
                'Nurture AI partnerships',
                'Navigate platform features',
                'News about AI updates',
                'Naming conventions established',
                'Nested automation logic',
                'Natural language processing',
                'New use case discovered'
            ],
            G: [
                'Build an AP AI agent',
                'Get AA certification',
                'Generate automation reports',
                'Governance framework reviewed',
                'Goal achievement tracked',
                'Group training attended',
                'Get hands-on experience',
                'Gather business requirements',
                'GitHub integration setup',
                'Global deployment planned',
                'Growth strategy defined',
                'GUI automation created',
                'Guide team members',
                'Gap analysis completed',
                'Green light for project'
            ],
            O: [
                'Sign up for the Agentic Bounty Challenge',
                'Optimize automation performance',
                'Orchestrate complex workflows',
                'Onboard new team members',
                'Overcome implementation challenges',
                'Organize automation repository',
                'Operate bot fleet',
                'Outline AI strategy',
                'Observe industry trends',
                'Obtain executive approval',
                'Offer peer feedback',
                'OpenAI integration demo',
                'Office productivity boost',
                'Output quality validated',
                'Opportunity assessment done'
            ]
        };
        
        return pools[columnLetter] || [];
    }

    /**
     * Get card proof from Supabase Edge Function
     */
    async getCardProof(cid) {
        try {
            const response = await fetch(`${this.supabaseUrl}/functions/v1/generate-proof`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cid })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.proof;
            
        } catch (error) {
            console.error('Error getting proof:', error);
            // Fallback for development - generate a mock proof
            return 'DEV-PROOF-' + cid.substring(0, 6);
        }
    }

    /**
     * Render the bingo card in the DOM
     */
    renderCard() {
        if (!this.currentCard) return;

        const cardElement = document.getElementById('bingoCard');
        const gridElement = document.getElementById('cardGrid');
        const cidElement = document.getElementById('displayCid');
        const proofElement = document.getElementById('displayProof');

        // Clear existing grid
        gridElement.innerHTML = '';

        // Render grid cells
        const columns = ['B', 'I', 'N', 'G', 'O'];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const value = this.currentCard.numbers[columns[col]][row];
                // Handle multi-line text
                if (value.includes('\n')) {
                    const lines = value.split('\n');
                    cell.innerHTML = lines.map(line => `<div>${line}</div>`).join('');
                } else {
                    cell.textContent = value;
                }
                
                // Mark FREE space
                if (value === 'FREE') {
                    cell.classList.add('free');
                } else {
                    // Add click handler for marking
                    cell.addEventListener('click', () => this.toggleSquare(row, col, cell));
                }
                
                gridElement.appendChild(cell);
            }
        }

        // Update card details
        cidElement.textContent = `CID: ${this.currentCard.cid}`;
        proofElement.textContent = `Proof: ${this.currentCard.proof}`;

        // Show card
        cardElement.classList.remove('hidden');
    }

    /**
     * Toggle square marking for claim submission
     */
    toggleSquare(row, col, cellElement) {
        const squareId = `${row}-${col}`;
        
        if (this.markedSquares.has(squareId)) {
            this.markedSquares.delete(squareId);
            cellElement.classList.remove('marked');
        } else {
            this.markedSquares.add(squareId);
            cellElement.classList.add('marked');
        }
        
        this.updateMarkedSquaresDisplay();
    }

    /**
     * Update the display of marked squares
     */
    updateMarkedSquaresDisplay() {
        const display = document.getElementById('markedSquares');
        if (this.markedSquares.size === 0) {
            display.textContent = 'No squares marked';
        } else {
            const squares = Array.from(this.markedSquares).join(', ');
            display.textContent = `Marked: ${squares}`;
        }
    }


    /**
     * Generate card image using html2canvas
     */
    async generateCardImage() {
        const cardElement = document.getElementById('bingoCard');
        const canvas = await html2canvas(cardElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false
        });
        
        return canvas.toDataURL('image/png');
    }

    /**
     * Download card as PNG
     */
    async downloadCard() {
        if (!this.currentCard) {
            this.showStatus('No card to download. Generate a card first.', 'error');
            return;
        }

        try {
            this.showStatus('Generating PNG...', 'info');

            const cardImage = await this.generateCardImage();
            
            // Include markings info in filename if any squares are marked
            const hasMarkings = this.markedSquares.size > 0;
            const suffix = hasMarkings ? '-with-markings' : '';
            const filename = `bingo-card-${this.currentCard.cid}${suffix}.png`;
            
            this.downloadBlob(cardImage, filename, 'image/png');

            const statusMsg = hasMarkings 
                ? 'PNG downloaded with your markings!' 
                : 'PNG downloaded successfully!';
            this.showStatus(statusMsg, 'success');

        } catch (error) {
            console.error('Error downloading card:', error);
            this.showStatus('Failed to generate PNG. Please try again.', 'error');
        }
    }

    /**
     * Download blob as file
     */
    downloadBlob(dataUrl, filename, mimeType) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Upload winning card to bucket
     */
    async submitClaim() {
        if (!this.currentCard) {
            this.showStatus('No card to claim. Generate a card first.', 'error');
            return;
        }

        const name = document.getElementById('claimName').value;
        const email = document.getElementById('claimEmail').value;
        const attachment = document.getElementById('claimAttachment').files[0];

        if (!name || !email) {
            this.showStatus('Please fill in your name and email.', 'error');
            return;
        }

        if (this.markedSquares.size === 0) {
            this.showStatus('Please mark your winning squares on the card.', 'error');
            return;
        }

        // Validate bingo
        if (!this.validateBingo()) {
            this.showStatus('The marked squares do not form a valid bingo. Please check your selection.', 'error');
            return;
        }

        try {
            this.showStatus('Uploading winning card to bucket...', 'info');
            
            // Debug information
            console.log('Upload details:', {
                supabaseUrl: this.supabaseUrl,
                cid: this.currentCard.cid,
                proof: this.currentCard.proof,
                markedSquares: Array.from(this.markedSquares),
                name,
                email
            });

            // Generate card image with markings
            const cardImage = await this.generateCardImage();

            // Prepare attachment if present
            let attachmentData = null;
            if (attachment) {
                attachmentData = await this.fileToBase64(attachment);
            }

            // Upload winning card to Supabase bucket
            const response = await fetch(`${this.supabaseUrl}/functions/v1/upload-winning-card`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cid: this.currentCard.cid,
                    proof: this.currentCard.proof,
                    name,
                    email,
                    marks: Array.from(this.markedSquares),
                    asset: cardImage,
                    attachment: attachmentData
                })
            });

            if (!response.ok) {
                // Try to get detailed error message from response
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                    if (errorData.details) {
                        errorMessage += ` - ${errorData.details}`;
                    }
                } catch (e) {
                    // If we can't parse the response, use status text
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            
            // Check if the response indicates success
            if (result.error) {
                throw new Error(result.error);
            }
            
            this.showStatus(`Winning card uploaded successfully! File: ${result.fileName}`, 'success');
            
            // Optionally show the public URL
            if (result.bucketUrl) {
                console.log('Winning card available at:', result.bucketUrl);
            }

            // Clear form
            document.getElementById('claimForm').reset();
            this.markedSquares.clear();
            this.updateMarkedSquaresDisplay();
            this.renderCard(); // Refresh to remove markings

        } catch (error) {
            console.error('Error uploading winning card:', error);
            
            // Show more specific error messages based on the error
            let userMessage = 'Failed to upload winning card. ';
            
            if (error.message.includes('Server configuration error')) {
                userMessage += 'Server setup incomplete - contact administrator.';
            } else if (error.message.includes('Invalid proof')) {
                userMessage += 'Card verification failed - try generating a new card.';
            } else if (error.message.includes('Only PNG files are allowed')) {
                userMessage += 'Invalid file format detected.';
            } else if (error.message.includes('Failed to upload to storage')) {
                userMessage += 'Storage service unavailable - try again later.';
            } else if (error.message.includes('HTTP 404')) {
                userMessage += 'Upload service not found - check configuration.';
            } else if (error.message.includes('HTTP 500')) {
                userMessage += 'Server error - please try again or contact support.';
            } else if (error.message.includes('CORS')) {
                userMessage += 'Network configuration issue - contact administrator.';
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                userMessage += 'Network connection failed - check your internet connection.';
            } else {
                userMessage += `Error: ${error.message}`;
            }
            
            this.showStatus(userMessage, 'error');
        }
    }

    /**
     * Validate if marked squares form a valid bingo
     */
    validateBingo() {
        const squares = Array.from(this.markedSquares).map(s => s.split('-').map(n => parseInt(n)));
        
        // Check rows
        for (let row = 0; row < 5; row++) {
            const rowSquares = squares.filter(s => s[0] === row);
            if (rowSquares.length === 5) return true;
        }
        
        // Check columns
        for (let col = 0; col < 5; col++) {
            const colSquares = squares.filter(s => s[1] === col);
            if (colSquares.length === 5) return true;
        }
        
        // Check diagonals
        const diagonal1 = squares.filter(s => s[0] === s[1]);
        if (diagonal1.length === 5) return true;
        
        const diagonal2 = squares.filter(s => s[0] + s[1] === 4);
        if (diagonal2.length === 5) return true;
        
        return false;
    }

    /**
     * Convert file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    /**
     * Store user-card mapping locally (privacy-first approach)
     */
    async storeUserCardMapping(cid, userName = null, userEmail = null) {
        // Privacy-first: Store mapping locally only, no server tracking
        const mapping = {
            cid,
            name: userName,
            email: userEmail,
            session_id: this.sessionId,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
        };
        
        // Store in browser's local storage only (optional, for user convenience)
        try {
            const existingMappings = JSON.parse(localStorage.getItem('bingo_card_history') || '[]');
            existingMappings.push(mapping);
            
            // Keep only last 10 cards to avoid storage bloat
            if (existingMappings.length > 10) {
                existingMappings.splice(0, existingMappings.length - 10);
            }
            
            localStorage.setItem('bingo_card_history', JSON.stringify(existingMappings));
            console.log('✅ Card mapping stored locally (privacy-first):', cid);
            
        } catch (error) {
            // Local storage failed - not a critical error
            console.log('ℹ️  Local storage unavailable, continuing without history tracking');
        }
        
        return { success: true, stored_locally: true };
    }

    /**
     * Get user's local card history (privacy-first)
     */
    getLocalCardHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('bingo_card_history') || '[]');
            return history;
        } catch (error) {
            console.log('Could not retrieve card history:', error);
            return [];
        }
    }

    /**
     * Clear local card history
     */
    clearLocalCardHistory() {
        try {
            localStorage.removeItem('bingo_card_history');
            console.log('✅ Local card history cleared');
        } catch (error) {
            console.log('Could not clear card history:', error);
        }
    }

    /**
     * Test connection and report results to user
     */
    async testConnectionAndReport() {
        this.showStatus('Testing upload service connection...', 'info');
        
        try {
            const isConnected = await this.testUploadService();
            
            if (isConnected) {
                this.showStatus('✅ Upload service is reachable! Connection test passed.', 'success');
            } else {
                this.showStatus('❌ Upload service connection failed. Check your Supabase URL or network connection.', 'error');
            }
            
        } catch (error) {
            this.showStatus('❌ Connection test failed: Network error or invalid URL.', 'error');
        }
    }

    /**
     * Test connection to the upload service
     */
    async testUploadService() {
        try {
            console.log('Testing upload service connectivity...');
            
            const response = await fetch(`${this.supabaseUrl}/functions/v1/upload-winning-card`, {
                method: 'OPTIONS',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('Upload service test response:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            return response.ok;
            
        } catch (error) {
            console.error('Upload service test failed:', error);
            return false;
        }
    }

    /**
     * Show status message to user
     */
    showStatus(message, type = 'info') {
        const container = document.getElementById('statusMessages');
        const messageEl = document.createElement('div');
        messageEl.className = `status-message ${type}`;
        messageEl.textContent = message;
        
        // Add click to dismiss functionality
        messageEl.addEventListener('click', () => {
            this.dismissMessage(messageEl);
        });
        
        container.appendChild(messageEl);
        
        // Auto-remove after 3 seconds (reduced from 5)
        setTimeout(() => {
            this.dismissMessage(messageEl);
        }, 3000);
    }

    /**
     * Set up PNG upload handlers
     */
    setupUploadHandlers() {
        const fileInput = document.getElementById('pngUpload');
        const uploadBtn = document.getElementById('uploadBtn');
        const preview = document.getElementById('uploadPreview');
        const previewImage = document.getElementById('previewImage');
        const fileName = document.getElementById('fileName');

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type === 'image/png') {
                // Show preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImage.src = e.target.result;
                    fileName.textContent = file.name;
                    preview.style.display = 'block';
                    uploadBtn.style.display = 'inline-flex';
                };
                reader.readAsDataURL(file);
                this.selectedFile = file;
            } else {
                this.showStatus('Please select a PNG file only.', 'error');
                this.resetUpload();
            }
        });

        uploadBtn.addEventListener('click', () => {
            if (this.selectedFile) {
                this.uploadPNG(this.selectedFile);
            }
        });
    }

    /**
     * Reset upload interface
     */
    resetUpload() {
        document.getElementById('pngUpload').value = '';
        document.getElementById('uploadPreview').style.display = 'none';
        document.getElementById('uploadBtn').style.display = 'none';
        this.selectedFile = null;
    }

    /**
     * Upload PNG file to storage
     */
    async uploadPNG(file) {
        try {
            this.showStatus('Uploading PNG to cloud...', 'info');
            
            const formData = new FormData();
            formData.append('png_file', file);

            const response = await fetch(`${this.supabaseUrl}/functions/v1/upload-winning-card`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.showStatus(`PNG uploaded successfully! File saved to cloud.`, 'success');
                console.log('File URL:', result.file_url);
                
                // Reset upload interface after successful upload
                setTimeout(() => {
                    this.resetUpload();
                }, 2000);
            } else {
                throw new Error(result.message || 'Upload failed');
            }

        } catch (error) {
            console.error('Error uploading PNG:', error);
            this.showStatus(`Upload failed: ${error.message}`, 'error');
        }
    }

    /**
     * Dismiss status message with animation
     */
    dismissMessage(messageEl) {
        if (messageEl.parentNode) {
            messageEl.style.animation = 'slideUp 0.3s ease forwards';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bingoApp = new BingoCardGenerator();
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Try different paths for service worker
        const swPaths = [
            './sw.js',  // Relative path (preferred)
            '/sw.js',   // Absolute path
            'sw.js'     // Same directory
        ];
        
        async function registerServiceWorker() {
            for (const path of swPaths) {
                try {
                    const registration = await navigator.serviceWorker.register(path);
                    console.log('✅ SW registered successfully:', registration);
                    console.log('📁 SW path:', path);
                    return; // Success, exit function
                } catch (error) {
                    console.log(`❌ SW registration failed for path "${path}":`, error.message);
                    continue; // Try next path
                }
            }
            
            // If all paths failed, it's likely not needed for basic functionality
            console.log('ℹ️  Service Worker registration failed - running without offline capabilities');
            console.log('💡 This doesn\'t affect the core bingo functionality');
        }
        
        registerServiceWorker();
    });
}
