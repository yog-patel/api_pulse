-- Add include_response column to task_notifications table
-- This allows users to optionally include API response body in notifications

ALTER TABLE task_notifications
ADD COLUMN IF NOT EXISTS include_response BOOLEAN DEFAULT FALSE;

-- Update existing rows to have default value
UPDATE task_notifications
SET include_response = FALSE
WHERE include_response IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN task_notifications.include_response IS 
  'When true, includes API response body in notification messages (truncated if too long)';
