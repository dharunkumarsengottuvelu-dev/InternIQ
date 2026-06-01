@echo off
echo ===================================
echo   InternIQ - Auto Git Push Script
echo ===================================

set /p msg="Enter your commit message: "

echo.
echo Adding files...
git add .

echo.
echo Committing...
git commit -m "%msg%"

echo.
echo Pushing to GitHub...
git push

echo.
echo Done!
pause
