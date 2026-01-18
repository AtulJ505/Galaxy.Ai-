# Fixing "Tenant or user not found" Error

## The Issue
The connection pooler URL format might be wrong for your region, or the username format is incorrect.

## Solution 1: Try Direct Connection with SSL

The direct connection might work better for Asia Pacific region:

```env
DATABASE_URL="postgresql://postgres:Achilles%40505%40Aiga@db.oojbfgqprqrimudnzydy.supabase.co:5432/postgres?sslmode=require"
```

## Solution 2: Try Connection Pooler with Different Username Format

Sometimes the username format is different. Try without the project ref in username:

```env
DATABASE_URL="postgresql://postgres:Achilles%40505%40Aiga@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
```

## Solution 3: Check Your Actual Connection String in Supabase

1. Go to: https://supabase.com/dashboard/project/oojbfgqprqrimudnzydy
2. Click **Settings** (⚙️) → **Database**
3. Look for any connection string shown
4. Or check **Settings** → **API** → Scroll to Database URL

## Solution 4: Verify Password

Make sure:
- The password is exactly: `Achilles@505@Aiga`
- URL encoding: `@` = `%40`
- No extra spaces

## Solution 5: Try Transaction Mode Instead of Session Mode

If connection pooler doesn't work, try the transaction mode format (port might be different).
