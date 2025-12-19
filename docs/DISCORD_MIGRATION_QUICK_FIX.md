# ?? Quick Fix: Apply Discord Migration

## The Issue
You're getting this error:
```
Failed to create integration: new row for relation "user_integrations" 
violates check constraint "user_integrations_integration_type_check"
```

**Why?** The database doesn't know about the "discord" integration type yet.

---

## ? Solution: Run the Migration

### Option 1: Supabase Dashboard (Easiest - 2 minutes)

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New query**

3. **Run This SQL**
   ```sql
   -- Drop the old constraint
   ALTER TABLE user_integrations 
     DROP CONSTRAINT IF EXISTS user_integrations_integration_type_check;

   -- Add the new constraint with Discord
   ALTER TABLE user_integrations 
     ADD CONSTRAINT user_integrations_integration_type_check 
     CHECK (integration_type IN ('email', 'slack', 'sms', 'webhook', 'discord'));
   ```

4. **Click "Run"** (or press Ctrl+Enter)

5. **Verify**
   - You should see "Success. No rows returned"
   - ? Migration complete!

### Option 2: Using Migration File

```bash
# Run the migration file we created
psql -h YOUR_SUPABASE_DB_HOST \
     -U postgres \
     -d postgres \
     -f database/migrations/add_discord_integration_type.sql
```

### Option 3: Supabase CLI

```bash
# If you have Supabase CLI set up locally
supabase db push
```

---

## ?? Test It

After running the migration:

1. **Refresh your browser** (Ctrl+Shift+R)
2. **Try adding Discord integration again**
3. **Fill in the form**:
   - Name: `Discord Test`
   - Webhook URL: Your Discord webhook URL
4. **Click "Add Integration"**
5. ? Should work now!

---

## ? What This Does

The migration updates the database constraint to allow these integration types:
- ? `email`
- ? `slack`
- ? `sms`
- ? `webhook`
- ? `discord` ? **NEW!**

---

## ?? Verify It Worked

After running the migration, you can verify with this SQL:

```sql
-- Check the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'user_integrations'::regclass 
AND conname = 'user_integrations_integration_type_check';
```

**Expected output:**
```
CHECK ((integration_type IN ('email', 'slack', 'sms', 'webhook', 'discord')))
```

---

## ?? You're Done!

After running the migration:
- ? Discord webhook test works (you already got this!)
- ? Database accepts Discord integrations (after migration)
- ? Full Discord integration ready to use!

---

## ?? Pro Tip

If you have multiple environments (dev, staging, prod), remember to run this migration on each database!

```sql
-- This is the complete migration (copy/paste ready)
ALTER TABLE user_integrations 
  DROP CONSTRAINT IF EXISTS user_integrations_integration_type_check;

ALTER TABLE user_integrations 
  ADD CONSTRAINT user_integrations_integration_type_check 
  CHECK (integration_type IN ('email', 'slack', 'sms', 'webhook', 'discord'));
```

---

**That's it! Run the SQL above and you're good to go!** ??
