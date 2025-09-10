# Database Migrations

This directory contains SQL migration files for the ALX Polly database.

## Running Migrations

### 1. Add Unique Vote Constraint

To prevent duplicate votes at the database level, run the following migration:

```sql
-- Run this in your Supabase SQL Editor
-- This creates a unique index to enforce one-vote-per-user per poll

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_unique_user_poll 
ON public.votes (poll_id, user_id) 
WHERE user_id IS NOT NULL;
```

**Important Notes:**
- Use `CONCURRENTLY` to avoid locking the table during index creation
- The `WHERE user_id IS NOT NULL` clause only applies the constraint to authenticated users
- This prevents TOCTOU (Time-of-Check-Time-of-Use) race conditions
- The constraint will return SQLSTATE 23505 (duplicate key error) when violated

### 2. Verify the Migration

After running the migration, you can verify it was created successfully:

```sql
-- Check if the index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'votes' 
AND indexname = 'idx_votes_unique_user_poll';

-- Check constraint details
SELECT conname, contype, confrelid::regclass
FROM pg_constraint 
WHERE conrelid = 'votes'::regclass;
```

## Migration Benefits

- **Database-Level Enforcement**: Prevents duplicate votes even with concurrent requests
- **Race Condition Protection**: Eliminates TOCTOU vulnerabilities
- **Performance**: Index improves query performance for vote lookups
- **Data Integrity**: Ensures one vote per user per poll at the database level

## Error Handling

The application now properly handles the unique constraint violation:
- Returns HTTP 409 (Conflict) with "Already voted" message
- Preserves other error handling for different database errors
- Provides clear feedback to users about duplicate vote attempts
