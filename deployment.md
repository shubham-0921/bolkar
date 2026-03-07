# Bolkar — Deployment Guide (GCP VM via Docker)

## Prerequisites
- Docker installed locally and on the VM
- `gcloud` CLI authenticated
- Your VM name, zone, and project handy

---

## Step 1: Build & export the image locally

```bash
# Build for AMD64 (GCP VM) — required if you're on Apple Silicon
docker build --platform linux/amd64 -t bolkar .

# Export to a tar file
docker save bolkar | gzip > bolkar.tar.gz
```

## Step 2: Copy to GCP VM

```bash
gcloud compute scp bolkar.tar.gz vm2:~ \
  --zone=us-central1-c \
  --project=project-796df5af-a68e-4648-a8f
```

## Step 3: SSH into the VM and run the container

```bash
gcloud compute ssh vm2 --zone=us-central1-c --project=project-796df5af-a68e-4648-a8f
```

Once inside the VM:

```bash
# Load the image
docker load < bolkar.tar.gz

# Run the container — bind to localhost only (Nginx will proxy)
docker run -d \
  --name bolkar \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -e SARVAM_API_KEY=your_sarvam_api_key \
  -e DATABASE_URL="postgresql://postgres:your_password@your-db-host/bolkar" \
  -e BETTER_AUTH_SECRET=your_better_auth_secret \
  -e BETTER_AUTH_URL=https://your-domain.com \
  -e NEXT_PUBLIC_APP_URL=https://your-domain.com \
  -e GOOGLE_CLIENT_ID=your_google_client_id \
  -e GOOGLE_CLIENT_SECRET=your_google_client_secret \
  bolkar
```

> **Note:** `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must be your actual public domain (with HTTPS). These are used for Google OAuth redirect URIs and session cookies.

---

## Step 4: Custom domain + HTTPS

### 4a. Open ports in GCP firewall

In the GCP Console → VPC Network → Firewall → Create rule:
- Name: `allow-http-https`
- Direction: Ingress
- Targets: All instances (or tag your VM)
- Source IP ranges: `0.0.0.0/0`
- Protocols: TCP ports `80, 443`

Or via CLI:
```bash
gcloud compute firewall-rules create allow-http-https \
  --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --project project-796df5af-a68e-4648-a8f
```

### 4b. Point your domain to the VM

Get the VM's external IP:
```bash
gcloud compute instances describe vm2 \
  --zone=us-central1-c \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

In your domain registrar's DNS settings, add:
| Type | Name | Value |
|------|------|-------|
| A    | @    | `<VM external IP>` |
| A    | www  | `<VM external IP>` |

**GoDaddy-specific steps:**
1. Go to godaddy.com → sign in → your name (top right) → **My Products**
2. Find your domain → click **DNS** button next to it
3. Look for an `A` record with Name `@` → click the pencil/edit icon (or ⋮ menu) and set Value to your VM IP, TTL = 600
4. If no `@` A record exists, click **Add New Record** at the bottom
5. Add a second `A` record: Name `www`, Value = same VM IP, TTL = 600
6. Click **Save** — GoDaddy requires an explicit save

**Check DNS propagation (on the VM):**
```bash
# Install if needed
sudo apt install -y dnsutils

# Check against Google's DNS — must return your VM IP before running certbot
nslookup bolkar.online 8.8.8.8

# Also verify your VM IP is correct
curl ifconfig.me
```

**If nslookup returns NXDOMAIN:**
- The A record wasn't saved in GoDaddy — go back and re-add it
- Or the domain was just purchased and needs up to 24h to activate globally

**If nslookup returns GoDaddy's parking IPs:**
- DNS is propagating — wait 15–30 min and check again

### 4c. Install Nginx and Certbot on the VM

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 4d. Create Nginx config

> **Important:** Use HTTP-only config first. Do NOT include the SSL server block yet — the certs
> don't exist until certbot runs in the next step. Certbot will auto-add the SSL block.

```bash
sudo nano /etc/nginx/sites-available/bolkar
```

Paste:
```nginx
server {
    listen 80;
    server_name bolkar.online www.bolkar.online;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it and remove the default site (important if the VM has other apps — otherwise the default
nginx site will intercept all traffic):
```bash
sudo ln -s /etc/nginx/sites-available/bolkar /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

**Verify nginx can reach the container before getting certs:**
```bash
curl -I -H "Host: bolkar.online" http://127.0.0.1
# Should return HTTP/1.1 200 OK
```

### 4e. Get SSL certificate

```bash
sudo certbot --nginx -d bolkar.online -d www.bolkar.online
```

Certbot will auto-edit your Nginx config (adding the SSL server block and HTTPS redirect) and
handle renewal via a systemd timer. Verify auto-renewal works:
```bash
sudo certbot renew --dry-run
```

Your site is now live at `https://bolkar.online`.

**Test before DNS propagates to your local machine:**
```bash
# From your Mac — if this returns a redirect, everything is wired correctly
curl -I -H "Host: bolkar.online" http://<VM external IP>
# Or flush your Mac's DNS cache:
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

---

## Step 5: Google OAuth setup for production

Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → your OAuth 2.0 Client ID.

Add the following:

**Authorized JavaScript origins:**
```
https://bolkar.online
https://www.bolkar.online
```

**Authorized redirect URIs:**
```
https://bolkar.online/api/auth/callback/google
https://www.bolkar.online/api/auth/callback/google
```

Click **Save**. OAuth will start working immediately — no redeploy needed.

> **Mobile OAuth:** The Android app also uses this same OAuth client. No additional Google Console config is needed for mobile — it goes through the web OAuth flow via `expo-web-browser` pointing at `https://bolkar.online`.

---

## Mobile development setup

After adding new packages to `mobile/package.json`, you must run `npm install` inside the `mobile/` directory before building. The root `node_modules` is separate — forgetting this causes `expo run:android` to exit silently with no error.

```bash
cd mobile && npm install
npm run android
```

---

## Step 6: Update mobile app for production

In `mobile/src/screens/HomeScreen.tsx`, change the default backend URL to the production domain:

```ts
const DEFAULT_BACKEND_URL = 'https://bolkar.online';
```

Rebuild and redeploy the Android APK after this change.

---

## Updating the app

```bash
# On your Mac — rebuild and re-export
docker build --platform linux/amd64 -t bolkar .
docker save bolkar | gzip > bolkar.tar.gz

# Copy again
gcloud compute scp bolkar.tar.gz vm2:~ \
  --zone=us-central1-c \
  --project=project-796df5af-a68e-4648-a8f

# On the VM — reload and restart
docker load < bolkar.tar.gz
docker stop bolkar && docker rm bolkar
docker run -d \
  --name bolkar \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -e SARVAM_API_KEY=your_sarvam_api_key \
  -e DATABASE_URL="postgresql://postgres:SinCos%401998@35.200.237.127/bolkar?sslmode=require" \
  -e BETTER_AUTH_SECRET=your_better_auth_secret \
  -e BETTER_AUTH_URL=https://bolkar.online \
  -e NEXT_PUBLIC_APP_URL=https://bolkar.online \
  -e GOOGLE_CLIENT_ID=your_google_client_id \
  -e GOOGLE_CLIENT_SECRET=your_google_client_secret \
  bolkar
```

---

## Quick reference: useful VM commands

```bash
# Check container logs
docker logs bolkar -f

# Check Nginx status
sudo systemctl status nginx

# Check SSL cert expiry
sudo certbot certificates

# Restart Nginx
sudo systemctl restart nginx
```
