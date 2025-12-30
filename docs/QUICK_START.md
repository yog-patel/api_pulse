# ?? Quick Start: Notifications in 5 Minutes

Get Slack notifications working in just a few steps!

## Prerequisites

- ? API Pulse deployed and running
- ? At least one API task created
- ? Slack account (free)

---

## Step 1: Get Slack Webhook (2 minutes)

1. Go to: https://api.slack.com/messaging/webhooks
2. Click **"Create your Slack app"** ? **"From scratch"**
3. Name it: `API Pulse Notifier`
4. Select your workspace
5. Click **"Incoming Webhooks"** ? Toggle **ON**
6. Click **"Add New Webhook to Workspace"**
7. Choose a channel (e.g., `#api-alerts`)
8. **Copy the webhook URL** (starts with `https://hooks.slack.com/services/...`)

---

## Step 2: Deploy Functions (1 minute)

### Windows:
```cmd
cd C:\path\to\api-schedulr
scripts\deploy-functions.bat
```

### Linux/Mac:
```bash
cd /path/to/api-schedulr
chmod +x scripts/deploy-functions.sh
./scripts/deploy-functions.sh
```

---

## Step 3: Add Integration (1 minute)

### Option A: Using cURL

```bash
# Replace these values:
# - YOUR_SUPABASE_URL
# - YOUR_JWT_TOKEN (get from browser after login)
# - YOUR_WEBHOOK_URL

curl -X POST https://YOUR_SUPABASE_URL.supabase.co/functions/v1/manage-integrations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "integration_type": "slack",
    "name": "Slack Alerts",
    "credentials": {
      "webhook_url": "YOUR_WEBHOOK_URL"
    }
  }'
```

**Copy the returned `id`** - you'll need it in the next step!

### Option B: Using Browser Console

1. Open API Pulse in browser and login
2. Open DevTools (F12) ? Console tab
3. Paste and run:

```javascript
// Get your auth token
const token = (await supabase.auth.getSession()).data.session.access_token;

// Create integration
const response = await fetch('https://YOUR_SUPABASE_URL.supabase.co/functions/v1/manage-integrations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    integration_type: 'slack',
    name: 'Slack Alerts',
    credentials: {
  webhook_url: 'YOUR_WEBHOOK_URL'
    }
  })
});

const integration = await response.json();
console.log('Integration ID:', integration.id);
```

---

## Step 4: Link to Task (1 minute)

Get your task ID from the dashboard, then:

### Option A: Using cURL

```bash
curl -X POST https://YOUR_SUPABASE_URL.supabase.co/functions/v1/link-task-notification \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "YOUR_TASK_ID",
  "integration_id": "YOUR_INTEGRATION_ID",
    "notify_on": "always"
  }'
```

### Option B: Using Browser Console

```javascript
const token = (await supabase.auth.getSession()).data.session.access_token;

const response = await fetch('https://YOUR_SUPABASE_URL.supabase.co/functions/v1/link-task-notification', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    task_id: 'YOUR_TASK_ID',
    integration_id: 'YOUR_INTEGRATION_ID',
    notify_on: 'always'  // or 'failure_only'
  })
});

const result = await response.json();
console.log('Linked!', result);
```

---

## Step 5: Test It! (30 seconds)

### Option A: Wait for GitHub Actions
- GitHub Actions runs every 5 minutes
- Your notification will appear automatically!

### Option B: Run Scheduler Manually

```bash
cd scheduler
node scheduler.js
```

Watch for:
```
? Task executed: Your Task - Status: 200
Sending 1 notification(s) for task: Your Task
? Slack notification sent for task: Your Task
```

---

## ? Success!

Check your Slack channel - you should see:

```
? API Task Success: Your Task Name

Task Name: Your Task Name
Status Code: 200
Response Time: 123ms
Method: GET

Endpoint: https://api.example.com/...

Executed at: Jan 15, 2025 at 10:30 AM
```

---

## ?? What's Next?

### Configure Notification Rules

- **Always** - Every execution (good for monitoring)
- **Failure Only** - Only when tasks fail (recommended for production)
- **Timeout** - Only on errors

Change rules by updating the link:

```javascript
// In browser console
const token = (await supabase.auth.getSession()).data.session.access_token;

await fetch(`https://YOUR_SUPABASE_URL.supabase.co/functions/v1/link-task-notification/${linkId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});

// Then create new link with different notify_on
```

### Add More Integrations

- Create webhooks for different channels
- Set up different rules for different tasks
- Monitor critical APIs separately

### Test the System

```bash
cd scheduler
npm test
```

---

## ?? Troubleshooting

### No notification received?

1. **Check Slack webhook works:**
   ```bash
   curl -X POST YOUR_WEBHOOK_URL \
     -H "Content-Type: application/json" \
     -d '{"text": "Test message"}'
 ```

2. **Verify integration is active:**
   ```bash
   curl https://YOUR_SUPABASE_URL.supabase.co/functions/v1/manage-integrations \
 -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Check task link exists:**
   ```bash
   curl "https://YOUR_SUPABASE_URL.supabase.co/functions/v1/link-task-notification?task_id=YOUR_TASK_ID" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

4. **Run test script:**
   ```bash
   cd scheduler
   npm test
   ```

### Need your JWT token?

In browser console after logging in:
```javascript
const token = (await supabase.auth.getSession()).data.session.access_token;
console.log(token);
```

---

## ?? More Resources

- [Full Setup Guide](NOTIFICATION_SETUP.md)
- [API Examples](API_EXAMPLES.md)
- [Implementation Details](IMPLEMENTATION_SUMMARY.md)
- [Main README](../README.md)

---

## ?? You're Done!

Notifications are now live! Your team will be alerted every time your API tasks run.

**Pro tip:** Start with `notify_on: "failure_only"` in production to avoid notification overload! ??
