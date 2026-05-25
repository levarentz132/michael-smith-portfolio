# Deployment Guide for aaPanel

This guide will help you deploy the Michael Smith Portfolio website to aaPanel.

## Prerequisites

- aaPanel installed on your server
- Node.js 18+ installed via aaPanel
- MySQL database created via aaPanel
- Domain name pointed to your server (optional but recommended)

## Step 1: Prepare Your Project for Production

### 1.1 Build the Frontend

On your local machine, run:
```bash
npm run build
```

This creates a `dist` folder with the production-ready frontend files.

### 1.2 Update server.js for Production

The server needs to serve the built frontend files in production. Add this code to your `server.js` after the middleware setup.

## Step 2: Upload Files to aaPanel

### 2.1 Create Website in aaPanel

1. Log in to aaPanel
2. Go to **Website** → **Add Site**
3. Enter your domain name (e.g., `michaelsmith.com`)
4. Select **PHP** or **Static** (we'll configure Node.js separately)
5. Click **Submit**

### 2.2 Upload Project Files

Upload your project to the website directory (usually `/www/wwwroot/yourdomain.com/`):

**Option A: Using FTP/SFTP**
- Use FileZilla or any FTP client
- Connect using credentials from aaPanel
- Upload all project files

**Option B: Using aaPanel File Manager**
1. Go to **Files** in aaPanel
2. Navigate to `/www/wwwroot/yourdomain.com/`
3. Upload your project as a ZIP file
4. Extract it in the file manager

### 2.3 Files to Upload

Upload these files and folders:
- `server.js`
- `package.json`
- `ecosystem.config.cjs`
- `.env` (create from .env.example)
- `dist/` (built frontend)
- `uploads/` directory
- All database scripts if needed

**Important:** Do NOT upload `node_modules` - we'll install them on the server.

## Step 3: Set Up MySQL Database

### 3.1 Create Database in aaPanel

1. Go to **Database** in aaPanel
2. Click **Add Database**
3. Database name: `highlanderstay`
4. Username: Create a user (e.g., `highlanderuser`)
5. Password: Set a strong password
6. Click **Submit**

### 3.2 Note Database Credentials

Write down:
- Database Host: `localhost`
- Database Name: `highlanderstay`
- Username: `highlanderuser`
- Password: (your password)
- Port: `3306`

## Step 4: Configure Environment Variables

### 4.1 Create .env File

In your project directory on the server, create a `.env` file:

```bash
cd /www/wwwroot/yourdomain.com
nano .env
```

Add your configuration:
```env
DB_HOST=localhost
DB_USER=highlanderuser
DB_PASSWORD=your_database_password
DB_NAME=highlanderstay
DB_PORT=3306
PORT=5000
NODE_ENV=production
```

Save the file (Ctrl+X, then Y, then Enter).

## Step 5: Install Dependencies

### 5.1 SSH into Your Server

Use aaPanel's terminal or SSH client:
```bash
ssh root@your_server_ip
```

### 5.2 Navigate to Project Directory

```bash
cd /www/wwwroot/yourdomain.com
```

### 5.3 Install Node.js Packages

```bash
npm install --production
```

## Step 6: Install and Configure PM2

### 6.1 Install PM2 Globally

```bash
npm install -g pm2
```

### 6.2 Start Application with PM2

```bash
pm2 start ecosystem.config.cjs
```

### 6.3 Configure PM2 Startup

To make your app start on server reboot:
```bash
pm2 startup
pm2 save
```

### 6.4 Useful PM2 Commands

```bash
pm2 list              # Show all running apps
pm2 logs              # Show logs
pm2 restart all       # Restart all apps
pm2 stop all          # Stop all apps
pm2 delete all        # Remove all apps from PM2
```

## Step 7: Configure Reverse Proxy in aaPanel

### 7.1 Set Up Reverse Proxy

1. Go to **Website** in aaPanel
2. Click on your site name
3. Go to **Reverse Proxy** tab
4. Click **Add Reverse Proxy**
5. Configure:
   - **Proxy Name**: Portfolio Backend
   - **Target URL**: `http://127.0.0.1:5000`
   - **Send Domain**: `$host`
   - **Proxy Directory**: `/` (or leave empty)
6. Click **Submit**

### 7.2 Configure Static Files

If the reverse proxy causes issues with static files, you may need to add specific location rules:

1. In the site settings, go to **Config Files**
2. Find the Nginx configuration
3. Add before the proxy location:

```nginx
location /uploads {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location /api {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Step 8: Configure Firewall

### 8.1 Open Required Ports in aaPanel

1. Go to **Security** in aaPanel
2. Add rule to allow port 5000 (for local access only)
3. Ensure ports 80 and 443 are open for web traffic

## Step 9: Set Up SSL (Optional but Recommended)

### 9.1 Install SSL Certificate

1. Go to your site settings in aaPanel
2. Click **SSL** tab
3. Choose one of:
   - **Let's Encrypt** (Free, recommended)
   - **Custom certificate**
4. Follow the wizard to install SSL
5. Enable **Force HTTPS**

## Step 10: Test Your Deployment

### 10.1 Check if Backend is Running

```bash
pm2 status
curl http://localhost:5000/api/settings
```

### 10.2 Access Your Website

Visit your domain in a browser:
```
https://yourdomain.com
```

### 10.3 Test Admin Panel

Visit:
```
https://yourdomain.com (navigate to admin panel)
```

## Troubleshooting

### Issue: Can't connect to database
- Check `.env` file has correct credentials
- Verify database exists in aaPanel
- Check MySQL is running: `systemctl status mysql`

### Issue: Port 5000 in use
- Change PORT in `.env` to another port (e.g., 5001)
- Update reverse proxy configuration
- Restart PM2: `pm2 restart all`

### Issue: Permission errors with uploads
```bash
chmod 755 /www/wwwroot/yourdomain.com/uploads
chown -R www:www /www/wwwroot/yourdomain.com/uploads
```

### Issue: Frontend not loading
- Check if `dist` folder exists and has files
- Verify server.js is serving static files
- Check Nginx error logs: `/www/wwwlogs/yourdomain.com.error.log`

### Issue: Module not found errors
- Reinstall dependencies: `npm install --production`
- Check Node.js version: `node --version` (should be 18+)

## Updating Your Application

When you need to update your site:

1. **Build new version locally:**
   ```bash
   npm run build
   ```

2. **Upload new files via FTP/aaPanel File Manager**

3. **Restart PM2:**
   ```bash
   pm2 restart michael-smith-portfolio
   ```

## Maintenance Commands

```bash
# View logs
pm2 logs

# Monitor resources
pm2 monit

# Restart app
pm2 restart michael-smith-portfolio

# Stop app
pm2 stop michael-smith-portfolio

# Clear logs
pm2 flush
```

## Backup Strategy

### Regular Backups

1. **Database Backup** (via aaPanel):
   - Go to **Database** → Select database → **Backup**

2. **Files Backup**:
   ```bash
   tar -czf backup-$(date +%Y%m%d).tar.gz /www/wwwroot/yourdomain.com
   ```

## Support

If you encounter issues:
- Check PM2 logs: `pm2 logs`
- Check Nginx error logs in aaPanel
- Verify all environment variables are set correctly
- Ensure database connection is working

## Security Recommendations

1. Use strong passwords for database and admin accounts
2. Keep Node.js and packages updated
3. Enable firewall rules
4. Use HTTPS only
5. Regular backups
6. Restrict database access to localhost only
