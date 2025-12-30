# Notification Integration Setup Guide

This guide will help you set up notifications for API Pulse task executions.

## Supported Integrations

- ?? **Slack** - Free (Webhooks)
- ?? **Discord** - Free (Webhooks)
- ?? **Email** - Available (Resend)
- ?? **SMS** - Coming soon (Twilio)
- ?? **Webhook** - Free (Custom endpoints)

---

## ?? Setting Up Slack Notifications

### Step 1: Create a Slack Webhook

1. Go to [Slack API: Incoming Webhooks](https://api.slack.com/messaging/webhooks)
2. Click **"Create your Slack app"**
3. Choose **"From scratch"**
4. Give your app a name (e.g., "API Pulse Notifier")
5. Select your workspace
6. Click **"Incoming Webhooks"** in the left sidebar
7. Toggle **"Activate Incoming Webhooks"** to ON
8. Click **"Add New Webhook to Workspace"**
9. Select the channel where you want notifications
10. Copy the **Webhook URL** (it looks like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`)

### Step 2: Add Integration via API Pulse Dashboard

1. Navigate to **Dashboard > Settings**
2. Click **+ Add Integration**
3. Select **Slack** tab
4. Enter a name and paste your webhook URL
5. Click **Add Integration**
6. Check your Slack channel for a test message!

---

## ?? Setting Up Discord Notifications

### Step 1: Create a Discord Webhook

1. Open Discord and navigate to your server
2. Right-click the channel where you want notifications
3. Select **Edit Channel** ? **Integrations** ? **Webhooks**
4. Click **Create Webhook**
5. Customize the name (e.g., "API Pulse")
6. Copy the **Webhook URL** (it looks like: `https://discord.com/api/webhooks/123456789/abcdefg...`)
7. Click **Save Changes**

### Step 2: Add Integration via API Pulse Dashboard

1. Navigate to **Dashboard > Settings**
2. Click **+ Add Integration**
3. Select **Discord** tab
4. Enter a name and paste your webhook URL
5. Click **Add Integration**
6. Check your Discord channel for a test message!

**?? For detailed Discord setup, see [DISCORD_INTEGRATION_GUIDE.md](./DISCORD_INTEGRATION_GUIDE.md)**

---

## ?? Setting Up Email Notifications

**?? See [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md) for complete email setup instructions**

---

## ?? Link Integration to a Task

After adding an integration:

1. Go to **Dashboard**
2. Find your task and click **?? Notifications**
3. Click **+ Add Notification**
4. Select your integration
5. Choose notification rule:
   - **Always** - Every execution
   - **Failure Only** - Only failures (status >= 400)
   - **Timeout Only** - Only connection errors
6. Optionally enable **Include API Response Body**
7. Click **Save**

---

## ?? Notification Rules

**Notification Rules (`notify_on`):**
- `always` - Send notification for every execution
- `failure_only` - Only when status code >= 400 or error occurs
- `timeout` - Only when task execution fails with an error

**Best Practices:**
- Production tasks: Use `failure_only`
- Development/testing: Use `always`
- Network monitoring: Use `timeout`

---

## ?? Testing Your Integration

After setting up:

1. Link the integration to a task
2. Wait for the scheduler to run (every 5 minutes)
3. Or run scheduler manually: `node scheduler/scheduler.js`
4. Check your channel for notifications!

### Test Message Format

**Slack Notifications** include:
- ?/? Status indicator
- Task name
- HTTP status code
- Response time
- HTTP method
- API endpoint
- Error message (if failed)
- Execution timestamp
- Optional: Response body

**Discord Notifications** include:
- Same information as Slack
- Rich colored embeds (green for success, red for failure)
- Formatted in Discord's native embed style

---

## ?? Deploy Edge Functions

If you're setting up from scratch, deploy the notification functions:

```bash
# Navigate to your project root
cd supabase

# Deploy manage-integrations function
supabase functions deploy manage-integrations

# Deploy link-task-notification function
supabase functions deploy link-task-notification
```

---

## ?? Environment Variables

Make sure these are set in your `.env` file for the scheduler:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key  # For email notifications
FROM_EMAIL=notifications@api-schedulr.com  # Your sender email
```

---

## ??? Troubleshooting

### Notifications not being sent?

1. **Check integration is active:**
   - Go to Settings and verify green "Active" badge

2. **Check notification is linked:**
   - Click ?? Notifications on your task
   - Verify your integration is listed

3. **Verify task is running:**
   - Look for green "?? Running" status badge

4. **Check scheduler logs:**
   - Run `node scheduler/scheduler.js` locally
   - Look for "Sending X notification(s) for task:" message

### Slack/Discord webhook not working?

**Slack:**
- Ensure URL starts with `https://hooks.slack.com/services/...`
- Check Slack app has permission to post
- Verify webhook hasn't been revoked

**Discord:**
- Ensure URL starts with `https://discord.com/api/webhooks/...`
- Check webhook still exists in Discord settings
- Verify you have permissions in the channel

### Still not working?

Test the webhook manually:

**Slack:**
```bash
curl -X POST YOUR_SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message"}'
```

**Discord:**
```bash
curl -X POST YOUR_DISCORD_WEBHOOK_URL \
-H "Content-Type: application/json" \
  -d '{"content": "Test message"}'
```

---

## ?? Tips

### 1. Use Different Channels for Different Priorities

**Slack:**
- `#api-critical` - Failure only
- `#api-all` - All executions
- `#api-dev` - Development testing

**Discord:**
- `#production-alerts` - Failure only
- `#monitoring` - All executions
- `#dev-testing` - Development testing

### 2. Set Appropriate Notification Rules

- **Production APIs**: `failure_only` or `timeout`
- **Testing APIs**: `always`
- **Critical APIs**: `always` with response body

### 3. Multiple Integrations per Task

You can link multiple integrations to the same task:
- Slack channel for team
- Discord channel for ops
- Email for on-call engineer

### 4. Monitor Notification Performance

- Slack: Unlimited messages
- Discord: Unlimited messages
- Email: Check your Resend quota

---

## ?? Related Documentation

- [Discord Integration Guide](./DISCORD_INTEGRATION_GUIDE.md) - Detailed Discord setup
- [Email Setup Guide](./EMAIL_SETUP_GUIDE.md) - Email configuration
- [Notification UI Guide](./NOTIFICATION_UI_GUIDE.md) - Using the dashboard
- [API Examples](./API_EXAMPLES.md) - API usage examples

---

## ? Need Help?

- Check the [main README](../README.md)
- Review [Slack Webhook Documentation](https://api.slack.com/messaging/webhooks)
- Review [Discord Webhook Documentation](https://discord.com/developers/docs/resources/webhook)
- Open an issue on GitHub

---

**Happy monitoring!** ????
