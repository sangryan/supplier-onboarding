# Email Setup Guide

> Two supported options: **Resend** (recommended) or **Google Workspace SMTP**.
> The app auto-detects which to use based on `EMAIL_PASSWORD` — if it starts with `re_`, Resend is used; otherwise it falls back to SMTP.

---

## Option A: Google Workspace (Gmail Suite)

### 1. Generate an App Password

Google blocks plain account passwords for SMTP — you need an App Password.

1. Sign in to the Google account you'll send from
2. Enable 2-Step Verification:
   `myaccount.google.com → Security → 2-Step Verification`
3. Generate an App Password:
   `myaccount.google.com → Security → App Passwords`
   - App: **Mail**, Device: **Other** → name it `Betika Server`
   - Copy the 16-character password (shown only once)

### 2. Set Environment Variables

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=noreply@yourdomain.com
NODE_ENV=production
```

Use a shared mailbox (`noreply@` or `support@`) rather than a personal account.

### Limits

| Limit | Amount |
|-------|--------|
| Emails per day | ~2,000 per account |
| Recipients per message | 500 |

---

## Option B: Resend (Recommended for scale)

# Resend Domain Setup Guide

## 1. Create a Resend Account

Go to [resend.com](https://resend.com) and sign up.

---

## 2. Add Your Domain

1. Dashboard → **Domains** → **Add Domain**
2. Enter your domain (e.g. `betika.co.ke`)
3. Select the region closest to your server

---

## 3. Add DNS Records

Resend will provide the exact records. Add all of them at your DNS provider (Cloudflare, GoDaddy, etc.):

| Type | Name | Purpose |
|------|------|---------|
| MX | `bounces.yourdomain.com` | Receives bounce messages |
| TXT | `yourdomain.com` | SPF — authorises Resend to send on your behalf |
| CNAME | `resend._domainkey` | DKIM — cryptographic signature (2 records) |
| TXT | `_dmarc.yourdomain.com` | DMARC policy (see step below) |

> DNS propagation can take a few minutes to a few hours.

---

## 4. Verify the Domain

Back in Resend → **Domains**, click **Verify**. All records must show a green checkmark before you can send from that domain.

---

## 5. Create an API Key

1. Dashboard → **API Keys** → **Create API Key**
2. Give it a name (e.g. `betika-production`)
3. Permission: **Sending access** is sufficient
4. Copy the key — it starts with `re_` and is **only shown once**

---

## 6. Set Environment Variables

Update your `.env` or hosting environment variables (e.g. Render):

```env
EMAIL_PASSWORD=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
NODE_ENV=production
```

- `EMAIL_PASSWORD` must be your `re_...` API key — the app auto-detects Resend when the key starts with `re_`
- `EMAIL_FROM` must use the exact domain verified in step 2

---

## 7. Test

Trigger a login OTP and confirm the email arrives. If it doesn't:

1. Check **Resend Dashboard → Logs** for delivery status and error details
2. Confirm `EMAIL_FROM` domain matches your verified domain exactly

---

## DMARC Record (Recommended)

Start with monitoring mode (`p=none`) before enforcing:

```
Type:  TXT
Name:  _dmarc
Value: v=DMARC1; p=none; rua=mailto:you@yourdomain.com
```

Once you're confident SPF and DKIM are passing, switch to `p=quarantine` or `p=reject`.

---

## Resend Free Tier Limits

| Limit | Amount |
|-------|--------|
| Emails per month | 3,000 |
| Emails per day | 100 |
| Custom domains | 1 |

Upgrade at [resend.com/pricing](https://resend.com/pricing) if you need more.
