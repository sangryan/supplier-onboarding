# Quick Setup Guide

This guide will help you get the Supplier Onboarding System up and running in minutes.

## Prerequisites Checklist

- [ ] Node.js v14+ installed
- [ ] MongoDB v4.4+ installed and running
- [ ] npm v6+ installed
- [ ] Terminal/Command Prompt access

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment

Copy the example environment file and update it:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- Change `JWT_SECRET` to a secure random string
- Update MongoDB URI if using remote database
- Configure email settings (optional but recommended)

### 3. Start MongoDB

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
net start MongoDB
```

### 4. Create Initial Admin User

Run the seed script to create a super admin user:

```bash
node server/seeds/createAdmin.js
```

Default credentials:
- Email: `admin@betika.com`
- Password: `Admin@123`

**⚠️ Important: Change this password immediately after first login!**

### 5. Start the Application

```bash
npm run dev
```

This will start both the backend (port 5000) and frontend (port 3000).

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

Login with the admin credentials created in Step 4.

## Next Steps

### Create Internal Users

1. Login as admin
2. Navigate to **User Management**
3. Create users for:
   - Procurement team members
   - Legal team members
   - Management (if needed)

### Test Supplier Flow

1. Logout from admin account
2. Click "Sign Up" on login page
3. Register as a supplier
4. Complete the onboarding application
5. Upload required documents
6. Submit for review

### Configure Email (Optional)

To enable email notifications:

1. Get SMTP credentials from your email provider
2. Update `.env` file with:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@example.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=noreply@betika.com
   ```

For Gmail:
- Enable 2-factor authentication
- Generate an App Password
- Use the App Password in EMAIL_PASSWORD

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution:**
- Ensure MongoDB is running
- Check MongoDB service status
- Verify MONGODB_URI in .env

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
- Stop any process using port 5000 or 3000
- Or change PORT in .env file

### Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Frontend Not Loading

**Solution:**
- Clear browser cache
- Check if backend is running on port 5000
- Verify proxy in client/package.json

## Verification Checklist

After setup, verify:

- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] Can login with admin credentials
- [ ] Can create new internal users
- [ ] Can register as supplier
- [ ] Can create supplier application
- [ ] Dashboard displays correctly

## Support

If you encounter issues:

1. Check the [README.md](README.md) for detailed documentation
2. Review error logs in terminal
3. Check MongoDB logs
4. Verify all environment variables are set correctly

## Production Deployment

For production deployment, see the [Deployment section](README.md#-deployment) in README.md.

---

**Ready to go!** 🚀

Start onboarding suppliers with confidence.

