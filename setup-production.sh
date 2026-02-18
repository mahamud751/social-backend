#!/bin/bash

# Production Setup Script for Social Backend - chatapi.pino7.com
# This script automates the production deployment setup

set -e  # Exit on any error

echo "=================================================="
echo "Social Backend - Production Setup"
echo "Domain: chatapi.pino7.com"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Node.js version
echo -e "${YELLOW}Step 1: Checking Node.js version...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed!${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js version: $NODE_VERSION${NC}"
echo ""

# Step 2: Check PostgreSQL
echo -e "${YELLOW}Step 2: Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Warning: PostgreSQL client not found!${NC}"
    echo "Please install PostgreSQL or ensure it's in your PATH"
else
    echo -e "${GREEN}✓ PostgreSQL client found${NC}"
fi
echo ""

# Step 3: Create logs directory
echo -e "${YELLOW}Step 3: Creating logs directory...${NC}"
mkdir -p logs
echo -e "${GREEN}✓ Logs directory created${NC}"
echo ""

# Step 4: Install dependencies
echo -e "${YELLOW}Step 4: Installing npm dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 5: Generate Prisma Client
echo -e "${YELLOW}Step 5: Generating Prisma Client...${NC}"
npm run prisma:generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"
echo ""

# Step 6: Run Database Migrations
echo -e "${YELLOW}Step 6: Running database migrations...${NC}"
echo "NOTE: Ensure your DATABASE_URL in .env is correctly configured!"
read -p "Continue with migrations? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate deploy
    echo -e "${GREEN}✓ Migrations completed${NC}"
else
    echo -e "${YELLOW}⚠ Skipped migrations. Run manually: npx prisma migrate deploy${NC}"
fi
echo ""

# Step 7: Build TypeScript
echo -e "${YELLOW}Step 7: Building TypeScript application...${NC}"
npm run build
echo -e "${GREEN}✓ Application built successfully${NC}"
echo ""

# Step 8: Setup Summary
echo "=================================================="
echo -e "${GREEN}Production Setup Complete!${NC}"
echo "=================================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. DATABASE CONFIGURATION:"
echo "   - Update .env with production database credentials"
echo "   - Change DATABASE_URL to your production database"
echo "   - Generate a strong JWT_SECRET"
echo ""
echo "2. NGINX SETUP:"
echo "   - Copy nginx-chatapi.conf to /etc/nginx/sites-available/"
echo "   sudo cp nginx-chatapi.conf /etc/nginx/sites-available/chatapi.pino7.com"
echo "   - Create symlink to sites-enabled:"
echo "   sudo ln -s /etc/nginx/sites-available/chatapi.pino7.com /etc/nginx/sites-enabled/"
echo ""
echo "3. SSL CERTIFICATE (Let's Encrypt):"
echo "   sudo apt-get install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d chatapi.pino7.com -d www.chatapi.pino7.com"
echo ""
echo "4. START APPLICATION:"
echo "   - Install PM2 globally: npm install -g pm2"
echo "   - Start with PM2: pm2 start ecosystem.config.js"
echo "   - Save PM2 config: pm2 save"
echo "   - Setup startup: pm2 startup"
echo ""
echo "5. VERIFY:"
echo "   - Check PM2 status: pm2 status"
echo "   - Check logs: pm2 logs social-backend"
echo "   - Test API: curl http://localhost:9002"
echo ""
echo "=================================================="
