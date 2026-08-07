@echo off
echo ==============================================
echo Pushing Path Pal AI to GitHub Repository
echo ==============================================
echo.

:: Check if git is available
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git was recently installed. Refreshing environment variables...
    :: Add default Git install path to session variable in case PATH hasn't updated yet
    set "PATH=%PATH%;C:\Program Files\Git\cmd"
)

:: Re-verify git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git was not found in standard system PATH.
    echo Please restart your computer or command prompt to refresh system variables, then run push.bat again.
    pause
    exit /b
)

echo Initializing local Git repository...
git init

echo Configuring remote origin to https://github.com/ridhanyas25aid/Pathpal.git...
git remote remove origin >nul 2>nul
git remote add origin https://github.com/ridhanyas25aid/Pathpal.git

echo Staging files...
git add .

echo Committing changes...
git commit -m "feat: complete Path Pal AI integration with OSRM and Firebase"

echo Renaming branch to main...
git branch -M main

echo.
echo ==============================================================
echo Pushing to GitHub...
echo A browser window or popup will open asking you to sign in.
echo Please authorize GitHub Credential Manager to complete the push.
echo ==============================================================
echo.

git push -u origin main

echo.
echo ==============================================
echo Push process completed!
echo ==============================================
pause
