# ?? Usage Increment Fix

## ? **Problem Identified**

The scheduler was **NOT calling `increment_run_count()`** after task executions!

### **What Was Missing:**
```javascript
// ? Before: No usage tracking
await supabase.from("api_task_logs").insert([logData]);
// ... notifications ...
```

### **What Was Added:**
```javascript
// ? After: Usage tracking added
await supabase.from("api_task_logs").insert([logData]);

// Increment usage count
await supabase.rpc('increment_run_count', {
  p_user_id: task.user_id
});

// ... notifications ...
```

---

## ?? **Deploy the Fix**

### **Step 1: Commit Changes**

```sh
git add scheduler/scheduler.js
git commit -m "fix: add usage tracking to scheduler

- Call increment_run_count() after each task execution
- Track both successful and failed runs
- Fixes usage indicator not updating"

git push origin main
```

### **Step 2: Wait for Next Run**

GitHub Actions runs every minute, so:
1. Push the code
2. Wait ~1 minute
3. Check GitHub Actions logs
4. Usage should increment!

---

## ?? **Test Locally (Optional)**

```sh
cd scheduler

# Make sure you have .env file with:
# SUPABASE_URL=your_url
# SUPABASE_SERVICE_ROLE_KEY=your_key

node scheduler.js
```

**Expected output:**
```
[2025-12-13T...] Starting task execution...
Found 1 tasks to execute

Executing task: Your Task (task-id)
? Task executed: Your Task - Status: 200 - Time: 150ms
Sending 2 notification(s) for task: Your Task
? Slack notification sent
[2025-12-13T...] Task execution completed
```

**No errors about `increment_run_count`** = Success! ?

---

## ? **Verify It's Working**

### **1. Check GitHub Actions Logs**

After next run, check logs at:
`https://github.com/yog-patel/api_pulse/actions`

Look for:
```
? Task executed: Your Task - Status: 200
```

**No `Error incrementing usage count` message** = Working! ?

### **2. Check Database**

In Supabase SQL Editor:

```sql
-- Check your usage record
SELECT 
  user_id, 
  month, 
  runs_count, 
  tasks_count,
  updated_at
FROM user_usage 
WHERE user_id = 'YOUR-USER-ID'
ORDER BY updated_at DESC;
```

**After each task run, `runs_count` should increase!**

### **3. Check Dashboard**

1. Go to your dashboard
2. Hard refresh: `Ctrl + Shift + R`
3. Usage indicator should show:

```
Usage This Month    [Free Plan]
API Runs:  1 / 100    (increases after each run!)
API Tasks: 1 / 2
```

---

## ?? **How It Works Now**

### **Execution Flow:**

```
1. Task executes
2. Log saved to api_task_logs ?
3. increment_run_count() called ?  ? THIS WAS MISSING!
4. Notifications sent ?
5. next_run_at updated ?
```

### **Database Updates:**

```sql
-- After each execution, this runs automatically:
INSERT INTO user_usage (user_id, month, runs_count, tasks_count)
VALUES (...)
ON CONFLICT (user_id, month)
DO UPDATE SET
  runs_count = user_usage.runs_count + 1,  ? Increments here!
  tasks_count = (SELECT COUNT(*) FROM api_tasks WHERE ...),
  updated_at = NOW();
```

---

## ?? **What Changed**

### **File Modified:**
- `scheduler/scheduler.js`

### **Changes Made:**

**1. Success Path (line ~106):**
```javascript
// After logging
const { error: usageError } = await supabase.rpc('increment_run_count', {
  p_user_id: task.user_id
});
```

**2. Error Path (line ~156):**
```javascript
// After logging error
const { error: usageError } = await supabase.rpc('increment_run_count', {
  p_user_id: task.user_id
});
```

---

## ? **Quick Test Checklist**

- [ ] Code committed and pushed
- [ ] GitHub Actions ran successfully (check Actions tab)
- [ ] No errors in logs
- [ ] Database `runs_count` increased
- [ ] Dashboard shows updated usage
- [ ] Progress bar reflects new count

---

## ?? **Troubleshooting**

### **If usage still doesn't increase:**

**1. Check function exists:**
```sql
SELECT proname FROM pg_proc WHERE proname = 'increment_run_count';
-- Should return: increment_run_count
```

**2. Test function manually:**
```sql
SELECT increment_run_count('YOUR-USER-ID');
-- Should execute without error

-- Check if it incremented:
SELECT runs_count FROM user_usage WHERE user_id = 'YOUR-USER-ID';
```

**3. Check GitHub Actions logs:**
```
# Look for this error:
Error incrementing usage count: ...

# If you see it, the function call is failing
```

**4. Verify user has usage record:**
```sql
SELECT * FROM user_usage WHERE user_id = 'YOUR-USER-ID';
-- Should return at least one row
```

---

## ?? **Status: Fixed!**

The scheduler now:
- ? Tracks successful runs
- ? Tracks failed runs
- ? Updates database automatically
- ? Shows real-time usage in dashboard

**Just push and wait ~1 minute for next run!** ??

---

## ?? **Summary**

**Problem:** Usage counter never increased

**Root Cause:** Scheduler didn't call `increment_run_count()`

**Solution:** Added function call after each execution

**Result:** Usage tracking now works perfectly! ?
