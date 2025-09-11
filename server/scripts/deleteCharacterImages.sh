#!/bin/bash

# Character Image Deletion Script Wrapper
# This script provides an easy way to run the character image deletion utility

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if .env file exists
ENV_FILE="$PROJECT_ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ .env file not found at $ENV_FILE${NC}"
    echo -e "${YELLOW}Please create a .env file with the following variables:${NC}"
    echo "CLOUDINARY_CLOUD_NAME=your_cloud_name"
    echo "CLOUDINARY_API_KEY=your_api_key"
    echo "CLOUDINARY_API_SECRET=your_api_secret"
    exit 1
fi

# Load environment variables
export $(cat "$ENV_FILE" | grep -v '^#' | xargs)

# Check required environment variables
if [ -z "$CLOUDINARY_CLOUD_NAME" ] || [ -z "$CLOUDINARY_API_KEY" ] || [ -z "$CLOUDINARY_API_SECRET" ]; then
    echo -e "${RED}❌ Missing required Cloudinary environment variables${NC}"
    echo -e "${YELLOW}Please ensure your .env file contains:${NC}"
    echo "CLOUDINARY_CLOUD_NAME=your_cloud_name"
    echo "CLOUDINARY_API_KEY=your_api_key"
    echo "CLOUDINARY_API_SECRET=your_api_secret"
    exit 1
fi

# Function to show help
show_help() {
    echo -e "${BLUE}🗑️  Character Image Deletion Script${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 --username=john --character=animeGirl"
    echo "  $0 --username=john --all-characters"
    echo "  $0 --username=john --list-only"
    echo ""
    echo "Options:"
    echo "  --username=<username>     Required: The username whose images to delete"
    echo "  --character=<name>        Delete images for a specific character"
    echo "  --all-characters          Delete images for all characters of the user"
    echo "  --list-only               List characters without deleting (safe mode)"
    echo "  --dry-run                 Show what would be deleted without actually deleting"
    echo "  --force                   Skip confirmation prompts"
    echo "  --help, -h               Show this help message"
    echo ""
    echo "Examples:"
    echo "  # Delete images for a specific character"
    echo "  $0 --username=john --character=animeGirl"
    echo ""
    echo "  # Delete all character images for a user"
    echo "  $0 --username=john --all-characters"
    echo ""
    echo "  # List characters without deleting"
    echo "  $0 --username=john --list-only"
    echo ""
    echo "  # Dry run to see what would be deleted"
    echo "  $0 --username=john --all-characters --dry-run"
    echo ""
    echo -e "${GREEN}Environment variables loaded from: $ENV_FILE${NC}"
}

# Check if help is requested
if [[ "$*" == *"--help"* ]] || [[ "$*" == *"-h"* ]]; then
    show_help
    exit 0
fi

# Check if username is provided
if [[ "$*" != *"--username="* ]]; then
    echo -e "${RED}❌ Username is required${NC}"
    echo "Use --username=yourUsername"
    echo ""
    show_help
    exit 1
fi

# Check if at least one operation is specified
if [[ "$*" != *"--character="* ]] && [[ "$*" != *"--all-characters"* ]] && [[ "$*" != *"--list-only"* ]]; then
    echo -e "${RED}❌ Must specify either --character=name, --all-characters, or --list-only${NC}"
    echo ""
    show_help
    exit 1
fi

# Change to project root directory
cd "$PROJECT_ROOT"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found, installing dependencies...${NC}"
    npm install
fi

# Check if the JavaScript script exists
JS_SCRIPT="$SCRIPT_DIR/deleteUserCharacterImages.js"
if [ -f "$JS_SCRIPT" ]; then
    echo -e "${GREEN}✅ Using JavaScript version${NC}"
    SCRIPT_TO_RUN="$JS_SCRIPT"
else
    echo -e "${RED}❌ deleteUserCharacterImages.js not found${NC}"
    exit 1
fi

# Make script executable
chmod +x "$SCRIPT_TO_RUN"

echo -e "${GREEN}🚀 Running Character Image Deletion Script${NC}"
echo -e "${BLUE}📁 Script: $SCRIPT_TO_RUN${NC}"
echo -e "${BLUE}📁 Project: $PROJECT_ROOT${NC}"
echo -e "${BLUE}📁 Environment: $ENV_FILE${NC}"
echo ""

# Run the script with all arguments
node "$SCRIPT_TO_RUN" "$@"
