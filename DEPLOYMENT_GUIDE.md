# Deployment Guide - Render.com

This guide will walk you through deploying the Supplier Onboarding Portal to Render.com.

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **MongoDB Atlas Account** - For production database (free tier available)

## Step 1: Prepare MongoDB Atlas (Production Database)

### 1.1 Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new **Free Tier** cluster
4. Choose a cloud provider and region (preferably same as your Render region)
5. Wait for cluster creation (2-3 minutes)

### 1.2 Configure Database Access

1. In Atlas, go to **Database Access**
2. Click **Add New Database User**
3. Create a user with username and password (save these!)
4. Set privileges to **Read and write to any database**

### 1.3 Configure Network Access

1. Go to **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (0.0.0.0/0)
4. Confirm

### 1.4 Get Connection String

1. Click **Connect** on your cluster
2. Choose **Connect your application**
3. Copy the connection string (looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`)
4. Replace `<password>` with your actual password
5. Add database name at the end: `mongodb+srv://<YOUR_USERNAME>:<YOUR_PASSWORD>@cluster0.xxxxx.mongodb.net/supplier-onboarding`

## Step 2: Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/supplier-onboarding.git

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. **Connect GitHub Repository**
   - Log in to [Render Dashboard](https://dashboard.render.com)
   - Click **New** → **Blueprint**
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml`

2. **Configure Environment Variables**
   
   The blueprint will prompt you to set these variables:

   **For Backend (supplier-onboarding-api):**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: (Auto-generated or set your own secure random string)
   - `EMAIL_HOST`: Your SMTP host (e.g., smtp.gmail.com)
   - `EMAIL_USER`: Your email address
   - `EMAIL_PASSWORD`: Your email password or app password

3. **Deploy**
   - Click **Apply**
   - Render will deploy both backend and frontend

### Option B: Manual Deployment

#### 3.1 Deploy Backend API

1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `supplier-onboarding-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=8000
   MONGODB_URI=<your-mongodb-atlas-uri>
   JWT_SECRET=<your-secure-random-string>
   JWT_EXPIRE=7d
   CLIENT_URL=https://supplier-onboarding-portal.onrender.com
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=<your-email>
   EMAIL_PASSWORD=<your-email-password>
   ```

5. Click **Create Web Service**
6. Wait for deployment (5-10 minutes)
7. **Copy your backend URL** (e.g., `https://supplier-onboarding-api.onrender.com`)

#### 3.2 Deploy Frontend

1. Click **New** → **Static Site**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `supplier-onboarding-portal`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/build`

4. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://supplier-onboarding-api.onrender.com
   ```
   (Replace with your actual backend URL from step 3.1.7)

5. Click **Create Static Site**
6. Wait for deployment (5-10 minutes)

## Step 4: Configure Backend with Frontend URL

1. Go back to your backend service settings
2. Update the `CLIENT_URL` environment variable with your frontend URL
3. Click **Save Changes** (this will redeploy)

## Step 5: Seed Initial Admin User

After both services are deployed:

1. In your local terminal, update the `createAdmin.js` script to use production MongoDB:
   
   ```bash
   # Temporarily set production DB
   export MONGODB_URI="<your-production-mongodb-uri>"
   
   # Run seed script
   node server/seeds/createAdmin.js
   ```

2. Or use Render's Shell:
   - Go to your backend service
   - Click **Shell** tab
   - Run: `node seeds/createAdmin.js`

## Step 6: Test Your Deployment

1. Visit your frontend URL (e.g., `https://supplier-onboarding-portal.onrender.com`)
2. Try logging in with admin credentials:
   - Email: `admin@betika.com`
   - Password: `Admin@123`
3. Test supplier registration
4. Test uploading documents

## Important Notes

### Free Tier Limitations

- **Spin Down**: Free services spin down after 15 minutes of inactivity
- **First Request**: May take 30-50 seconds to spin up
- **Upgrade**: Consider upgrading to paid tier for production use

### Environment Variables

Store sensitive variables securely:
- Never commit `.env` files to GitHub
- Use Render's environment variable feature
- Rotate secrets regularly

### Custom Domain (Optional)

1. Purchase a domain (e.g., from Namecheap, Google Domains)
2. In Render, go to your static site settings
3. Click **Custom Domain**
4. Follow Render's instructions to add DNS records

### Email Configuration

For Gmail:
1. Enable 2-Factor Authentication
2. Generate an **App Password**
3. Use app password in `EMAIL_PASSWORD`

For other providers, use their SMTP settings.

### Database Backups

MongoDB Atlas automatically backs up your data on free tier, but:
1. Set up regular exports for critical data
2. Monitor database size (free tier: 512MB limit)
3. Consider upgrading for production use

## Troubleshooting

### Backend Won't Start

**Check logs:**
- Go to backend service → **Logs** tab
- Look for errors

**Common issues:**
- Invalid MongoDB URI
- Missing environment variables
- Port conflicts (ensure PORT=8000)

### Frontend Can't Connect to Backend

**Check:**
1. `REACT_APP_API_URL` is set correctly
2. Backend is running (visit `/api/health`)
3. CORS is configured (should allow your frontend URL)

**Test backend:**
```bash
curl https://your-backend-url.onrender.com/api/health
```

### Database Connection Errors

**Check:**
1. MongoDB Atlas network access allows all IPs (0.0.0.0/0)
2. Database user credentials are correct
3. Connection string includes database name

### Email Not Sending

**Check:**
1. SMTP credentials are correct
2. Email provider allows less secure apps or use app password
3. Check backend logs for email errors

## Monitoring

### Render Dashboard

- Monitor service health
- View logs in real-time
- Track deployments

### MongoDB Atlas

- Monitor database performance
- Check connection counts
- Review query performance

## Updating Your Application

### Automatic Deploys

Render automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render will:
1. Detect the push
2. Rebuild and redeploy
3. Show status in dashboard

### Manual Deploy

In Render dashboard:
1. Go to your service
2. Click **Manual Deploy**
3. Select branch
4. Click **Deploy**

## Cost Optimization

### Free Tier Strategy

- Keep both services on free tier for testing
- Expect spin-down delays
- Limit to 750 hours/month per service

### Production Recommendations

Upgrade to paid tier for:
- **Backend**: $7/month (Starter plan)
  - No spin down
  - 512MB RAM
  - Better performance

- **Frontend**: Free tier is usually sufficient for static sites

- **Database**: MongoDB Atlas M2 tier ($9/month)
  - Better performance
  - More storage
  - Automated backups

## Security Checklist

- [ ] Strong JWT_SECRET (min 32 characters)
- [ ] MongoDB user has limited privileges
- [ ] CORS configured with actual frontend URL
- [ ] Email credentials secured
- [ ] All environment variables set
- [ ] .env files not in repository
- [ ] Admin password changed from default
- [ ] Rate limiting enabled
- [ ] HTTPS enabled (automatic on Render)

## Support

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Project Issues**: Create issue on GitHub repository

---

## Quick Reference

**Backend URL**: `https://supplier-onboarding-api.onrender.com`
**Frontend URL**: `https://supplier-onboarding-portal.onrender.com`
**Health Check**: `https://supplier-onboarding-api.onrender.com/api/health`

**Admin Login**:
- Email: `admin@betika.com`
- Password: `Admin@123` (change after first login!)

---

**Ready to deploy? Follow the steps above and your app will be live in ~20 minutes!** 🚀

