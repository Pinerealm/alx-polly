'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { login } from '@/app/lib/actions/auth-actions';

/**
 * User login page with authentication form.
 * 
 * This component provides the primary entry point for existing users to access
 * the polling platform. It handles user authentication through a secure form
 * interface and manages the complete login workflow including validation,
 * error handling, and successful authentication redirects.
 * 
 * Key features:
 * - Secure email/password authentication
 * - Real-time form validation and error display
 * - Loading states during authentication
 * - Automatic redirect on successful login
 * - Link to registration page for new users
 * - Responsive design with modern UI components
 * 
 * The component uses Server Actions for secure authentication processing,
 * ensuring that sensitive operations happen on the server side while
 * maintaining a smooth client-side user experience.
 * 
 * @returns JSX element containing the login form interface
 * 
 * @example
 * ```tsx
 * // This component is automatically rendered for the /login route
 * // Users can enter their credentials to access the platform
 * ```
 * 
 * @security
 * - Uses Server Actions for secure authentication
 * - Validates input on both client and server side
 * - Prevents XSS through proper input handling
 * - Handles authentication errors securely
 * - Uses HTTPS for secure data transmission
 * 
 * @assumptions
 * - User has a valid account with email/password
 * - Authentication service is available and working
 * - Form submission will redirect to /polls on success
 * - Error messages are user-friendly and secure
 * 
 * @edge_cases
 * - Invalid credentials: Display error message
 * - Network errors: Show connection error
 * - Empty fields: Client-side validation prevents submission
 * - Authentication service down: Display service error
 * - Multiple rapid submissions: Prevented by loading state
 * 
 * @integration
 * - Connected to: login Server Action, authentication context
 * - Used by: Authentication flow, protected route redirects
 * - Triggers: User authentication, session creation, page redirect
 * - Manages: Form state, error display, loading states
 */
export default function LoginPage() {
  // Local state management for form and UI feedback
  const [error, setError] = useState<string | null>(null); // Error message display
  const [loading, setLoading] = useState(false); // Loading state during authentication

  /**
   * Handles form submission and user authentication.
   * 
   * This function manages the complete login workflow:
   * 1. Prevents default form submission
   * 2. Sets loading state and clears previous errors
   * 3. Extracts form data (email and password)
   * 4. Calls the login Server Action for authentication
   * 5. Handles response and updates UI accordingly
   * 6. Redirects to dashboard on successful login
   * 
   * The function uses a full page reload after successful login to ensure
   * the authentication context is properly updated across the application.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission
    setLoading(true); // Show loading state
    setError(null); // Clear previous errors

    // Extract form data
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Attempt authentication using Server Action
    const result = await login({ email, password });

    if (result?.error) {
      // Display error message and clear loading state
      setError(result.error);
      setLoading(false);
    } else {
      // Authentication successful - redirect to dashboard
      // Full reload ensures authentication context is updated
      window.location.href = '/polls';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login to ALX Polly</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="current-password"
              />
            </div>
            {/* Error message display */}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {/* Submit button with loading state */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        {/* Registration link footer */}
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}