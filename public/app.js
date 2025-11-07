//   Bingo Card Generator
// Frontend Application Logic

class BingoCardGenerator {
    constructor() {
        this.currentCard = null;
        this.supabaseUrl = 'https://jnsfslmcowcefhpszrfx.supabase.co';
        this.sessionId = this.generateSessionId();
        this.init();
    }

    init() {
        this.bindEvents();
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

        // Winning card upload preview
        document.getElementById('winningCardUpload').addEventListener('change', (e) => {
            console.log('File input changed, files:', e.target.files);
            this.previewWinningCard(e.target.files[0]);
        });

        // Add input event listeners for debugging
        document.getElementById('claimName').addEventListener('input', (e) => {
            console.log('Name field changed:', e.target.value);
        });

        document.getElementById('claimEmail').addEventListener('input', (e) => {
            console.log('Email field changed:', e.target.value);
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

            // Render the card
            this.renderCard();
            
            // Update UI
            document.getElementById('cardId').textContent = `Card ID: ${cid}`;
            document.getElementById('cardProof').textContent = `Proof: ${proof}`;
            
            // Show action sections
            document.getElementById('downloadSection').classList.remove('hidden');
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
                    'Content-Type': 'application/json'
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
            
            const filename = `bingo-card-${this.currentCard.cid}.png`;
            
            this.downloadBlob(cardImage, filename, 'image/png');

            this.showStatus('PNG downloaded successfully!', 'success');

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
     * Submit winning claim with uploaded card
     */
    async submitClaim() {
        console.log('=== FORM SUBMISSION STARTED ===');
        
        // Check if elements exist
        const nameElement = document.getElementById('claimName');
        const emailElement = document.getElementById('claimEmail');
        const fileElement = document.getElementById('winningCardUpload');
        
        console.log('Form elements found:', {
            nameElement: !!nameElement,
            emailElement: !!emailElement,
            fileElement: !!fileElement
        });
        
        if (!nameElement || !emailElement || !fileElement) {
            console.error('Missing form elements!');
            this.showStatus('Form error: Missing input fields. Please refresh the page.', 'error');
            return;
        }

        const name = nameElement.value.trim();
        const email = emailElement.value.trim();
        const winningCard = fileElement.files[0];

        // Detailed logging of what we captured
        console.log('=== FORM VALUES CAPTURED ===');
        console.log('Name:', name, '(length:', name.length, ')');
        console.log('Email:', email, '(length:', email.length, ')');
        console.log('File:', winningCard ? {
            name: winningCard.name,
            size: winningCard.size,
            type: winningCard.type
        } : 'NO FILE SELECTED');
        console.log('Files array:', fileElement.files);
        console.log('Files array length:', fileElement.files.length);

        // Validate required fields with detailed feedback
        if (!name || name.length === 0) {
            console.error('Validation failed: Name is empty');
            this.showStatus('❌ Please enter your full name in the form.', 'error');
            return;
        }

        if (!email || email.length === 0) {
            console.error('Validation failed: Email is empty');
            this.showStatus('❌ Please enter your email address in the form.', 'error');
            return;
        }

        if (!winningCard) {
            console.error('Validation failed: No file selected');
            this.showStatus('❌ Please upload your winning bingo card photo.', 'error');
            return;
        }

        console.log('✅ All validations passed, proceeding with submission...');

        try {
            this.showStatus('Submitting your winning claim...', 'info');
            
            // Validate file size (max 10MB)
            if (winningCard.size > 10 * 1024 * 1024) {
                this.showStatus('Image file is too large. Please choose a file smaller than 10MB.', 'error');
                return;
            }

            // Convert winning card to base64
            console.log('Converting file to base64:', winningCard.name, winningCard.size, winningCard.type);
            const winningCardData = await this.fileToBase64(winningCard);
            console.log('Base64 conversion completed, length:', winningCardData.length);

            const payload = {
                name: name,
                email: email,
                image: winningCardData,
                timestamp: new Date().toISOString()
            };

            console.log('====== ACTUAL PAYLOAD BEING SENT ======');
            console.log('Full payload object (without base64 data for readability):');
            console.log({
                name: payload.name,
                email: payload.email,
                image: '(base64 data - length: ' + payload.image.length + ' chars)',
                timestamp: payload.timestamp
            });
            console.log('Payload keys:', Object.keys(payload));
            console.log('========================================');

            // Submit claim to Supabase
            const response = await fetch(`${this.supabaseUrl}/functions/v1/upload-winning-card`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('Response status:', response.status, response.statusText);

            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                    console.log('Error response data:', errorData);
                } catch (e) {
                    console.log('Could not parse error response as JSON');
                }
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Success response:', result);
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            this.showStatus(`🎉 Winning claim submitted successfully! We'll be in touch soon.`, 'success');

            // Clear form and preview
            document.getElementById('claimForm').reset();
            const cardPreview = document.getElementById('cardPreview');
            if (cardPreview) {
                cardPreview.style.display = 'none';
            }

        } catch (error) {
            console.error('Error submitting claim:', error);
            
            let userMessage = 'Failed to submit winning claim. ';
            
            if (error.message.includes('HTTP 500')) {
                userMessage += 'Server error - please try again or contact support.';
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                userMessage += 'Network connection failed - check your internet connection.';
            } else {
                userMessage += `Error: ${error.message}`;
            }
            
            this.showStatus(userMessage, 'error');
        }
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
     * Store user-card mapping locally (  approach)
     */
    async storeUserCardMapping(cid, userName = null, userEmail = null) {
        //  : Store mapping locally only, no server tracking
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
            console.log('✅ Card mapping stored locally ( ):', cid);
            
        } catch (error) {
            // Local storage failed - not a critical error
            console.log('ℹ️  Local storage unavailable, continuing without history tracking');
        }
        
        return { success: true, stored_locally: true };
    }

    /**
     * Get user's local card history ( )
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
     * Preview uploaded winning card
     */
    previewWinningCard(file) {
        console.log('previewWinningCard called with:', file);
        
        if (!file) {
            console.log('No file provided to preview');
            return;
        }

        if (!file.type.startsWith('image/')) {
            console.error('Invalid file type:', file.type);
            this.showStatus('❌ Please select an image file (JPG, PNG, etc.).', 'error');
            return;
        }

        console.log('✅ Valid image file, creating preview...');

        const preview = document.getElementById('cardPreview');
        const previewImage = document.getElementById('cardPreviewImage');
        const fileName = document.getElementById('cardFileName');

        if (!preview || !previewImage || !fileName) {
            console.error('Preview elements not found');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('✅ File read successfully, showing preview');
            previewImage.src = e.target.result;
            fileName.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
            preview.style.display = 'block';
            this.showStatus('✅ Image uploaded successfully!', 'success');
        };
        reader.onerror = (e) => {
            console.error('Error reading file:', e);
            this.showStatus('❌ Error reading file. Please try again.', 'error');
        };
        reader.readAsDataURL(file);
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
