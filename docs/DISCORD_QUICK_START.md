# ?? Discord Integration - Quick Start Guide

## For Existing API Pulse Users

If you're already using API Pulse with Slack or Email notifications, adding Discord is super easy!

---

## ?? Quick Setup (5 Minutes)

### Step 1: Get Your Discord Webhook (2 min)

1. Open Discord desktop or web app
2. Right-click any channel ? **Edit Channel**
3. Go to **Integrations** tab
4. Click **View Webhooks** ? **New Webhook**
5. Name it "API Pulse" (or anything you like)
6. **Copy Webhook URL**
7. Click **Save Changes**

### Step 2: Add to API Pulse (1 min)

1. Go to https://your-app.com/dashboard/settings
2. Click **+ Add Integration** button
3. Click **Discord** tab
4. Enter:
   - Name: `Production Alerts` (or any name)
   - Webhook URL: Paste the URL you copied
5. Click **Add Integration**
6. ? Check your Discord channel for a test message!

### Step 3: Link to Your Tasks (2 min)

1. Go to **Dashboard**
2. Find a task you want to monitor
3. Click **?? Notifications** button
4. Click **+ Add Notification**
5. Select your Discord integration
6. Choose when to notify:
   - **Always** - Every execution
   - **Failure Only** - Only when API fails
   - **Timeout Only** - Only connection errors
7. Optional: Check **Include API Response Body**
8. Click **Save**

### Done! ??

Wait for your next scheduled task run (every 5 minutes) or run the scheduler manually to test it out.

---

## ?? Pro Tips

### Multiple Channels for Different Priorities

Create dedicated channels:
```
#api-critical     ? Failure Only notifications
#api-production   ? Always notifications for prod APIs
#api-development  ? Always notifications for dev/test APIs
```

### Organize Your Server

Create a category called "API Monitoring":
```
?? API MONITORING
  ?? #critical-alerts     ? Production failures
  ?? #warnings           ? Timeouts & slow responses
  ?? #all-executions     ? Everything
  ?? #development        ? Dev/test APIs
```

### Use Discord Roles

Create Discord roles for alerting:
```
@api-oncall     ? Mention in critical channels
@dev-team       ? Mention in dev channels
@ops-team       ? Mention in production channels
```

**Note**: @mentions require a Discord bot, not webhook. Coming in future update!

---

## ?? What You'll See

### Success Message
```
? API Task Success: Health Check API

Task Name: Health Check API
Status Code: 200
Response Time: 145ms
Method: GET
Endpoint: https://api.example.com/health

Executed at 1/15/2025, 10:30:00 AM
```

### Failure Message
```
? API Task Failed: Payment Gateway

Task Name: Payment Gateway
Status Code: 500
Response Time: 3200ms
Method: POST
Endpoint: https://api.payment.com/charge

Error: Internal Server Error - Connection timeout

Executed at 1/15/2025, 10:35:00 AM
```

### With Response Body (Optional)
```
? API Task Success: User API

Task Name: User API
Status Code: 200
Response Time: 89ms
Method: GET
Endpoint: https://api.example.com/users

Response Body:
{
  "status": "ok",
  "count": 1250,
  "active": 980
}

Executed at 1/15/2025, 10:40:00 AM
```

---

## ? FAQ

### Q: Can I use both Slack and Discord?
**A:** Yes! You can add both and link them to the same task. Perfect for notifying multiple teams.

### Q: Do I need to change my existing tasks?
**A:** Nope! Your existing Slack/Email notifications keep working. Discord is just another option.

### Q: Can I have multiple Discord webhooks?
**A:** Absolutely! Add as many as you want for different channels or servers.

### Q: What if I delete the webhook in Discord?
**A:** Notifications will fail silently. Just delete the integration from API Pulse Settings.

### Q: Is there a limit on Discord messages?
**A:** Discord webhooks are free and unlimited, but they have rate limits. For typical API monitoring, you won't hit them.

### Q: Can I customize the embed colors?
**A:** Not yet! Currently green = success, red = failure. Custom colors coming soon.

---

## ?? Discord vs Slack - Which to Use?

| Use Discord If... | Use Slack If... |
|------------------|-----------------|
| Your team uses Discord | Your team uses Slack |
| Gaming/community server | Professional workplace |
| Want custom avatars | Need better threading |
| Free unlimited channels | Already have Slack workspace |

**Best Practice**: Use both! Send critical alerts to both platforms for redundancy.

---

## ?? Migrating from Slack to Discord

Already using Slack? Here's how to switch:

1. **Add Discord integration** (Steps above)
2. **Link Discord** to all your tasks
3. **Test** to make sure it works
4. **Remove Slack notifications** (optional)
5. **Delete Slack integration** (optional)

Or just keep both running! ??

---

## ??? Troubleshooting

### "Invalid Discord webhook URL"
- Make sure it starts with `https://discord.com/api/webhooks/`
- Don't use the webhook ID, use the full URL
- Make sure you copied the entire URL

### "Integration added but no test message"
- Check you're looking at the correct Discord channel
- Verify the webhook exists in Discord settings
- Try sending a manual test message

### "Not receiving notifications"
- Verify integration shows "Active" badge in Settings
- Check notification is linked to your task (?? button)
- Make sure task is enabled (green "?? Running" badge)
- Wait for next scheduler run (every 5 minutes)

---

## ?? Learn More

- **Full Guide**: `docs/DISCORD_INTEGRATION_GUIDE.md`
- **All Notifications**: `docs/NOTIFICATION_SETUP.md`
- **API Examples**: `docs/API_EXAMPLES.md`

---

## ?? You're All Set!

Discord notifications are ready to go! Your team will now get instant updates about API health directly in Discord.

**Happy monitoring!** ????

---

**Need help?** Open an issue on GitHub or check the full documentation.
