# ?? Email Notifications - Quick Reference

## ? Setup (3 Steps)

### 1. Get Resend API Key
```
1. Sign up: https://resend.com (free)
2. Create API key
3. Copy key (re_...)
```

### 2. Configure
```bash
# scheduler/.env
RESEND_API_KEY=re_your_key
FROM_EMAIL=notifications@yourdomain.com
```

### 3. Add Integration
```
Settings ? + Add Integration ? Email ? Save
Dashboard ? Task ? ?? Notifications ? Select Email ? Save
```

---

## ?? Features

- ? **No dependencies** - Uses REST API directly
- ? **HTML emails** - Professional design
- ? **Mobile responsive** - Works everywhere
- ? **Free tier** - 100/day, 3,000/month
- ? **Color coded** - Green success, red failure
- ? **Instant** - 1-3 second delivery

---

## ?? Email Examples

### Success
```
Subject: ? API Task Success: Task Name
Theme: Green
Contains: Status, response time, endpoint, optional response body
```

### Failure
```
Subject: ? API Task Failed: Task Name
Theme: Red
Contains: Error message, status, details, call to action
```

---

## ?? API Endpoint

```javascript
POST https://api.resend.com/emails

Headers:
  Authorization: Bearer re_your_api_key
  Content-Type: application/json

Body:
  {
    from: "notifications@domain.com",
    to: ["user@email.com"],
    subject: "Email subject",
    html: "<html>...</html>"
  }
```

---

## ?? Best Practices

| Environment | Notification Rule | Why |
|------------|------------------|-----|
| **Development** | `always` | Test everything |
| **Staging** | `failure_only` | Catch issues |
| **Production** | `failure_only` | Reduce noise |

---

## ?? Troubleshooting

| Issue | Solution |
|-------|----------|
| Not receiving | Check spam folder |
| "Resend not configured" | Add RESEND_API_KEY to .env |
| Emails in spam | Verify domain, add to contacts |
| "Invalid email" | Use format: user@domain.com |

---

## ?? Usage Calculator

```
Formula: tasks × frequency × 24 hours

Examples:
- 5 tasks × 1/hour × 24 = 120 emails/day ? (if always)
- 5 tasks × 1/hour × 24 = ~5 emails/day ? (if failure_only)
- 10 tasks × 1/6 hours × 24 = 40 emails/day ? (always)
```

**Pro tip:** Use `failure_only` to stay in free tier!

---

## ?? Security

**Safe:**
- ? Health checks
- ? Public APIs
- ? Status updates

**Unsafe:**
- ? Auth tokens
- ? API keys
- ? PII data
- ? Financial info

---

## ?? Documentation

- **Full Setup:** `docs/EMAIL_SETUP_GUIDE.md`
- **Templates:** `scheduler/emailTemplates.js`
- **Implementation:** `docs/EMAIL_COMPLETE.md`
- **Fix Notes:** `docs/EMAIL_FIX.md`

---

## ? Checklist

- [ ] Resend account created
- [ ] API key in .env
- [ ] FROM_EMAIL configured
- [ ] Email integration added
- [ ] Integration linked to task
- [ ] Test email received
- [ ] Spam checked
- [ ] Notification rule set

---

## ?? Quick Test

```bash
cd scheduler
node scheduler.js
```

**Check your email!** ??

---

**Need help?** Check `docs/EMAIL_SETUP_GUIDE.md` for detailed instructions.
