# Testing Password Encoding for Supabase

## Your Situation:
- Password: `Achilles@505@Aiga`
- Supabase requires special character in password
- Connection pooler format not working
- Getting "Tenant or user not found" error

## Possible Solutions:

### Solution 1: Try Direct Connection with Proper Encoding

Open your `.env` file and try this EXACT format:

```env
DATABASE_URL="postgresql://postgres:Achilles%40505%40Aiga@db.oojbfgqprqrimudnzydy.supabase.co:5432/postgres?sslmode=require"
```

Key points:
- Username: `postgres` (not `postgres.oojbfgqprqrimudnzydy`)
- Password encoding: `@` = `%40`
- Port: `5432` (not 6543)
- SSL mode: `require`

### Solution 2: Try Without URL Encoding (Rare but Sometimes Works)

Some connection strings might need the password in a different format:

```env
DATABASE_URL="postgresql://postgres:Achilles%40505%40Aiga@db.oojbfgqprqrimudnzydy.supabase.co:5432/postgres"
```

### Solution 3: Use Password in Query Parameter

```env
DATABASE_URL="postgresql://postgres@db.oojbfgqprqrimudnzydy.supabase.co:5432/postgres?password=Achilles%40505%40Aiga&sslmode=require"
```

### Solution 4: Check Your Actual Supabase Connection String

Since Supabase requires special characters, the password format they provide might be different.

**Steps:**
1. Go to Supabase Dashboard → Settings → Database
2. Look for "Database password" field
3. Try to view/copy the connection string from there
4. Or check if there's a "Copy connection string" button

### Solution 5: Reset Password to Use Different Special Character

If `@` causes issues, reset password to use:
- `!` (exclamation) - no encoding needed
- `#` (hash) - encodes to `%23`
- `$` (dollar) - encodes to `%24`

Example new password: `Achilles!505!Aiga` or `Achilles#505#Aiga`

Then the connection string would be:
```env
DATABASE_URL="postgresql://postgres:Achilles!505!Aiga@db.oojbfgqprqrimudnzydy.supabase.co:5432/postgres?sslmode=require"
```

Or with hash:
```env
DATABASE_URL="postgresql://postgres:Achilles%23505%23Aiga@db.oojbfgqprqrimudnzydy.supabase.co:5432/postgres?sslmode=require"
```

## Next Steps:

1. **First, try Solution 1** - Direct connection with proper encoding
2. If that doesn't work, try **Solution 5** - reset password with `!` instead of `@`
3. Or check Supabase dashboard for the actual connection string format they provide
