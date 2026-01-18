# Debugging Database Connection Issues

## Common Issues and Solutions

### Issue 1: Password URL Encoding
If your password has special characters, they need proper URL encoding:
- `@` = `%40`
- `#` = `%23`
- `$` = `%24`
- `%` = `%25`
- `&` = `%26`
- `+` = `%2B`
- `=` = `%3D`

For password `Achilles@505@Aiga`:
- Encoded: `Achilles%40505%40Aiga`

### Issue 2: Verify Your Actual Connection String from Supabase

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/oojbfgqprqrimudnzydy

2. **Settings → Database:**
   - Look for **Connection string** OR **Connection Info**
   - It might be under a different tab or section

3. **Alternative: Check SQL Editor:**
   - Click **SQL Editor** in left sidebar
   - Look at the connection info displayed there

### Issue 3: Try Different Connection Formats

**Format A - Direct with password in URL:**
```
postgresql://postgres:PASSWORD@db.oojbfgqprqrimudnzydy.supabase.co:5432/postgres?sslmode=require
```

**Format B - Direct with pgpass format:**
```
postgresql://postgres@db.oojbfgqprqrimudnzydy.supabase.co:5432/postgres?password=PASSWORD&sslmode=require
```

**Format C - Check if project uses a different host:**
Sometimes Supabase projects have different connection patterns.

### Issue 4: Verify Project Status

Make sure your Supabase project is:
- ✅ Active (not paused)
- ✅ Fully provisioned (not still creating)
- ✅ Database is running

### Issue 5: Check IP Allowlisting

1. Go to **Settings → Database → Connection Pooling**
2. Check **Allowed IPs**
3. Make sure your IP is allowed (or use `0.0.0.0/0` for all IPs)

### Issue 6: Try Raw Password (No Encoding)

Sometimes the encoding causes issues. Try the password as-is first (though this usually doesn't work with special chars):

```
postgresql://postgres:Achilles@505@Aiga@db.oojbfgqprqrimudnzydy.supabase.co:5432/postgres?sslmode=require
```

Note: This likely won't work because `@` is a URL delimiter, but worth testing.

### Issue 7: Verify Project Reference

Double-check your project reference ID is correct:
- Project ref: `oojbfgqprqrimudnzydy`
- This should match exactly in your URL
