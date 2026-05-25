#!/bin/bash

# Deployment Script for aaPanel
# This script helps prepare your application for deployment

echo "======================================"
echo "aaPanel Deployment Preparation Script"
echo "======================================"
echo ""

# Step 1: Build the frontend
echo "Step 1: Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Step 2: Create deployment package
echo "Step 2: Creating deployment package..."

# Create a temporary directory for deployment files
DEPLOY_DIR="deploy_package"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy necessary files
echo "Copying files..."
cp -r dist $DEPLOY_DIR/
cp server.js $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp ecosystem.config.cjs $DEPLOY_DIR/
cp .env.example $DEPLOY_DIR/
cp -r uploads $DEPLOY_DIR/ 2>/dev/null || mkdir $DEPLOY_DIR/uploads

# Copy database scripts (optional)
mkdir -p $DEPLOY_DIR/db_scripts
cp *.js $DEPLOY_DIR/db_scripts/ 2>/dev/null || true

# Create logs directory
mkdir -p $DEPLOY_DIR/logs

# Create README for server
cat > $DEPLOY_DIR/DEPLOY_INSTRUCTIONS.txt << 'EOF'
DEPLOYMENT INSTRUCTIONS
======================

1. Upload all files from this folder to your aaPanel website directory
   (e.g., /www/wwwroot/yourdomain.com/)

2. Create .env file from .env.example with your actual values:
   cp .env.example .env
   nano .env

3. Install dependencies (do NOT upload node_modules):
   cd /www/wwwroot/yourdomain.com
   npm install --production

4. Install PM2 globally if not already installed:
   npm install -g pm2

5. Start the application with PM2:
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup

6. Configure reverse proxy in aaPanel:
   - Website → Your Site → Reverse Proxy
   - Target: http://127.0.0.1:5000
   - Apply

7. Set up SSL certificate (Let's Encrypt in aaPanel)

8. Test your site!

For detailed instructions, see DEPLOYMENT.md
EOF

echo "✅ Deployment package created in: $DEPLOY_DIR"
echo ""

# Step 3: Create archive
echo "Step 3: Creating archive..."
tar -czf deploy_package.tar.gz $DEPLOY_DIR

if [ $? -eq 0 ]; then
    echo "✅ Archive created: deploy_package.tar.gz"
    echo ""
    echo "======================================"
    echo "📦 Deployment package ready!"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo "1. Upload deploy_package.tar.gz to your server"
    echo "2. Extract it in your website directory"
    echo "3. Follow DEPLOY_INSTRUCTIONS.txt on the server"
    echo ""
    echo "Or upload files from '$DEPLOY_DIR' directory manually via FTP/aaPanel File Manager"
    echo ""
else
    echo "⚠️  Could not create archive (tar not available)"
    echo "You can still upload the files from '$DEPLOY_DIR' manually"
fi
