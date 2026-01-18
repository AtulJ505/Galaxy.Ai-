# Database Setup Guide

## What is DATABASE_URL?

The `DATABASE_URL` is a PostgreSQL connection string that tells your application how to connect to your database. It follows this format:

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME?schema=SCHEMA_NAME
```

## Option 1: Supabase (Recommended - Free Tier Available)

### Steps:
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account (GitHub login available)
3. Click "New Project"
4. Fill in project details:
   - **Name**: your-project-name
   - **Database Password**: create a strong password (SAVE THIS!)
   - **Region**: choose closest to you
   - Click "Create new project" (takes 1-2 minutes)

### Get Your Connection String:
1. Once your project is ready, go to **Settings** (gear icon) → **Database**
2. Scroll down to **Connection string** section
3. Under **Connection pooling** tab, copy the **URI** connection string
4. It will look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. **Important**: Replace `[YOUR-PASSWORD]` with the actual password you set during project creation

### Example DATABASE_URL from Supabase:
```
postgresql://postgres.xxxxx:your-actual-password@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```

Or if using direct connection:
```
postgresql://postgres:your-actual-password@db.xxxxx.supabase.co:5432/postgres
```

---

## Option 2: Neon (Recommended - Free Tier Available)

### Steps:
1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for a free account (GitHub login available)
3. Click "Create a project"
4. Fill in project details:
   - **Name**: your-project-name
   - **Region**: choose closest to you
   - Click "Create project"

### Get Your Connection String:
1. Once created, you'll see the connection string directly on the dashboard
2. It will look like:
   ```
   postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Click the "Copy" button next to the connection string

### Example DATABASE_URL from Neon:
```
postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## Option 3: Local PostgreSQL

If you have PostgreSQL installed locally:

### Format:
```
postgresql://username:password@localhost:5432/database_name?schema=public
```

### Steps:
1. Make sure PostgreSQL is installed and running
2. Create a new database:
   ```sql
   CREATE DATABASE workflow_db;
   ```
3. Your DATABASE_URL would be:
   ```
   postgresql://postgres:your-local-password@localhost:5432/workflow_db?schema=public
   ```

---

## How to Add It to Your .env File

1. Open or create `.env` file in your project root
2. Add the DATABASE_URL like this:

```env
DATABASE_URL="postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres"
```

**Important Notes:**
- Keep the quotes around the URL
- Replace all placeholder values with your actual credentials
- Never commit your `.env` file to git (it's already in `.gitignore`)
- Keep your password secure!

---

## Testing Your Connection

After setting up your DATABASE_URL, test it by running:

```bash
npx prisma db push
```

This will:
1. Connect to your database
2. Create all the necessary tables based on your Prisma schema

If successful, you'll see:
```
✔ Generated Prisma Client
✔ Pushed database schema to database
```

---

## Troubleshooting

### Connection Error?
- **Check your password**: Make sure you replaced `[YOUR-PASSWORD]` with your actual password
- **Check SSL mode**: Some providers require `?sslmode=require` at the end
- **Check firewall**: Make sure your IP is allowed (Supabase/Neon usually allows all by default)
- **Check credentials**: Verify username, password, host, and database name are correct

### Still Having Issues?
1. Make sure PostgreSQL is running (if using local)
2. Check your internet connection
3. Verify the connection string format is correct
4. Try using the connection pooler URL (for Supabase) instead of direct connection
