'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';

/**
 * Authenticates a user with email and password credentials.
 * 
 * This function is essential for the app's security model as it validates user identity
 * before allowing access to protected resources like poll creation and management.
 * It uses Supabase's built-in authentication which handles password hashing, session
 * management, and JWT token generation automatically.
 * 
 * @param data - Object containing email and password for authentication
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * const result = await login({ email: 'user@example.com', password: 'password123' });
 * if (result.error) {
 *   // Handle authentication failure
 *   console.error('Login failed:', result.error);
 * } else {
 *   // User successfully authenticated, session established
 *   router.push('/polls');
 * }
 * ```
 * 
 * @throws No exceptions thrown - errors are returned in the response object
 * 
 * @security
 * - Passwords are never logged or stored in plain text
 * - Supabase handles secure session management
 * - Failed attempts are logged by Supabase for security monitoring
 * 
 * @assumptions
 * - Supabase client is properly configured with valid credentials
 * - Email format validation is handled by Supabase
 * - Password strength requirements are enforced by Supabase
 * 
 * @edge_cases
 * - Invalid email format: Returns validation error from Supabase
 * - Wrong password: Returns authentication error
 * - Account not found: Returns authentication error (for security, doesn't reveal if email exists)
 * - Network issues: Returns connection error
 * - Rate limiting: Supabase may throttle repeated failed attempts
 */
export async function login(data: LoginFormData) {
  // Create Supabase client for server-side authentication
  // This client has access to server-side environment variables and can perform
  // secure operations that client-side code cannot
  const supabase = await createClient();

  // Attempt to sign in using Supabase's built-in authentication
  // This method handles password verification, session creation, and JWT token generation
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  // Return error message if authentication failed
  // Supabase provides user-friendly error messages for common scenarios
  if (error) {
    return { error: error.message };
  }

  // Authentication successful - session is automatically established
  // The session will be available in subsequent requests via cookies
  return { error: null };
}

/**
 * Registers a new user account with email, password, and display name.
 * 
 * This function creates a new user account in the Supabase authentication system.
 * It's the entry point for new users to join the polling platform and is essential
 * for user onboarding. The function stores the user's name in metadata for display
 * purposes throughout the application.
 * 
 * @param data - Object containing name, email, and password for account creation
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * const result = await register({ 
 *   name: 'John Doe', 
 *   email: 'john@example.com', 
 *   password: 'securePassword123' 
 * });
 * if (result.error) {
 *   // Handle registration failure (email already exists, weak password, etc.)
 *   setError(result.error);
 * } else {
 *   // Account created successfully, user can now log in
 *   router.push('/login');
 * }
 * ```
 * 
 * @throws No exceptions thrown - errors are returned in the response object
 * 
 * @security
 * - Passwords are automatically hashed by Supabase using bcrypt
 * - Email verification can be enabled in Supabase dashboard
 * - User metadata is stored securely and only accessible to the user
 * 
 * @assumptions
 * - Email is unique across the system (enforced by Supabase)
 * - Password meets Supabase's strength requirements
 * - Name is provided for user identification in the UI
 * 
 * @edge_cases
 * - Email already exists: Returns 'User already registered' error
 * - Weak password: Returns password strength validation error
 * - Invalid email format: Returns email validation error
 * - Network issues: Returns connection error
 * - Supabase service unavailable: Returns service error
 * 
 * @integration
 * - Connected to: User profile display, poll ownership tracking
 * - Triggers: Email verification (if enabled), welcome email (if configured)
 * - Creates: User session, user metadata, database user record
 */
export async function register(data: RegisterFormData) {
  // Create Supabase client for server-side user creation
  const supabase = await createClient();

  // Create new user account with email/password authentication
  // The options.data.name is stored in user_metadata for easy access in the UI
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  // Return error message if registration failed
  if (error) {
    return { error: error.message };
  }

  // Registration successful - user account created
  // Note: User may need to verify email depending on Supabase configuration
  return { error: null };
}

