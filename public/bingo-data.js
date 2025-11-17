// Bingo Card Activity Pool and Rules
// Pathfinder Summit 2025

const BINGO_DATA = {
    "B": {
        "label": "Keynotes & Awards",
        "items": [
            "Attend The Edge of Possibility",
            "Attend Ready or Not – Building for What's Next",
            "Attend Scaling Front Office Agentic AI for the Enterprise with Aisera",
            "Attend Bending the Curve – Leading Before the Tipping Point",
            "Community Awards"
        ]
    },

    "I": {
        "label": "Hands-on + Cert + Booths",
        "subgroups": {
            "hands_on": {
                "label": "Hands-on builds",
                "items": [
                    "Build an Insurance AI Agent",
                    "Build an HR AI Agent",
                    "Build a Healthcare AI Agent",
                    "Build a GTM AI Agent",
                    "Build an IT Ticketing AI Agent",
                    "Build an Accounts Payable AI Agent"
                ]
            },
            "certification": {
                "label": "Certification",
                "items": [
                    "Get an Advanced Cert Voucher for $5"
                ]
            },
            "booths": {
                "label": "Virtual Booths",
                "items": [
                    "Visit HEDEHI virtual booth",
                    "Visit Hexa Data virtual booth"
                ]
            }
        }
    },

    "N": {
        "label": "Pathfinder (Free square lives here)",
        "center_free_square": {
            "text": "Join the Pathfinder Summit Community Group",
            "fixed": true
        },
        "items": [
            "Ask a question in the Pathfinder Summit Group",
            "Update your community profile",
            "Complete the Mission Control Assessment",
            "Listen to an episode of Agentic Quest",
            "Sign up for the .38 Delta Release Training"
        ]
    },

    "G": {
        "label": "Pathfinder Framework (session tags)",
        "subgroups": {
            "framework_tags": {
                "label": "Framework tags",
                "items": [
                    "Attend a session tagged with Strategy & Vision",
                    "Attend a session tagged with People & Skills",
                    "Attend a session tagged with Evangelism & Stakeholder Management",
                    "Attend a session tagged with Governance & Risk Management",
                    "Attend a session tagged with Opportunity Identification & Pipeline Management",
                    "Attend a session tagged with Value Measurement & Analytics",
                    "Attend a session tagged with Change Management & Adoption",
                    "Attend a Session tagged with Development & Deployment",
                    "Attend a session tagged with Operating Model & Delivery"
                ]
            }
        }
    },

    "O": {
        "label": "Product Highlights + Session Types",
        "subgroups": {
            "product_highlights": {
                "label": "Product highlights",
                "items": [
                    "Learn about Model Context Protocol (MCP)",
                    "Learn about Document Automation",
                    "Learn about CoE Manager",
                    "Learn about Workload management",
                    "Learn about Forms",
                    "Learn about Automation Cloud Services",
                    "Learn about Automator AI",
                    "Learn about Conversational Co-Pilot"
                ]
            },
            "session_types": {
                "label": "Session types",
                "items": [
                    "Join a Networking Session",
                    "Join a Success Story session",
                    "Join a Strategic Insights session"
                ]
            }
        }
    },

    "rules": {
        "per_card": [
            { "from": "B", "type": "Keynotes & Awards", "pick": 3 },
            { "from": "I", "subgroup": "hands_on", "type": "Hands-on builds", "pick": 2 },
            { "from": "I", "subgroup": "certification", "type": "Certification", "pick": 1, "must_include": "Get an Advanced Cert Voucher for $5" },
            { "from": "I", "subgroup": "booths", "type": "Virtual Booths", "pick": 2 },
            { "from": "N", "type": "Center Free", "pick": 1, "fixed": true, "slot": "center" },
            { "from": "N", "type": "Other Pathfinder", "pick": 3 },
            { "from": "G", "subgroup": "framework_tags", "type": "Framework tags", "pick_range": [3, 5] },
            { "from": "O", "subgroup": "product_highlights", "type": "Product highlights", "pick_range": [3, 5] },
            { "from": "O", "subgroup": "session_types", "type": "Session types", "pick": 2 }
        ],
        "total_squares": 25,
        "notes": [
            "Ensure all picks are unique within a card.",
            "Place the fixed free square at the center (row 2, col 2).",
            "Distribute chosen items across the 5×5 grid."
        ]
    }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BINGO_DATA;
}

