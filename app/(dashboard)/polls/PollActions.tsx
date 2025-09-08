"use client";

import Link from "next/link";
import { useAuth } from "@/app/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { deletePoll } from "@/app/lib/actions/poll-actions";

/**
 * Interface defining the structure of a poll object.
 * 
 * This interface ensures type safety when working with poll data throughout
 * the application. It matches the database schema and provides clear expectations
 * for poll object properties.
 */
interface Poll {
  id: string; // Unique identifier for the poll
  question: string; // The poll question text
  options: any[]; // Array of poll options (could be strings or objects)
  user_id: string; // ID of the user who created the poll
}

/**
 * Props interface for the PollActions component.
 * 
 * This interface defines the required props for the component, ensuring
 * that poll data is properly passed and typed.
 */
interface PollActionsProps {
  poll: Poll; // The poll object to display and manage
}

/**
 * Interactive poll card component with management actions.
 * 
 * This component displays a poll in a card format and provides management
 * actions (edit, delete) for poll owners. It's the primary way users interact
 * with their polls in the dashboard, providing both navigation and management
 * functionality in a single, cohesive interface.
 * 
 * Key features:
 * - Clickable poll card for navigation to poll details
 * - Owner-only management actions (edit, delete)
 * - Confirmation dialog for destructive actions
 * - Responsive design with hover effects
 * - Real-time authentication state checking
 * 
 * @param poll - The poll object to display and manage
 * @returns JSX element containing the poll card with actions
 * 
 * @example
 * ```tsx
 * const poll = {
 *   id: '123',
 *   question: 'What's your favorite color?',
 *   options: ['Red', 'Blue', 'Green'],
 *   user_id: 'user123'
 * };
 * 
 * return <PollActions poll={poll} />;
 * ```
 * 
 * @security
 * - Only shows management actions to poll owners
 * - Uses authentication context for user verification
 * - Confirms destructive actions before execution
 * - Server-side ownership validation in delete action
 * 
 * @assumptions
 * - Poll object contains valid data
 * - User authentication state is available
 * - deletePoll Server Action is available and working
 * - Poll ownership is determined by user_id comparison
 * 
 * @edge_cases
 * - Unauthenticated user: No management actions shown
 * - Non-owner user: No management actions shown
 * - Delete confirmation cancelled: No action taken
 * - Delete action failure: Error handled by Server Action
 * - Network issues: Handled by Server Action error handling
 * 
 * @integration
 * - Connected to: useAuth hook, deletePoll Server Action
 * - Used by: PollsPage component, poll management interfaces
 * - Triggers: Poll deletion, page refresh, navigation
 * - Manages: Poll display, owner actions, user feedback
 */
export default function PollActions({ poll }: PollActionsProps) {
  // Get current user from authentication context
  const { user } = useAuth();
  
  /**
   * Handles poll deletion with user confirmation.
   * 
   * This function provides a safe way to delete polls by requiring user
   * confirmation before executing the destructive action. It ensures users
   * don't accidentally delete their polls and provides immediate feedback
   * by refreshing the page after successful deletion.
   * 
   * The function is only accessible to poll owners, providing an additional
   * layer of security beyond the server-side validation.
   */
  const handleDelete = async () => {
    // Require user confirmation before deletion
    if (confirm("Are you sure you want to delete this poll?")) {
      // Execute deletion via Server Action
      await deletePoll(poll.id);
      // Refresh page to show updated poll list
      window.location.reload();
    }
  };

  return (
    <div className="border rounded-md shadow-md hover:shadow-lg transition-shadow bg-white">
      {/* Clickable poll card for navigation to poll details */}
      <Link href={`/polls/${poll.id}`}>
        <div className="group p-4">
          <div className="h-full">
            <div>
              {/* Poll question with hover effect */}
              <h2 className="group-hover:text-blue-600 transition-colors font-bold text-lg">
                {poll.question}
              </h2>
              {/* Option count display */}
              <p className="text-slate-500">{poll.options.length} options</p>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Management actions - only visible to poll owner */}
      {user && user.id === poll.user_id && (
        <div className="flex gap-2 p-2">
          {/* Edit button - navigates to poll edit page */}
          <Button asChild variant="outline" size="sm">
            <Link href={`/polls/${poll.id}/edit`}>Edit</Link>
          </Button>
          {/* Delete button - triggers confirmation and deletion */}
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
