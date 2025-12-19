# ?? Discord Integration Guide

This guide will help you set up Discord notifications for your API Pulse tasks.

---

## ?? Quick Overview

Discord integration allows you to receive real-time notifications about your API task executions directly in your Discord server. You'll get beautifully formatted embed messages with:

- ? Success/failure status
- ?? Response times
- ?? API endpoint information
- ?? Error messages (when applicable)
- ?? Optional API response body

---

## ?? Setup Instructions

### Step 1: Create a Discord Webhook

1. **Open Discord** and navigate to your server
2. **Right-click** the channel where you want notifications
3. Select **Edit Channel** (or click the gear icon)
4. Go to **Integrations** ? **Webhooks**
5. Click **New Webhook** or **Create Webhook**
6. **Customize** your webhook:
   - Name: `API Pulse` (or whatever you prefer)
   - Icon: Upload an icon (optional)
7. **Copy the Webhook URL**
   - It looks like: `https://discord.com/api/webhooks/123456789/abcdefg...`
8. Click **Save Changes**

### Step 2: Add Discord Integration to API Pulse

1. **Log in** to your API Pulse dashboard
2. Go to **Settings** (or `/dashboard/settings`)
3. Click **+ Add Integration**
4. Select **Discord** tab
5. Fill in the form:
   - **Integration Name**: e.g., "Production Alerts"
   - **Discord Webhook URL**: Paste the URL you copied
6. Click **Add Integration**
7. **Check your Discord channel** - you should see a test message!

### Step 3: Link Discord to Your Tasks

1. Go to your **Dashboard**
2. Find the task you want to monitor
3. Click **?? Notifications** button
4. Click **+ Add Notification**
5. Select your Discord integration
6. Choose notification rule:
   - **Always** - Every execution (success or failure)
   - **Failure Only** - Only when API fails
   - **Timeout Only** - Only on connection issues
7. Optional: Check **Include API Response Body**
8. Click **Save**

---

## ?? Notification Examples

### Success Notification
```
? API Task Success: Production Health Check

Task Name: Production Health Check
Status Code: 200
Response Time: 145ms
Method: GET
Endpoint: `https://api.example.com/health`

Executed at 1/15/2025, 10:30:00 AM
```

### Failure Notification
```
? API Task Failed: Payment Gateway

Task Name: Payment Gateway
Status Code: 500
Response Time: 3200ms
Method: POST
Endpoint: `https://api.payment.com/charge`

Error: Internal Server Error - Database connection timeout

Executed at 1/15/2025, 10:35:00 AM
```

### With Response Body
```
? API Task Success: User Count API

Task Name: User Count API
Status Code: 200
Response Time: 89ms
Method: GET
Endpoint: `https://api.example.com/users/count`

Response Body:
```json
{
"status": "ok",
  "data": {
    "total_users": 1250,
    "active": 980,
    "inactive": 270
  }
}
```

Executed at 1/15/2025, 10:40:00 AM
```

---

## ?? Best Practices

### 1. **Create Dedicated Channels**
Don't spam your main chat! Create dedicated channels:
- `#api-alerts` - All notifications
- `#api-errors` - Failure only
- `#api-production` - Production monitoring

### 2. **Use Multiple Webhooks**
Create different webhooks for different priorities:
- Critical alerts ? `#critical-alerts`
- Development APIs ? `#dev-alerts`
- Regular monitoring ? `#monitoring`

### 3. **Set Appropriate Notification Rules**
- **Production APIs**: Use "Failure Only" or "Timeout Only"
- **Testing**: Use "Always" to verify everything works
- **Critical APIs**: Use "Always" with response body

### 4. **Name Your Integrations Clearly**
Good examples:
- "Production Alerts Channel"
- "Dev Team Discord"
- "Critical Errors Only"

Bad examples:
- "Discord 1"
- "Test"
- "Webhook"

---

## ?? Advanced Features

### Multiple Tasks ? One Channel
You can link the same Discord integration to multiple tasks:
1. Create one Discord integration
2. Link it to Task A with "Failure Only"
3. Link it to Task B with "Always"
4. Link it to Task C with "Timeout Only"

### Multiple Channels ? One Task
You can send notifications to multiple Discord channels:
1. Create Discord integration A ? `#team-alerts`
2. Create Discord integration B ? `#critical-alerts`
3. Link both to the same task with different rules

### Include Response Body
Perfect for:
- ? Debugging API responses
- ? Monitoring data changes
- ? Tracking metrics over time

**Note**: Responses are truncated to 1000 characters to fit Discord's limits.

---

## ??? Troubleshooting

