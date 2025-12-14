-- Add subscription and usage tracking to profiles table

-- Add plan columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of the month (e.g., 2025-01-01)
  runs_count INTEGER DEFAULT 0,
  tasks_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month);

-- Add comments for documentation
COMMENT ON COLUMN profiles.plan_id IS 'Current subscription plan: free, starter, or pro';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN profiles.subscription_status IS 'Subscription status: active, canceled, past_due, trialing';
COMMENT ON COLUMN profiles.trial_ends_at IS 'When the trial period ends';
COMMENT ON COLUMN profiles.current_period_start IS 'Current billing period start date';
COMMENT ON COLUMN profiles.current_period_end IS 'Current billing period end date';

COMMENT ON TABLE user_usage IS 'Tracks monthly usage for billing and limits';
COMMENT ON COLUMN user_usage.runs_count IS 'Number of API executions this month';
COMMENT ON COLUMN user_usage.tasks_count IS 'Number of active tasks (for reference)';

-- Enable RLS on user_usage
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own usage
CREATE POLICY "Users can view their own usage"
  ON user_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage all usage
CREATE POLICY "Service role can manage all usage"
  ON user_usage
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to get current month usage
CREATE OR REPLACE FUNCTION get_current_month_usage(p_user_id UUID)
RETURNS TABLE (
  runs_count INTEGER,
  tasks_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(u.runs_count, 0) as runs_count,
    COALESCE(u.tasks_count, 0) as tasks_count
  FROM user_usage u
  WHERE u.user_id = p_user_id
 AND u.month = DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  -- If no record exists, return zeros
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment run count
CREATE OR REPLACE FUNCTION increment_run_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO user_usage (user_id, month, runs_count, tasks_count)
  VALUES (
    p_user_id,
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    1,
    (SELECT COUNT(*) FROM api_tasks WHERE user_id = p_user_id AND is_active = true)
)
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    runs_count = user_usage.runs_count + 1,
tasks_count = (SELECT COUNT(*) FROM api_tasks WHERE user_id = p_user_id AND is_active = true),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_current_month_usage(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_run_count(UUID) TO service_role;
