# Quick Deployment Guide - chatapi.pino7.com

## ⚡ Fast Track Deployment

### 1️⃣ Database Setup (2 minutes)

```bash
# Edit database password
nano setup-database.sh  # Change DB_PASSWORD

# Run database setup
sudo ./setup-database.sh
```

### 2️⃣ Environment Configuration (1 minute)

```bash
# Edit .env file
nano .env
```

**MUST UPDATE:**
- `DATABASE_URL` - Your production database credentials
- `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 3️⃣ Install & Build (Already Done ✅)

```bash
# These are already completed:
✅ npm install
✅ npm run prisma:generate
✅ npm run build
```

### 4️⃣ Run Migrations (1 minute)

```bash
npx prisma migrate deploy
```

### 5️⃣ Nginx Setup (3 minutes)

```bash
# Install Nginx
sudo apt-get update && sudo apt-get install nginx -y

# Copy config
sudo cp nginx-chatapi.conf /etc/nginx/sites-available/chatapi.pino7.com
sudo ln -s /etc/nginx/sites-available/chatapi.pino7.com /etc/nginx/sites-enabled/

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

### 6️⃣ SSL Certificate (2 minutes)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d chatapi.pino7.com -d www.chatapi.pino7.com
```

### 7️⃣ Start Application (1 minute)

```bash
# Install PM2
sudo npm install -g pm2

# Create logs directory
mkdir -p logs

# Start app
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup startup
pm2 startup
```

### 8️⃣ Verify (30 seconds)

```bash
# Check PM2
pm2 status

# Test locally
curl http://localhost:9002

# Test domain
curl https://chatapi.pino7.com
```

---

## 🔥 One-Command Production Setup

```bash
cd /var/www/social-backend && \
npm install && \
npm run prisma:generate && \
npm run build && \
echo "✅ Setup complete! Now configure .env and run database setup"
```

---

## 📋 Pre-Deployment Checklist

- [ ] Domain DNS A record points to server IP
- [ ] PostgreSQL installed and running
- [ ] Node.js 18+ installed
- [ ] Port 80, 443 open in firewall
- [ ] .env file configured with production values
- [ ] Database created and migrations run
- [ ] SSL certificate obtained
- [ ] PM2 running the application

---

## 🚨 Critical Configuration

### Update .env (REQUIRED!)

```env
DATABASE_URL="postgresql://social_user:YOUR_PASSWORD@localhost:5432/social_production?schema=public"
JWT_SECRET='YOUR_STRONG_RANDOM_SECRET_HERE'
```

### Generate Strong JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🛠️ Quick Commands

```bash
# View logs
pm2 logs social-backend

# Restart app
pm2 restart social-backend

# Check status
pm2 status

# Nginx logs
sudo tail -f /var/log/nginx/chatapi.pino7.com.error.log
```

---

## 📞 Having Issues?

See full documentation: [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

---

## ✅ Current Status

- ✅ Dependencies installed
- ✅ Prisma client generated
- ✅ Application built
- ✅ PM2 config ready
- ✅ Nginx config created
- ⚠️ Need to configure .env
- ⚠️ Need to setup database
- ⚠️ Need to run migrations
- ⚠️ Need to install SSL
- ⚠️ Need to start with PM2
