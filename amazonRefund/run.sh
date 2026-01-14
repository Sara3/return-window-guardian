#!/bin/bash
# Quick launcher for the Refund Agent

# Cleanup function
cleanup_temp_chrome() {
    if [ -n "$TEMP_CHROME_DIR" ] && [ -d "$TEMP_CHROME_DIR" ]; then
        rm -rf "$TEMP_CHROME_DIR" 2>/dev/null || true
    fi
}

# Set trap to cleanup on exit
trap cleanup_temp_chrome EXIT

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          AUTONOMOUS REFUND AGENT - LAUNCHER                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo ""
    echo "Please create a .env file with your OpenAI API key:"
    echo ""
    echo "  echo 'OPENAI_API_KEY=your-key-here' > .env"
    echo ""
    echo "Get your API key from: https://platform.openai.com/api-keys"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if venv exists
if [ ! -d venv ]; then
    echo "❌ Error: Virtual environment not found!"
    echo ""
    echo "Please run: python3 -m venv venv"
    echo "Then run: pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
echo "✓ Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if ! python -c "import browser_use" 2>/dev/null; then
    echo "⚠️  Installing dependencies..."
    pip install -q -r requirements.txt
    echo "✓ Dependencies installed"
fi

echo "✓ All dependencies ready"
echo ""

# Check if Chrome is already running with debugging enabled
echo "🔍 Checking Chrome debugging status..."
if curl -s --max-time 2 http://localhost:9222/json/version > /dev/null 2>&1; then
    echo "✓ Chrome with debugging already running"
else
    echo "🌐 Starting Chrome with debugging enabled..."

    # Don't kill existing Chrome - just start a new debugging instance
    if pgrep -f "Google Chrome" > /dev/null; then
        echo "   Found existing Chrome processes - keeping them open"
        echo "   Starting new Chrome window with debugging enabled..."
    else
        echo "   No existing Chrome found - starting new instance..."
    fi

    # Start Chrome with debugging enabled (no initial URL)
    echo "   Launching Chrome..."
    # Use temporary directory to avoid profile conflicts
    TEMP_CHROME_DIR="/tmp/chrome-automation-$$"
    mkdir -p "$TEMP_CHROME_DIR"
    echo "   Command: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=9222 --user-data-dir=\"$TEMP_CHROME_DIR\" --no-first-run --disable-web-security --new-window"
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
        --remote-debugging-port=9222 \
        --user-data-dir="$TEMP_CHROME_DIR" \
        --no-first-run \
        --disable-web-security \
        --new-window >/dev/null 2>&1 &
    CHROME_PID=$!
    echo "   Chrome PID: $CHROME_PID"

    # Wait for Chrome to start and debugging to be ready
    echo "⏳ Waiting for Chrome debugging to be ready..."
    DEBUG_READY=false
    for i in {1..20}; do  # Give Chrome more time to initialize
        echo -n "."
        if curl -s --max-time 1 http://localhost:9222/json/version > /dev/null 2>&1; then
            echo " ✓ Chrome debugging ready!"
            DEBUG_READY=true
            break
        fi
        sleep 1
    done
    echo ""  # New line after dots

    # Debug: Check what Chrome processes are running
    echo "🔍 Debug info:"
    ps aux | grep -i "Google Chrome" | grep -v grep | head -3 || echo "   No Chrome processes found"
    echo "   Testing CDP endpoint manually..."
    curl -s --max-time 2 http://localhost:9222/json/version | head -1 || echo "   CDP endpoint not responding"

    if [ "$DEBUG_READY" = false ]; then
        echo "⚠️  Chrome debugging not ready after 20 seconds"
        echo "   Chrome may still work - continuing anyway..."
        echo ""
        echo "🔧 Manual debugging test:"
        echo "   Run this in another terminal: curl http://localhost:9222/json/version"
        echo "   If you see JSON, debugging is working. If not, Chrome needs restart."
        echo ""
        sleep 1
    fi
fi

echo ""
echo "🤖 Starting fully automated refund agent..."
echo "   • Opens new Chrome window with debugging enabled"
echo "   • Your existing Chrome browser stays open and unchanged"
echo "   • Fully automated - no interaction needed"
echo ""

# Final debugging check
echo "🔍 Verifying debugging connection..."
if curl -s --max-time 2 http://localhost:9222/json/version > /dev/null 2>&1; then
    echo "✅ Chrome debugging confirmed active"
    echo "✅ New debugging window is ready for automation"
else
    echo "⚠️  Chrome debugging endpoint not responding"
    echo "   New Chrome window started but debugging may not be active"
    echo "   To check manually: curl http://localhost:9222/json/version"
fi

echo ""
echo "ℹ️  New Chrome debugging window is ready"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Run the main script
python main.py "$@"

