# Security Policy

## 🔒 Handling Secrets and Credentials

### What Are Secrets?

Secrets are sensitive information that should **never** be committed to version control:

- Database passwords and connection strings
- API keys and tokens
- JWT secrets
- Email passwords
- Encryption keys
- Any authentication credentials

---

## ✅ Best Practices

### 1. Use Environment Variables

**Never hardcode secrets in your code!**

❌ **BAD:**
```javascript
const dbUrl = "mongodb+srv://admin:MyPassword123@cluster.mongodb.net/mydb";
```

✅ **GOOD:**
```javascript
const dbUrl = process.env.MONGODB_URI;
```

### 2. Use .env Files Locally

For local development, use `.env` files:

```env
MONGODB_URI=mongodb+srv://admin:MyPassword123@cluster.mongodb.net/mydb
JWT_SECRET=my-super-secret-key
EMAIL_PASSWORD=my-email-password
```

**Important:** The `.env` file is already in `.gitignore` and will NOT be committed to GitHub.

### 3. Use Secure Environment Variables in Production

On Render (or any hosting platform):
1. Never put secrets in `render.yaml`
2. Use the platform's environment variable manager
3. Mark sensitive variables with `sync: false` in blueprints

**Example in render.yaml:**
```yaml
envVars:
  - key: MONGODB_URI
    sync: false  # User must provide this securely
  - key: JWT_SECRET
    generateValue: true  # Auto-generated, not in repo
```

---

## 🚨 What Was Fixed

### GitHub Secret Scanning Alerts

GitHub detected example MongoDB URIs in our documentation files. These were **NOT real credentials**, just examples, but they triggered security alerts.

**What we fixed:**
- ✅ Replaced `mongodb+srv://username:password@...` with `mongodb+srv://<YOUR_USERNAME>:<YOUR_PASSWORD>@...`
- ✅ Updated all documentation to use clear placeholders
- ✅ Made it obvious these are examples, not real credentials

**Files updated:**
- `README.md`
- `DEPLOYMENT_GUIDE.md`
- `SEED_ADMIN_GUIDE.md`
- `RENDER_TROUBLESHOOTING.md`

---

## 🔍 How to Check for Exposed Secrets

### Before Committing

Always check what you're about to commit:

```bash
# See what files will be committed
git status

# Review changes
git diff

# Make sure no .env files are included
git ls-files | grep .env
```

### GitHub Secret Scanning

GitHub automatically scans for exposed secrets. If you see alerts:

1. **Rotate the secret immediately** (change the password/key)
2. **Remove it from git history** (if real credentials were exposed)
3. **Update the secret** in all environments where it's used

### Tools You Can Use

- **git-secrets**: Prevents committing secrets
- **truffleHog**: Scans git history for secrets
- **GitHub Secret Scanning**: Built-in to GitHub (free for public repos)

---

## 🔐 Secure Secret Management

### JWT Secret

Generate a strong random string (32+ characters):

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

Use this as your `JWT_SECRET`.

### MongoDB Password

- Use MongoDB Atlas auto-generated passwords (strong by default)
- If creating your own, use 16+ characters with mix of:
  - Uppercase letters
  - Lowercase letters
  - Numbers
  - Special characters (but be careful with URL encoding!)

### Email Passwords

For Gmail:
1. ✅ **Use App Passwords** (not your actual Gmail password)
2. Enable 2-Factor Authentication first
3. Generate app-specific password
4. Use that in your application

---

## 📋 Security Checklist

Before deploying:

- [ ] All secrets in `.env` file (not in code)
- [ ] `.env` file is in `.gitignore`
- [ ] No secrets in `render.yaml` or other config files committed to GitHub
- [ ] Production secrets set in Render environment variables
- [ ] MongoDB network access allows `0.0.0.0/0` (but uses password auth)
- [ ] Email using app passwords (not real passwords)
- [ ] JWT secret is long and random (32+ characters)
- [ ] Default admin password changed after first login
- [ ] No example credentials look like real credentials in docs

---

## 🚨 What to Do If Secrets Are Exposed

### If You Accidentally Commit Secrets:

1. **Rotate the secret immediately**
   - Change the password/key right away
   - Update it everywhere it's used

2. **Remove from git history**
   ```bash
   # Remove file from all git history (use with caution!)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (WARNING: This rewrites history!)
   git push origin --force --all
   ```

3. **Or use BFG Repo-Cleaner** (easier and safer):
   ```bash
   # Install BFG
   brew install bfg
   
   # Remove passwords from history
   bfg --replace-text passwords.txt
   ```

4. **Notify your team**
   - Tell everyone that uses the repository
   - They'll need to re-clone or force pull

---

## 🎯 Quick Reference

### Example .env File Structure

```env
# Server
NODE_ENV=development
PORT=8000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRE=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Frontend
CLIENT_URL=http://localhost:3000
```

### What Goes in .gitignore

```
# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/

# Uploads
uploads/

# Build output
client/build/
dist/

# Logs
*.log
logs/

# OS files
.DS_Store
```

---

## 📚 Additional Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [MongoDB Security Best Practices](https://www.mongodb.com/docs/manual/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## 🆘 Reporting Security Issues

If you discover a security vulnerability, please email: **[your-email@example.com]**

**Do NOT create a public GitHub issue for security vulnerabilities.**

---

**Remember:** Security is not a one-time thing. Always review your code before committing, and regularly audit your secrets and access controls.

🔒 Stay safe!

