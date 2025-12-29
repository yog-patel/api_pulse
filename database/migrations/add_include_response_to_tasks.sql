-- Add include_response column to api_tasks table
ALTER TABLE api_tasks
ADD COLUMN IF NOT EXISTS include_response BOOLEAN DEFAULT TRUE;

-- Update any existing rows to have include_response = true (to keep showing responses)
UPDATE api_tasks
SET include_response = TRUE
WHERE include_response IS NULL;

-- Add comment
COMMENT ON COLUMN api_tasks.include_response IS 'Controls whether API response body and headers are captured in logs';
