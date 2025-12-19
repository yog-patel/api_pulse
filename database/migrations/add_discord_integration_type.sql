-- Migration: Add Discord to user_integrations integration_type check constraint
-- Date: 2025-01-15
-- Description: Updates the user_integrations table to allow 'discord' as a valid integration type

-- Drop the existing check constraint
ALTER TABLE user_integrations 
  DROP CONSTRAINT IF EXISTS user_integrations_integration_type_check;

-- Add the new check constraint with 'discord' included
ALTER TABLE user_integrations 
  ADD CONSTRAINT user_integrations_integration_type_check 
  CHECK (integration_type IN ('email', 'slack', 'sms', 'webhook', 'discord'));

-- Verify the constraint was updated
-- You can run this query to check:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'user_integrations'::regclass 
-- AND conname = 'user_integrations_integration_type_check';
