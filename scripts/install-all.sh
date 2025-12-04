#!/bin/bash

#
# Install all dependencies for the UTS Mood Journal project.
#
# This script installs dependencies for all services:
# - Backend (Laravel/PHP)
# - Frontend (React/Node.js)
# - WebSocket Service (Node.js)
# - AI Service (Python) - optional
#
# Usage:
#   ./scripts/install-all.sh
#   ./scripts/install-all.sh --skip-python
#   ./scripts/install-all.sh --skip-backend --skip-ai

set -e

# Parse arguments
SKIP_PYTHON=false
SKIP_BACKEND=false
SKIP_FRONTEND=false
SKIP_WEBSOCKET=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-python)
            SKIP_PYTHON=true
            shift
            ;;
        --skip-backend)
            SKIP_BACKEND=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --skip-websocket)
            SKIP_WEBSOCKET=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "  UTS Mood Journal - Install All"
echo "========================================"
echo ""

# Check prerequisites
echo -e "\033[33mChecking prerequisites...\033[0m"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "  \033[32m[OK] Node.js $NODE_VERSION\033[0m"
else
    echo -e "  \033[31m[ERROR] Node.js not found. Install from https://nodejs.org\033[0m"
    exit 1
fi

# Check PHP
if command -v php &> /dev/null; then
    PHP_VERSION=$(php --version | /usr/bin/head -n 1)
    echo -e "  \033[32m[OK] $PHP_VERSION\033[0m"
else
    echo -e "  \033[31m[ERROR] PHP not found. Install PHP 8.2+\033[0m"
    exit 1
fi

# Check Composer
if command -v composer &> /dev/null; then
    COMPOSER_VERSION=$(composer --version)
    echo -e "  \033[32m[OK] $COMPOSER_VERSION\033[0m"
else
    echo -e "  \033[31m[ERROR] Composer not found. Install from https://getcomposer.org\033[0m"
    exit 1
fi

# Check Python (optional)
if [ "$SKIP_PYTHON" = false ]; then
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        echo -e "  \033[32m[OK] $PYTHON_VERSION\033[0m"
    else
        echo -e "  \033[33m[WARN] Python not found. AI service will be skipped.\033[0m"
        SKIP_PYTHON=true
    fi
fi

echo ""

# Install Backend (Laravel)
if [ "$SKIP_BACKEND" = false ]; then
    echo -e "\033[33mInstalling Backend (Laravel)...\033[0m"
    cd "$ROOT_DIR/backend"
    
    # Copy .env if not exists
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp ".env.example" ".env"
            echo "  Created .env from .env.example"
        fi
    fi
    
    # Install composer dependencies
    composer install --no-interaction --prefer-dist
    
    # Generate app key if not set
    if grep -q "APP_KEY=$" ".env" || grep -q "APP_KEY=XXXX" ".env"; then
        php artisan key:generate
        echo "  Generated APP_KEY"
    fi
    
    echo -e "  \033[32m[DONE] Backend installed\033[0m"
    echo ""
fi

# Install Frontend (React)
if [ "$SKIP_FRONTEND" = false ]; then
    echo -e "\033[33mInstalling Frontend (React)...\033[0m"
    cd "$ROOT_DIR/frontend"
    npm install
    echo -e "  \033[32m[DONE] Frontend installed\033[0m"
    echo ""
fi

# Install WebSocket Service
if [ "$SKIP_WEBSOCKET" = false ]; then
    echo -e "\033[33mInstalling WebSocket Service...\033[0m"
    cd "$ROOT_DIR/chat-service"
    npm install
    echo -e "  \033[32m[DONE] Chat service installed\033[0m"
    echo ""
fi

# Install AI Service (Python)
if [ "$SKIP_PYTHON" = false ]; then
    echo -e "\033[33mInstalling AI Service (Python)...\033[0m"
    cd "$ROOT_DIR/ai-service"
    
    # Create virtual environment if not exists
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "  Created virtual environment"
    fi
    
    # Activate and install
    source venv/bin/activate
    pip install -r requirements.txt --quiet
    deactivate
    
    echo -e "  \033[32m[DONE] AI service installed\033[0m"
    echo ""
fi

echo "========================================"
echo -e "  \033[32mInstallation Complete!\033[0m"
echo "========================================"
echo ""
echo -e "\033[33mNext steps:\033[0m"
echo "  1. Configure backend/.env with your database and API keys"
echo "  2. Run: cd backend && php artisan migrate"
echo "  3. Run: ./scripts/run-all.sh"
echo ""