# Render Deployment Troubleshooting Guide

## Quick Fixes for Common Issues

### 502 Bad Gateway Error

**Symptoms:**
- Frontend shows 502 error when trying to login
- API requests fail
- Backend service appears down

**Solutions:**

#### 1. Check Backend Service Status
- Go to [Render Dashboard](https://dashboard.render.com)
- Click on `supplier-onboarding-api`
- Status should be **Live** (green)
- If **Failed** or **Suspended**, check logs

#### 2. Verify Environment Variables

Make sure these are set in **Backend Service → Environment**:

```
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://<YOUR_USERNAME>:<YOUR_PASSWORD>@cluster.mongodb.net/supplier-onboarding
JWT_SECRET=(auto-generated)
JWT_EXPIRE=7d
CLIENT_URL=https://supplier-onboarding-portal.onrender.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### 3. Verify Frontend Environment Variable

**Frontend Service → Environment**:
```
REACT_APP_API_URL=https://supplier-onboarding-api.onrender.com
```

#### 4. Test Health Endpoint

Visit: `https://supplier-onboarding-api.onrender.com/api/health`

**Expected:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-01-13T..."
}
```

#### 5. Free Tier Spin Down

Free services sleep after 15 minutes of inactivity:
- First request takes 30-60 seconds to "wake up"
- This is normal for free tier
- Wait and refresh
- Consider upgrading to paid tier ($7/mo) to avoid this

---

## MongoDB Connection Issues

### Error: MongooseServerSelectionError

**Fix:**

1. **Check MongoDB Atlas Network Access**
   - Go to MongoDB Atlas
   - Click **Network Access**
   - Ensure `0.0.0.0/0` is added
   - This allows connections from anywhere (including Render)

2. **Verify Database User**
   - Go to **Database Access**
   - User should have "Read and write" privileges
   - Password must match what's in `MONGODB_URI`

3. **Check Connection String Format**
   ```
   mongodb+srv://<YOUR_USERNAME>:<YOUR_PASSWORD>@cluster0.xxxxx.mongodb.net/supplier-onboarding?retryWrites=true&w=majority
   ```
   - Must include database name: `/supplier-onboarding`
   - Special characters in password must be URL-encoded
   - No spaces

---

## Build Failed Errors

### Check Build Logs

1. Go to backend service
2. Click **Logs** tab
3. Look for errors during `npm install`

**Common fixes:**
- Dependencies version conflicts
- Missing dependencies
- Node version mismatch

### Force Rebuild

1. Click **Manual Deploy** dropdown
2. Select **Clear build cache & deploy**
3. Wait 5-10 minutes

---

## CORS Errors

### Symptoms:
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Fix:**

Backend has been configured to allow your frontend origin. If you see CORS errors:

1. Check `CLIENT_URL` in backend environment variables
2. Make sure it matches your frontend URL exactly
3. No trailing slash: ✅ `https://supplier-onboarding-portal.onrender.com`
4. With trailing slash: ❌ `https://supplier-onboarding-portal.onrender.com/`

---

## JWT Secret Issues

### Error: JWT_SECRET not defined

**Fix:**

1. Go to backend service → Environment
2. Add `JWT_SECRET` if not present
3. Use a long random string (32+ characters)
4. Or let Render auto-generate it:
   - In render.yaml: `generateValue: true`

---

## Email Not Sending

### Server runs but emails don't send

**This won't prevent login!** Email errors are logged but don't crash the server.

**To fix:**

1. Verify Gmail App Password is correct
2. Check EMAIL_* environment variables
3. Look in backend logs for email errors
4. Test with Mailtrap.io first (see DEPLOYMENT_GUIDE.md)

---

## Database Seeding

### Create Admin User

After successful deployment:

**Option 1: Using Render Shell**
1. Go to backend service
2. Click **Shell** tab
3. Run: `node server/seeds/createAdmin.js`

**Option 2: Local with Production DB**
```bash
# Set production MongoDB URI temporarily
export MONGODB_URI="your-production-mongodb-uri"

# Run seed script
node server/seeds/createAdmin.js
```

**Default admin credentials:**
```
Email: admin@betika.com
Password: Admin@123
```

⚠️ **Change this password after first login!**

---

## Checking Service Health

### Backend Health Check
```bash
curl https://supplier-onboarding-api.onrender.com/api/health
```

**Expected:**
```json
{"success":true,"message":"Server is running","timestamp":"..."}
```

### Frontend Check
Visit: `https://supplier-onboarding-portal.onrender.com`

Should show the landing page with:
- Header with logo
- "Streamline Your Supplier Onboarding Process"
- Login/Register buttons

---

## Performance Issues

### Slow First Load (Cold Start)

**Free tier services spin down after 15 min**
- First request: 30-60 seconds
- Subsequent requests: Fast

**Solutions:**
- Upgrade to paid tier ($7/mo) - no spin down
- Or accept the delay for free tier

### Slow API Responses

**Check:**
1. MongoDB Atlas cluster location (should be close to Render region)
2. Database indexes (check slow queries in Atlas)
3. Backend logs for slow operations

---

## Redeploying After Code Changes

### Automatic Deploy (Recommended)

Render auto-deploys when you push to GitHub:

```bash
git add .
git commit -m "Fix: description of changes"
git push origin main
```

Render will:
1. Detect the push
2. Pull latest code
3. Run build command
4. Deploy new version
5. Show in **Events** tab

### Manual Deploy

1. Go to service on Render
2. Click **Manual Deploy**
3. Select branch: `main`
4. Click **Deploy**

---

## Getting Help

### Check Logs First

**Backend Logs:**
1. Go to `supplier-onboarding-api`
2. Click **Logs** tab
3. Look for errors (in red)

**Frontend Build Logs:**
1. Go to `supplier-onboarding-portal`
2. Click **Events** tab
3. Click on latest deploy
4. View build output

### Common Log Errors

**MongoDB connection failed:**
```
MongooseServerSelectionError: Could not connect
```
→ Check MongoDB Atlas network access and credentials

**Missing environment variable:**
```
JWT_SECRET is not defined
```
→ Add missing environment variable

**Port already in use:**
```
Error: listen EADDRINUSE
```
→ Shouldn't happen on Render, try redeploying

---

## Service URLs

**Backend API:**
- Production: `https://supplier-onboarding-api.onrender.com`
- Health Check: `https://supplier-onboarding-api.onrender.com/api/health`

**Frontend:**
- Production: `https://supplier-onboarding-portal.onrender.com`

**GitHub Repository:**
- `https://github.com/sangryan/supplier-onboarding`

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Render Community**: https://community.render.com

---

## Quick Checklist

Before reporting issues, verify:

- [ ] Backend service is **Live** (green status)
- [ ] All environment variables are set correctly
- [ ] MongoDB Atlas allows connections from `0.0.0.0/0`
- [ ] Health endpoint returns 200 OK
- [ ] Frontend `REACT_APP_API_URL` points to correct backend
- [ ] Waited 60 seconds for cold start (free tier)
- [ ] Checked logs for specific errors
- [ ] Admin user has been seeded

---

**Most 502 errors are due to:**
1. Backend service not running (check status)
2. Free tier cold start (wait 60 seconds)
3. MongoDB connection failed (check Atlas settings)
4. Missing environment variables (verify all are set)

Good luck! 🚀

