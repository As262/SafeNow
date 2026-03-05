# AI Safety Chatbot - Quick Setup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SafeNow AI Chatbot Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if we're in the right directory
if (-not (Test-Path "backend\requirements.txt")) {
    Write-Host "ERROR: Please run this script from the SafeNow root directory" -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
pip install google-generativeai
Write-Host "Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Prompt for API key
Write-Host "[2/4] Setting up Google Gemini API Key..." -ForegroundColor Yellow
Write-Host "To use the AI chatbot, you need a Google Gemini API key." -ForegroundColor White
Write-Host "Get one at: https://makersuite.google.com/app/apikey" -ForegroundColor Cyan
Write-Host ""

$apiKey = Read-Host "Enter your Gemini API key (or press Enter to skip)"

if ($apiKey) {
    # Set environment variable for current session
    $env:GEMINI_API_KEY = $apiKey
    Write-Host "API key set for current session" -ForegroundColor Green
    Write-Host ""
    Write-Host "NOTE: To make this permanent, add to your system environment variables" -ForegroundColor Yellow
    Write-Host "or create a .env file in the backend directory with:" -ForegroundColor Yellow
    Write-Host "GEMINI_API_KEY=$apiKey" -ForegroundColor Cyan
} else {
    Write-Host "Skipped API key setup. Chatbot will use fallback responses." -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Run migrations (if needed)
Write-Host "[3/4] Checking database..." -ForegroundColor Yellow
python manage.py makemigrations
python manage.py migrate
Write-Host "Database ready" -ForegroundColor Green
Write-Host ""

# Step 4: Instructions
Write-Host "[4/4] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Start the backend server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   python manage.py runserver" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. In a new terminal, start the frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Open your browser and log in as a user" -ForegroundColor White
Write-Host ""
Write-Host "4. Look for the purple chat button at the bottom-right!" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Documentation: AI_CHATBOT_GUIDE.md" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location ..
