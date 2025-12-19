# API Pulse

A web application for scheduling automated HTTP requests to API endpoints with real-time notifications.

## Features

- 📅 Schedule API calls (GET/POST) to run on intervals
- 📊 Monitor execution logs and response status
- 🔐 User authentication with Supabase
- ⚡ Serverless backend using Supabase Edge Functions
- 🔔 **Multi-channel notifications** (Slack, Discord, Email, SMS, Webhooks)
- 🤖 Automated execution via GitHub Actions (every 5 minutes)

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
   
   # scheduler/.env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
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
API_Pulse/
├── frontend/   # Next.js frontend
├── supabase/functions/    # Supabase Edge Functions
│   ├── create-task/       # Create new scheduled task
│   ├── list-tasks/        # List user's tasks
│   ├── get-task-logs/     # Get task execution logs
│   ├── delete-task/       # Delete a task
│   ├── toggle-task/    # Enable/disable a task
│   ├── manage-integrations/      # ⭐ NEW: Manage notification integrations
│   └── link-task-notification/   # ⭐ NEW: Link tasks to notifications
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

### 🔔 Notification Management (NEW)
- `GET /functions/v1/manage-integrations` - List all notification integrations
- `POST /functions/v1/manage-integrations` - Create new integration (Slack/Email/SMS)
- `DELETE /functions/v1/manage-integrations/:id` - Delete an integration
- `GET /functions/v1/link-task-notification?task_id=:id` - Get notifications for a task
- `POST /functions/v1/link-task-notification` - Link task to notification channel
- `DELETE /functions/v1/link-task-notification/:id` - Unlink notification

## 🔔 Notification Features

### Supported Channels
- ✅ **Slack** - Free webhooks with rich formatting
- ✅ **Discord** - 🆕 Free webhooks with rich embeds
- ✅ **Email** - Resend integration (100 emails/day free)
- 🚧 **SMS** - Coming soon (Twilio integration)
- ✅ **Custom Webhooks** - Send to any endpoint

### ✨ Easy Management UI
- **Settings Page** - Add/manage notification integrations (Slack, Discord, Email, SMS)
- **Dashboard** - 🔔 Link integrations to tasks with one click!
- **Notification Rules** - Choose when to notify (always/failure/timeout)
- **Visual Feedback** - See active notifications for each task
- **Response Body** - Optionally include API responses in notifications for debugging

### Notification Rules
- **always** - Notify on every task execution
- **failure_only** - Only notify when tasks fail (status >= 400)
- **timeout** - Only notify on errors/timeouts

### 🆕 Include Response Body
- ✅ **Optional feature** - Check a box to include API response
- ✅ **Auto-formatted** - JSON responses pretty-printed
- ✅ **Auto-truncated** - Long responses limited to 2,000 chars
- ✅ **Visual badge** - Purple "📝 With Response" indicator
- ✅ **Perfect for debugging** - See exactly what APIs return

See the [response body guide](docs/INCLUDE_RESPONSE_FEATURE.md) for details.

## Database Schema

The application uses the following main tables:
- `profiles` - User profiles
- `api_tasks` - Scheduled API tasks
- `api_task_logs` - Task execution history
- `user_integrations` - ⭐ NEW: Notification channel configurations
- `task_notifications` - ⭐ NEW: Links between tasks and notification channels

## Development Status

✅ **Completed:**
- Edge Functions deployed
- Database schema with RLS policies
- User authentication (Supabase Auth)
- API task scheduling and execution
- GitHub Actions integration (runs every 5 minutes)
- Slack notification integration
- Webhook notification support
- Notification service architecture

🚧 **In Progress:**
- Email notifications (Resend)
- SMS notifications (Twilio)
- Frontend UI for managing integrations

🔮 **Planned:**
- Notification templates
- Advanced scheduling options
- Rate limiting for notifications
- Notification history/logs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT