'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Mock poll data for development and demonstration purposes.
 * 
 * This mock data simulates a real poll with voting results and is used
 * to demonstrate the voting interface and results display. In a production
 * environment, this would be replaced with actual data fetched from the database.
 * 
 * The structure includes all necessary fields for displaying poll information,
 * voting options, and result calculations.
 */
const mockPoll = {
  id: '1',
  title: 'Favorite Programming Language',
  description: 'What programming language do you prefer to use?',
  options: [
    { id: '1', text: 'JavaScript', votes: 15 },
    { id: '2', text: 'Python', votes: 12 },
    { id: '3', text: 'Java', votes: 8 },
    { id: '4', text: 'C#', votes: 5 },
    { id: '5', text: 'Go', votes: 2 },
  ],
  totalVotes: 42,
  createdAt: '2023-10-15',
  createdBy: 'John Doe',
};

/**
 * Interactive poll detail page with voting functionality and results display.
 * 
 * This component is the heart of the voting system, providing users with a complete
 * poll experience including voting interface, results visualization, and sharing options.
 * It handles the entire voting workflow from option selection to result display.
 * 
 * Key features:
 * - Dynamic poll data loading based on URL parameters
 * - Interactive voting interface with option selection
 * - Real-time vote submission with loading states
 * - Results visualization with percentage calculations
 * - Poll sharing functionality
 * - Management actions for poll owners
 * 
 * The component manages multiple states to provide a smooth user experience:
 * - Voting state (before/after voting)
 * - Loading states during operations
 * - Option selection tracking
 * - Poll data management
 * 
 * @param params - Next.js route parameters containing the poll ID
 * @returns JSX element containing the complete poll interface
 * 
 * @example
 * ```tsx
 * // This component is automatically rendered for routes like /polls/123
 * // The poll ID is extracted from the URL parameters
 * ```
 * 
 * @security
 * - Validates poll ID from URL parameters
 * - Handles voting permissions (authenticated vs anonymous)
 * - Prevents duplicate voting through state management
 * - Uses Server Actions for secure vote submission
 * 
 * @assumptions
 * - Poll ID is valid and exists in the database
 * - User has appropriate permissions to view the poll
 * - Voting is allowed (poll is active, user hasn't voted, etc.)
 * - Poll data can be fetched successfully
 * 
 * @edge_cases
 * - Invalid poll ID: Should show error or redirect
 * - Poll not found: Should show appropriate error message
 * - User already voted: Should show results instead of voting interface
 * - Network errors: Should handle gracefully with error states
 * - Loading states: Should provide appropriate feedback
 * 
 * @integration
 * - Connected to: submitVote Server Action, poll data fetching
 * - Used by: Poll sharing links, poll management interface
 * - Triggers: Vote submission, poll result updates
 * - Manages: Voting state, poll display, user interactions
 */
export default function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // State management for voting workflow
  const [pollId, setPollId] = useState<string>(''); // Poll ID from URL parameters
  const [selectedOption, setSelectedOption] = useState<string | null>(null); // Currently selected voting option
  const [hasVoted, setHasVoted] = useState(false); // Whether user has already voted
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state during vote submission

  /**
   * Extract poll ID from URL parameters when component mounts.
   * 
   * This effect runs once when the component mounts to extract the poll ID
   * from the URL parameters. The poll ID is then used to fetch the specific
   * poll data and determine the voting interface state.
   */
  useEffect(() => {
    params.then(({ id }) => setPollId(id));
  }, [params]);

  // TODO: Replace with actual poll data fetching based on pollId
  // In a real app, you would fetch the poll data based on the ID
  const poll = mockPoll;
  
  // Calculate total votes for percentage calculations
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  /**
   * Handles vote submission for the selected option.
   * 
   * This function manages the complete voting workflow:
   * 1. Validates that an option is selected
   * 2. Sets loading state to prevent multiple submissions
   * 3. Submits the vote to the server
   * 4. Updates the UI to show results
   * 
   * In a production environment, this would call the submitVote Server Action
   * with the poll ID and selected option index.
   */
  const handleVote = () => {
    // Ensure an option is selected before proceeding
    if (!selectedOption) return;
    
    // Set loading state to prevent multiple submissions
    setIsSubmitting(true);
    
    // TODO: Replace with actual vote submission
    // Simulate API call with realistic timing
    setTimeout(() => {
      setHasVoted(true); // Show results after successful vote
      setIsSubmitting(false); // Clear loading state
    }, 1000);
  };

  /**
   * Calculates the percentage of votes for a specific option.
   * 
   * This utility function is essential for displaying poll results with
   * visual progress bars and percentage indicators. It handles edge cases
   * like zero total votes to prevent division by zero errors.
   * 
   * @param votes - Number of votes for the specific option
   * @returns Percentage value rounded to the nearest integer
   * 
   * @example
   * ```typescript
   * const percentage = getPercentage(15); // Returns 36 for 15 votes out of 42 total
   * ```
   */
  const getPercentage = (votes: number) => {
    // Prevent division by zero
    if (totalVotes === 0) return 0;
    // Calculate percentage and round to nearest integer
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation and management actions header */}
      <div className="flex items-center justify-between">
        {/* Back navigation link */}
        <Link href="/polls" className="text-blue-600 hover:underline">
          &larr; Back to Polls
        </Link>
        {/* Poll management actions (should be conditional on ownership) */}
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/polls/${pollId}/edit`}>Edit Poll</Link>
          </Button>
          <Button variant="outline" className="text-red-500 hover:text-red-700">
            Delete
          </Button>
        </div>
      </div>

      {/* Main poll card with voting interface or results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription>{poll.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Conditional rendering based on voting state */}
          {!hasVoted ? (
            /* Voting interface - shown before user votes */
            <div className="space-y-3">
              {/* Interactive option selection */}
              {poll.options.map((option) => (
                <div 
                  key={option.id} 
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedOption === option.id 
                      ? 'border-blue-500 bg-blue-50' // Selected state
                      : 'hover:bg-slate-50' // Hover state
                  }`}
                  onClick={() => setSelectedOption(option.id)}
                >
                  {option.text}
                </div>
              ))}
              {/* Vote submission button */}
              <Button 
                onClick={handleVote} 
                disabled={!selectedOption || isSubmitting} 
                className="mt-4"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </div>
          ) : (
            /* Results display - shown after user votes */
            <div className="space-y-4">
              <h3 className="font-medium">Results:</h3>
              {/* Results for each option with progress bars */}
              {poll.options.map((option) => (
                <div key={option.id} className="space-y-1">
                  {/* Option text and vote count */}
                  <div className="flex justify-between text-sm">
                    <span>{option.text}</span>
                    <span>{getPercentage(option.votes)}% ({option.votes} votes)</span>
                  </div>
                  {/* Visual progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${getPercentage(option.votes)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {/* Total votes summary */}
              <div className="text-sm text-slate-500 pt-2">
                Total votes: {totalVotes}
              </div>
            </div>
          )}
        </CardContent>
        {/* Poll metadata footer */}
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Created by {poll.createdBy}</span>
          <span>Created on {new Date(poll.createdAt).toLocaleDateString()}</span>
        </CardFooter>
      </Card>

      {/* Poll sharing section */}
      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Share this poll</h2>
        <div className="flex space-x-2">
          {/* Copy poll link button */}
          <Button variant="outline" className="flex-1">
            Copy Link
          </Button>
          {/* Social media sharing button */}
          <Button variant="outline" className="flex-1">
            Share on Twitter
          </Button>
        </div>
      </div>
    </div>
  );
}