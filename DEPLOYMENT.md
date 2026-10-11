# 🚀 ProofHire AI — Cloud Deployment Guide

This guide details how to deploy the **ProofHire AI Adaptive Interview Intelligence Platform** to live production with free HTTPS hosting.

---

## 🏗️ Architecture Overview for Production

The platform is configured as a **single unified containerized application**:
- The **React 19 + TypeScript frontend** is built into static assets (`frontend/dist`).
- The **FastAPI backend** serves both the REST API (`/api/*`) and the built React SPA (`/`) on a single port (`$PORT`).
- No separate frontend hosting is required (unless desired).

---

## 🌟 Option 1: 1-Click Deployment on Render.com (Recommended Free Hosting)

[Render](https://render.com) provides free cloud hosting with automatic SSL (HTTPS), continuous deployment from GitHub, and Docker container support.

### Step-by-Step Instructions:

1. **Sign in to Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com/) and sign in with your GitHub account.

2. **Create New Web Service**:
   - Click the **New +** button in the top right $\rightarrow$ select **Web Service**.
   - Choose **Build and deploy from a Git repository**.
   - Select your repository: `vu241fa04c70-tech/Adaptive-Interview-Intelligence`.
     *(If it doesn't appear, click "Configure account" to grant Render access to the repo).*

3. **Configure Service Details**:
   - **Name**: `proofhire-ai` (or your preferred name).
   - **Region**: Choose closest to you (e.g. *Oregon* or *Frankfurt*).
   - **Branch**: `main`.
   - **Runtime**: **Docker** *(Render will automatically detect the root `Dockerfile`)*.
   - **Instance Type**: **Free**.

4. **Add Environment Variables**:
   Click **Advanced** $\rightarrow$ **Add Environment Variable** and add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `GEMINI_API_KEY` | `your_gemini_api_key` | Your Google Gemini API Key |
   | `GEMINI_MODEL` | `gemini-flash-lite-latest` | High-availability active model |
   | `JWT_SECRET_KEY` | *(Click "Generate" or enter random string)* | Secret for auth tokens |
   | `SMTP_HOST` | `smtp.gmail.com` | Gmail SMTP server |
   | `SMTP_PORT` | `587` | TLS port |
   | `SMTP_USER` | `your_email@gmail.com` | Your Gmail address |
   | `SMTP_PASSWORD` | `your_16_char_app_password` | Gmail App Password (no spaces) |
   | `SMTP_FROM_EMAIL` | `your_email@gmail.com` | Sender address |
   | `SMTP_FROM_NAME` | `ProofHire AI` | Sender display name |

5. **Deploy**:
   - Click **Create Web Service**.
   - Render will build the Docker container and deploy it in 2-3 minutes.
   - Your live public HTTPS URL will be:  
     `https://proofhire-ai.onrender.com`

---

## 🚂 Option 2: Deploy on Railway.app

[Railway](https://railway.app) provides fast containerized deployments with automatic GitHub synchronization.

1. Sign in to [Railway.app](https://railway.app/) using GitHub.
2. Click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
3. Select `Adaptive-Interview-Intelligence`.
4. Railway will automatically detect the root `Dockerfile` and start building.
5. In the **Variables** tab, add your environment variables (`GEMINI_API_KEY`, `SMTP_USER`, `SMTP_PASSWORD`).
6. In **Settings** $\rightarrow$ **Networking**, click **Generate Domain** to get your public HTTPS URL (e.g., `https://adaptive-interview.up.railway.app`).

---

## ☁️ Option 3: Deploy on Google Cloud Run

If deploying to Google Cloud:

```bash
# 1. Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Build and deploy container directly
gcloud run deploy proofhire-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_MODEL=gemini-flash-lite-latest,GEMINI_API_KEY=YOUR_KEY
```

---

## ⚡ Option 4: Local Docker Container

To run the complete production container locally:

```bash
# 1. Build Docker image
docker build -t proofhire-ai .

# 2. Run container on port 8000
docker run -p 8000:8000 --env-file backend/.env proofhire-ai
```
Visit `http://localhost:8000` in your browser.
