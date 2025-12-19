# ? Discord Integration - Complete Deployment Checklist

## Overview
This checklist ensures Discord integration is fully deployed and working.

---

## ?? Pre-Deployment Checklist

### 1. Code Changes ?
- [x] **Frontend** - Discord tab added to settings page
- [x] **Edge Function** - Discord validation and testing added
- [x] **Scheduler** - Discord notification service implemented
- [x] **Syntax Error** - Fixed template literal bug
- [x] **Documentation** - Created guides and troubleshooting docs

### 2. Database Migration ?? **ACTION REQUIRED**
- [ ] **Run this SQL in Supabase Dashboard:**
  ```sql
  ALTER TABLE user_integrations 
    DROP CONSTRAINT IF EXISTS user_integrations_integration_type_check;

  ALTER TABLE user_integrations 
 ADD CONSTRAINT user_integrations_integration_type_check 
    CHECK (integration_type IN ('email', 'slack', 'sms', 'webhook', 'discord'));
  ```

### 3. Edge Function Deployment ?? **ACTION REQUIRED**
- [ ] **Deploy to Supabase:**
  ```bash
  supabase functions deploy manage-integrations
  ```

### 4. Scheduler Deployment ?? **ACTION REQUIRED**
- [ ] **Commit and push** the fixed `notificationService.js` to GitHub
- [ ] **GitHub Actions** will automatically deploy the scheduler

---

## ?? Deployment Steps

### Step 1: Database Migration (2 minutes)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** ? **New query**
4. Paste and run:
   ```sql
   ALTER TABLE user_integrations 
     DROP CONSTRAINT IF EXISTS user_integrations_integration_type_check;

ALTER TABLE user_integrations 
     ADD CONSTRAINT user_integrations_integration_type_check 
     CHECK (integration_type IN ('email', 'slack', 'sms', 'webhook', 'discord'));
   ```
5. Verify: Should show "Success. No rows returned"

### Step 2: Deploy Edge Function (2 minutes)

**Option A: Using Supabase CLI**
```bash
# Make sure you're logged in
supabase login

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy manage-integrations
```

**Option B: Using Supabase Dashboard**
1. Go to **Edge Functions** in Supabase Dashboard
2. Select `manage-integrations` function
3. Update the code with the version from `supabase/functions/manage-integrations/index.ts`
4. Click **Deploy**

### Step 3: Deploy Scheduler (Git Push)

```bash
# Make sure all changes are committed
git add .
git commit -m "Add Discord integration support"
git push origin main
```

GitHub Actions will automatically:
- ? Deploy the updated scheduler
- ? Include the fixed `notificationService.js`
- ? Run the scheduler every 5 minutes

---

## ?? Testing Procedure

### Test 1: Verify Database Constraint

Run this SQL in Supabase Dashboard:
```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'user_integrations'::regclass 
AND conname = 'user_integrations_integration_type_check';
```

**Expected Output:**
```
CHECK ((integration_type IN ('email', 'slack', 'sms', 'webhook', 'discord')))
```

### Test 2: Test Discord Webhook Manually

```bash
curl -X POST "YOUR_DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test from curl"}'
```

**Expected:** Message appears in Discord channel

### Test 3: Test Edge Function

```bash
curl -X OPTIONS \
  https://YOUR_PROJECT.supabase.co/functions/v1/manage-integrations \
  -H "Origin: http://localhost:3000" \
  -v
```

**Expected:** Response with CORS headers

### Test 4: Add Discord Integration via UI

1. Go to http://localhost:3000/dashboard/settings (or your production URL)
2. Click **+ Add Integration**
3. Select **Discord** tab
4. Enter:
   - Name: `Test Discord`
   - Webhook URL: Your Discord webhook URL
5. Click **Add Integration**

**Expected Results:**
- ? Test message appears in Discord
- ? Integration shows in settings list with green "Active" badge
- ? No errors in browser console

### Test 5: Link to Task

