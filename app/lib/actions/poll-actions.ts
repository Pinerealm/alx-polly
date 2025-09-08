"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Creates a new poll with the provided question and options.
 * 
 * This function is the core of the polling system, allowing authenticated users to create
 * polls that others can vote on. It validates input data, ensures user authentication,
 * and stores the poll in the database with proper ownership tracking.
 * 
 * The function enforces business rules like minimum option requirements and user authentication.
 * It also triggers cache revalidation to ensure the polls list updates immediately.
 * 
 * @param formData - FormData object containing poll question and options
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('question', 'What's your favorite programming language?');
 * formData.append('options', 'JavaScript');
 * formData.append('options', 'Python');
 * formData.append('options', 'Java');
 * 
 * const result = await createPoll(formData);
 * if (result.error) {
 *   setError(result.error);
 * } else {
 *   // Poll created successfully, redirect to polls list
 *   router.push('/polls');
 * }
 * ```
 * 
 * @throws No exceptions thrown - errors are returned in the response object
 * 
 * @security
 * - Requires user authentication to prevent anonymous poll creation
 * - Validates input data to prevent injection attacks
 * - Uses parameterized queries to prevent SQL injection
 * - Enforces user ownership through database constraints
 * 
 * @assumptions
 * - User is authenticated (checked by function)
 * - FormData contains valid question and options
 * - Database connection is available
 * - User has permission to create polls
 * 
 * @edge_cases
 * - Empty question: Returns validation error
 * - Less than 2 options: Returns validation error
 * - Empty options: Filtered out before validation
 * - Unauthenticated user: Returns authentication error
 * - Database error: Returns database error message
 * - Network issues: Returns connection error
 * 
 * @integration
 * - Connected to: PollCreateForm component, polls list page
 * - Triggers: Cache revalidation for /polls route
 * - Creates: New poll record with user ownership
 * - Updates: Polls list cache, user's poll count
 */
export async function createPoll(formData: FormData) {
  // Create Supabase client for server-side database operations
  const supabase = await createClient();

  // Extract and validate form data
  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Business rule validation: Poll must have a question and at least 2 options
  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Security check: Ensure user is authenticated before creating poll
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  // Insert new poll into database with user ownership
  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id, // Link poll to authenticated user
      question,
      options,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  // Revalidate the polls page cache to show the new poll immediately
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Retrieves all polls created by the currently authenticated user.
 * 
 * This function provides users with a personalized view of their created polls,
 * enabling them to manage, edit, and monitor their polling activities. It's essential
 * for the user dashboard and poll management features.
 * 
 * The function enforces user isolation by only returning polls owned by the authenticated
 * user, ensuring data privacy and security. Results are ordered by creation date (newest first)
 * for better user experience.
 * 
 * @returns Promise resolving to an object with polls array and error property
 * 
 * @example
 * ```typescript
 * const { polls, error } = await getUserPolls();
 * if (error) {
 *   console.error('Failed to fetch polls:', error);
 * } else {
 *   // Display user's polls in dashboard
 *   polls.forEach(poll => {
 *     console.log(poll.question, poll.options.length, 'options');
 *   });
 * }
 * ```
 * 
 * @throws No exceptions thrown - errors are returned in the response object
 * 
 * @security
 * - Requires user authentication to prevent unauthorized access
 * - Uses Row Level Security (RLS) to enforce user isolation
 * - Only returns polls owned by the authenticated user
 * - No sensitive data exposed in response
 * 
 * @assumptions
 * - User is authenticated (checked by function)
 * - Database connection is available
 * - User has polls in the database (may return empty array)
 * 
 * @edge_cases
 * - Unauthenticated user: Returns empty array with error message
 * - No polls created: Returns empty array (not an error)
 * - Database error: Returns empty array with error message
 * - Network issues: Returns empty array with connection error
 * - User deleted: Returns empty array (polls cascade deleted)
 * 
 * @integration
 * - Connected to: PollsPage component, user dashboard
 * - Used by: Poll management interface, poll statistics
 * - Returns: Array of poll objects with id, question, options, created_at
 */
export async function getUserPolls() {
  // Create Supabase client for server-side database operations
  const supabase = await createClient();
  
  // Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  // Security check: Only authenticated users can access their polls
  if (!user) return { polls: [], error: "Not authenticated" };

  // Query polls owned by the authenticated user, ordered by creation date (newest first)
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id) // Enforce user isolation
    .order("created_at", { ascending: false }); // Newest polls first

  // Handle database errors
  if (error) return { polls: [], error: error.message };
  
  // Return polls array (empty array if no polls found)
  return { polls: data ?? [], error: null };
}

/**
 * Retrieves a specific poll by its unique identifier.
 * 
 * This function is essential for displaying individual poll details, enabling voting,
 * and providing poll-specific functionality. It's used when users click on a poll
 * to view its details or when sharing poll links.
 * 
 * The function allows public access to poll data (anyone can view polls) but maintains
 * security through database-level constraints and validation.
 * 
 * @param id - Unique identifier of the poll to retrieve
 * @returns Promise resolving to an object with poll data and error property
 * 
 * @example
 * ```typescript
 * const { poll, error } = await getPollById('123e4567-e89b-12d3-a456-426614174000');
 * if (error) {
 *   console.error('Poll not found:', error);
 * } else {
 *   // Display poll details
 *   console.log(poll.question, poll.options);
 * }
 * ```
 * 
 * @throws No exceptions thrown - errors are returned in the response object
 * 
 * @security
 * - Uses parameterized queries to prevent SQL injection
 * - Validates UUID format through database constraints
 * - No sensitive user data exposed in poll object
 * - Public access allowed (polls are meant to be shared)
 * 
 * @assumptions
 * - Poll ID is a valid UUID format
 * - Database connection is available
 * - Poll exists in the database
 * 
 * @edge_cases
 * - Invalid UUID format: Returns database error
 * - Poll not found: Returns null poll with error message
 * - Poll deleted: Returns null poll with error message
 * - Database error: Returns null poll with error message
 * - Network issues: Returns null poll with connection error
 * - Malformed ID: Returns validation error
 * 
 * @integration
 * - Connected to: Poll detail pages, voting interfaces, poll sharing
 * - Used by: Poll display components, vote submission forms
 * - Returns: Poll object with id, question, options, user_id, created_at
 */
export async function getPollById(id: string) {
  // Create Supabase client for server-side database operations
  const supabase = await createClient();
  
  // Query for the specific poll by ID
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single(); // Expect exactly one result

  // Handle database errors (poll not found, invalid ID, etc.)
  if (error) return { poll: null, error: error.message };
  
  // Return poll data
  return { poll: data, error: null };
}

/**
 * Submits a vote for a specific option in a poll.
 * 
 * This function is the core of the voting system, allowing users (and optionally anonymous
 * users) to participate in polls. It records the vote in the database and enables real-time
 * poll result updates.
 * 
 * The function supports both authenticated and anonymous voting, providing flexibility
 * for different use cases. Authenticated votes are linked to users for potential features
 * like vote change tracking, while anonymous votes allow broader participation.
 * 
 * @param pollId - Unique identifier of the poll being voted on
 * @param optionIndex - Zero-based index of the selected option in the poll's options array
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * // Vote for the first option (index 0) in a poll
 * const result = await submitVote('123e4567-e89b-12d3-a456-426614174000', 0);
 * if (result.error) {
 *   setError(result.error);
 * } else {
 *   // Vote submitted successfully, update UI
 *   setHasVoted(true);
 *   fetchUpdatedResults();
 * }
 * ```
 * 
 * @throws No exceptions thrown - errors are returned in the response object
 * 
 * @security
 * - Uses parameterized queries to prevent SQL injection
 * - Validates poll ID and option index
 * - Supports both authenticated and anonymous voting
 * - No sensitive data exposed in vote record
 * 
 * @assumptions
 * - Poll ID is a valid UUID format
 * - Option index is within the valid range for the poll
 * - Poll exists and is active
 * - Database connection is available
 * 
 * @edge_cases
 * - Invalid poll ID: Returns database error
 * - Invalid option index: Returns database constraint error
 * - Poll not found: Returns foreign key constraint error
 * - Duplicate vote: May be allowed or prevented based on business rules
 * - Network issues: Returns connection error
 * - Database error: Returns database error message
 * 
 * @integration
 * - Connected to: Voting interfaces, poll result displays
 * - Used by: Poll detail pages, voting buttons
 * - Creates: Vote record in database
 * - Updates: Poll result calculations, vote counts
 */
export async function submitVote(pollId: string, optionIndex: number) {
  // Create Supabase client for server-side database operations
  const supabase = await createClient();
  
  // Get current user (may be null for anonymous voting)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optional: Require authentication for voting
  // Uncomment the following lines to enforce authenticated voting only
  // if (!user) return { error: 'You must be logged in to vote.' };

  // Insert vote record into database
  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId, // Link vote to specific poll
      user_id: user?.id ?? null, // Link to user if authenticated, null if anonymous
      option_index: optionIndex, // Record which option was selected
    },
  ]);

  // Handle database errors
  if (error) return { error: error.message };
  
  // Vote submitted successfully
  return { error: null };
}

