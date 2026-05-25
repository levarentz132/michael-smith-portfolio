# aaPanel Deployment Quick Guide

## 📋 Pre-Deployment Checklist

- [ ] aaPanel installed on your server
- [ ] Node.js 18+ installed in aaPanel (App Store → Node.js)
- [ ] MySQL database created in aaPanel
- [ ] Domain pointed to your server
- [ ] SSH/Terminal access to server

## 🚀 Quick Deployment Steps

### 1. Build Your Project Locally

```bash
npm run build
```

### 2. Prepare Files to Upload

Upload these to your server (via FTP or aaPanel File Manager):

**Required Files:**
- `dist/` folder (entire folder with all contents)
- `server.js`
- `package.json`
- `ecosystem.config.cjs`
- `.env` (create from .env.example with your settings)
- `uploads/` folder (create empty if it doesn't exist)

**Location:** `/www/wwwroot/yourdomain.com/`

### 3. Create Database in aaPanel

1. **Database** → **Add Database**
2. Name: `highlanderstay`
3. Username: Create user
4. Password: Set strong password
5. **Submit**

### 4. Configure Environment (.env file)

SSH into your server and create/edit `.env`:

```bash
cd /www/wwwroot/yourdomain.com
nano .env
```

Add:
```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=highlanderstay
DB_PORT=3306
PORT=5000
NODE_ENV=production
```

Save: `Ctrl+X` → `Y` → `Enter`

### 5. Install Dependencies

```bash
npm install --production
```

### 6. Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start app
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Enable startup on boot
pm2 startup
# Run the command it outputs
```

### 7. Configure Reverse Proxy in aaPanel

1. **Website** → Click your site
2. **Reverse Proxy** tab
3. **Add Reverse Proxy**
4. Settings:
   - Proxy Name: `Portfolio`
   - Target URL: `http://127.0.0.1:5000`
   - Send Domain: `$host`
5. **Submit**

### 8. Set Up SSL (Recommended)

1. Your site → **SSL** tab
2. **Let's Encrypt** → Follow wizard
3. Enable **Force HTTPS**

### 9. Test Your Site

Visit: `https://yourdomain.com`

## 🔧 Useful Commands

```bash
# Check app status
pm2 status

# View logs
pm2 logs

# Restart app
pm2 restart michael-smith-portfolio

# Stop app
pm2 stop michael-smith-portfolio

# Monitor resources
pm2 monit
```

## 🐛 Common Issues

### Issue: "Cannot connect to database"
**Solution:**
- Verify `.env` credentials match your database
- Check database exists in aaPanel
- Test connection: `mysql -u your_user -p highlanderstay`

### Issue: "Port 5000 already in use"
**Solution:**
1. Change PORT in `.env` to another port (e.g., 5001)
2. Update reverse proxy target in aaPanel
3. Restart PM2: `pm2 restart all`

### Issue: "502 Bad Gateway"
**Solution:**
- Check if app is running: `pm2 status`
- View logs: `pm2 logs`
- Restart app: `pm2 restart all`
- Check reverse proxy settings in aaPanel

### Issue: Upload folder permission errors
**Solution:**
```bash
cd /www/wwwroot/yourdomain.com
chmod 755 uploads
chmod 755 uploads/properties
chown -R www:www uploads
```

### Issue: Frontend shows but API fails
**Solution:**
- Check reverse proxy includes `/api` path
- Verify backend is running: `curl http://localhost:5000/api/settings`
- Check Nginx error logs in aaPanel

## 📱 Updating Your Site

When you make changes:

```bash
# On your local machine
npm run build

# Upload new 'dist' folder to server

# On server, restart PM2
pm2 restart michael-smith-portfolio
```

## 🔐 Security Checklist

- [ ] Strong database password
- [ ] HTTPS/SSL enabled
- [ ] Force HTTPS enabled
- [ ] Firewall configured (ports 80, 443 open)
- [ ] `.env` file has correct permissions (chmod 600)
- [ ] Regular backups enabled

## 📚 Full Documentation

For detailed instructions, troubleshooting, and advanced configuration, see [DEPLOYMENT.md](DEPLOYMENT.md)

## 🆘 Need Help?

1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `/www/wwwlogs/yourdomain.com.error.log`
3. Verify environment variables: `cat .env`
4. Test database connection
5. Check if all services are running
