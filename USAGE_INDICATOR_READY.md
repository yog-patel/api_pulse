# ?? Quick Deployment Script

## ? All Files Are Ready!

Your usage indicator is now properly configured. Here's what to do:

---

## ?? **Deployment Checklist**

### ? **Step 1: Database Migration** (5 minutes)

1. **Open Supabase Dashboard:** https://supabase.com/dashboard
2. **Go to SQL Editor**
3. **Copy this file's content:** `database/migrations/add_subscription_tracking.sql`
4. **Paste and Run** in SQL Editor
5. **Set default plan:**
   ```sql
   UPDATE profiles SET plan_id = 'free' WHERE plan_id IS NULL;
   ```

### ? **Step 2: Commit & Push** (2 minutes)

```sh
git add .
git commit -m "feat: add usage tracking with pricing system"
git push origin main
```

### ? **Step 3: Test Locally** (optional)

```sh
cd frontend
npm install
npm run dev
```

Visit: http://localhost:3000/dashboard

### ? **Step 4: Deploy** (if using Vercel)

```sh
cd frontend
vercel --prod
```

Or push to GitHub and Vercel will auto-deploy.

---

## ?? **What You Should See**

After completing the steps, your dashboard will show:

```
???????????????????????????????????????????
? Usage This Month          [Free Plan]   ?
???????????????????????????????????????????
? API Runs        ?
? ??????????  0 / 100          ?
???????????????????????????????????????????
? API Tasks         ?
? ??????????  1 / 2       ?
???????????????????????????????????????????
```

**Features:**
- ? Real-time usage stats
- ? Color-coded progress bars (green ? yellow ? red)
- ? Plan display
- ? Upgrade prompts when near limits

---

## ?? **Troubleshooting**

### **If usage indicator doesn't appear:**

1. **Check browser console (F12)** for errors
2. **Hard refresh:** `Ctrl + Shift + R`
3. **Verify migration ran:**
   ```sql
   SELECT id, email, plan_id FROM profiles LIMIT 1;
   ```
4. **Test function:**
   ```sql
   SELECT * FROM get_current_month_usage('your-user-id');
   ```

### **Common Issues:**

| Error | Solution |
|-------|----------|
| "Cannot find module '../lib/plans'" | Run `npm install` and rebuild |
| "get_current_month_usage is not a function" | Run database migration |
| "column plan_id does not exist" | Run database migration |
| Component not showing | Clear cache, hard refresh |

---

## ? **Files Changed**

1. ? `lib/plans.ts` - Created (plan configuration)
2. ? `frontend/components/UsageIndicator.tsx` - Already exists
3. ? `frontend/app/dashboard/page.tsx` - Updated (imports UsageIndicator)
4. ? `frontend/app/page.tsx` - Updated (new pricing)
5. ? `database/migrations/add_subscription_tracking.sql` - Ready to run

---

## ?? **You're Ready to Deploy!**

**Just 3 commands:**

```sh
# 1. Commit
git add . && git commit -m "feat: add usage tracking" && git push

# 2. Run SQL migration in Supabase Dashboard

# 3. Deploy (or wait for auto-deploy)
```

**That's it!** Your usage indicator will be live! ??

---

## ?? **Need Help?**

If you encounter any issues:
1. Check browser console (F12)
2. Verify database migration ran
3. Check Supabase logs
4. Review `docs/SETUP_GUIDE.md`

**Everything is ready - just deploy!** ?
