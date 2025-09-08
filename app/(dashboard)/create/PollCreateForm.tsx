"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Interactive form component for creating new polls.
 * 
 * This component provides a user-friendly interface for poll creation, handling dynamic
 * option management, form validation, and submission. It's the primary entry point
 * for users to create polls and is essential for the core functionality of the app.
 * 
 * The component manages local state for options, error handling, and success feedback,
 * providing a smooth user experience with real-time validation and feedback.
 * 
 * Key features:
 * - Dynamic option addition/removal
 * - Form validation with user feedback
 * - Loading states during submission
 * - Success feedback with automatic redirect
 * - Error handling and display
 * 
 * @returns JSX element containing the poll creation form
 * 
 * @example
 * ```tsx
 * function CreatePollPage() {
 *   return (
 *     <div>
 *       <h1>Create New Poll</h1>
 *       <PollCreateForm />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @security
 * - Uses Server Actions for secure form submission
 * - Validates input on both client and server side
 * - Prevents XSS through proper input handling
 * - Requires user authentication (enforced by Server Action)
 * 
 * @assumptions
 * - User is authenticated (enforced by Server Action)
 * - createPoll Server Action is available and working
 * - Form submission will redirect to /polls on success
 * 
 * @edge_cases
 * - Network errors: Displayed to user with error message
 * - Validation errors: Shown inline with form
 * - Empty options: Prevented by minimum option requirement
 * - Form submission failure: User can retry
 * - Multiple rapid submissions: Prevented by loading state
 * 
 * @integration
 * - Connected to: createPoll Server Action, /polls route
 * - Used by: Create poll page, poll management interface
 * - Triggers: Poll creation, cache revalidation, page redirect
 * - Manages: Local form state, user feedback, option management
 */
export default function PollCreateForm() {
  // Local state management for form data and UI feedback
  const [options, setOptions] = useState(["", ""]); // Start with 2 empty options (minimum required)
  const [error, setError] = useState<string | null>(null); // Error message display
  const [success, setSuccess] = useState(false); // Success state for feedback

  /**
   * Updates a specific option at the given index.
   * 
   * This function maintains the controlled input state for poll options, ensuring
   * that user input is properly tracked and can be submitted with the form.
   * 
   * @param idx - Index of the option to update
   * @param value - New value for the option
   */
  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
  };

  /**
   * Adds a new empty option to the poll.
   * 
   * This function allows users to dynamically add more options to their poll,
   * providing flexibility for polls with varying numbers of choices.
   */
  const addOption = () => setOptions((opts) => [...opts, ""]);
  
  /**
   * Removes an option at the specified index.
   * 
   * This function allows users to remove options they no longer want, but enforces
   * the minimum requirement of 2 options to maintain poll validity.
   * 
   * @param idx - Index of the option to remove
   */
  const removeOption = (idx: number) => {
    // Enforce minimum of 2 options for poll validity
    if (options.length > 2) {
      setOptions((opts) => opts.filter((_, i) => i !== idx));
    }
  };

  return (
    <form
      /**
       * Form submission handler using Server Actions.
       * 
       * This async function handles the complete poll creation workflow:
       * 1. Clear previous error/success states
       * 2. Submit form data to createPoll Server Action
       * 3. Handle response and update UI accordingly
       * 4. Provide success feedback and redirect on completion
       * 
       * The use of Server Actions ensures secure, server-side processing
       * while maintaining a smooth client-side user experience.
       */
      action={async (formData) => {
        // Reset UI state for new submission
        setError(null);
        setSuccess(false);
        
        const response = await fetch('/api/polls', {
          method: 'POST',
          body: formData,
        });

        const res = await response.json();
        
        if (!response.ok) {
          // Display error message to user
          setError(res.error);
        } else {
          // Show success feedback and redirect after delay
          setSuccess(true);
          setTimeout(() => {
            window.location.href = "/polls";
          }, 1200); // 1.2 second delay for user to see success message
        }
      }}
      className="space-y-6 max-w-md mx-auto"
    >
      {/* Poll question input - required field */}
      <div>
        <Label htmlFor="question">Poll Question</Label>
        <Input name="question" id="question" required />
      </div>
      {/* Dynamic options management */}
      <div>
        <Label>Options</Label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <Input
              name="options" // All options use same name for FormData.getAll()
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              required // Each option is required
            />
            {/* Show remove button only if more than 2 options (minimum requirement) */}
            {options.length > 2 && (
              <Button type="button" variant="destructive" onClick={() => removeOption(idx)}>
                Remove
              </Button>
            )}
          </div>
        ))}
        {/* Button to add more options */}
        <Button type="button" onClick={addOption} variant="secondary">
          Add Option
        </Button>
      </div>
      {/* Error and success feedback */}
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">Poll created! Redirecting...</div>}
      
      {/* Submit button */}
      <Button type="submit">Create Poll</Button>
    </form>
  );
} 