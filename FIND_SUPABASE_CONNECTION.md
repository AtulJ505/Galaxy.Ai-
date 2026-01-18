# How to Find Supabase Connection String

## Method 1: Settings → Database Tab

1. **Go to your Supabase project dashboard**
   - URL: `https://supabase.com/dashboard/project/oojbfgqprqrimudnzydy`

2. **Look for these sections:**
   - In the left sidebar: Click **Settings** (⚙️ gear icon)
   - Then click **Database** (under "Project Settings")
   
3. **On the Database settings page, look for:**
   - **Connection string** section (scroll down)
   - Or **Connection Info** section
   - Or **Connection Pooling** section

## Method 2: Project Settings → API

Sometimes it's under:
- **Settings** → **API** → Scroll down to **Database URL**

## Method 3: Construct It Manually

If you can't find it, we can build the connection pooler URL from your project details:

### What you need:
1. **Project Reference ID**: `oojbfgqprqrimudnzydy` (from your current URL)
2. **Region**: Check Settings → General → Region (e.g., `us-west-1`, `eu-west-1`, `ap-southeast-1`)
3. **Database Password**: The password you set when creating the project

### Connection Pooler URL Format:
```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```

### Example with your project:
```
postgresql://postgres.oojbfgqprqrimudnzydy:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Common Regions:
- **US West**: `aws-0-us-west-1`
- **US East**: `aws-0-us-east-1`
- **EU West**: `aws-0-eu-west-1`
- **EU Central**: `aws-0-eu-central-1`
- **AP Southeast**: `aws-0-ap-southeast-1`

## Method 4: Use Direct Connection (Alternative)

If connection pooler doesn't work, try the direct connection with SSL:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.oojbfgqprqrimudnzydy.supabase.co:5432/postgres?sslmode=require"
```

But make sure you:
1. Replace `[YOUR-PASSWORD]` with your actual password
2. Check if your IP needs to be allowlisted (Settings → Database → Connection Pooling → Allowed IPs)

## What to Check in Supabase Dashboard:

1. **Settings** (gear icon) → **General**
   - Note your **Region**
   - Note your **Project URL**

2. **Settings** → **Database**
   - Look for "Connection string", "Connection Info", or "Database URL"
   - Check "Connection Pooling" section
   - If you see "Allowed IPs", you might need to add your IP (or use 0.0.0.0/0 for all)

3. **Settings** → **API**
   - Sometimes connection info is here

## Quick Fix: Try This URL Format

Based on your project ref `oojbfgqprqrimudnzydy`, try this in your `.env`:

```env
DATABASE_URL="postgresql://postgres.oojbfgqprqrimudnzydy:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

Replace:
- `YOUR_PASSWORD` with your actual database password
- If it doesn't work, try changing `us-west-1` to your actual region (check in Settings → General)
