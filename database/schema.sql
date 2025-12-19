-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (handled by Supabase Auth, but adding profile info)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Tasks table
CREATE TABLE IF NOT EXISTS api_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_name VARCHAR(255) NOT NULL,
  api_url TEXT NOT NULL,
  method VARCHAR(10) DEFAULT 'GET' CHECK (method IN ('GET', 'POST')),
  request_headers JSONB DEFAULT '{}',
  request_body TEXT,
  schedule_interval VARCHAR(50) NOT NULL, -- e.g., "5m", "1h", "6h", "1d"
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- API Task Logs table
CREATE TABLE IF NOT EXISTS api_task_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES api_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status_code INTEGER,
  response_headers JSONB,
  response_body TEXT,
  response_time_ms INTEGER,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Integrations table (for storing notification channels)
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('email', 'slack', 'sms', 'webhook', 'discord')),
  name VARCHAR(255) NOT NULL,
  credentials JSONB NOT NULL, -- Stores integration-specific data (email, webhook_url, phone_number, etc.)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task Notifications table (links tasks to their notification integrations)
CREATE TABLE IF NOT EXISTS task_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES api_tasks(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES user_integrations(id) ON DELETE CASCADE,
  notify_on VARCHAR(50) DEFAULT 'always' CHECK (notify_on IN ('always', 'failure_only', 'timeout')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, integration_id) -- Prevent duplicate notification rules
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_tasks_user_id ON api_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tasks_is_active ON api_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_api_tasks_next_run_at ON api_tasks(next_run_at) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_api_task_logs_task_id ON api_task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_api_task_logs_user_id ON api_task_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_task_logs_executed_at ON api_task_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_type ON user_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_task_notifications_task_id ON task_notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_integration_id ON task_notifications(integration_id);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only view their own profile
CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- API Tasks: Users can only view/modify their own tasks
CREATE POLICY api_tasks_select_policy ON api_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY api_tasks_insert_policy ON api_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() = created_by);

CREATE POLICY api_tasks_update_policy ON api_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY api_tasks_delete_policy ON api_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- API Task Logs: Users can only view their own logs
CREATE POLICY api_task_logs_select_policy ON api_task_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY api_task_logs_insert_policy ON api_task_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Integrations: Users can only view/manage their own integrations
CREATE POLICY user_integrations_select_policy ON user_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_integrations_insert_policy ON user_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_integrations_update_policy ON user_integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_integrations_delete_policy ON user_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Task Notifications: Users can only manage notifications for their own tasks
CREATE POLICY task_notifications_select_policy ON task_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM api_tasks
      WHERE api_tasks.id = task_notifications.task_id
      AND api_tasks.user_id = auth.uid()
    )
  );

CREATE POLICY task_notifications_insert_policy ON task_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM api_tasks
      WHERE api_tasks.id = task_notifications.task_id
      AND api_tasks.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM user_integrations
      WHERE user_integrations.id = task_notifications.integration_id
      AND user_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY task_notifications_delete_policy ON task_notifications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM api_tasks
      WHERE api_tasks.id = task_notifications.task_id
      AND api_tasks.user_id = auth.uid()
    )
  );
