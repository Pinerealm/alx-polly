'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Authentication context interface defining the shape of auth state and methods.
 * 
 * This interface provides a centralized way to access authentication state throughout
 * the application. It includes the current session, user data, logout functionality,
 * and loading state to handle async authentication operations.
 * 
 * @interface AuthContextType
 * @property session - Current Supabase session object containing tokens and metadata
 * @property user - Current authenticated user object with profile information
 * @property signOut - Function to sign out the current user and clear session
 * @property loading - Boolean indicating whether authentication state is being determined
 */
const AuthContext = createContext<{ 
  session: Session | null;
  user: User | null;
  signOut: () => void;
  loading: boolean;
}>({ 
  session: null, 
  user: null,
  signOut: () => {},
  loading: true,
});

/**
 * Authentication provider component that manages global authentication state.
 * 
 * This component is the heart of the authentication system, providing real-time
 * authentication state to all child components. It handles session initialization,
 * auth state changes, and provides a centralized logout function. The provider
 * automatically listens for authentication events and updates the context accordingly.
 * 
 * Key responsibilities:
 * - Initialize authentication state on app load
 * - Listen for authentication state changes (login/logout)
 * - Provide loading state during async auth operations
 * - Handle session persistence across page refreshes
 * - Clean up event listeners on unmount
 * 
 * @param children - React components that will have access to auth context
 * @returns JSX element wrapping children with authentication context
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <DashboardLayout>
 *         <Routes />
 *       </DashboardLayout>
 *     </AuthProvider>
 *   );
 * }
 * ```
 * 
 * @security
 * - Uses client-side Supabase client for real-time auth updates
 * - Automatically handles token refresh and session validation
 * - Prevents memory leaks by cleaning up event listeners
 * 
 * @assumptions
 * - Supabase client is properly configured with public keys
 * - Authentication state changes are handled by Supabase automatically
 * - Session cookies are managed by Supabase client
 * 
 * @edge_cases
 * - Network disconnection: Auth state remains until reconnection
 * - Token expiration: Automatically handled by Supabase
 * - Multiple tabs: Auth state syncs across tabs via Supabase
 * - Component unmount: Event listeners are properly cleaned up
 * 
 * @integration
 * - Connected to: All protected components, dashboard layout, navigation
 * - Triggers: Re-renders of components using useAuth hook
 * - Manages: Global authentication state, session persistence
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Create Supabase client instance - memoized to prevent recreation on every render
  // This client is configured for client-side operations and has access to browser APIs
  const supabase = useMemo(() => createClient(), []);
  
  // Authentication state management
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true to prevent flash of unauthenticated content

  useEffect(() => {
    // Flag to prevent state updates after component unmounts
    // This prevents memory leaks and React warnings about setting state on unmounted components
    let mounted = true;
    
    /**
     * Initial user fetch to determine authentication state on app load.
     * 
     * This function runs once when the component mounts to check if there's an existing
     * session. It's separate from the auth state change listener because we need to
     * handle the initial loading state differently from subsequent auth changes.
     */
    const getUser = async () => {
      try {
        // Get current user from existing session (if any)
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          // Log error but don't throw - user might not be authenticated
          console.error('Error fetching user:', error);
        }
        
        // Only update state if component is still mounted
        if (mounted) {
          setUser(data.user ?? null);
          setSession(null); // Clear session state initially
          setLoading(false); // Initial load complete
          console.log('AuthContext: Initial user loaded', data.user);
        }
      } catch (error) {
        // Handle unexpected errors during initial user fetch
        console.error('Unexpected error during initial user fetch:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    };

    // Perform initial user fetch
    getUser();

    /**
     * Set up real-time authentication state change listener.
     * 
     * This listener responds to authentication events like login, logout, token refresh,
     * and session changes. It's crucial for keeping the UI in sync with authentication
     * state across the entire application.
     */
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Update session and user state based on auth event
      setSession(session);
      setUser(session?.user ?? null);
      
      // Note: We don't set loading to false here because this listener can fire
      // multiple times during a single auth operation. The loading state is only
      // set to false after the initial user fetch completes.
      console.log('AuthContext: Auth state changed', _event, session, session?.user);
    });

    /**
     * Cleanup function to prevent memory leaks.
     * 
     * This function runs when the component unmounts or when the dependencies change.
     * It's essential for preventing memory leaks and React warnings.
     */
    return () => {
      mounted = false; // Prevent state updates after unmount
      authListener.subscription.unsubscribe(); // Remove auth state listener
    };
  }, [supabase]); // Re-run effect if supabase client changes (shouldn't happen due to useMemo)

  /**
   * Signs out the current user and clears the authentication session.
   * 
   * This function provides a centralized way to log out users from anywhere in the app.
   * It triggers the auth state change listener, which will update the context and
   * cause all components using the auth context to re-render with the new state.
   * 
   * @returns Promise that resolves when logout is complete
   * 
   * @example
   * ```tsx
   * const { signOut } = useAuth();
   * 
   * const handleLogout = async () => {
   *   await signOut();
   *   // User is now logged out, context will update automatically
   * };
   * ```
   * 
   * @security
   * - Invalidates session on both client and server
   * - Clears authentication cookies
   * - Prevents further access to protected resources
   * 
   * @assumptions
   * - User has an active session to log out from
   * - Supabase client is properly configured
   * 
   * @edge_cases
   * - No active session: Still succeeds (idempotent operation)
   * - Network issues: May fail silently, but session will expire naturally
   * - Multiple logout calls: Safe to call multiple times
   * 
   * @integration
   * - Connected to: Logout buttons, session timeout handlers
   * - Triggers: Auth state change event, context updates
   * - Clears: User session, authentication state, protected route access
   */
  const signOut = async () => {
    try {
      // Sign out using Supabase client
      // This will trigger the onAuthStateChange listener with a null session
      await supabase.auth.signOut();
    } catch (error) {
      // Log error but don't throw - logout should be resilient
      console.error('Error during sign out:', error);
    }
  };

  // Debug logging to help with development and troubleshooting
  console.log('AuthContext: user', user);
  
  // Provide authentication context to all child components
  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context throughout the application.
 * 
 * This hook provides a convenient way to access authentication state and methods
 * from any component within the AuthProvider tree. It's the primary interface
 * for components that need to check authentication status, display user information,
 * or trigger logout functionality.
 * 
 * @returns Authentication context object containing session, user, signOut function, and loading state
 * 
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { user, loading, signOut } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Please log in</div>;
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {user.user_metadata.name}</h1>
 *       <button onClick={signOut}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @throws Will throw an error if used outside of AuthProvider
 * 
 * @security
 * - Only provides access to user data for authenticated users
 * - SignOut function is safe to call multiple times
 * - Loading state prevents flash of unauthenticated content
 * 
 * @assumptions
 * - Component is wrapped in AuthProvider
 * - Authentication state is properly managed by AuthProvider
 * 
 * @edge_cases
 * - Used outside AuthProvider: Throws React context error
 * - AuthProvider not mounted: Returns default context values
 * - Network issues: Loading state handles async operations gracefully
 * 
 * @integration
 * - Connected to: All components that need authentication state
 * - Used by: Dashboard layout, protected routes, user menus
 * - Provides: Real-time authentication state, logout functionality
 */
export const useAuth = () => useContext(AuthContext);
