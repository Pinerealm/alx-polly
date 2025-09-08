#!/usr/bin/env node

/**
 * Setup Admin User Script
 * 
 * This script helps you set up the first admin user in the system.
 * Run this after applying the database migration.
 * 
 * Usage:
 * 1. First, run the database migration: database-migrations/add-admin-roles.sql
 * 2. Find your user ID from Supabase Auth dashboard or by logging in and checking the browser console
 * 3. Run this script: node scripts/setup-admin.js <user-id>
 * 
 * Example:
 * node scripts/setup-admin.js 12345678-1234-1234-1234-123456789012
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please set these in your .env.local file or pass them as environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdmin(userId) {
  try {
    console.log(`🔧 Setting up admin role for user: ${userId}`);
    
    // Check if user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error(`❌ User not found: ${userId}`);
      console.error('Please verify the user ID is correct.');
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.user.email}`);
    
    // Check if user already has admin role
    const { data: existingRole, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();
    
    if (existingRole && !roleError) {
      console.log('⚠️  User already has admin role');
      return;
    }
    
    // Add admin role
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
        created_by: userId // Self-created for the first admin
      });
    
    if (error) {
      console.error('❌ Failed to create admin role:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Admin role created successfully!');
    console.log(`🎉 User ${user.user.email} is now an administrator.`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Get user ID from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a user ID');
  console.error('');
  console.error('Usage: node scripts/setup-admin.js <user-id>');
  console.error('');
  console.error('To find your user ID:');
  console.error('1. Log in to your app');
  console.error('2. Open browser developer tools');
  console.error('3. Check the console for "AuthContext: user" logs');
  console.error('4. Copy the "id" field from the user object');
  process.exit(1);
}

// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(userId)) {
  console.error('❌ Invalid user ID format. Please provide a valid UUID.');
  process.exit(1);
}

setupAdmin(userId);
