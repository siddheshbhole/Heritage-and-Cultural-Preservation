-- ---------------------------------------------------------------------------
-- Instant Sign-In: Retroactively confirm existing unconfirmed Supabase users
--
-- Run this ONCE in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- after disabling "Confirm email" under:
--   Authentication -> Providers -> Email -> Confirm email: OFF
--
-- This marks every account that never clicked a confirmation link as
-- confirmed so existing users can sign in immediately.
--
-- SAFE: idempotent, only touches rows where email_confirmed_at IS NULL.
-- ---------------------------------------------------------------------------

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Optional sanity check: should report 0 rows remaining.
SELECT COUNT(*) AS still_unconfirmed
FROM auth.users
WHERE email_confirmed_at IS NULL;