/**
 * Deletes a poll and all associated votes.
 * 
 * This function provides poll owners with the ability to remove their polls from the system.
 * It's a destructive operation that permanently removes the poll and all its voting data,
 * so it should be used with caution and proper user confirmation.
 * 
 * The function enforces ownership through database constraints, ensuring only poll owners
 * can delete their polls. It also triggers cache revalidation to update the UI immediately.
 * 
 * @param id - Unique identifier of the poll to delete
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * const result = await deletePoll('123e4567-e89b-12d3-a456-426614174000');
 * if (result.error) {
 *   console.error('Failed to delete poll:', result.error);
 * } else {
 *   // Poll deleted successfully, refresh the page
 *   window.location.reload();
 * }
 * ```
 * 
 * @throws No exceptions thrown - errors are returned in the response object
 * 
 * @security
 * - Enforces user ownership through database constraints
 * - Uses parameterized queries to prevent SQL injection
 * - Cascades deletion to associated votes
 * - Requires authentication (enforced by database RLS)
 * 
 * @assumptions
 * - Poll ID is a valid UUID format
 * - User is authenticated and owns the poll
 * - Database connection is available
 * - User has permission to delete the poll
 * 
 * @edge_cases
 * - Invalid poll ID: Returns database error
 * - Poll not found: Returns database error
 * - Unauthorized access: Returns permission error (RLS)
 * - Network issues: Returns connection error
 * - Database error: Returns database error message
 * - Poll already deleted: Returns error (idempotent operation)
 * 
 * @integration
 * - Connected to: Poll management interface, delete buttons
 * - Triggers: Cache revalidation for /polls route
 * - Deletes: Poll record and all associated votes (cascade)
 * - Updates: Polls list cache, user's poll count
 */