1. Go to **Dashboard**
2. Find any task
3. Click **?? Notifications**
4. Click **+ Add Notification**
5. Select your Discord integration
6. Choose "Always"
7. Click **Save**

**Expected:** Notification shows in task list

### Test 6: Test Full Flow

**Option A: Wait for scheduler (5 minutes)**
- GitHub Actions runs every 5 minutes
- Check Discord for notification

**Option B: Run scheduler locally**
```bash
cd scheduler
node scheduler.js
```

**Expected:** Discord message with task execution details

---

## ?? Verification Checklist

After deployment, verify these all work:

### Frontend
- [ ] Settings page shows Discord option
- [ ] Can add Discord integration
- [ ] Test message appears in Discord
- [ ] Integration shows in list
- [ ] Can link Discord to tasks
- [ ] Can view linked notifications

### Backend
- [ ] Edge function accepts Discord type
- [ ] Webhook validation works
- [ ] Database accepts Discord integrations
- [ ] RLS policies work correctly

### Scheduler
- [ ] No syntax errors when running
- [ ] Can send Discord notifications
- [ ] Embeds are properly formatted
- [ ] Colors are correct (green/red)
- [ ] Error messages show correctly

---

## ?? Troubleshooting

### Issue: "SyntaxError: Invalid or unexpected token"
**Status:** ? **FIXED**
**Fix:** Syntax error on line 286 has been corrected

### Issue: "violates check constraint"
**Status:** ?? **ACTION REQUIRED**
**Fix:** Run the database migration (Step 1)

### Issue: "Invalid Discord webhook URL"
**Possible Causes:**
1. Webhook URL is incorrect
2. Webhook was deleted in Discord
3. Network connectivity issue

**Fix:**
1. Verify webhook exists in Discord settings
2. Copy webhook URL again
3. Test with curl (see Test 2 above)

### Issue: CORS error
**Possible Causes:**
1. Edge function not deployed
2. CORS headers missing

**Fix:**
1. Deploy edge function (Step 2)
2. Hard refresh browser (Ctrl+Shift+R)

---

## ?? Deployment Status

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Frontend Code | ? Complete | None |
| Edge Function | ?? Pending | Deploy function |
| Database | ?? Pending | Run migration |
| Scheduler | ?? Pending | Git push |
| Documentation | ? Complete | None |

---

## ?? Success Criteria

You'll know Discord integration is fully working when:

1. ? Can add Discord integration in Settings without errors
2. ? Test message appears in Discord when adding integration
3. ? Can link Discord to tasks
4. ? Notifications appear in Discord when tasks run
5. ? Embeds are properly formatted with colors
6. ? No errors in logs

---

## ?? Getting Help

If you encounter issues:

1. **Check the logs:**
   - Browser console (F12)
   - Supabase function logs
   - GitHub Actions logs

2. **Review documentation:**
   - `docs/DISCORD_MIGRATION_QUICK_FIX.md` - Database fix
   - `docs/DISCORD_DEPLOYMENT_TROUBLESHOOTING.md` - Common issues
   - `docs/DISCORD_SYNTAX_ERROR_FIX.md` - Syntax error details

3. **Test components individually:**
   - Discord webhook (curl test)
   - Edge function (curl test)
 - Scheduler (local run)

---

## ?? Quick Start After Deployment

Once everything is deployed:

1. Refresh your app (hard refresh: Ctrl+Shift+R)
2. Go to Settings ? Add Integration ? Discord
3. Enter your Discord webhook URL
4. Check Discord for test message
5. Link to a task
6. Wait for next run or test manually

---

**Ready to deploy? Start with Step 1 (Database Migration)!** ??

---

## ?? Deployment Notes

**Date:** January 2025
**Components Updated:**
- Frontend: Settings page with Discord tab
- Backend: Edge function with Discord validation
- Scheduler: Discord notification service
- Database: Integration type constraint
- Documentation: 7+ new docs created

**Breaking Changes:** None
**Backward Compatible:** Yes (existing integrations unaffected)
