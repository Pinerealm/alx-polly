-- Add unique constraint to prevent duplicate votes per user per poll
-- This migration adds a unique index on (poll_id, user_id) where user_id is not null
-- to enforce one-vote-per-user at the database level

-- Step 1: Check for existing duplicates before migration
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Count existing duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT poll_id, user_id, COUNT(*) as cnt
        FROM public.votes 
        WHERE user_id IS NOT NULL
        GROUP BY poll_id, user_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- Log the count of duplicates found
    RAISE NOTICE 'Found % duplicate vote records that need cleanup', duplicate_count;
END $$;

-- Step 2: Clean up duplicate votes (keep the earliest vote per poll_id/user_id)
-- This uses a CTE to identify and delete duplicates while preserving the first vote
WITH duplicates_to_remove AS (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY poll_id, user_id 
                   ORDER BY created_at ASC, id ASC
               ) as rn
        FROM public.votes
        WHERE user_id IS NOT NULL
    ) ranked
    WHERE rn > 1
)
DELETE FROM public.votes 
WHERE id IN (SELECT id FROM duplicates_to_remove);

-- Step 3: Verify cleanup was successful
DO $$
DECLARE
    remaining_duplicates INTEGER;
BEGIN
    -- Check for any remaining duplicates
    SELECT COUNT(*) INTO remaining_duplicates
    FROM (
        SELECT poll_id, user_id, COUNT(*) as cnt
        FROM public.votes 
        WHERE user_id IS NOT NULL
        GROUP BY poll_id, user_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF remaining_duplicates > 0 THEN
        RAISE EXCEPTION 'Cleanup failed: % duplicate records still exist', remaining_duplicates;
    ELSE
        RAISE NOTICE 'Cleanup successful: No duplicate records remain';
    END IF;
END $$;

-- Step 4: Create unique index (will now succeed since duplicates are removed)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_unique_user_poll 
ON public.votes (poll_id, user_id) 
WHERE user_id IS NOT NULL;

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_votes_unique_user_poll IS 'Ensures one vote per user per poll, only applies to authenticated users (user_id IS NOT NULL)';
