# Sports Plus + n8n - VPS Docker Deployment Guide

Complete guide to deploy both apps using Docker on Ubuntu VPS.

---

## Prerequisites

- Ubuntu 20.04/22.04 VPS (KVM 2)
- Root/SSH access
- Domain names configured (api.yourdomain.com, n8n.yourdomain.com)

---

## Phase 1: Initial Server Setup (5 minutes)

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git nano ufw
```

---

## Phase 2: Install Docker & Docker Compose (10 minutes)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (optional, for non-root usage)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

## Phase 3: Deploy Applications (15 minutes)

```bash
# Create app directory
sudo mkdir -p /var/www/sports-plus
sudo chown -R $USER:$USER /var/www/sports-plus
cd /var/www/sports-plus

# Clone repository
git clone https://github.com/Yahya2345/sports-plus-deal-search.git .

# Create .env file from your current values
nano .env
# Paste all your environment variables
# Add these additional variables:
#   POSTGRES_PASSWORD=your_secure_password
#   N8N_HOST=n8n.yourdomain.com
#   N8N_ENCRYPTION_KEY=your_32_char_random_string
# Save: Ctrl+X, Y, Enter

# Build and start all containers
docker-compose up -d --build

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f
# Press Ctrl+C to stop viewing logs
```

---

## Phase 4: Install & Configure Nginx (10 minutes)

```bash
# Install Nginx
sudo apt install -y nginx

# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Create config for Sports Plus API
sudo nano /etc/nginx/sites-available/sports-plus-api
```

**Paste this config:**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Create config for n8n
sudo nano /etc/nginx/sites-available/n8n
```

**Paste this config:**

```nginx
server {
    listen 80;
    server_name n8n.yourdomain.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}
```

```bash
# Enable both sites
sudo ln -s /etc/nginx/sites-available/sports-plus-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Phase 5: Configure Firewall (2 minutes)

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

---

## Phase 6: Setup SSL Certificates (5 minutes)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL for Sports Plus API
sudo certbot --nginx -d api.yourdomain.com

# Get SSL for n8n
sudo certbot --nginx -d n8n.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Phase 7: Configure DNS (5 minutes)

Go to your domain provider and add these A records:

```
Type | Name | Value (VPS IP) | TTL
-----|------|----------------|-----
A    | api  | YOUR_VPS_IP    | 3600
A    | n8n  | YOUR_VPS_IP    | 3600
```

Wait 5-10 minutes for DNS propagation.

---

## Verification & Management

### Check Container Status

```bash
# View running containers
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f sports-plus-api
docker-compose logs -f n8n
docker-compose logs -f postgres
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart sports-plus-api
docker-compose restart n8n
```

### Update Application

```bash
# Pull latest code from GitHub
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

### Stop All Services

```bash
docker-compose down
```

### Stop and Remove All Data

```bash
# WARNING: This deletes database data!
docker-compose down -v
```

---

## Access Your Applications

| Service | URL | Purpose |
|---------|-----|---------|
| **Sports Plus API** | https://api.yourdomain.com | Deal search portal |
| **n8n Dashboard** | https://n8n.yourdomain.com | Automation workflows |

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs sports-plus-api

# Check if port is in use
sudo netstat -tuln | grep -E '3000|5678'
```

### Can't connect to service

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t
```

### Reset everything

```bash
# Stop and remove all containers
docker-compose down -v

# Remove all Docker images
docker system prune -a

# Start fresh
docker-compose up -d --build
```

---

## Automatic Updates

Add this to crontab for automatic container restarts:

```bash
# Edit crontab
crontab -e

# Add this line (restarts containers daily at 3 AM)
0 3 * * * cd /var/www/sports-plus && /usr/local/bin/docker-compose restart
```

---

## Security Best Practices

1. **Change default passwords** in .env file
2. **Keep system updated**: `sudo apt update && sudo apt upgrade`
3. **Monitor logs regularly**: `docker-compose logs -f`
4. **Backup database**: `docker exec n8n-postgres pg_dump -U n8n_user n8n > backup.sql`
5. **Use strong encryption keys** for n8n

---

## Performance Optimization

### For KVM 2 (2GB RAM):

```yaml
# Add to docker-compose.yml under each service:
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

---

## Monitoring

```bash
# Watch resource usage
docker stats

# Check disk space
df -h

# Check container health
docker inspect sports-plus-api | grep -A 10 Health
```

---

## Backup & Restore

### Backup

```bash
# Backup PostgreSQL database
docker exec n8n-postgres pg_dump -U n8n_user n8n > n8n_backup_$(date +%Y%m%d).sql

# Backup n8n data volume
docker run --rm -v sports-plus_n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n_data_backup.tar.gz /data
```

### Restore

```bash
# Restore PostgreSQL database
cat n8n_backup_20260113.sql | docker exec -i n8n-postgres psql -U n8n_user n8n
```

---

## Support

- Check logs: `docker-compose logs -f`
- Verify .env file has all required variables
- Ensure DNS records are correct
- Wait 5-10 minutes after DNS changes

**Setup Time: ~45 minutes**
**No Node.js installation required on host!**
