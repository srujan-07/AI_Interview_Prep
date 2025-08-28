@echo off
REM Startup script for AI Interview Prep application (Windows)
echo Starting AI Interview Prep application...

REM Start Python backend in a new window
echo Starting Python backend...
start "AI Interview Backend" cmd /k "cd Ai-interview && python api_server.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start React frontend
echo Starting React frontend...
npm run dev

echo Press any key to exit...
pause >nul
