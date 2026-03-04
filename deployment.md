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

# Run the container (replace with your actual Sarvam API key)
docker run -d \
  --name bolkar \
  --restart unless-stopped \
  -p 3000:3000 \
  -e SARVAM_API_KEY=your_sarvam_api_key \
  bolkar
```

## Step 4: Expose via HTTPS (required for mic on mobile)

Install cloudflared on the VM:

```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

Start the tunnel (no account needed):

```bash
cloudflared tunnel --url http://localhost:3000
```

It will print a public HTTPS URL like:
```
https://abc-def-ghi.trycloudflare.com
```

Open that URL on your phone — mic will work.

---

## Updating the app

```bash
# On your Mac — rebuild and re-export
docker build --platform linux/amd64 -t bolkar .
docker save bolkar | gzip > bolkar.tar.gz

# Copy again
gcloud compute scp bolkar.tar.gz YOUR_VM_NAME:~ \
  --zone=YOUR_ZONE \
  --project=YOUR_PROJECT_ID

# On the VM — reload and restart
docker load < bolkar.tar.gz
docker restart bolkar
```

---

## Keeping cloudflared running across SSH sessions

Run it in the background with `nohup`:

```bash
nohup cloudflared tunnel --url http://localhost:3000 > tunnel.log 2>&1 &
```

Check the assigned URL:

```bash
cat tunnel.log
```