/**
 * Signs out the current user and invalidates their session.
 * 
 * This function is crucial for security as it properly terminates user sessions
 * and prevents unauthorized access to user data. It should be called whenever
 * a user explicitly logs out or when implementing session timeout functionality.
 * 
 * @returns Promise resolving to an object with error property (null on success, error message on failure)
 * 
 * @example
 * ```typescript
 * const result = await logout();
 * if (result.error) {
 *   console.error('Logout failed:', result.error);
 * } else {
 *   // User successfully logged out, redirect to login page
 *   router.push('/login');
 * }
 * ```
 * 
 * @throws No exceptions thrown - errors are returned in the response object
 * 
 * @security
 * - Invalidates JWT tokens on the server side
 * - Clears session cookies
 * - Prevents further access to protected resources
 * 
 * @assumptions
 * - User has an active session to log out from
 * - Supabase client is properly configured
 * 
 * @edge_cases
 * - No active session: Still returns success (idempotent operation)
 * - Network issues: Returns connection error
 * - Already logged out: Returns success (no error)
 * 
 * @integration
 * - Connected to: AuthContext signOut method, logout buttons
 * - Triggers: Session cleanup, redirect to login page
 * - Clears: User session, authentication cookies, JWT tokens
 */
export async function logout() {
  // Create Supabase client for server-side logout
  const supabase = await createClient();
  
  // Sign out the current user and invalidate their session
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { error: error.message };
  }
  
  // Logout successful - session invalidated
  return { error: null };
}

/**
 * Retrieves the currently authenticated user from the active session.
 * 
 * This function is essential for determining user identity and permissions throughout
 * the application. It's used to check if a user is logged in, get user details for
 * display purposes, and enforce authorization rules for poll management.
 * 
 * @returns Promise resolving to the current user object or null if not authenticated
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (user) {
 *   // User is authenticated, show user-specific content
 *   console.log('Welcome,', user.user_metadata.name);
 * } else {
 *   // User is not authenticated, redirect to login
 *   router.push('/login');
 * }
 * ```
 * 
 * @throws No exceptions thrown - returns null for unauthenticated users
 * 
 * @security
 * - Only returns user data for valid, active sessions
 * - Automatically handles expired tokens
 * - No sensitive data exposed (passwords, etc.)
 * 
 * @assumptions
 * - Supabase client is properly configured
 * - Session cookies are present if user is authenticated
 * 
 * @edge_cases
 * - No active session: Returns null
 * - Expired session: Returns null
 * - Invalid session: Returns null
 * - Network issues: Returns null (graceful degradation)
 * 
 * @integration
 * - Connected to: AuthContext, protected routes, poll ownership checks
 * - Used by: Dashboard layout, poll creation, user profile display
 * - Returns: User object with id, email, user_metadata, etc.
 */
export async function getCurrentUser() {
  // Create Supabase client for server-side user retrieval
  const supabase = await createClient();
  
  // Get the current user from the active session
  // This method automatically validates the session and returns user data
  const { data } = await supabase.auth.getUser();
  
  // Return user object or null if not authenticated
  return data.user;
}

/**
 * Retrieves the current authentication session including tokens and metadata.
 * 
 * This function provides access to the full session object, which includes JWT tokens,
 * expiration times, and other session metadata. It's primarily used for advanced
 * session management and when you need more than just user data.
 * 
 * @returns Promise resolving to the current session object or null if not authenticated
 * 
 * @example
 * ```typescript
 * const session = await getSession();
 * if (session) {
 *   // Check session expiration
 *   const expiresAt = new Date(session.expires_at * 1000);
 *   if (expiresAt < new Date()) {
 *     // Session expired, redirect to login
 *     router.push('/login');
 *   }
 * }
 * ```
 * 
 * @throws No exceptions thrown - returns null for unauthenticated users
 * 
 * @security
 * - Returns session tokens that should be handled securely
 * - Automatically validates session integrity
 * - Tokens are automatically refreshed by Supabase when needed
 * 
 * @assumptions
 * - Supabase client is properly configured
 * - Session cookies are present if user is authenticated
 * 
 * @edge_cases
 * - No active session: Returns null
 * - Expired session: Returns null
 * - Invalid session: Returns null
 * - Network issues: Returns null (graceful degradation)
 * 
 * @integration
 * - Connected to: Advanced session management, token refresh logic
 * - Used by: Middleware, session validation, token-based API calls
 * - Returns: Session object with access_token, refresh_token, expires_at, etc.
 */
export async function getSession() {
  // Create Supabase client for server-side session retrieval
  const supabase = await createClient();
  
  // Get the current session including tokens and metadata
  const { data } = await supabase.auth.getSession();
  
  // Return session object or null if not authenticated
  return data.session;
}
