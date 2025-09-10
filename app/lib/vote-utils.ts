import { Poll, VoteResult, PollResults } from './types';

/**
 * Counts votes for each option in a poll
 * @param poll - The poll object with options
 * @param votes - Array of vote objects with option_index
 * @returns Array of vote counts for each option
 */
export function countVotesByOption(poll: Poll, votes: { option_index: number }[]): number[] {
  const voteCounts = new Array(poll.options.length).fill(0);
  
  votes.forEach(vote => {
    if (vote.option_index >= 0 && vote.option_index < poll.options.length) {
      voteCounts[vote.option_index]++;
    }
  });
  
  return voteCounts;
}

/**
 * Calculates vote results with percentages for each option
 * @param poll - The poll object with options
 * @param voteCounts - Array of vote counts for each option
 * @returns Array of VoteResult objects with counts and percentages
 */
export function calculateVoteResults(poll: Poll, voteCounts: number[]): VoteResult[] {
  const totalVotes = voteCounts.reduce((sum, count) => sum + count, 0);
  
  return poll.options.map((option, index) => ({
    option_index: index,
    option_text: option,
    vote_count: voteCounts[index] || 0,
    percentage: totalVotes > 0 ? Math.round((voteCounts[index] || 0) / totalVotes * 100) : 0
  }));
}

/**
 * Checks if a user has already voted on a poll
 * @param votes - Array of vote objects
 * @param userId - The user ID to check
 * @returns The option index the user voted for, or null if they haven't voted
 */
export function getUserVote(votes: { user_id: string | null; option_index: number }[], userId: string | null): number | null {
  if (!userId) return null;
  
  const userVote = votes.find(vote => vote.user_id === userId);
  return userVote ? userVote.option_index : null;
}

/**
 * Validates if a vote is valid
 * @param optionIndex - The option index being voted for
 * @param poll - The poll object
 * @param existingVote - The user's existing vote (if any)
 * @returns Object with validation result and error message
 */
export function validateVote(
  optionIndex: number, 
  poll: Poll, 
  existingVote: number | null
): { isValid: boolean; error?: string } {
  // Check if option index is valid
  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return { isValid: false, error: 'Invalid option selected' };
  }
  
  // Check if user has already voted
  if (existingVote !== null) {
    return { isValid: false, error: 'You have already voted on this poll' };
  }
  
  return { isValid: true };
}

/**
 * Creates a complete poll results object
 * @param poll - The poll object
 * @param votes - Array of vote objects
 * @param userId - The current user's ID
 * @returns Complete PollResults object
 */
export function createPollResults(
  poll: Poll, 
  votes: { user_id: string | null; option_index: number }[], 
  userId: string | null
): PollResults {
  const voteCounts = countVotesByOption(poll, votes);
  const results = calculateVoteResults(poll, voteCounts);
  const totalVotes = voteCounts.reduce((sum, count) => sum + count, 0);
  const userVote = getUserVote(votes, userId);
  
  return {
    poll: {
      ...poll,
      total_votes: totalVotes,
      vote_counts: voteCounts
    },
    results,
    total_votes: totalVotes,
    has_user_voted: userVote !== null,
    user_vote: userVote || undefined
  };
}
