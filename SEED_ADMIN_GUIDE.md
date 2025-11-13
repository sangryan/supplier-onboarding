# How to Seed Admin User (Production)

Since Render's free tier doesn't have Shell access, you'll seed the admin user from your local machine to the production database.

## 📋 Prerequisites

1. ✅ Backend deployed on Render
2. ✅ MongoDB Atlas cluster created
3. ✅ MongoDB connection string ready

---

## 🚀 Quick Steps

### Step 1: Get Your Production MongoDB URI

From MongoDB Atlas:
1. Go to your cluster
2. Click **"Connect"**
3. Choose **"Connect your application"**
4. Copy the connection string

**Example:**
```
mongodb+srv://<YOUR_USERNAME>:<YOUR_PASSWORD>@cluster0.xxxxx.mongodb.net/supplier-onboarding?retryWrites=true&w=majority
```

### Step 2: Set Environment Variable (Temporary)

Open Terminal and run:

```bash
cd /Users/heatmap/Documents/Betika

# Set your production MongoDB URI (replace with your actual URI)
export MONGODB_URI="mongodb+srv://<YOUR_USERNAME>:<YOUR_PASSWORD>@cluster0.xxxxx.mongodb.net/supplier-onboarding"
```

**OR** create a temporary `.env` file:

```bash
# Create .env file with production MongoDB URI
echo 'MONGODB_URI=mongodb+srv://<YOUR_USERNAME>:<YOUR_PASSWORD>@cluster0.xxxxx.mongodb.net/supplier-onboarding' > .env
```

### Step 3: Run the Seed Script

```bash
node seed-production.js
```

### Step 4: Expected Output

```
════════════════════════════════════════════════════
  SEED PRODUCTION DATABASE - ADMIN USER
════════════════════════════════════════════════════

🔄 Connecting to MongoDB...
📍 Database: cluster0.xxxxx.mongodb.net/supplier-onboarding

✅ Connected to MongoDB

🔐 Hashing password...
👤 Creating admin user...

✅ Admin user created successfully!

═══════════════════════════════════════════════════
📋 ADMIN CREDENTIALS
═══════════════════════════════════════════════════
📧 Email:    admin@betika.com
🔑 Password: Admin@123
👤 Role:     admin
🆔 User ID:  65abc123def456789...
═══════════════════════════════════════════════════

⚠️  IMPORTANT: Change this password after first login!

🎉 You can now login at:
   https://supplier-onboarding-portal.onrender.com

✅ Database connection closed
🚀 Setup complete!
```

---

## 🧪 If Admin Already Exists

If you run the script again, you'll see:

```
⚠️  Admin user already exists!
📧 Email: admin@betika.com
👤 Role: admin
✅ Active: true

💡 You can login with:
   Email: admin@betika.com
   Password: Admin@123
```

**This is normal!** Just login with the credentials shown.

---

## 🔒 Security Notes

### After Seeding (IMPORTANT!)

1. **Delete or clear the `.env` file:**
   ```bash
   rm .env
   # Or clear it
   echo "" > .env
   ```

2. **Clear the terminal history:**
   ```bash
   history -c
   ```

3. **Change the admin password:**
   - Login to your app
   - Go to Profile → Change Password
   - Use a strong password

---

## ❌ Troubleshooting

### Error: MONGODB_URI not found

**Problem:** Environment variable not set

**Fix:**
```bash
# Make sure you're in the project directory
cd /Users/heatmap/Documents/Betika

# Set the variable again
export MONGODB_URI="your-connection-string"

# Run seed script
node seed-production.js
```

### Error: MongooseServerSelectionError

**Problem:** Can't connect to MongoDB

**Fix:**

1. **Check MongoDB Atlas Network Access:**
   - Go to MongoDB Atlas
   - Click **Network Access**
   - Ensure `0.0.0.0/0` is added
   - Click **"Add IP Address"** if not present

2. **Check Connection String:**
   - Password must be URL-encoded (e.g., `@` → `%40`)
   - Must include database name: `/supplier-onboarding`
   - Format: `mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>`

3. **Check Database User:**
   - Go to **Database Access**
   - User should have "Read and write" privileges
   - Password matches what's in connection string

### Error: Dependencies not installed

**Problem:** Missing npm packages

**Fix:**
```bash
cd /Users/heatmap/Documents/Betika
npm install
node seed-production.js
```

---

## 🎯 What This Script Does

1. ✅ Connects to your **production** MongoDB database
2. ✅ Checks if admin user already exists
3. ✅ If not, creates admin user with:
   - Email: `admin@betika.com`
   - Password: `Admin@123`
   - Role: `admin`
   - Status: Active
4. ✅ Displays the credentials
5. ✅ Closes database connection

**It does NOT:**
- ❌ Modify existing users
- ❌ Delete any data
- ❌ Touch your local development database
- ❌ Send data anywhere except MongoDB

---

## 🔄 Run Multiple Times?

**Safe to run multiple times!** The script checks if admin exists first.

- First run: Creates admin user
- Subsequent runs: Shows "already exists" message
- No data loss or duplication

---

## 📊 After Seeding

### Test Login

1. Visit: `https://supplier-onboarding-portal.onrender.com`
2. Click **"Login"**
3. Enter credentials:
   - Email: `admin@betika.com`
   - Password: `Admin@123`
4. Click **"Sign In"**

### Expected: ✅
- Redirects to dashboard
- Shows admin menu items
- Can create users, view suppliers, etc.

### If Login Fails:
- Check browser console for errors
- Visit backend health check: `/api/health`
- Check backend logs on Render
- Verify MongoDB connection in Render environment variables

---

## 🎉 Success!

Once you can login:

1. ✅ Backend is working
2. ✅ Database is connected
3. ✅ Authentication is working
4. ✅ Admin user is created

**Next steps:**
- Change admin password
- Create additional users (Procurement, Legal, etc.)
- Test supplier registration
- Upload documents

---

## 🆘 Still Having Issues?

Check:
- [ ] Backend is **Live** on Render
- [ ] MongoDB Atlas allows `0.0.0.0/0`
- [ ] All Render environment variables are set
- [ ] Connection string is correct
- [ ] Admin user was created successfully (check script output)

**Get help:** Check `RENDER_TROUBLESHOOTING.md` for common issues.

---

**Ready? Run the seed script now!** 🚀

```bash
cd /Users/heatmap/Documents/Betika
export MONGODB_URI="your-mongodb-uri-here"
node seed-production.js
```

