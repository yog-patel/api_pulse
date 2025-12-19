# ?? Discord Integration - Deployment & Troubleshooting

## ?? Important: Deploy the Edge Function First!

Before Discord integration will work, you **must deploy** the updated `manage-integrations` function to Supabase.

---

## ?? Step 1: Deploy the Edge Function

### Option A: Using Supabase CLI (Recommended)

```bash
# 1. Make sure you have Supabase CLI installed
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link your project (if not already linked)
supabase link --project-ref your-project-ref

# 4. Deploy the manage-integrations function
supabase functions deploy manage-integrations

# Expected output:
# ? Deployed function manage-integrations to Supabase
```

### Option B: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Edge Functions** in the left sidebar
4. Click **Deploy new function**
5. Select `manage-integrations`
6. Upload or paste the code from `supabase/functions/manage-integrations/index.ts`
7. Click **Deploy**

---

## ?? Step 2: Test the Deployment

### Test with cURL

```bash
# Replace with your actual Supabase URL and user token
curl -X OPTIONS \
  https://YOUR_PROJECT.supabase.co/functions/v1/manage-integrations \
  -H "Origin: http://localhost:3000"

# Expected response: Should include CORS headers
```

### Test Discord Webhook Directly

Before testing through the app, verify your Discord webhook works:

```bash
# Replace with your actual Discord webhook URL
curl -X POST \
  "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test from command line"}'
```

If this works, your Discord webhook is valid! ?

---

## ?? Step 3: Debugging CORS Errors

### Check 1: Verify Function is Deployed

```bash
# List all deployed functions
supabase functions list

# You should see 'manage-integrations' in the list
```

### Check 2: Check Function Logs

```bash
# View real-time logs
supabase functions logs manage-integrations --tail

# Or from Supabase Dashboard:
# Edge Functions ? manage-integrations ? Logs
```

### Check 3: Verify CORS Headers

The function should have these CORS headers (already in code):

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
```

### Check 4: Test OPTIONS Request

```bash
curl -X OPTIONS \
  https://YOUR_PROJECT.supabase.co/functions/v1/manage-integrations \
  -H "Origin: http://localhost:3000" \
  -v
```

Look for these headers in the response:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS`

---

## ?? Common Issues & Solutions

### Issue 1: "Access to fetch at '...' blocked by CORS"

**Cause**: Edge function not deployed or CORS headers missing

**Solution**:
1. Deploy the function: `supabase functions deploy manage-integrations`
2. Wait 30 seconds for deployment to complete
3. Refresh your browser
4. Try again

### Issue 2: "An error occurred while creating the integration"

**Cause**: Generic error, need more details

**Solution**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for the detailed error message
4. Check Network tab ? find the failed request ? Response tab

### Issue 3: "Invalid Discord webhook URL"

**Cause**: Discord webhook test failed

**Possible reasons**:
- Webhook URL is incorrect
- Webhook was deleted in Discord
- Discord API is down
- Network connectivity issues

**Solution**:
1. Verify webhook exists in Discord: Server Settings ? Integrations ? Webhooks
2. Copy the webhook URL again (entire URL)
3. Test manually:
 ```bash
   curl -X POST "YOUR_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"content": "Test"}'
   ```
4. If manual test works but app doesn't, check function logs

### Issue 4: Function Logs Show Error

**View logs**:
```bash
supabase functions logs manage-integrations --tail
```

**Common log errors**:

- `"Failed to test Discord webhook"` ? Check webhook URL format
- `"Discord webhook URL is required"` ? Check frontend is sending `webhook_url` in credentials
- `"Unauthorized"` ? Check your auth token is valid

### Issue 5: "Network request failed"

**Cause**: Frontend can't reach Supabase

**Solution**:
1. Check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
2. Verify it matches your Supabase project URL
3. Make sure you're logged in (check session)
4. Try logging out and back in

---

## ?? Manual Test Procedure

Follow these steps to isolate the issue:

### 1. Test Discord Webhook Manually
```bash
curl -X POST "https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Manual test"}'
```

**Expected**: Message appears in Discord channel  
**If fails**: Discord webhook is invalid

### 2. Test Edge Function OPTIONS
```bash
curl -X OPTIONS \
  https://YOUR_PROJECT.supabase.co/functions/v1/manage-integrations \
  -H "Origin: http://localhost:3000" \
  -v
```

**Expected**: 200 OK with CORS headers  
**If fails**: Function not deployed or CORS issue

### 3. Test Edge Function POST (with Auth)
```bash
# Get your auth token from browser DevTools:
# Application tab ? Storage ? Local Storage ? sb-...-auth-token

curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/manage-integrations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "integration_type": "discord",
    "name": "Test Discord",
    "credentials": {
      "webhook_url": "https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"
    }
  }'
```

**Expected**: Integration created, test message in Discord
**If fails**: Check function logs for error

### 4. Test from Frontend
```javascript
// Open browser console (F12) and paste:
const session = await (await fetch('/api/auth/session')).json();
const token = session?.access_token;

const response = await fetch(
  'https://YOUR_PROJECT.supabase.co/functions/v1/manage-integrations',
  {
    method: 'POST',
    headers: {
 'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
    },
    body: JSON.stringify({
   integration_type: 'discord',
      name: 'Test Discord',
      credentials: {
        webhook_url: 'https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN'
      }
    })
  }
);

const data = await response.json();
console.log(data);
```

**Expected**: Integration object returned  
**If fails**: Check response for error details

---

## ? Verification Checklist

Before reporting an issue, verify:

- [ ] Edge function is deployed (`supabase functions list`)
- [ ] CORS headers are in the function code
- [ ] Discord webhook URL is valid (test with cURL)
- [ ] Discord webhook URL is complete (starts with `https://discord.com/api/webhooks/`)
- [ ] You're logged into the app (valid session)
- [ ] Environment variables are set correctly
- [ ] Function logs don't show errors (`supabase functions logs`)
- [ ] Browser console shows the actual error message

---

## ?? Getting Help

If you've tried all the above and still have issues:

1. **Check function logs**:
   ```bash
   supabase functions logs manage-integrations --tail
   ```

2. **Check browser console** for detailed error messages

3. **Share these details**:
   - Error message from browser console
   - Error from function logs (if any)
   - Discord webhook test result (cURL)
   - Edge function deployment status

4. **Quick fix**: Redeploy the function
   ```bash
   supabase functions deploy manage-integrations --no-verify-jwt
   ```

---

## ?? Quick Start After Deployment

Once the function is deployed:

1. ? Refresh your browser (clear cache: Ctrl+Shift+R)
2. ? Go to Settings ? Add Integration
3. ? Select Discord tab
4. ? Enter name and webhook URL
5. ? Click Add Integration
6. ? Check Discord for test message
7. ? Link to a task and test!

---

**Most common fix**: Just deploy the function!
```bash
supabase functions deploy manage-integrations
```

Then refresh your browser and try again. ??
