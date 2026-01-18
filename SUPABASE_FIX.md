# Fixing Supabase Connection Error

## The Problem
Error: `P1001: Can't reach database server at db.oojbfgqprqrimudnzydy.supabase.co:5432`

This happens because you're using the **direct connection** URL which requires IP allowlisting and can be unreliable.

## The Solution: Use Connection Pooler

Supabase provides a **Connection Pooler** URL that's more reliable and doesn't require IP allowlisting.

### Steps to Fix:

1. **Go to your Supabase Dashboard:**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Get the Connection Pooler URL:**
   - Go to **Settings** (gear icon) → **Database**
   - Scroll down to **Connection string** section
   - Click on the **Connection pooling** tab
   - Under **Session mode**, copy the URI connection string
   - It will look like:
     ```
     postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
     ```
   - **Important**: Replace `[YOUR-PASSWORD]` with your actual database password

3. **Update your .env file:**
   - Open your `.env` file
   - Replace the `DATABASE_URL` with the connection pooler URL
   - Make sure it has `pooler.supabase.com` and port `6543`

### Example of Correct DATABASE_URL:

```env
DATABASE_URL="postgresql://postgres.xxxxx:your-actual-password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

### Key Differences:

**Wrong (Direct Connection - Port 5432):**
```
postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

**Correct (Connection Pooler - Port 6543):**
```
postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Notice:
- ✅ Uses `pooler.supabase.com` (not `db.xxxxx.supabase.co`)
- ✅ Port is `6543` (not `5432`)
- ✅ Username format is `postgres.xxxxx` (project ref included)

## After Updating:

Run again:
```bash
npx prisma db push
```

This should now work! ✅
