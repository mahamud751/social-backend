# Production Deployment Guide
## Social Backend - chatapi.pino7.com

This guide provides step-by-step instructions for deploying the Social Backend to production.

---

## 📋 Prerequisites

- Ubuntu/Debian Linux server
- Root or sudo access
- Node.js 18+ installed
- PostgreSQL 13+ installed
- Domain: `chatapi.pino7.com` pointed to your server IP

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
cd /var/www/social-backend

# 1. Setup database
sudo ./setup-database.sh

# 2. Update .env file with your production credentials
nano .env

# 3. Run production setup
./setup-production.sh
```

### Option 2: Manual Setup

Follow the detailed steps below for complete control over the deployment process.

---

## 📝 Detailed Deployment Steps

### Step 1: Database Configuration

#### 1.1 Create Production Database

Edit the database password in `setup-database.sh`:
```bash
nano setup-database.sh
# Change: DB_PASSWORD="your_strong_password_here"
```

Run the database setup:
```bash
sudo ./setup-database.sh
```

#### 1.2 Update Environment Variables

Edit `.env` file:
```bash
nano .env
```

Update the following values:

```env
# Production Database - UPDATE THESE VALUES!
DATABASE_URL="postgresql://social_user:YOUR_STRONG_PASSWORD@localhost:5432/social_production?schema=public"

# JWT Secret - Generate a strong random secret!
JWT_SECRET='GENERATE_A_STRONG_RANDOM_SECRET_HERE'

# Server Configuration
PORT=9002
NODE_ENV=production

# Domain Configuration
DOMAIN=chatapi.pino7.com
ALLOWED_ORIGINS=https://chatapi.pino7.com,https://www.chatapi.pino7.com
```

**Generate a strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 2: Install Dependencies

```bash
cd /var/www/social-backend
npm install
```

### Step 3: Generate Prisma Client

```bash
npm run prisma:generate
```

### Step 4: Run Database Migrations

```bash
npx prisma migrate deploy
```

### Step 5: Build Application

```bash
npm run build
```

### Step 6: Nginx Configuration

#### 6.1 Install Nginx

```bash
sudo apt-get update
sudo apt-get install nginx -y
```

#### 6.2 Copy Nginx Configuration

```bash
sudo cp nginx-chatapi.conf /etc/nginx/sites-available/chatapi.pino7.com
sudo ln -s /etc/nginx/sites-available/chatapi.pino7.com /etc/nginx/sites-enabled/
```

#### 6.3 Test Nginx Configuration

```bash
sudo nginx -t
```

#### 6.4 Temporarily Disable SSL for Certificate Generation

Edit the Nginx config to comment out SSL sections:
```bash
sudo nano /etc/nginx/sites-available/chatapi.pino7.com
# Comment out the HTTPS server block temporarily
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

### Step 7: SSL Certificate (Let's Encrypt)

#### 7.1 Install Certbot

```bash
sudo apt-get install certbot python3-certbot-nginx -y
```

#### 7.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d chatapi.pino7.com -d www.chatapi.pino7.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: yes)

#### 7.3 Verify Certificate Auto-Renewal

```bash
sudo certbot renew --dry-run
```

### Step 8: Process Manager (PM2)

#### 8.1 Install PM2 Globally

```bash
sudo npm install -g pm2
```

#### 8.2 Create Logs Directory

```bash
mkdir -p /var/www/social-backend/logs
```

#### 8.3 Start Application with PM2

```bash
cd /var/www/social-backend
pm2 start ecosystem.config.js
```

#### 8.4 Save PM2 Configuration

```bash
pm2 save
```

#### 8.5 Setup PM2 Startup Script

```bash
pm2 startup
# Follow the instructions provided by the command
```

### Step 9: Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

---

## ✅ Verification

### 1. Check PM2 Status

```bash
pm2 status
pm2 logs social-backend
```

### 2. Check Nginx Status