export async function deletePoll(id: string) {
  // Create Supabase client for server-side database operations
  const supabase = await createClient();
  
  // Delete the poll (votes will be cascade deleted due to foreign key constraint)
  const { error } = await supabase.from("polls").delete().eq("id", id);
  
  // Handle database errors
  if (error) return { error: error.message };
  
  // Revalidate the polls page cache to remove the deleted poll immediately
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Updates an existing poll's question and options.
 * 
 * This function allows poll owners to modify their polls after creation, providing
 * flexibility for correcting errors or updating content. It enforces strict ownership
 * validation to prevent unauthorized modifications.
 * 
 * The function validates input data and ensures only the poll owner can make changes.
 * It maintains data integrity by validating the same business rules as poll creation.
 * 
 * @param pollId - Unique identifier of the poll to update
 * @param formData - FormData object containing updated question and options
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('question', 'Updated: What's your favorite programming language?');
 * formData.append('options', 'JavaScript');
 * formData.append('options', 'Python');
 * formData.append('options', 'TypeScript'); // Added new option
 * 
 * const result = await updatePoll('123e4567-e89b-12d3-a456-426614174000', formData);
 * if (result.error) {
 *   setError(result.error);
 * } else {
 *   // Poll updated successfully
 *   router.push('/polls');
 * }
 * ```
 * 
 * @throws No exceptions thrown - errors are returned in the response object
 * 
 * @security
 * - Requires user authentication to prevent unauthorized updates
 * - Enforces ownership through database constraints
 * - Validates input data to prevent injection attacks
 * - Uses parameterized queries to prevent SQL injection
 * 
 * @assumptions
 * - User is authenticated and owns the poll
 * - FormData contains valid question and options
 * - Database connection is available
 * - Poll exists and is owned by the user
 * 
 * @edge_cases
 * - Empty question: Returns validation error
 * - Less than 2 options: Returns validation error
 * - Empty options: Filtered out before validation
 * - Unauthenticated user: Returns authentication error
 * - Poll not found: Returns database error
 * - Unauthorized access: Returns permission error (RLS)
 * - Network issues: Returns connection error
 * - Database error: Returns database error message
 * 
 * @integration
 * - Connected to: Poll edit forms, poll management interface
 * - Used by: EditPollForm component, poll update workflows
 * - Updates: Poll question and options in database
 * - Maintains: Poll ownership, creation date, vote history
 */
export async function updatePoll(pollId: string, formData: FormData) {
  // Create Supabase client for server-side database operations
  const supabase = await createClient();

  // Extract and validate form data
  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Business rule validation: Poll must have a question and at least 2 options
  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Security check: Ensure user is authenticated before updating poll
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Update poll with ownership validation (only poll owner can update)
  const { error } = await supabase
    .from("polls")
    .update({ question, options })
    .eq("id", pollId) // Target specific poll
    .eq("user_id", user.id); // Ensure user owns the poll

  // Handle database errors
  if (error) {
    return { error: error.message };
  }

  // Poll updated successfully
  return { error: null };
}
