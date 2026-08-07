@echo off
echo ==============================================
echo Pushing React App to GitHub Repository
echo ==============================================
echo.

set "GIT_EXE=C:\Users\ridha\OneDrive\Desktop\Project\bin\git\cmd\git.exe"

if not exist "%GIT_EXE%" (
    echo Portable Git was not found at %GIT_EXE%!
    echo Standard checkout...
    set "GIT_EXE=git"
)

echo Initializing local Git repository...
"%GIT_EXE%" init

echo Configuring Git local user metadata...
"%GIT_EXE%" config user.name "ridhanyas25aid"
"%GIT_EXE%" config user.email "ridha@example.com"

echo Configuring remote origin to https://github.com/ridhanyas25aid/Pathpal.git...
"%GIT_EXE%" remote remove origin >nul 2>nul
"%GIT_EXE%" remote add origin https://github.com/ridhanyas25aid/Pathpal.git

echo Staging all React project files (excluding node_modules)...
"%GIT_EXE%" add .

echo Committing changes...
"%GIT_EXE%" commit -m "feat: migrate safe route navigation frontend to React (Vite) and Supabase"

echo Renaming branch to main...
"%GIT_EXE%" branch -M main

echo.
echo ==============================================================
echo Pushing to GitHub...
echo A browser window or popup will open asking you to sign in.
echo Please authorize Git Credential Manager to complete the push.
echo ==============================================================
echo.

"%GIT_EXE%" push -u origin main

echo.
echo ==============================================
echo Push process completed!
echo ==============================================
pause
