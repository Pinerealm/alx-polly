-- Migration: Add Admin Roles System
-- This migration adds a proper admin role system to the database

-- =============================================
-- USER ROLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(user_id, role)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view all user roles
CREATE POLICY "Admins can view all user roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Only admins can insert user roles
CREATE POLICY "Admins can insert user roles" ON public.user_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Only admins can update user roles
CREATE POLICY "Admins can update user roles" ON public.user_roles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Only admins can delete user roles
CREATE POLICY "Admins can delete user roles" ON public.user_roles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- =============================================
-- GRANTS AND PERMISSIONS
-- =============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role 
    FROM public.user_roles 
    WHERE user_id = user_uuid 
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'user');
END;
$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- INITIAL ADMIN SETUP
-- =============================================

-- Note: You need to manually insert admin users after running this migration
-- Example:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('your-admin-user-id-here', 'admin');

-- =============================================
-- UPDATE EXISTING POLICIES TO USE ADMIN ROLE
-- =============================================

-- Update polls policies to allow admins to delete any poll
DROP POLICY IF EXISTS "Users can delete their own polls" ON public.polls;
CREATE POLICY "Users can delete their own polls or admins can delete any" ON public.polls
    FOR DELETE USING (
        auth.uid() = user_id OR public.is_admin()
    );

-- Update polls policies to allow admins to update any poll
DROP POLICY IF EXISTS "Users can update their own polls" ON public.polls;
CREATE POLICY "Users can update their own polls or admins can update any" ON public.polls
    FOR UPDATE USING (
        auth.uid() = user_id OR public.is_admin()
    );
