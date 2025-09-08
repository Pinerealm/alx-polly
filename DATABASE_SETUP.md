# Database Setup Guide for ALX Polly

This guide will help you set up the Supabase database for the ALX Polly polling application.

## Prerequisites

- A Supabase account and project
- Access to your Supabase project's SQL editor
- Environment variables configured in your `.env.local` file

## Setup Steps

### 1. Create the Database Schema

1. Open your Supabase project dashboard
2. Navigate to the **SQL Editor** tab
3. Copy the contents of `supabase-schema.sql` and paste it into the SQL editor
4. Click **Run** to execute the schema

### 2. Verify the Setup

After running the schema, you should see the following tables created:

- `polls` - Main polls table
- `votes` - Individual votes

### 3. Test the Setup

You can verify the setup by running these test queries in the SQL editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('polls', 'votes');

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('polls', 'votes');
```

## Database Schema Overview

### Tables

#### `polls`
- Main table for storing poll data
- Uses TEXT[] array for poll options
- References auth.users for poll ownership
- Simple structure with id, user_id, question, options, created_at

#### `votes`
- Stores individual votes cast on polls
- Supports both authenticated and anonymous voting
- Uses option_index to reference poll options array
- Simple structure with id, poll_id, user_id, option_index

### Key Features

#### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Public polls are readable by everyone
- Anonymous voting is supported where allowed

#### Performance Optimizations
- Strategic indexes on frequently queried columns
- Optimized for common query patterns
- Efficient vote counting and aggregation

#### Data Integrity
- Foreign key constraints ensure data consistency
- Check constraints validate data quality
- Unique constraints prevent duplicate votes

## Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_service_role_key
```

## Usage Examples

### Creating a Poll
```typescript
const { data, error } = await supabase
  .from('polls')
  .insert({
    user_id: user.id,
    question: 'What is your favorite color?',
    options: ['Red', 'Blue', 'Green', 'Yellow']
  });
```

### Submitting a Vote
```typescript
const { data, error } = await supabase
  .from('votes')
  .insert({
    poll_id: pollId,
    user_id: user?.id || null, // null for anonymous
    option_index: 0 // index of selected option
  });
```

### Getting Poll Results
```sql
SELECT p.*, COUNT(v.id) as total_votes
FROM polls p
LEFT JOIN votes v ON p.id = v.poll_id
WHERE p.id = 'poll-uuid-here'
GROUP BY p.id;
```

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Make sure you're authenticated when testing
2. **Foreign Key Violations**: Ensure referenced records exist
3. **Permission Denied**: Check that RLS policies are correctly configured

### Reset Database
If you need to start over:

```sql
-- Drop all tables (in order due to foreign keys)
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.polls CASCADE;

-- Then re-run the schema
```

## Security Considerations

- All user data is protected by RLS policies
- Poll owners can only modify their own polls
- Anonymous voting is supported
- Simple and secure structure

## Next Steps

After setting up the database:

1. Test the application with sample data
2. Verify all CRUD operations work correctly
3. Test both authenticated and anonymous voting
4. Ensure proper error handling for edge cases

For more information about the application architecture, see the main README.md file.