### "Invalid Discord webhook URL"
**Problem**: The webhook URL doesn't work

**Solutions**:
- Make sure you copied the entire URL
- Verify the webhook still exists in Discord
- Check that you have permissions in that channel
- Ensure the URL starts with `https://discord.com/api/webhooks/`

### "Integration added but no test message"
**Problem**: No test message appears in Discord

**Solutions**:
- Check the correct channel in Discord
- Verify the webhook wasn't deleted
- Check Discord server permissions
- Try deleting and recreating the integration

### "Not receiving notifications"
**Problem**: No notifications when tasks run

**Checklist**:
- ? Integration is active (green badge in Settings)
- ? Notification is linked to the task
- ? Task is active (green "?? Running" status)
- ? Notification rule matches execution result
- ? GitHub Actions is running (every 5 minutes)

### "Response body is truncated"
**Problem**: Long responses are cut off

**Explanation**: Discord has a 1024 character limit per embed field

**Solutions**:
- View full response in Dashboard ? Task Logs
- Reduce API response size
- Use webhook integration for custom handling

---

## ?? Discord vs Slack

| Feature | Discord | Slack |
|---------|---------|-------|
| **Setup** | Free, unlimited webhooks | Free tier limited |
| **Formatting** | Rich embeds with colors | Blocks with attachments |
| **Character Limit** | 1000 per field | 3000 per block |
| **Best For** | Gaming teams, communities | Professional teams |
| **Customization** | Webhook avatar & name | Webhook name only |

---

## ?? Security Tips

1. **Never share webhook URLs publicly** - Anyone with the URL can send messages
2. **Use different webhooks** for different environments (dev/staging/prod)
3. **Regenerate webhooks** if accidentally exposed
4. **Delete unused webhooks** from Discord settings
5. **Monitor webhook usage** in Discord's audit log

---

## ?? Common Use Cases

### 1. Production Monitoring
```
Integration: Discord ? #production-alerts
Linked Tasks: All production APIs
Rule: Failure Only
Result: Only get notified when something breaks
```

### 2. Development Testing
```
Integration: Discord ? #dev-testing
Linked Tasks: Development APIs
Rule: Always
Result: See every execution for debugging
```

### 3. Critical Systems
```
Integration: Discord ? #critical-systems
Linked Tasks: Payment, Auth, Core APIs
Rule: Always (with response body)
Result: Monitor every execution and response
```

### 4. Network Monitoring
```
Integration: Discord ? #network-alerts
Linked Tasks: External API dependencies
Rule: Timeout Only
Result: Only notified on connection problems
```

---

## ?? Quick Reference

| Notification Rule | Success | Failure | Timeout | Best For |
|------------------|---------|---------|---------|----------|
| **Always** | ? | ? | ? | Testing, debugging |
| **Failure Only** | ? | ? | ? | Production monitoring |
| **Timeout Only** | ? | ? | ? | Network issues |

---

## ?? Next Steps

1. **Set up your first Discord webhook** in your server
2. **Add the integration** in Settings
3. **Link it to a task** using the dashboard
4. **Test it** by waiting for next execution or running scheduler manually
5. **Adjust notification rules** as needed
6. **Scale** to all your important tasks!

---

## ?? Pro Tips

- ?? Use Discord's webhook avatar feature to set a custom icon
- ?? Enable Discord mobile notifications for critical alerts
- ?? Use Discord's notification settings to mute non-critical channels
- ??? Mention roles in webhook name for @mentions (advanced)
- ?? Create separate channels for different severity levels

---

## ? FAQ

### Can I add multiple Discord integrations?
**Yes!** You can add as many as you want - one per channel or server.

### Can I use the same webhook for multiple tasks?
**Absolutely!** One webhook can receive notifications from all your tasks.

### What happens if I delete a webhook in Discord?
Notifications will fail silently. Delete the integration from API Pulse Settings.

### Can I customize the embed colors?
Not yet! Currently green = success, red = failure. Custom colors coming soon.

### Can I @mention people in notifications?
Not directly through the UI. You can set up Discord bot integrations for advanced mentions.

---

## ?? You're All Set!

Discord notifications are now active! Your team will be notified in real-time whenever your APIs need attention.

**Happy monitoring!** ????

---

## ?? Need Help?

- Check the main [SETUP_GUIDE.md](./SETUP_GUIDE.md) for general help
- Review [NOTIFICATION_UI_GUIDE.md](./NOTIFICATION_UI_GUIDE.md) for UI instructions
- See [NOTIFICATION_SETUP.md](./NOTIFICATION_SETUP.md) for technical details

**Everything is ready - start monitoring with Discord!** ??
