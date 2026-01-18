# How to Fix Your Supabase Connection String

## Your Current URL (Direct Connection - Unreliable):
```
postgresql://postgres:[YOUR-PASSWORD]@db.oojbfgqprqrimudnzydy.supabase.co:5432/postgres
```

## What You Need: Connection Pooler URL

### Step-by-Step:

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/oojbfgqprqrimudnzydy
   - Or go to: https://supabase.com/dashboard → Select your project

2. **Navigate to Database Settings:**
   - Click the **Settings** icon (⚙️ gear) in the left sidebar
   - Click **Database** under "Project Settings"

3. **Get Connection Pooler URL:**
   - Scroll down to **Connection string** section
   - Click on the **Connection pooling** tab (NOT "URI" tab)
   - You'll see two modes: **Session mode** and **Transaction mode**
   - Copy the **Session mode** URI (first one)
   - It will look like one of these formats:

   **Format 1 (with project ref):**
   ```
   postgresql://postgres.oojbfgqprqrimudnzydy:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```

   **Format 2 (different region):**
   ```
   postgresql://postgres.oojbfgqprqrimudnzydy:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
   ```

4. **Replace [YOUR-PASSWORD]:**
   - This is the password you set when creating the Supabase project
   - If you forgot it, you can reset it in the same Database settings page

5. **Update Your .env File:**
   - Open `.env` file
   - Replace the entire `DATABASE_URL` line with the connection pooler URL
   - Make sure to keep the quotes!

### Final Format Should Be:

```env
DATABASE_URL="postgresql://postgres.oojbfgqprqrimudnzydy:your-actual-password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

### Key Differences:
- ✅ Uses `pooler.supabase.com` (not `db.xxxxx.supabase.co`)
- ✅ Port is `6543` (not `5432`)
- ✅ Username includes project ref: `postgres.oojbfgqprqrimudnzydy` (not just `postgres`)

## Alternative: If Connection Pooler Doesn't Work

If you still have issues, you can try adding `?pgbouncer=true` to the direct connection:

```env
DATABASE_URL="postgresql://postgres:your-password@db.oojbfgqprqrimudnzydy.supabase.co:5432/postgres?pgbouncer=true"
```

But the connection pooler URL (port 6543) is strongly recommended!
