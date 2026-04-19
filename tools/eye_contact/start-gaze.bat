@echo off
title GazeCorrect — Eye Contact Correction
echo.
echo  ╔══════════════════════════════════════╗
echo  ║   GazeCorrect — Eye Contact Fix      ║
echo  ║   Ctrl+C to stop                     ║
echo  ╚══════════════════════════════════════╝
echo.

REM Try Windows Python first, then fall back to wsl python
where python >nul 2>&1
if %ERRORLEVEL% == 0 (
    python "C:\Users\Ben\friday\tools\eye_contact\gaze_correct.py"
) else (
    echo [INFO] Windows Python not found, trying WSL...
    wsl python3 /mnt/c/Users/Ben/friday/tools/eye_contact/gaze_correct.py
)

echo.
echo [GazeCorrect stopped]
pause
