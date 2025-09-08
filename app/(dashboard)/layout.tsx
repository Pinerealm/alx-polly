"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/app/lib/context/auth-context";

/**
 * Protected dashboard layout component with authentication and navigation.
 * 
 * This component serves as the main layout for all authenticated user pages,
 * providing a consistent navigation experience and ensuring only authenticated
 * users can access protected content. It's the foundation of the user dashboard
 * and handles authentication state management, navigation, and user interface.
 * 
 * Key responsibilities:
 * - Authentication state monitoring and redirects
 * - Navigation header with user menu
 * - Loading state management during auth checks
 * - User session management and logout functionality
 * - Responsive layout with consistent styling
 * 
 * The component automatically redirects unauthenticated users to the login page
 * and provides a loading state while authentication is being determined.
 * 
 * @param children - React components to be rendered within the dashboard layout
 * @returns JSX element containing the complete dashboard layout
 * 
 * @example
 * ```tsx
 * function DashboardPage() {
 *   return (
 *     <DashboardLayout>
 *       <UserContent />
 *     </DashboardLayout>
 *   );
 * }
 * ```
 * 
 * @security
 * - Enforces authentication for all child components
 * - Automatically redirects unauthenticated users
 * - Provides secure logout functionality
 * - Uses authentication context for state management
 * 
 * @assumptions
 * - Authentication context is available and working
 * - Router is available for navigation
 * - User has valid session if authenticated
 * 
 * @edge_cases
 * - Loading state: Shows loading message while checking auth
 * - Unauthenticated user: Redirects to login page
 * - Network issues: Handled by authentication context
 * - Session expiration: Automatically redirects to login
 * 
 * @integration
 * - Connected to: useAuth hook, Next.js router
 * - Used by: All protected dashboard pages
 * - Manages: Authentication state, navigation, user interface
 * - Provides: Consistent layout, user menu, logout functionality
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Get authentication state and methods from context
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  /**
   * Authentication guard effect.
   * 
   * This effect monitors authentication state and automatically redirects
   * unauthenticated users to the login page. It only runs after the initial
   * authentication check is complete (loading is false) to prevent premature
   * redirects during the authentication process.
   */
  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  /**
   * Handles user logout and navigation.
   * 
   * This function provides a complete logout workflow by signing out the user
   * and redirecting them to the login page. It ensures a clean logout experience
   * and prevents users from accessing protected content after logout.
   */
  const handleSignOut = async () => {
    // Sign out the current user
    await signOut();
    // Redirect to login page
    router.push("/login");
  };

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p>Loading user session...</p>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Sticky navigation header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand logo and home link */}
          <Link href="/polls" className="text-xl font-bold text-slate-800">
            ALX Polly
          </Link>
          
          {/* Desktop navigation menu */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/polls" className="text-slate-600 hover:text-slate-900">
              My Polls
            </Link>
            <Link
              href="/create"
              className="text-slate-600 hover:text-slate-900"
            >
              Create Poll
            </Link>
          </nav>
          
          {/* User actions and menu */}
          <div className="flex items-center space-x-4">
            {/* Quick create poll button */}
            <Button asChild>
              <Link href="/create">Create Poll</Link>
            </Button>
            
            {/* User avatar and dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        user?.user_metadata?.avatar_url ||
                        "/placeholder-user.jpg"
                      }
                      alt={user?.email || "User"}
                    />
                    <AvatarFallback>
                      {user?.email ? user.email[0].toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/profile" className="w-full">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings" className="w-full">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Main content area */}
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
      
      {/* Footer */}
      <footer className="border-t bg-white py-4">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} ALX Polly. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
