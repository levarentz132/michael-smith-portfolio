@echo off
REM Deployment Script for aaPanel (Windows)
REM This script helps prepare your application for deployment

echo ======================================
echo aaPanel Deployment Preparation Script
echo ======================================
echo.

REM Step 1: Build the frontend
echo Step 1: Building frontend...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo Build failed! Please fix errors and try again.
    pause
    exit /b 1
)

echo Build successful!
echo.

REM Step 2: Create deployment package
echo Step 2: Creating deployment package...

REM Create deployment directory
set DEPLOY_DIR=deploy_package
if exist %DEPLOY_DIR% rmdir /s /q %DEPLOY_DIR%
mkdir %DEPLOY_DIR%

REM Copy necessary files
echo Copying files...
xcopy /E /I /Y dist %DEPLOY_DIR%\dist
copy /Y server.js %DEPLOY_DIR%\
copy /Y package.json %DEPLOY_DIR%\
copy /Y ecosystem.config.cjs %DEPLOY_DIR%\
copy /Y .env.example %DEPLOY_DIR%\

REM Create uploads directory
if not exist %DEPLOY_DIR%\uploads mkdir %DEPLOY_DIR%\uploads
if not exist %DEPLOY_DIR%\uploads\properties mkdir %DEPLOY_DIR%\uploads\properties

REM Create logs directory
mkdir %DEPLOY_DIR%\logs

REM Copy database scripts (optional)
mkdir %DEPLOY_DIR%\db_scripts
copy /Y *.js %DEPLOY_DIR%\db_scripts\ 2>nul

REM Create deployment instructions
echo DEPLOYMENT INSTRUCTIONS > %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo ====================== >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo 1. Upload all files from this folder to your aaPanel website directory >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo    (e.g., /www/wwwroot/yourdomain.com/) >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo 2. Create .env file from .env.example with your actual values: >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo    cp .env.example .env >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo    nano .env >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo 3. Install dependencies (do NOT upload node_modules): >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo    cd /www/wwwroot/yourdomain.com >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo    npm install --production >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo 4. Install PM2 globally if not already installed: >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo    npm install -g pm2 >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo 5. Start the application with PM2: >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo    pm2 start ecosystem.config.cjs >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo    pm2 save >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo    pm2 startup >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo 6. Configure reverse proxy in aaPanel: >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo    - Website - Your Site - Reverse Proxy >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo    - Target: http://127.0.0.1:5000 >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo    - Apply >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo 7. Set up SSL certificate (Let's Encrypt in aaPanel) >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo 8. Test your site! >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo. >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt
echo For detailed instructions, see DEPLOYMENT.md >> %DEPLOY_DIR%\DEPLOY_INSTRUCTIONS.txt

echo.
echo ======================================
echo Deployment package ready!
echo ======================================
echo.
echo Files are ready in the '%DEPLOY_DIR%' directory
echo.
echo Next steps:
echo 1. Upload all files from '%DEPLOY_DIR%' to your server
echo    - Use FTP/SFTP (FileZilla recommended)
echo    - Or use aaPanel File Manager
echo 2. Follow DEPLOY_INSTRUCTIONS.txt on the server
echo 3. See QUICK_DEPLOY.md for step-by-step guide
echo.
pause
