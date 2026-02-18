#!/bin/bash

# ==============================================================================
# REMAINING DEPLOYMENT STEPS - Social Backend
# Domain: chatapi.pino7.com
# ==============================================================================
# This script guides you through the remaining manual steps
# Run this script to complete your production deployment
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear
echo -e "${CYAN}"
echo "================================================================================"
echo "                 PRODUCTION DEPLOYMENT - REMAINING STEPS"
echo "                     Social Backend - chatapi.pino7.com"
echo "================================================================================"
echo -e "${NC}"
echo ""

# Step 1: Generate JWT Secret
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 1: Generate JWT Secret${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Generating a strong JWT secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo -e "${GREEN}✓ JWT Secret Generated!${NC}"
echo ""
echo -e "${CYAN}Your JWT Secret:${NC}"
echo -e "${GREEN}${JWT_SECRET}${NC}"
echo ""
echo "📋 Copy this secret - you'll need it for the .env file!"
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 2: Update .env
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 2: Update .env File${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "You need to update the following in your .env file:"
echo ""
echo "1. DATABASE_URL - Set your production database credentials"
echo "2. JWT_SECRET - Use the secret generated above"
echo ""
read -p "Do you want to edit .env now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    nano .env
    echo -e "${GREEN}✓ .env file updated${NC}"
else
    echo -e "${YELLOW}⚠ Remember to update .env manually!${NC}"
fi
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 3: Setup Database
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 3: Setup Production Database${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "First, let's set a strong database password..."
read -sp "Enter a strong password for database user 'social_user': " DB_PASSWORD
echo ""
echo ""
echo "Updating setup-database.sh with your password..."
sed -i "s/DB_PASSWORD=\"your_strong_password_here\"/DB_PASSWORD=\"$DB_PASSWORD\"/g" setup-database.sh
echo -e "${GREEN}✓ Database password updated in script${NC}"
echo ""
read -p "Run database setup now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo ./setup-database.sh
    echo -e "${GREEN}✓ Database setup complete${NC}"
    echo ""
    echo -e "${CYAN}Your DATABASE_URL should be:${NC}"
    echo -e "${GREEN}postgresql://social_user:$DB_PASSWORD@localhost:5432/social_production?schema=public${NC}"
    echo ""
    echo "📋 Update this in your .env file!"
else
    echo -e "${YELLOW}⚠ Run manually: sudo ./setup-database.sh${NC}"
fi
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 4: Run Migrations
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 4: Run Database Migrations${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "This will create all database tables..."
read -p "Run migrations now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate deploy
    echo -e "${GREEN}✓ Migrations complete${NC}"
else
    echo -e "${YELLOW}⚠ Run manually: npx prisma migrate deploy${NC}"
fi
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 5: Nginx Setup
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 5: Nginx Setup${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if ! command -v nginx &> /dev/null; then
    echo "Nginx is not installed."
    read -p "Install Nginx? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo apt-get update
        sudo apt-get install nginx -y
        echo -e "${GREEN}✓ Nginx installed${NC}"
    fi
else
    echo -e "${GREEN}✓ Nginx is already installed${NC}"
fi
echo ""
echo "Copying Nginx configuration..."
sudo cp nginx-chatapi.conf /etc/nginx/sites-available/chatapi.pino7.com
sudo ln -sf /etc/nginx/sites-available/chatapi.pino7.com /etc/nginx/sites-enabled/
echo -e "${GREEN}✓ Nginx config copied${NC}"
echo ""
echo "Testing Nginx configuration..."
sudo nginx -t
echo ""
sudo systemctl restart nginx
echo -e "${GREEN}✓ Nginx restarted${NC}"
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 6: SSL Certificate
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 6: SSL Certificate (Let's Encrypt)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if ! command -v certbot &> /dev/null; then
    echo "Certbot is not installed."
    read -p "Install Certbot? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo apt-get install certbot python3-certbot-nginx -y
        echo -e "${GREEN}✓ Certbot installed${NC}"
    fi
else
    echo -e "${GREEN}✓ Certbot is already installed${NC}"
fi
echo ""
echo "⚠️  IMPORTANT: Make sure chatapi.pino7.com points to this server's IP!"
echo ""
read -p "Obtain SSL certificate now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo certbot --nginx -d chatapi.pino7.com -d www.chatapi.pino7.com
    echo -e "${GREEN}✓ SSL certificate obtained${NC}"
else
    echo -e "${YELLOW}⚠ Run manually: sudo certbot --nginx -d chatapi.pino7.com -d www.chatapi.pino7.com${NC}"
fi
echo ""
read -p "Press Enter to continue..."
echo ""

# Step 7: PM2 Setup
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 7: Start Application with PM2${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed."
    read -p "Install PM2? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo npm install -g pm2
        echo -e "${GREEN}✓ PM2 installed${NC}"
    fi
else
    echo -e "${GREEN}✓ PM2 is already installed${NC}"
fi
echo ""
echo "Creating logs directory..."
mkdir -p logs
echo -e "${GREEN}✓ Logs directory created${NC}"
echo ""
read -p "Start application with PM2? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pm2 start ecosystem.config.js
    pm2 save
    echo -e "${GREEN}✓ Application started with PM2${NC}"
    echo ""
    echo "Setting up PM2 startup script..."
    pm2 startup
    echo ""
    echo -e "${YELLOW}⚠ Run the command shown above to enable PM2 on system boot${NC}"
else
    echo -e "${YELLOW}⚠ Run manually: pm2 start ecosystem.config.js${NC}"
fi
echo ""

# Final Summary
echo ""
echo -e "${CYAN}"
echo "================================================================================"
echo "                         DEPLOYMENT COMPLETE! 🎉"
echo "================================================================================"
echo -e "${NC}"
echo ""
echo -e "${GREEN}✅ Your Social Backend is now ready for production!${NC}"
echo ""
echo -e "${CYAN}Application Details:${NC}"
echo "  - Domain: https://chatapi.pino7.com"
echo "  - Local Port: 9002"
echo "  - Process Manager: PM2"
echo ""
echo -e "${CYAN}Quick Commands:${NC}"
echo "  - View logs: pm2 logs social-backend"
echo "  - Check status: pm2 status"
echo "  - Restart: pm2 restart social-backend"
echo ""
echo -e "${CYAN}Verification:${NC}"
echo "  - Local: curl http://localhost:9002"
echo "  - Domain: curl https://chatapi.pino7.com"
echo ""
echo -e "${CYAN}Documentation:${NC}"
echo "  - Quick Guide: QUICK_DEPLOY.md"
echo "  - Full Guide: PRODUCTION_DEPLOYMENT.md"
echo "  - Summary: DEPLOYMENT_SUMMARY.txt"
echo ""
echo "================================================================================"
echo ""