```bash
sudo systemctl status nginx
```

### 3. Test Local API

```bash
curl http://localhost:9002
```

### 4. Test Domain (HTTP - if not using SSL yet)

```bash
curl http://chatapi.pino7.com
```

### 5. Test Domain (HTTPS - after SSL setup)

```bash
curl https://chatapi.pino7.com
```

---

## 🔧 Common Management Commands

### PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs social-backend

# View real-time logs
pm2 logs social-backend --lines 100

# Restart application
pm2 restart social-backend

# Stop application
pm2 stop social-backend

# Delete from PM2
pm2 delete social-backend

# Monitor resources
pm2 monit
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/chatapi.pino7.com.error.log

# View access logs
sudo tail -f /var/log/nginx/chatapi.pino7.com.access.log
```

### Database Commands

```bash
# Connect to database
psql -U social_user -d social_production

# View migrations status
npx prisma migrate status

# Run migrations
npx prisma migrate deploy

# Open Prisma Studio (development only)
npx prisma studio
```

---

## 🔄 Updating the Application

```bash
# 1. Pull latest changes
cd /var/www/social-backend
git pull origin main

# 2. Install new dependencies (if any)
npm install

# 3. Run new migrations (if any)
npx prisma migrate deploy

# 4. Regenerate Prisma Client (if schema changed)
npm run prisma:generate

# 5. Rebuild application
npm run build

# 6. Restart with PM2
pm2 restart social-backend
```

---

## 🐛 Troubleshooting

### Application Not Starting

1. Check PM2 logs:
   ```bash
   pm2 logs social-backend --err
   ```

2. Check if port 9002 is in use:
   ```bash
   sudo lsof -i :9002
   ```

3. Verify .env file configuration
   ```bash
   cat .env
   ```

### Database Connection Issues

1. Test database connection:
   ```bash
   psql -U social_user -d social_production
   ```

2. Check PostgreSQL status:
   ```bash
   sudo systemctl status postgresql
   ```

3. Verify DATABASE_URL in .env

### Nginx Issues

1. Check Nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. Test Nginx configuration:
   ```bash
   sudo nginx -t
   ```

3. Verify proxy is reaching backend:
   ```bash
   curl http://localhost:9002
   ```

### SSL Certificate Issues

1. Check certificate status:
   ```bash
   sudo certbot certificates
   ```

2. Renew certificate manually:
   ```bash
   sudo certbot renew
   ```

---

## 📊 Monitoring

### Health Check Endpoint

The application should expose a health check endpoint:
```bash
curl https://chatapi.pino7.com/health
```

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Web-based monitoring (optional)
pm2 plus
```

---

## 🔐 Security Checklist

- [ ] Strong database password set
- [ ] Strong JWT_SECRET generated
- [ ] SSL certificate installed and working
- [ ] Firewall configured (UFW)
- [ ] SSH key authentication enabled (disable password auth)
- [ ] Regular backups configured
- [ ] PM2 monitoring enabled
- [ ] Log rotation configured
- [ ] Environment variables secured

---

## 📦 Backup Strategy

### Database Backup

```bash
# Manual backup
pg_dump -U social_user -d social_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U social_user -d social_production < backup_20260218_120000.sql
```

### Automated Backup Script

Create `/var/www/social-backend/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/social-backend"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U social_user -d social_production > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /var/www/social-backend/backup.sh
```

---

## 📞 Support

For issues or questions:
- Check application logs: `pm2 logs social-backend`
- Check Nginx logs: `/var/log/nginx/`
- Check system logs: `journalctl -xe`

---

## 🎉 Deployment Complete!

Your Social Backend is now running in production at:
- **Domain:** https://chatapi.pino7.com
- **Port:** 9002 (internal)
- **SSL:** Enabled with Let's Encrypt

Remember to:
1. Monitor logs regularly
2. Keep dependencies updated
3. Backup database regularly
4. Monitor server resources
