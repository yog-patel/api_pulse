# ?? Email Notifications Setup Guide (Resend)

## Overview

Send beautiful HTML email notifications for your API tasks using **Resend** - a modern email API with a generous free tier.

---

## ? Why Resend?

- **Free Tier:** 100 emails/day, 3,000 emails/month
- **No Credit Card:** Get started immediately
- **Simple API:** Easy integration
- **Reliable:** Built for developers
- **Beautiful Emails:** HTML templates included

---

## ?? Quick Setup (5 Minutes)

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Click **"Sign Up"** (free account)
3. Verify your email address
4. Complete onboarding

### Step 2: Get API Key

1. Go to [API Keys](https://resend.com/api-keys)
2. Click **"Create API Key"**
3. Name it: `API Pulse Notifications`
4. Select **"Sending access"** permission
5. Click **"Add"**
6. **Copy the API key** (starts with `re_`)

?? **Important:** Save this key securely - you won't see it again!

### Step 3: Verify Domain (Optional but Recommended)

**For testing**, you can use:
- `onboarding@resend.dev` (only sends to your verified email)

**For production**, verify your domain:
1. Go to [Domains](https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add DNS records as shown
5. Wait for verification (usually 1-5 minutes)

### Step 4: Configure Scheduler

Add to `scheduler/.env`:

```env
# Email configuration (Resend)
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=notifications@yourdomain.com
```

**Testing without domain?** Use:
```env
FROM_EMAIL=onboarding@resend.dev
```

### Step 5: Install Dependencies

```bash
cd scheduler
npm install
```

**Note:** We use Resend's REST API directly, so no additional packages are needed beyond the existing dependencies.

### Step 6: Add Email Integration

**Via UI:**
1. Go to **Settings**
2. Click **"+ Add Integration"**
3. Select **"Email"** tab
4. Name: `My Email Alerts`
5. Email: `your@email.com`
6. Click **"Add Integration"**

**Via API:**
```bash
curl -X POST https://YOUR_SUPABASE_URL.supabase.co/functions/v1/manage-integrations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "integration_type": "email",
    "name": "My Email Alerts",
    "credentials": {
      "email": "your@email.com"
    }
  }'
```

### Step 7: Link to Task

1. Go to **Dashboard**
2. Click **?? Notifications** on any task
3. Select your email integration
4. Choose notification rule
5. Optionally check **"Include API Response Body"**
6. Click **"Add Notification"**

### Step 8: Test!

Wait 5 minutes for GitHub Actions OR run:
```bash
cd scheduler
node scheduler.js
```

Check your email inbox! ??

---

## ?? What Emails Look Like

### Success Email

**Subject:** ? API Task Success: Your Task Name

**Content:**
- ? Green header with success badge
- Task details (status, response time, method)
- Endpoint URL
- Optional: Response body (formatted JSON)
- Timestamp

**Design:**
- Clean, modern HTML
- Mobile responsive
- Professional branding

### Failure Email

**Subject:** ? API Task Failed: Your Task Name

**Content:**
- ? Red header with error badge
- Error message (highlighted)
- Task details
- Endpoint URL
- Optional: Response body
- Call to action to investigate

**Design:**
- Attention-grabbing red theme
- Error details prominent
- Easy to scan quickly

---

## ?? Email Templates

Email templates are automatically generated with:
- **HTML formatting** - Professional design
- **Responsive layout** - Works on mobile
- **Color coding** - Green for success, red for failures
- **Monospace code blocks** - For endpoints and responses
- **Truncation** - Long responses limited to 2,000 chars

Templates located in: `scheduler/emailTemplates.js`

---

## ?? Security & Privacy

### Email Validation

- Email format validated before saving
- Invalid emails rejected

### Content Safety

- HTML escaped to prevent XSS
- Response bodies sanitized
- No executable code in emails

### Best Practices

**Safe to send:**
- ? Health check results
- ? Public API responses
- ? Status updates
- ? Error messages

**Don't send:**
- ? Authentication tokens
- ? API keys/secrets
- ? Personal data (PII)
- ? Financial information

---

## ?? Resend Pricing

### Free Tier (Perfect for Getting Started)
```
100 emails/day
3,000 emails/month
All features included
No credit card required
```

### Pro Tier ($20/month)
```
50,000 emails/month
Custom domains
Advanced analytics
Priority support
```

**For most users:** Free tier is plenty!

**Calculate your usage:**
- 1 task, notify always, runs every 5 min = ~288 emails/day ?
- 5 tasks, notify on failure, run hourly = ~0-120 emails/day ?
- 10 tasks, notify on failure, run every 6 hours = ~0-40 emails/day ?

**Pro tip:** Use "failure_only" in production to stay in free tier!

---

## ?? Use Cases

### 1. **Critical API Monitoring**
```
Rule: failure_only
Email: oncall@company.com
Result: Immediate alerts when APIs break
```

### 2. **Daily Status Reports**
```
Rule: always
Schedule: Daily at 9 AM
Email: team@company.com
Result: Daily health check summaries
```

### 3. **Personal Monitoring**
```
Rule: failure_only
Email: your@email.com
Result: Know immediately when your side projects fail
```

### 4. **Client Notifications**
```
Rule: failure_only
Email: client@external.com
Result: Transparent API status for clients
```

---

## ?? Configuration Options

### Environment Variables

```env
# Required
RESEND_API_KEY=re_your_key_here

# Optional (defaults shown)
FROM_EMAIL=notifications@api-schedulr.com
```

### Per-Integration Settings

```json
{
  "integration_type": "email",
  "name": "Production Alerts",
  "credentials": {
    "email": "alerts@company.com"
  }
}
```

### Per-Notification Settings

- **notify_on:** always / failure_only / timeout
- **include_response:** true / false

---

## ?? Delivery & Reliability

### Delivery Times

- **Typical:** 1-3 seconds
- **Max:** 10 seconds
- **Failure retry:** Automatic

### Email Providers Supported

? Gmail, Outlook, Yahoo
? Corporate email servers
? Custom domains
? Email aliases

### Spam Prevention

Resend has excellent deliverability:
- Authenticated with DKIM
- SPF records verified
- DMARC compliant
- Reputation monitoring

**Tip:** Verify your domain for best deliverability!

---

## ?? Troubleshooting

### Not receiving emails?

**Check spam folder:**
- Add `notifications@yourdomain.com` to contacts
- Mark as "Not Spam"

**Verify API key:**
```bash
# Test in scheduler
cd scheduler
node -e "const { Resend } = require('resend'); const r = new Resend(process.env.RESEND_API_KEY); console.log('API Key valid!');"
```

**Check Resend logs:**
1. Go to [Resend Dashboard](https://resend.com/emails)
2. View recent emails
3. Check delivery status

**Verify integration:**
```bash
# Via UI: Settings ? Check email integration exists
# Via Database: Check user_integrations table
```

### Emails going to spam?

**Solutions:**
1. Verify your domain (adds authentication)
2. Add "From" address to contacts
3. Use a custom domain (not @gmail.com)
4. Whitelist IP addresses (advanced)

### Error: "RESEND_API_KEY not set"

**Fix:**
```bash
# Add to scheduler/.env
RESEND_API_KEY=re_your_key_here

# Restart scheduler
node scheduler.js
```

### Error: "Invalid email format"

**Fix:**
- Use format: `user@domain.com`
- No spaces, no special characters
- Verify TLD exists (.com, .org, etc.)

---

## ?? Monitoring Email Usage

### Check Resend Dashboard

1. Go to [Resend Dashboard](https://resend.com/overview)
2. View **"Emails sent"** graph
3. Monitor daily usage vs limit

### Check API Pulse Logs

```bash
# Scheduler logs show email sending
cd scheduler
node scheduler.js

# Look for:
? Email notification sent for task: Your Task (ID: abc123)
```

---

## ?? Advanced Features

### Multiple Recipients

Add multiple integrations for the same task:
```
Integration 1: alerts@company.com (failure_only)
Integration 2: team@company.com (always)
```

### Custom From Names

Update FROM_EMAIL in .env:
```env
FROM_EMAIL="API Pulse <notifications@yourdomain.com>"
```

### Reply-To Address

Coming soon! Will allow users to reply to notifications.

---

## ?? Future Enhancements

Planned features:
- ?? Email digest (daily/weekly summaries)
- ?? Custom email templates
- ?? CC/BCC support
- ?? Email threading (group by task)
- ?? Open/click tracking
- ?? Smart delivery times

---

## ? Checklist

Before going to production:

- [ ] Resend account created
- [ ] API key configured in .env
- [ ] Domain verified (for production)
- [ ] Email integration added
- [ ] Integration linked to tasks
- [ ] Test email received
- [ ] Spam folder checked
- [ ] Usage monitoring set up
- [ ] notification rules configured (failure_only recommended)

---

## ?? Need Help?

- **Resend Docs:** [resend.com/docs](https://resend.com/docs)
- **API Reference:** [resend.com/docs/api-reference](https://resend.com/docs/api-reference)
- **Community:** [Resend Discord](https://resend.com/discord)
- **API Pulse Docs:** Check main README

---

## ?? You're All Set!

Email notifications are now configured! You'll receive beautiful HTML emails every time your API tasks run (or fail).

**Pro tips:**
1. Start with "always" to test, then switch to "failure_only"
2. Verify your domain for better deliverability
3. Use different notification rules for different tasks
4. Monitor your Resend usage to stay in free tier

**Happy monitoring!** ???
