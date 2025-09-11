#!/bin/bash

# RunPod Cleanup Deployment and Execution Script
# This script helps deploy and run the Python cleanup script on your RunPod instance

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLEANUP_SCRIPT="$SCRIPT_DIR/runpod_cleanup.py"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to deploy cleanup script to RunPod
deploy_to_runpod() {
    local runpod_url="$1"
    
    if [ -z "$runpod_url" ]; then
        print_error "Please provide RunPod URL"
        echo "Usage: $0 deploy <runpod_url>"
        echo "Example: $0 deploy https://your-runpod-instance.runpod.net"
        exit 1
    fi
    
    print_info "Deploying cleanup script to RunPod instance..."
    
    # Remove protocol and trailing slash
    runpod_host=$(echo "$runpod_url" | sed 's|^https://||' | sed 's|^http://||' | sed 's|/$||')
    
    print_info "Copying cleanup script to RunPod..."
    
    # You'll need to customize this based on your RunPod access method
    # This assumes you have SSH access configured
    if command -v scp >/dev/null 2>&1; then
        scp "$CLEANUP_SCRIPT" "root@$runpod_host:/workspace/runpod_cleanup.py"
        print_success "Cleanup script deployed to /workspace/runpod_cleanup.py"
    else
        print_warning "SCP not available. Please manually copy runpod_cleanup.py to your RunPod instance."
        print_info "You can copy the script content and create it manually on your RunPod instance."
    fi
}

# Function to run cleanup via API call
run_cleanup_api() {
    local runpod_url="$1"
    local mode="${2:-all}"
    
    if [ -z "$runpod_url" ]; then
        print_error "Please provide RunPod URL"
        echo "Usage: $0 cleanup <runpod_url> [mode]"
        echo "Modes: gpu, memory, files, models, all (default: all)"
        exit 1
    fi
    
    print_info "Running cleanup on RunPod instance via API..."
    
    # Try to run cleanup script via a simple HTTP request
    # This assumes you've set up an endpoint on your RunPod instance
    local cleanup_url="$runpod_url/cleanup?mode=$mode"
    
    if command -v curl >/dev/null 2>&1; then
        print_info "Sending cleanup request to $cleanup_url"
        response=$(curl -s -X POST "$cleanup_url" || echo "ERROR")
        
        if [ "$response" = "ERROR" ]; then
            print_warning "API cleanup failed. Trying direct script execution..."
            run_cleanup_ssh "$runpod_url" "$mode"
        else
            print_success "Cleanup completed via API"
            echo "$response"
        fi
    else
        print_warning "curl not available. Trying SSH method..."
        run_cleanup_ssh "$runpod_url" "$mode"
    fi
}

# Function to run cleanup via SSH
run_cleanup_ssh() {
    local runpod_url="$1"
    local mode="${2:-all}"
    
    runpod_host=$(echo "$runpod_url" | sed 's|^https://||' | sed 's|^http://||' | sed 's|/$||')
    
    print_info "Running cleanup via SSH..."
    
    if command -v ssh >/dev/null 2>&1; then
        ssh "root@$runpod_host" "cd /workspace && python3 runpod_cleanup.py --mode $mode --json"
        print_success "Cleanup completed via SSH"
    else
        print_error "SSH not available. Please run the cleanup script manually on your RunPod instance:"
        print_info "python3 /workspace/runpod_cleanup.py --mode $mode"
    fi
}

# Function to run local cleanup (for testing)
run_local_cleanup() {
    local mode="${1:-all}"
    
    print_info "Running local cleanup (for testing)..."
    
    if [ -f "$CLEANUP_SCRIPT" ]; then
        python3 "$CLEANUP_SCRIPT" --mode "$mode" --json
    else
        print_error "Cleanup script not found at $CLEANUP_SCRIPT"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "RunPod Cleanup Script Manager"
    echo ""
    echo "Usage:"
    echo "  $0 deploy <runpod_url>                    Deploy cleanup script to RunPod"
    echo "  $0 cleanup <runpod_url> [mode]           Run cleanup on RunPod (default: all)"
    echo "  $0 local [mode]                          Run cleanup locally (for testing)"
    echo "  $0 help                                  Show this help"
    echo ""
    echo "Cleanup modes:"
    echo "  gpu      Clear GPU memory only"
    echo "  memory   Clear system memory only"
    echo "  files    Clean temporary files only"
    echo "  models   Reset models only"
    echo "  all      Run all cleanup operations (default)"
    echo ""
    echo "Examples:"
    echo "  $0 deploy https://your-pod.runpod.net"
    echo "  $0 cleanup https://your-pod.runpod.net gpu"
    echo "  $0 cleanup https://your-pod.runpod.net"
    echo "  $0 local all"
}

# Main script logic
case "${1:-help}" in
    "deploy")
        deploy_to_runpod "$2"
        ;;
    "cleanup")
        run_cleanup_api "$2" "$3"
        ;;
    "local")
        run_local_cleanup "$2"
        ;;
    "help"|*)
        show_help
        ;;
esac
