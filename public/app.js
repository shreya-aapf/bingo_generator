//   Bingo Card Generator
// Frontend Application Logic

class BingoCardGenerator {
    constructor() {
        this.currentCard = null;
        this.supabaseUrl = 'https://jnsfslmcowcefhpszrfx.supabase.co';
        this.sessionId = this.generateSessionId();
        this.annotationMode = false;
        this.annotations = [];
        this.uploadedCardImage = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupCardNavigation();
        this.setupHelpModal();
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

        // Annotation mode event listeners
        document.getElementById('cardImageUpload').addEventListener('change', (e) => {
            this.handleCardImageUpload(e.target.files[0]);
        });

        document.getElementById('clearAnnotations').addEventListener('click', () => {
            this.clearAllAnnotations();
        });

        document.getElementById('downloadAnnotated').addEventListener('click', () => {
            this.downloadAnnotatedCard();
        });
    }

    /**
     * Setup card-based navigation
     */
    setupCardNavigation() {
        const actionCards = document.querySelectorAll('.action-card-item');
        const navWheel = document.getElementById('navWheel');
        const navButtons = document.querySelectorAll('.nav-card-mini');
        const cardSelectionHero = document.querySelector('.card-selection-hero');
        
        // Main card click handlers
        actionCards.forEach(card => {
            card.addEventListener('click', () => {
                const cardType = card.dataset.card;
                this.showSection(cardType, cardSelectionHero, navWheel);
            });
        });
        
        // Navigation wheel button handlers
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const navType = button.dataset.nav;
                
                // Home button - go back to card selection
                if (navType === 'home') {
                    this.hideAllSections(cardSelectionHero, navWheel);
                    return;
                }
                
                // Check if we're on hero page or in a section
                const heroVisible = !cardSelectionHero.classList.contains('hidden');
                
                if (heroVisible) {
                    // If on hero, navigate to section
                    this.showSection(navType, cardSelectionHero, navWheel);
                } else {
                    // If in a section, switch sections
                    this.switchSection(navType);
                }
                
                // Update active state
                navButtons.forEach(btn => {
                    if (btn.dataset.nav === 'home') return; // Skip home button
                    btn.classList.remove('active');
                });
                button.classList.add('active');
            });
        });
    }

    /**
     * Setup help modal
     */
    setupHelpModal() {
        const helpButton = document.getElementById('helpButton');
        const helpModal = document.getElementById('helpModal');
        const helpClose = document.getElementById('helpClose');
        
        helpButton.addEventListener('click', () => {
            helpModal.classList.remove('hidden');
        });
        
        helpClose.addEventListener('click', () => {
            helpModal.classList.add('hidden');
        });
        
        // Close on background click
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.add('hidden');
            }
        });
    }

    /**
     * Show a specific content section
     */
    showSection(sectionType, heroSection, navWheel) {
        // Hide hero
        heroSection.classList.add('hidden');
        
        // Hide byline
        const byline = document.querySelector('.hero-subtitle');
        if (byline) {
            byline.style.display = 'none';
        }
        
        // Show nav wheel
        navWheel.classList.add('visible');
        
        // Hide all content sections
        const allSections = document.querySelectorAll('.content-section');
        allSections.forEach(section => section.classList.add('hidden'));
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionType}Section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            
            // Update nav wheel active state
            const navButtons = document.querySelectorAll('.nav-card-mini');
            navButtons.forEach(btn => {
                if (btn.dataset.nav === sectionType) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Smooth scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Switch between sections (when already viewing content)
     */
    switchSection(sectionType) {
        // Hide all content sections
        const allSections = document.querySelectorAll('.content-section');
        allSections.forEach(section => section.classList.add('hidden'));
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionType}Section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            
            // Smooth scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Hide all sections and show card selection
     */
    hideAllSections(heroSection, navWheel) {
        // Show hero
        heroSection.classList.remove('hidden');
        
        // Show byline
        const byline = document.querySelector('.hero-subtitle');
        if (byline) {
            byline.style.display = 'block';
        }
        
        // Hide nav wheel
        if (navWheel) {
            navWheel.classList.remove('visible');
        }
        
        // Hide all content sections
        const allSections = document.querySelectorAll('.content-section');
        allSections.forEach(section => section.classList.add('hidden'));
        
        // Clear nav wheel active states
        const navButtons = document.querySelectorAll('.nav-card-mini');
        navButtons.forEach(btn => btn.classList.remove('active'));
        
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            
            // Show download banner
            document.getElementById('downloadBanner').classList.remove('hidden');
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
     * Handle uploaded bingo card image for annotation
     */
    async handleCardImageUpload(file) {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showStatus('❌ Please select an image file (JPG, PNG, etc.).', 'error');
            return;
        }

        try {
            this.showStatus('Loading your bingo card...', 'info');

            // Convert to data URL
            const dataUrl = await this.fileToBase64(file);
            this.uploadedCardImage = dataUrl;

            // Display the image
            const uploadedImage = document.getElementById('uploadedCardImage');
            const cardContainer = document.getElementById('uploadedCardContainer');
            const placeholder = document.getElementById('annotationPlaceholder');
            const annotationButtons = document.getElementById('annotationButtons');
            const canvas = document.getElementById('markCanvas');

            uploadedImage.src = dataUrl;
            uploadedImage.onload = () => {
                // Setup canvas to match image size
                canvas.width = uploadedImage.naturalWidth;
                canvas.height = uploadedImage.naturalHeight;
                canvas.style.width = '100%';
                canvas.style.height = '100%';

                // Show the image and controls
                cardContainer.classList.remove('hidden');
                placeholder.classList.add('hidden');
                annotationButtons.classList.remove('hidden');

                // Setup click detection
                this.setupGridClickDetection();
                
                this.showStatus('✅ Card loaded! Click on any square to mark it as completed.', 'success');
            };

        } catch (error) {
            console.error('Error loading image:', error);
            this.showStatus('❌ Error loading image. Please try again.', 'error');
        }
    }

    /**
     * Setup click detection for grid-based marking (5x5 bingo grid)
     */
    setupGridClickDetection() {
        const canvas = document.getElementById('markCanvas');
        const annotationCanvas = document.getElementById('annotationCanvas');
        
        // Clear existing marks
        this.annotations = [];
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Remove old event listener by cloning
        const newAnnotationCanvas = annotationCanvas.cloneNode(true);
        annotationCanvas.parentNode.replaceChild(newAnnotationCanvas, annotationCanvas);
        
        // Get the new canvas reference
        const finalCanvas = document.getElementById('markCanvas');
        const finalAnnotationCanvas = document.getElementById('annotationCanvas');
        
        // Add click detection to the annotation canvas container
        finalAnnotationCanvas.addEventListener('click', (e) => {
            const rect = finalAnnotationCanvas.getBoundingClientRect();
            const scaleX = finalCanvas.width / rect.width;
            const scaleY = finalCanvas.height / rect.height;
            
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            this.markGridCell(x, y);
        });
    }

    /**
     * Mark a bingo grid cell (assumes 5x5 grid)
     */
    markGridCell(x, y) {
        const canvas = document.getElementById('markCanvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate grid dimensions (5x5 bingo card)
        const cardWidth = canvas.width;
        const cardHeight = canvas.height;
        
        // Precise margins calculated from actual card layout:
        // - Orange header takes ~23.5% of height
        // - Footer (CID/Proof) takes ~7.5% of height  
        // - Grid occupies the middle ~69% of height
        // - Purple borders on sides are ~1.5% each
        
        const topMargin = cardHeight * 0.235; // 23.5% for header
        const bottomMargin = cardHeight * 0.075; // 7.5% for footer
        const sideMargin = cardWidth * 0.015; // 1.5% on each side (purple border)
        
        const gridWidth = cardWidth - (sideMargin * 2);
        const gridHeight = cardHeight - topMargin - bottomMargin;
        
        const cellWidth = gridWidth / 5;
        const cellHeight = gridHeight / 5;
        
        // Determine which cell was clicked
        const relativeX = x - sideMargin;
        const relativeY = y - topMargin;
        
        // Check if click is within grid bounds
        if (relativeX < 0 || relativeX > gridWidth || relativeY < 0 || relativeY > gridHeight) {
            this.showStatus('⚠️ Click within the bingo grid to mark squares', 'warning');
            return;
        }
        
        const col = Math.floor(relativeX / cellWidth);
        const row = Math.floor(relativeY / cellHeight);
        
        // Clamp to valid range (0-4)
        const validCol = Math.max(0, Math.min(4, col));
        const validRow = Math.max(0, Math.min(4, row));
        
        // Check if this cell is already marked
        const cellKey = `${validRow}-${validCol}`;
        const existingIndex = this.annotations.findIndex(a => a.key === cellKey);
        
        if (existingIndex !== -1) {
            // Unmark the cell
            this.annotations.splice(existingIndex, 1);
            this.redrawAllMarks();
            this.showStatus(`✅ Square unmarked! Total marks: ${this.annotations.length}`, 'success');
        } else {
            // Mark the cell
            const cellData = {
                key: cellKey,
                row: validRow,
                col: validCol,
                x: sideMargin + (validCol * cellWidth),
                y: topMargin + (validRow * cellHeight),
                width: cellWidth,
                height: cellHeight
            };
            
            this.annotations.push(cellData);
            this.drawCellMark(cellData);
            this.showStatus(`✅ Square marked! Total marks: ${this.annotations.length}`, 'success');
        }
    }

    /**
     * Draw a filled rectangle over a cell (matching bingo card style)
     */
    drawCellMark(cellData) {
        const canvas = document.getElementById('markCanvas');
        const ctx = canvas.getContext('2d');
        
        // Check if this is the center FREE square (row 2, col 2 in 0-indexed)
        const isFreeSquare = cellData.row === 2 && cellData.col === 2;
        
        if (isFreeSquare) {
            // Gold/yellow fill for FREE square
            ctx.fillStyle = 'rgba(255, 188, 3, 0.5)'; // AA Gold with more transparency
            ctx.fillRect(cellData.x, cellData.y, cellData.width, cellData.height);
            
            // Darker gold border
            ctx.strokeStyle = 'rgba(204, 150, 2, 0.8)';
            ctx.lineWidth = 3;
            ctx.strokeRect(cellData.x, cellData.y, cellData.width, cellData.height);
            
            // Draw a star in the center
            this.drawStar(ctx, 
                cellData.x + cellData.width / 2, 
                cellData.y + cellData.height / 2, 
                5, 
                cellData.width * 0.15, 
                cellData.width * 0.08,
                'rgba(204, 150, 2, 1)');
        } else {
            // Purple fill for regular squares (matching the bingo card purple)
            ctx.fillStyle = 'rgba(102, 45, 143, 0.5)'; // AA Plum with more transparency
            ctx.fillRect(cellData.x, cellData.y, cellData.width, cellData.height);
            
            // Darker purple border
            ctx.strokeStyle = 'rgba(82, 36, 114, 0.8)';
            ctx.lineWidth = 3;
            ctx.strokeRect(cellData.x, cellData.y, cellData.width, cellData.height);
            
            // Draw a checkmark in the center
            this.drawCheckmark(ctx, 
                cellData.x + cellData.width / 2, 
                cellData.y + cellData.height / 2, 
                cellData.width * 0.3,
                'rgba(82, 36, 114, 1)');
        }
    }
    
    /**
     * Draw a star shape
     */
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }
    
    /**
     * Draw a checkmark
     */
    drawCheckmark(ctx, cx, cy, size, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = size * 0.15;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw checkmark
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.3, cy);
        ctx.lineTo(cx - size * 0.05, cy + size * 0.25);
        ctx.lineTo(cx + size * 0.35, cy - size * 0.3);
        ctx.stroke();
    }

    /**
     * Redraw all marked cells
     */
    redrawAllMarks() {
        const canvas = document.getElementById('markCanvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Redraw all marks
        this.annotations.forEach(cellData => {
            this.drawCellMark(cellData);
        });
    }

    /**
     * Clear all annotations
     */
    clearAllAnnotations() {
        const canvas = document.getElementById('markCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.annotations = [];
        this.showStatus('✅ All marks cleared!', 'success');
    }

    /**
     * Download the annotated bingo card
     */
    async downloadAnnotatedCard() {
        if (!this.uploadedCardImage || this.annotations.length === 0) {
            this.showStatus('❌ Please upload a card and add some marks first.', 'error');
            return;
        }

        try {
            this.showStatus('Generating marked card...', 'info');

            // Create a temporary canvas to combine image and marks
            const tempCanvas = document.createElement('canvas');
            const uploadedImage = document.getElementById('uploadedCardImage');
            const markCanvas = document.getElementById('markCanvas');
            
            // Use the natural dimensions of the image (full resolution)
            tempCanvas.width = uploadedImage.naturalWidth;
            tempCanvas.height = uploadedImage.naturalHeight;
            
            const ctx = tempCanvas.getContext('2d');
            
            // Draw the original image at full size
            ctx.drawImage(uploadedImage, 0, 0, tempCanvas.width, tempCanvas.height);
            
            // Draw the marks on top at full size
            ctx.drawImage(markCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
            
            // Convert to data URL and download
            const dataUrl = tempCanvas.toDataURL('image/png', 1.0);
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `marked-bingo-card-${timestamp}.png`;
            
            this.downloadBlob(dataUrl, filename, 'image/png');
            this.showStatus('✅ Marked card downloaded successfully!', 'success');

        } catch (error) {
            console.error('Error downloading annotated card:', error);
            this.showStatus('❌ Failed to generate marked card. Please try again.', 'error');
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
