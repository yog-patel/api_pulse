# API Schedulr

A web application for scheduling automated HTTP requests to API endpoints with real-time notifications.

## Features

-  Schedule API calls (GET/POST) to run on intervals
-  Monitor execution logs and response status
-  User authentication with Supabase
-  Serverless backend using Supabase Edge Functions
-  **Multi-channel notifications** (Slack, Discord, Email, SMS, Webhooks)
-  Automated execution via GitHub Actions (every 5 minutes)

## Quick Start

1. **Clone and Install**
   ```bash
   cd frontend
   npm install
   cd ../scheduler
   npm install
   ```

2. **Setup Environment Variables**
   ```bash
   # frontend/.env.local
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...
   NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   
   # scheduler/.env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Supabase Edge Functions (set in Supabase Dashboard)
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Run Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   Open http://localhost:3000

4. **Deploy Backend**
   - Deploy functions in `supabase/functions/` to Supabase Edge Functions
   - Deploy database schema from `database/schema.sql`

5. **Setup Scheduler**
   - GitHub Actions runs automatically every 5 minutes (`.github/workflows/schedule-tasks.yml`)
   - Or run locally: `node scheduler/scheduler.js`

6. **Setup Notifications** (Optional)
   - See [Notification Setup Guide](docs/NOTIFICATION_SETUP.md)
   - Configure Slack, Email, or SMS notifications

## Project Structure

```
api-schedulr/
├── frontend/   # Next.js frontend
├── supabase/functions/    # Supabase Edge Functions
│   ├── create-task/       # Create new scheduled task
│   ├── list-tasks/        # List user's tasks
│   ├── get-task-logs/     # Get task execution logs
│   ├── delete-task/       # Delete a task
│   ├── toggle-task/    # Enable/disable a task
│   ├── manage-integrations/      # Manage notification integrations
│   ├── link-task-notification/   # Link tasks to notifications
│   ├── create-checkout-session/  # ⭐ NEW: Create Stripe checkout sessions
│   └── stripe-webhook/           # ⭐ NEW: Handle Stripe webhook events
├── database/    # PostgreSQL schema
├── scheduler/     # Task execution scheduler
│   ├── scheduler.js       # Main scheduler logic
│   └── notificationService.js  # ⭐ NEW: Notification service
├── docs/             # Documentation
│   └── NOTIFICATION_SETUP.md   # ⭐ NEW: Setup guide
└── .github/workflows/     # GitHub Actions
```

## API Endpoints

### Task Management
- `POST /functions/v1/create-task` - Create a new task
- `GET /functions/v1/list-tasks` - List user's tasks
- `GET /functions/v1/get-task-logs/:id` - Get task execution logs
- `DELETE /functions/v1/delete-task/:id` - Delete a task
- `PATCH /functions/v1/toggle-task/:id` - Enable/disable a task

###  Notification Management
- `GET /functions/v1/manage-integrations` - List all notification integrations
- `POST /functions/v1/manage-integrations` - Create new integration (Slack/Email/SMS/Webhook)
- `DELETE /functions/v1/manage-integrations/:id` - Delete an integration
- `GET /functions/v1/link-task-notification?task_id=:id` - Get notifications for a task
- `POST /functions/v1/link-task-notification` - Link task to notification channel
- `DELETE /functions/v1/link-task-notification/:id` - Unlink notification

### Payment Management (NEW)
- `POST /functions/v1/create-checkout-session` - Create Stripe checkout session
- `POST /functions/v1/stripe-webhook` - Handle Stripe webhook events (subscription updates)

##  Notification Features

### Supported Channels
-  **Slack** - Free webhooks with rich formatting
-  **Discord** - Free webhooks with rich embeds
-  **Email** - Resend integration (100 emails/day free)
-  **SMS** - Coming soon (Twilio integration)
-  **Custom Webhooks** - Send to any endpoint

###  Easy Management UI
- **Settings Page** - Add/manage notification integrations (Slack, Discord, Email, SMS)
- **Dashboard** -  Link integrations to tasks with one click!
- **Notification Rules** - Choose when to notify (always/failure/timeout)
- **Visual Feedback** - See active notifications for each task
- **Response Body** - Optionally include API responses in notifications for debugging

### Notification Rules
- **always** - Notify on every task execution
- **failure_only** - Only notify when tasks fail (status >= 400)
- **timeout** - Only notify on errors/timeouts

### Include Response Body
-  **Optional feature** - Check a box to include API response
-  **Auto-formatted** - JSON responses pretty-printed
-  **Auto-truncated** - Long responses limited to 2,000 chars
-  **Visual badge** - Purple " With Response" indicator
-  **Perfect for debugging** - See exactly what APIs return

See the [response body guide](docs/INCLUDE_RESPONSE_FEATURE.md) for details.

## Payment & Subscription System

API Schedulr uses **Stripe** for secure payment processing and subscription management.

### Pricing Plans

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | 2 tasks, 1hr min interval, Dashboard only, 7 day history |
| **Starter** | $9/mo | 10 tasks, 15min min interval, Slack & Discord, 14 day history |
| **Pro** | $15/mo | 50 tasks, 5min min interval, Email + all channels, Custom webhooks, 30 day history |

### Payment Features

- ✅ **Stripe Checkout Integration** - Secure payment processing
- ✅ **Automatic Subscription Management** - Webhook-based plan updates
- ✅ **Billing Dashboard** - View and manage subscriptions
- ✅ **Plan Upgrades/Downgrades** - Seamless plan changes
- ✅ **Subscription Status Tracking** - Active, canceled, past_due states
- ✅ **Billing Period Tracking** - Current period start/end dates

### Setup Instructions

#### 1. Create Stripe Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Products
2. Create two products:
   - **Starter Plan**: $9/month recurring subscription
   - **Pro Plan**: $15/month recurring subscription
3. Copy the **Price IDs** (starts with `price_...`)

#### 2. Configure Environment Variables

**Frontend (`.env.local`):**
```bash
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**Supabase Edge Functions (Set in Supabase Dashboard):**
```bash
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe webhook settings
```

