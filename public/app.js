// Privacy-First Bingo Card Generator
// Frontend Application Logic

class BingoCardGenerator {
    constructor() {
        this.currentCard = null;
        this.markedSquares = new Set();
        // UPDATE THIS: Use your Supabase project URL
        this.supabaseUrl = 'https://jnsfslmcowcefhpszrfx.supabase.co'; // Your Supabase project URL
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

        // Email form
        document.getElementById('emailForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.emailCard();
        });

        // Download buttons
        document.getElementById('downloadPng').addEventListener('click', () => {
            this.downloadCard('png');
        });
        document.getElementById('downloadPdf').addEventListener('click', () => {
            this.downloadCard('pdf');
        });

        // Claim form
        document.getElementById('claimForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitClaim();
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

            // Reset marked squares
            this.markedSquares.clear();
            
            // Render the card
            this.renderCard();
            
            // Update UI
            document.getElementById('cardId').textContent = `Card ID: ${cid}`;
            document.getElementById('cardProof').textContent = `Proof: ${proof}`;
            
            // Show action section
            document.getElementById('actionsSection').classList.remove('hidden');
            
            this.showStatus(`Card ${cid} generated successfully!`, 'success');
            
        } catch (error) {
            console.error('Error generating card:', error);
            this.showStatus('Failed to generate card. Please try again.', 'error');
        }
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
        columns.N[2] = 'Sign up for\nPF Summit';
        
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
                'Book a demo',
                'Browse Bot Store',
                'Build your first bot',
                'Backup your work',
                'Bookmark a session',
                'Badge collection started',
                'Brainstorm with AI',
                'Beta feature tested',
                'Business case created',
                'Breakout room joined',
                'Best practice noted',
                'Benchmark set',
                'Bot deployed',
                'Blueprint downloaded',
                'Buzz word counted'
            ],
            I: [
                'Install AA Desktop',
                'Integrate with API',
                'Import a package',
                'Identify use case',
                'Innovate workflow',
                'Inspect bot logs',
                'Implement security',
                'Invite team member',
                'Iterate on design',
                'Improve process',
                'Index documents',
                'Initiate automation',
                'Issue resolved',
                'Interact with expert',
                'Increase efficiency'
            ],
            N: [
                'Network with peers',
                'Navigate Control Room',
                'New skill learned',
                'Note key insight',
                'Next step planned',
                'Notify stakeholder',
                'Nuance understood',
                'Navigate roadmap',
                'Negotiate timeline',
                'Nurture partnership',
                'No-code solution',
                'Naming convention',
                'Notification setup',
                'Nested logic used',
                'News feature found'
            ],
            G: [
                'Get certified',
                'Generate report',
                'Governance reviewed',
                'Goal achieved',
                'Group collaboration',
                'Get hands-on demo',
                'Gather requirements',
                'GitHub integration',
                'Global deployment',
                'Growth strategy',
                'GUI automation',
                'Guide team member',
                'Gamification added',
                'Gap analysis done',
                'Green light received'
            ],
            O: [
                'Optimize performance',
                'Orchestrate workflow',
                'Onboard new user',
                'Overcome challenge',
                'Organize repository',
                'Operate bot fleet',
                'Outline strategy',
                'Observe best practice',
                'Obtain approval',
                'Offer feedback',
                'OpenAI connected',
                'Office automation',
                'Output validated',
                'Opportunity identified',
                'Outcome measured'
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
     * Deploy automation to email the card to user
     */
    async emailCard() {
        if (!this.currentCard) {
            this.showStatus('No card to email. Generate a card first.', 'error');
            return;
        }

        const name = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;

        if (!name || !email) {
            this.showStatus('Please fill in your name and email.', 'error');
            return;
        }

        try {
            this.showStatus('Deploying email automation...', 'info');

            // Generate card image
            const cardImage = await this.generateCardImage();

            // Deploy AA automation instead of sending email directly
            const response = await fetch(`${this.supabaseUrl}/functions/v1/deploy-card-automation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cid: this.currentCard.cid,
                    name,
                    email,
                    asset: cardImage
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.showStatus(`Email automation deployed successfully! Deployment ID: ${result.deploymentId}`, 'success');

            // Clear form
            document.getElementById('emailForm').reset();

        } catch (error) {
            console.error('Error deploying email automation:', error);
            this.showStatus('Failed to deploy email automation. Please try again.', 'error');
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
     * Download card as PNG or PDF
     */
    async downloadCard(format) {
        if (!this.currentCard) {
            this.showStatus('No card to download. Generate a card first.', 'error');
            return;
        }

        try {
            this.showStatus(`Generating ${format.toUpperCase()}...`, 'info');

            if (format === 'png') {
                const cardImage = await this.generateCardImage();
                this.downloadBlob(cardImage, `bingo-card-${this.currentCard.cid}.png`, 'image/png');
            } else if (format === 'pdf') {
                const cardImage = await this.generateCardImage();
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();
                
                // Add image to PDF
                const imgWidth = 190;
                const imgHeight = 190;
                pdf.addImage(cardImage, 'PNG', 10, 10, imgWidth, imgHeight);
                
                // Save PDF
                pdf.save(`bingo-card-${this.currentCard.cid}.pdf`);
            }

            this.showStatus(`${format.toUpperCase()} downloaded successfully!`, 'success');

        } catch (error) {
            console.error('Error downloading card:', error);
            this.showStatus(`Failed to generate ${format.toUpperCase()}. Please try again.`, 'error');
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
     * Deploy automation to process winning claim
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
            this.showStatus('Deploying claim processing automation...', 'info');

            // Prepare attachment if present
            let attachmentData = null;
            if (attachment) {
                attachmentData = await this.fileToBase64(attachment);
            }

            // Deploy AA automation instead of processing claim directly
            const response = await fetch(`${this.supabaseUrl}/functions/v1/deploy-claim-automation`, {
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
                    attachment: attachmentData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.showStatus(`Claim automation deployed successfully! Reference: ${result.claimRef}, Deployment ID: ${result.deploymentId}`, 'success');

            // Clear form
            document.getElementById('claimForm').reset();
            this.markedSquares.clear();
            this.updateMarkedSquaresDisplay();
            this.renderCard(); // Refresh to remove markings

        } catch (error) {
            console.error('Error deploying claim automation:', error);
            this.showStatus('Failed to deploy claim automation. Please try again.', 'error');
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
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
