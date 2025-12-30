# API Schedulr - Notification API Examples

This file contains example API calls for managing notifications in API Schedulr.

## Prerequisites

- Get your Supabase URL and Anon Key from your Supabase project
- Get your user authentication token (JWT) after logging in
- Have a Slack webhook URL ready

---

## 1. Create a Slack Integration

### cURL
```bash
curl -X POST https://YOUR_SUPABASE_URL.supabase.co/functions/v1/manage-integrations \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "integration_type": "slack",
    "name": "Production Alerts",
    "credentials": {
      "webhook_url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    }
  }'
```

### JavaScript (fetch)
```javascript
const response = await fetch('https://YOUR_SUPABASE_URL.supabase.co/functions/v1/manage-integrations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
 integration_type: 'slack',
    name: 'Production Alerts',
    credentials: {
      webhook_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
    }
  })
});

const integration = await response.json();
console.log('Integration created:', integration);
```

---

## 2. List All Integrations

### cURL
```bash
curl -X GET https://YOUR_SUPABASE_URL.supabase.co/functions/v1/manage-integrations \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN"
```

### JavaScript (fetch)
```javascript
const response = await fetch('https://YOUR_SUPABASE_URL.supabase.co/functions/v1/manage-integrations', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const integrations = await response.json();
console.log('Your integrations:', integrations);
```

---

## 3. Link Task to Integration

### cURL
```bash
curl -X POST https://YOUR_SUPABASE_URL.supabase.co/functions/v1/link-task-notification \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task-uuid-here",
    "integration_id": "integration-uuid-here",
    "notify_on": "always"
  }'
```

**Notification Rules:**
- `always` - Every execution
- `failure_only` - Only when status >= 400
- `timeout` - Only on errors/timeouts

### JavaScript (fetch)
```javascript
const response = await fetch('https://YOUR_SUPABASE_URL.supabase.co/functions/v1/link-task-notification', {
method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    task_id: 'task-uuid-here',
    integration_id: 'integration-uuid-here',
    notify_on: 'always'  // or 'failure_only', 'timeout'
  })
});

const link = await response.json();
console.log('Notification linked:', link);
```

---

## 4. Get Notifications for a Task

### cURL
```bash
curl -X GET "https://YOUR_SUPABASE_URL.supabase.co/functions/v1/link-task-notification?task_id=task-uuid-here" \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN"
```

### JavaScript (fetch)
```javascript
const taskId = 'task-uuid-here';
const response = await fetch(`https://YOUR_SUPABASE_URL.supabase.co/functions/v1/link-task-notification?task_id=${taskId}`, {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const notifications = await response.json();
console.log('Task notifications:', notifications);
```

---

## 5. Delete an Integration

### cURL
```bash
curl -X DELETE https://YOUR_SUPABASE_URL.supabase.co/functions/v1/manage-integrations/integration-uuid-here \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN"
```

### JavaScript (fetch)
```javascript
const integrationId = 'integration-uuid-here';
const response = await fetch(`https://YOUR_SUPABASE_URL.supabase.co/functions/v1/manage-integrations/${integrationId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const result = await response.json();
console.log('Integration deleted:', result);
```

---

## 6. Unlink Notification from Task

### cURL
```bash
curl -X DELETE https://YOUR_SUPABASE_URL.supabase.co/functions/v1/link-task-notification/link-uuid-here \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN"
```

### JavaScript (fetch)
```javascript
const linkId = 'link-uuid-here';
const response = await fetch(`https://YOUR_SUPABASE_URL.supabase.co/functions/v1/link-task-notification/${linkId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const result = await response.json();
console.log('Notification unlinked:', result);
```

---

## Complete Example Workflow

```javascript
// 1. Create a Slack integration
const createIntegration = async () => {
  const response = await fetch('https://YOUR_SUPABASE_URL.supabase.co/functions/v1/manage-integrations', {
    method: 'POST',
 headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      integration_type: 'slack',
      name: 'My Slack Channel',
      credentials: {
   webhook_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
      }
    })
  });
  
  return await response.json();
};

// 2. Link it to a task
const linkToTask = async (taskId, integrationId) => {
  const response = await fetch('https://YOUR_SUPABASE_URL.supabase.co/functions/v1/link-task-notification', {
 method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      task_id: taskId,
      integration_id: integrationId,
  notify_on: 'always'
    })
  });
  
  return await response.json();
};

// Run the workflow
(async () => {
  const integration = await createIntegration();
  console.log('Created integration:', integration.id);
  
  const link = await linkToTask('your-task-id', integration.id);
  console.log('Linked to task:', link);
  
  console.log('? Setup complete! You will now receive notifications.');
})();
```

---

## Testing Your Setup

After setting up notifications, you can:

1. **Wait for scheduler** - GitHub Actions runs every 5 minutes
2. **Run scheduler locally** - `node scheduler/scheduler.js`
3. **Test notifications** - `node scheduler/test-notifications.js`

---

## Error Codes

- `401` - Unauthorized (check your JWT token)
- `400` - Bad request (check your payload)
- `404` - Resource not found (check IDs)
- `500` - Server error (check Supabase logs)

---

## Need Help?

- Read the [Setup Guide](../docs/NOTIFICATION_SETUP.md)
- Check [Slack Webhook Docs](https://api.slack.com/messaging/webhooks)
- Review the [main README](../README.md)
