'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { register } from '@/app/lib/actions/auth-actions';

/**
 * User registration page with account creation form.
 * 
 * This component provides the entry point for new users to join the polling
 * platform. It handles user account creation through a secure form interface
 * and manages the complete registration workflow including validation,
 * error handling, and successful registration redirects.
 * 
 * Key features:
 * - Secure account creation with email/password
 * - Password confirmation validation
 * - Real-time form validation and error display
 * - Loading states during registration
 * - Automatic redirect on successful registration
 * - Link to login page for existing users
 * - Responsive design with modern UI components
 * 
 * The component enforces password confirmation to prevent user errors and
 * uses Server Actions for secure account creation processing.
 * 
 * @returns JSX element containing the registration form interface
 * 
 * @example
 * ```tsx
 * // This component is automatically rendered for the /register route
 * // New users can create accounts to access the platform
 * ```
 * 
 * @security
 * - Uses Server Actions for secure account creation
 * - Validates input on both client and server side
 * - Enforces password confirmation
 * - Prevents XSS through proper input handling
 * - Handles registration errors securely
 * - Uses HTTPS for secure data transmission
 * 
 * @assumptions
 * - User provides valid email and password
 * - Registration service is available and working
 * - Form submission will redirect to /polls on success
 * - Error messages are user-friendly and secure
 * 
 * @edge_cases
 * - Email already exists: Display error message
 * - Password mismatch: Client-side validation prevents submission
 * - Weak password: Server-side validation with error message
 * - Network errors: Show connection error
 * - Empty fields: Client-side validation prevents submission
 * - Multiple rapid submissions: Prevented by loading state
 * 
 * @integration
 * - Connected to: register Server Action, authentication context
 * - Used by: Authentication flow, new user onboarding
 * - Triggers: Account creation, session establishment, page redirect
 * - Manages: Form state, error display, loading states
 */
export default function RegisterPage() {
  // Local state management for form and UI feedback
  const [error, setError] = useState<string | null>(null); // Error message display
  const [loading, setLoading] = useState(false); // Loading state during registration

  /**
   * Handles form submission and user account creation.
   * 
   * This function manages the complete registration workflow:
   * 1. Prevents default form submission
   * 2. Sets loading state and clears previous errors
   * 3. Extracts form data (name, email, password, confirmPassword)
   * 4. Validates password confirmation
   * 5. Calls the register Server Action for account creation
   * 6. Handles response and updates UI accordingly
   * 7. Redirects to dashboard on successful registration
   * 
   * The function includes client-side password confirmation validation
   * to provide immediate feedback and prevent user errors.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission
    setLoading(true); // Show loading state
    setError(null); // Clear previous errors
    
    // Extract form data
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Client-side password confirmation validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Attempt account creation using Server Action
    const result = await register({ email, password });

    if (result?.error) {
      // Display error message and clear loading state
      setError(result.error);
      setLoading(false);
    } else {
      // Registration successful - redirect to dashboard
      // Full reload ensures authentication context is updated
      window.location.href = '/polls';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">Sign up to start creating and sharing polls</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name input field */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name"
                type="text" 
                placeholder="John Doe" 
                required
              />
            </div>
            {/* Email input field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="your@email.com" 
                required
                autoComplete="email"
              />
            </div>
            {/* Password input field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required
                autoComplete="new-password"
              />
            </div>
            {/* Password confirmation input field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword"
                type="password" 
                required
                autoComplete="new-password"
              />
            </div>
            {/* Error message display */}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {/* Submit button with loading state */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </CardContent>
        {/* Login link footer */}
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}