# DocVerify Production Deployment Guide

## Overview
This guide covers deploying DocVerify to production using free tier services.

## Architecture
- **Frontend**: Vercel (Free tier - 100GB bandwidth/month)
- **Backend**: Render (Free tier - 750 hours/month)
- **Database**: MongoDB Atlas (Free tier - 512MB)
- **Cache**: Redis Cloud (Free tier - 30MB) or In-memory fallback
- **Storage**: Cloudinary (Free tier - 25GB)
- **Blockchain**: Polygon Amoy Testnet (Free forever)

---

## Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (choose FREE M0 tier)
4. Create a database user with read/write access
5. Whitelist IP address `0.0.0.0/0` for universal access
6. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/docverify
   ```

---

## Step 2: Cloudinary Setup

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Go to Dashboard → Settings
4. Copy your `CLOUDINARY_URL` from the Account Details section
   ```
   cloudinary://API_KEY:API_SECRET@CLOUD_NAME
   ```

---

## Step 3: Redis Cloud Setup (Optional)

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create a free account
3. Create a new database (Free tier)
4. Get your Redis URL:
   ```
   redis://default:<password>@<host>:<port>
   ```

> Note: Redis is optional. The system falls back to in-memory caching if Redis is unavailable.

---

## Step 4: OpenAI API Setup (Optional)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account and add billing information
3. Generate an API key
4. Add credits ($5-10 is sufficient for testing)

> Note: AI extraction falls back to regex-based extraction if OpenAI is not configured.

---

## Step 5: Deploy Backend to Render

1. Go to [Render](https://render.com/)
2. Connect your GitHub repository
3. Create a new **Web Service**
4. Configure:
   - **Name**: docverify-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=<your-mongodb-atlas-uri>
   JWT_SECRET=<generate-a-secure-random-string>
   CLOUDINARY_URL=<your-cloudinary-url>
   OPENAI_API_KEY=<your-openai-key> (optional)
   REDIS_URL=<your-redis-url> (optional)
   FRONTEND_URL=https://your-app.vercel.app
   ```

6. Deploy and note your backend URL (e.g., `https://docverify-backend.onrender.com`)

---

## Step 6: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com/)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add Environment Variables:
   ```
   VITE_API_URL=https://docverify-backend.onrender.com/api
   VITE_GOOGLE_CLIENT_ID=<your-google-client-id> (optional)
   ```

5. Deploy!

---

## Step 7: Configure OAuth (Optional)

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://docverify-backend.onrender.com/api/auth/google/callback`
6. Add to backend environment:
   ```
   GOOGLE_CLIENT_ID=<client-id>
   GOOGLE_CLIENT_SECRET=<client-secret>
   GOOGLE_CALLBACK_URL=https://docverify-backend.onrender.com/api/auth/google/callback
   ```

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL:
   - `https://docverify-backend.onrender.com/api/auth/github/callback`
4. Add to backend environment:
   ```
   GITHUB_CLIENT_ID=<client-id>
   GITHUB_CLIENT_SECRET=<client-secret>
   GITHUB_CALLBACK_URL=https://docverify-backend.onrender.com/api/auth/github/callback
   ```

---

## Step 8: Blockchain Setup (Polygon Amoy)

1. Get testnet MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
2. Update backend environment:
   ```
   BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
   BLOCKCHAIN_PRIVATE_KEY=<your-wallet-private-key>
   ```
3. Deploy contract to Amoy:
   ```bash
   cd blockchain
   npx hardhat run scripts/deploy.js --network amoy
   ```
4. Update `backend/contracts/DocVerify.json` with new contract address

---

## Cost Summary (Free Tier)

| Service | Cost | Limits |
|---------|------|--------|
| Vercel | $0 | 100GB bandwidth |
| Render | $0 | 750 hours/month |
| MongoDB Atlas | $0 | 512MB storage |
| Cloudinary | $0 | 25GB storage |
| Redis Cloud | $0 | 30MB storage |
| Polygon Amoy | $0 | Testnet (free forever) |
| **Total** | **$0** | |

---

## Troubleshooting

### Backend not starting
- Check Render logs for errors
- Verify all environment variables are set
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0`

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify `VITE_API_URL` is correct
- Check browser console for errors

### Blockchain not connecting
- Verify RPC URL is correct
- Check wallet has testnet MATIC
- Verify contract is deployed to correct network

---

## Production Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Cloudinary account configured
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] OAuth providers configured (optional)
- [ ] Blockchain contract deployed (optional)
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active (automatic on Vercel/Render)
