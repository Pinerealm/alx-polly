-- Add unique constraint to prevent duplicate votes per user per poll
-- This migration adds a unique index on (poll_id, user_id) where user_id is not null
-- to enforce one-vote-per-user at the database level

-- Create unique index on votes table
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_unique_user_poll 
ON public.votes (poll_id, user_id) 
WHERE user_id IS NOT NULL;

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_votes_unique_user_poll IS 'Ensures one vote per user per poll, only applies to authenticated users (user_id IS NOT NULL)';
