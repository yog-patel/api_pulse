# ?? API Pulse - Complete Setup Guide

## Table of Contents
- [Quick Start](#quick-start)
- [Email Notifications](#email-notifications)
- [Pricing & Plans](#pricing--plans)
- [Deployment](#deployment)

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- Supabase account
- GitHub account (for automation)

### 2. Installation

```bash
# Clone repository
git clone https://github.com/yog-patel/api_pulse.git
cd api_pulse

# Install frontend dependencies
cd frontend
npm install

# Install scheduler dependencies
cd ../scheduler
npm install
```

### 3. Environment Setup

**Frontend (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Scheduler (.env):**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key  # Optional for email
FROM_EMAIL=notifications@yourdomain.com  # Optional for email
```

### 4. Database Setup

Run migrations in Supabase SQL Editor:

```sql
-- 1. Run initial schema (from your Supabase dashboard)
-- 2. Run subscription tracking migration
-- Copy from: database/migrations/add_subscription_tracking.sql
```

### 5. Deploy Edge Functions

```bash
cd supabase
supabase functions deploy list-tasks
supabase functions deploy create-task
supabase functions deploy delete-task
supabase functions deploy toggle-task
supabase functions deploy manage-integrations
supabase functions deploy link-task-notification
```

### 6. GitHub Actions Setup

Add these secrets to your GitHub repository:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (optional)
- `FROM_EMAIL` (optional)

---

## Email Notifications

### Setup Resend (Free Tier: 100 emails/day)

1. **Sign up at [resend.com](https://resend.com)**
2. **Create API Key:**
   - Go to API Keys
 - Create new key
   - Copy key (starts with `re_`)

3. **Configure:**
   ```bash
   # scheduler/.env
   RESEND_API_KEY=re_your_key_here
   FROM_EMAIL=notifications@yourdomain.com
   ```

4. **For testing without domain:**
   ```bash
   FROM_EMAIL=onboarding@resend.dev
   ```

5. **Add to GitHub Secrets:**
   - Settings ? Secrets ? Actions
   - Add `RESEND_API_KEY`
   - Add `FROM_EMAIL`

### Email Features
- ? Beautiful HTML templates
- ? Success/failure notifications
- ? Mobile responsive
- ? Optional response body inclusion
- ? No SDK dependencies (uses REST API)

---

## Pricing & Plans

### Current Pricing Structure

| Feature | Free | Starter ($9/mo) | Pro ($15/mo) |
|---------|------|-----------------|--------------|
| **API Tasks** | 2 | 10 | 50 |
| **Min Interval** | 1 hour | 15 min | 5 min |
| **Monthly Runs** | 100 | 2,000 | 5,000 |
| **Notifications** | Dashboard only | Email/Slack | All + SMS |
| **Log Retention** | 7 days | 14 days | 30 days |
| **Support** | Community | Email | Priority |

### Database Schema

Plans are tracked in the `profiles` table:
- `plan_id`: 'free', 'starter', or 'pro'
- `stripe_customer_id`: For billing (future)
- `stripe_subscription_id`: For subscription management (future)

Usage is tracked in `user_usage` table:
- Runs per month
- Task count
- Auto-resets monthly

---

## Deployment

### Frontend (Vercel Recommended)

```bash
cd frontend
npm run build

# Deploy to Vercel
vercel --prod
```

### Scheduler (GitHub Actions)

Already configured! Runs every minute via:
`.github/workflows/schedule-tasks.yml`

**No additional setup needed** - just push to GitHub.

### Manual Scheduler Testing

```bash
cd scheduler
node scheduler.js
```

---

## Feature Guides

### 1. Slack Notifications

1. Create Slack webhook: https://api.slack.com/messaging/webhooks
2. Go to Settings ? Add Integration ? Slack
3. Paste webhook URL
4. Link to tasks via ?? Notifications button

### 2. Email Notifications

1. Set up Resend (see above)
2. Go to Settings ? Add Integration ? Email
3. Enter email address
4. Link to tasks via ?? Notifications button

### 3. Notification Rules

- **Always**: Every execution (testing/debugging)
- **Failure Only**: Status >= 400 (production)
- **Timeout Only**: Network errors (connectivity monitoring)

### 4. Response Body Inclusion

Optional feature to include API response in notifications:
- ? Enable for debugging
- ? Auto-truncated to 2,000 chars
- ? JSON auto-formatted
- ?? Don't use for sensitive data

---

## Troubleshooting

### Common Issues

**Issue: Email not sending**
- Check `RESEND_API_KEY` in GitHub secrets
- Verify `.github/workflows/schedule-tasks.yml` has env vars
- Check Resend dashboard for delivery status

**Issue: Tasks not executing**
- Verify GitHub Actions is enabled
- Check workflow runs in Actions tab
- Ensure tasks are set to "Running" status

**Issue: Usage not tracking**
- Run database migration: `add_subscription_tracking.sql`
- Verify `increment_run_count()` function exists
- Check `user_usage` table has data

**Issue: Import errors in TypeScript**
- Use `@supabase/supabase-js` (npm package) not relative path
- Use relative paths for local files: `../lib/plans`
- TypeScript config issues don't affect runtime

---

## File Structure

```
api_pulse/
??? frontend/    # Next.js app
?   ??? app/   # Pages
?   ??? components/       # React components
?   ??? lib/             # Utilities (plans.ts)
??? scheduler/            # Task execution
?   ??? scheduler.js      # Main scheduler
?   ??? notificationService.js
?   ??? emailTemplates.js
??? supabase/
?   ??? functions/    # Edge functions
??? database/
?   ??? migrations/       # SQL migrations
??? docs/        # Documentation
??? .github/
    ??? workflows/        # GitHub Actions
```

---

## Monitoring

### GitHub Actions Logs

View execution logs:
1. Go to Actions tab
2. Click on latest workflow run
3. View "Run scheduler" step

### Supabase Logs

View Edge Function logs:
1. Supabase Dashboard ? Edge Functions
2. Click on function
3. View Logs tab

### Task Execution Logs

View in dashboard:
1. Dashboard ? Task ? View Logs
2. See all executions with status/timing

---

## Security Best Practices

1. **Never commit `.env` files**
2. **Use GitHub Secrets** for all keys
3. **Enable RLS** on all Supabase tables
4. **Validate inputs** in Edge Functions
5. **Limit notification response bodies** for sensitive APIs

---

## Support & Resources

- **Documentation:** See `/docs` folder
- **Issues:** GitHub Issues
- **Email Setup:** `docs/EMAIL_SETUP_GUIDE.md`
- **Pricing:** `docs/PRICING_IMPLEMENTATION.md`

---

## Quick Commands Reference

```bash
# Development
cd frontend && npm run dev        # Start frontend
cd scheduler && node scheduler.js # Test scheduler

# Deployment
supabase functions deploy <name>  # Deploy Edge Function
vercel --prod         # Deploy frontend
git push origin main       # Trigger GitHub Actions

# Testing
cd scheduler && npm test   # Test notifications
node -c scheduler/scheduler.js    # Check syntax
```

---

## ? Deployment Checklist

- [ ] Supabase project created
- [ ] Database migrations run
- [ ] Edge Functions deployed
- [ ] Frontend deployed
- [ ] GitHub Secrets configured
- [ ] Email (Resend) configured (optional)
- [ ] Test task created
- [ ] Notifications working
- [ ] Usage tracking verified

---

**You're all set! Start monitoring your APIs!** ??
