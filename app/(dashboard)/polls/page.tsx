import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getUserPolls } from '@/app/lib/actions/poll-actions';
import PollActions from './PollActions'; 

/**
 * User dashboard page displaying all polls created by the authenticated user.
 * 
 * This component serves as the main dashboard for users to view and manage their
 * created polls. It provides a comprehensive overview of all user polls with
 * management actions and serves as the central hub for poll-related activities.
 * 
 * Key features:
 * - Displays all user-created polls in a responsive grid layout
 * - Provides quick access to poll creation
 * - Shows poll management actions (edit, delete)
 * - Handles empty state with helpful guidance
 * - Displays error states with user feedback
 * - Server-side data fetching for optimal performance
 * 
 * The component uses Server Components for data fetching, ensuring fast initial
 * page loads and SEO optimization. It handles various states including loading,
 * error, and empty states to provide a complete user experience.
 * 
 * @returns JSX element containing the user polls dashboard
 * 
 * @example
 * ```tsx
 * // This component is automatically rendered for the /polls route
 * // It fetches and displays all polls created by the authenticated user
 * ```
 * 
 * @security
 * - Uses Server Actions for secure data fetching
 * - Enforces user authentication through getUserPolls
 * - Only displays polls owned by the authenticated user
 * - Handles authentication errors gracefully
 * 
 * @assumptions
 * - User is authenticated (enforced by getUserPolls)
 * - Database connection is available
 * - Poll data can be fetched successfully
 * - User has created polls (may show empty state)
 * 
 * @edge_cases
 * - No polls created: Shows empty state with creation guidance
 * - Database errors: Displays error message to user
 * - Authentication errors: Handled by getUserPolls
 * - Network issues: Handled by error state display
 * - Empty poll list: Shows helpful empty state UI
 * 
 * @integration
 * - Connected to: getUserPolls Server Action, PollActions component
 * - Used by: Dashboard navigation, user dashboard
 * - Fetches: User's poll data, error states
 * - Displays: Poll grid, management actions, empty states
 */
export default async function PollsPage() {
  // Fetch user's polls using Server Action
  const { polls, error } = await getUserPolls();

  return (
    <div className="space-y-6">
      {/* Page header with title and create button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Polls</h1>
        <Button asChild>
          <Link href="/create">Create New Poll</Link>
        </Button>
      </div>
      
      {/* Polls grid layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Conditional rendering based on poll data */}
        {polls && polls.length > 0 ? (
          /* Display polls in grid layout */
          polls.map((poll) => <PollActions key={poll.id} poll={poll} />)
        ) : (
          /* Empty state with helpful guidance */
          <div className="flex flex-col items-center justify-center py-12 text-center col-span-full">
            <h2 className="text-xl font-semibold mb-2">No polls yet</h2>
            <p className="text-slate-500 mb-6">Create your first poll to get started</p>
            <Button asChild>
              <Link href="/create">Create New Poll</Link>
            </Button>
          </div>
        )}
      </div>
      
      {/* Error state display */}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
}