#### 3. Set Up Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook Signing Secret** (starts with `whsec_...`)

#### 4. Deploy Edge Functions

```bash
# Deploy checkout function
supabase functions deploy create-checkout-session

# Deploy webhook handler
supabase functions deploy stripe-webhook
```

**📖 For detailed step-by-step setup instructions, see [Payment Setup Guide](docs/PAYMENT_SETUP_GUIDE.md)**

### Payment Flow

1. **User clicks "Get Started"** on a paid plan
2. **Frontend** calls `create-checkout-session` Edge Function
3. **Function** creates/retrieves Stripe customer
4. **Function** creates Stripe Checkout session
5. **User** is redirected to Stripe Checkout
6. **After payment**, Stripe redirects back with `session_id`
7. **Stripe** sends webhook to `stripe-webhook` function
8. **Webhook** updates user's plan in database
9. **User** sees updated plan immediately

### API Endpoints

#### Payment Management
- `POST /functions/v1/create-checkout-session` - Create Stripe checkout session
  - Body: `{ priceId: string, planId: 'starter' | 'pro' }`
  - Returns: `{ sessionId: string, url: string }`

- `POST /functions/v1/stripe-webhook` - Handle Stripe webhooks
  - Automatically processes subscription events
  - Updates user plans in database

### Database Schema

The `profiles` table includes subscription fields:
- `plan_id` - Current plan: 'free', 'starter', or 'pro'
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Stripe subscription ID
- `subscription_status` - 'active', 'canceled', 'past_due', 'trialing'
- `current_period_start` - Current billing period start
- `current_period_end` - Current billing period end

### Billing Management

Users can manage their subscriptions at `/dashboard/billing`:
- View current plan and subscription details
- See billing period and next payment date
- Upgrade to higher plans
- Cancel subscriptions (downgrades to free at period end)

### Plan Restrictions

The system enforces plan limits:
- **Task Limits**: Maximum number of tasks per plan
- **Interval Limits**: Minimum check interval (Free: 1hr, Starter: 15min, Pro: 5min)
- **Notification Channels**: 
  - Free: Dashboard only
  - Starter: Slack & Discord
  - Pro: Email, Slack, Discord, Custom Webhooks
- **Log Retention**: How long execution logs are stored (7/14/30 days)

## Database Schema

The application uses the following main tables:
- `profiles` - User profiles (includes subscription info: plan_id, stripe_customer_id, subscription_status)
- `api_tasks` - Scheduled API tasks
- `api_task_logs` - Task execution history
- `user_integrations` - Notification channel configurations
- `task_notifications` - Links between tasks and notification channels
- `user_usage` - Monthly usage tracking (runs_count, tasks_count)



## Development Status

 **Completed:**
- Edge Functions deployed
- Database schema with RLS policies
- User authentication (Supabase Auth)
- API task scheduling and execution
- GitHub Actions integration (runs every 5 minutes)
- Multi-channel notifications (Slack, Discord, Email, Custom Webhooks)
- Notification service architecture
- Frontend UI for managing integrations
- **Stripe payment integration** ⭐
- **Subscription management** ⭐
- **Plan-based feature restrictions** ⭐
- **Billing dashboard** ⭐

 **In Progress:**
- SMS notifications (Twilio)

 **Planned:**
- Advanced scheduling options
- Rate limiting for notifications
- Customer portal for subscription management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT