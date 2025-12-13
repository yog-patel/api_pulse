# ?? Include API Response Body in Notifications

## Overview

You can now optionally include the actual API response body in your Slack notifications! This is perfect for debugging and monitoring what your APIs are actually returning.

---

## ? How to Enable

### When Adding a Notification:

1. Go to **Dashboard**
2. Click **?? Notifications** on any task
3. Select your integration and notification rule
4. ? **Check "Include API Response Body"**
5. Click **Add Notification**

That's it! Your notifications will now include the response.

---

## ?? What It Looks Like

### Without Response Body (Default):
```
? API Task Success: Get User Data

Task Name: Get User Data
Status Code: 200
Response Time: 145ms
Method: GET

Endpoint: https://api.example.com/users

Executed at: Jan 15, 2025 at 10:30 AM
```

### With Response Body:
```
? API Task Success: Get User Data

Task Name: Get User Data
Status Code: 200
Response Time: 145ms
Method: GET

Endpoint: https://api.example.com/users

Response Body:
```json
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "status": "active"
}
```

Executed at: Jan 15, 2025 at 10:30 AM
```

---

## ?? Use Cases

### 1. **Debugging API Changes**
```
Scenario: API suddenly returns different data format
Solution: Enable response body to see exactly what changed
```

### 2. **Monitoring Data Quality**
```
Scenario: Need to verify API returns expected values
Solution: Include response to spot anomalies quickly
```

### 3. **Development & Testing**
```
Scenario: Testing new API integrations
Solution: See actual responses without checking logs
```

### 4. **Error Investigation**
```
Scenario: API fails with unclear error message
Solution: Response body shows detailed error info
```

---

## ?? How It Works

### Response Formatting

**JSON Responses:**
- Automatically formatted with proper indentation
- Easy to read in Slack

**Text Responses:**
- Displayed as-is in code block
- Plain text format preserved

### Truncation

**Long Responses:**
- Automatically truncated after 2,000 characters
- Shows `... (truncated)` at the end
- Prevents Slack message limits

**Why truncate?**
- Slack has a 3,000 character limit for code blocks
- Keeps notifications readable
- Full response always available in dashboard logs

---

## ?? Best Practices

### ? **When to Enable**

- **Development/Testing** - Always enable to see what's happening
- **Debugging Issues** - Enable temporarily to investigate problems
- **New APIs** - Enable initially, disable once stable
- **Simple APIs** - Enable for APIs with short responses
- **Error Tracking** - Enable for APIs that return detailed errors

### ? **When to Disable**

- **Production (Stable)** - Only enable if needed
- **Large Responses** - APIs returning lots of data (gets truncated anyway)
- **High-Frequency Tasks** - Avoid notification spam
- **Sensitive Data** - Don't expose passwords, tokens, PII in Slack
- **Binary/Media** - Not useful for images, PDFs, etc.

---

## ?? Security Considerations

### ?? **Important: Review Response Content**

Before enabling, consider:

1. **Sensitive Data**
   - Passwords
 - API keys/tokens
   - Personal information (PII)
   - Financial data
   - Internal IDs

2. **Slack Visibility**
   - Who has access to the Slack channel?
   - Is the workspace properly secured?
   - Could sensitive data be leaked?

3. **Compliance**
   - GDPR considerations for personal data
   - HIPAA for healthcare data
   - PCI-DSS for payment data

### ? **Safe Practices**

```
? Health check endpoints (no sensitive data)
? Public API responses
? Status/metadata endpoints
? Development/test environments
? Authentication endpoints (tokens!)
? User profile data (PII!)
? Payment endpoints (financial data!)
? Production sensitive APIs
```

---

## ?? Visual Indicators

### In Dashboard Notification List:

Notifications with response body enabled show a purple badge:

```
?? Slack Alerts
[All Executions] [?? With Response]
```

**Badge Colors:**
- **Blue** - All Executions
- **Red** - Failures Only
- **Yellow** - Timeouts Only
- **Purple** - With Response Body ? NEW!

---

## ?? Technical Details

### Database Schema

New column in `task_notifications`:
```sql
include_response BOOLEAN DEFAULT FALSE
```

### API Payload

When creating a notification link:
```json
{
  "task_id": "uuid",
  "integration_id": "uuid",
  "notify_on": "always",
  "include_response": true  // ? NEW!
}
```

### Response Processing

1. **Retrieve** response body from execution log
2. **Truncate** if longer than 2,000 characters
3. **Format** JSON responses with indentation
4. **Include** in Slack message as code block

---

## ?? Examples

### Example 1: REST API
```json
{
  "status": "ok",
  "data": {
    "users": 42,
    "active": 38,
    "inactive": 4
  }
}
```

### Example 2: Error Response
```json
{
  "error": "Invalid API key",
  "code": "AUTH_FAILED",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Example 3: Plain Text
```
Service Status: All systems operational
Uptime: 99.99%
Last Check: 2025-01-15 10:30:00
```

---

## ?? Troubleshooting

### Response not showing in Slack?

**Check:**
1. ? Checkbox was enabled when creating notification
2. ? Purple "?? With Response" badge shows in dashboard
3. ? API actually returned a response body
4. ? Response isn't empty

### Response truncated too aggressively?

**Reason:** Slack has hard limits on message size

**Solutions:**
- View full response in Dashboard ? Task Logs
- Use webhook integration for custom handling
- Filter/reduce API response size

### Response formatting looks weird?

**JSON:** Should auto-format nicely
**Plain text:** Displayed as-is
**HTML/XML:** Shown as raw text

---

## ?? Future Enhancements

Planned features:
- ??? **Custom truncation length** - Choose how much to include
- ?? **Response filtering** - Show only specific JSON fields
- ?? **Email support** - Include responses in email notifications
- ?? **Response comparison** - Highlight changes between executions

---

## ? Summary

| Feature | Benefit |
|---------|---------|
| **Optional** | Enable only when needed |
| **Formatted** | JSON auto-formatted for readability |
| **Truncated** | Long responses handled automatically |
| **Visible** | Purple badge shows it's enabled |
| **Flexible** | Per-task, per-integration control |

---

## ?? Get Started!

1. Go to Dashboard
2. Click ?? Notifications
3. Check "Include API Response Body"
4. Save and test!

**Pro tip:** Start with "Include Response" enabled, then disable once you verify everything works! ??
