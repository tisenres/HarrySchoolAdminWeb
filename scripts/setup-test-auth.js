#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTestAuth() {
  console.log('🔐 Setting up test authentication...\n');

  // Test credentials
  const testEmail = 'admin@harryschool.uz';
  const testPassword = 'Admin123!';
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'; // Harry School Main Campus

  try {
    // Step 1: Check if user already exists in auth
    console.log('📋 Checking if user exists in auth...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === testEmail);

    let userId;

    if (existingUser) {
      console.log('✅ User already exists in auth');
      userId = existingUser.id;
      
      // Update password
      console.log('🔄 Updating user password...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: testPassword }
      );
      
      if (updateError) {
        console.error('❌ Failed to update password:', updateError.message);
      } else {
        console.log('✅ Password updated successfully');
      }
    } else {
      // Create new user
      console.log('👤 Creating new auth user...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Test Admin'
        }
      });

      if (createError) {
        console.error('❌ Failed to create user:', createError.message);
        process.exit(1);
      }

      userId = newUser.user.id;
      console.log('✅ User created successfully');
    }

    // Step 2: Check/Create profile
    console.log('\n📋 Checking user profile...');
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      console.log('✅ Profile already exists');
      
      // Update profile to ensure it's active
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          email: testEmail,
          full_name: 'Test Admin',
          role: 'admin',
          organization_id: organizationId,
          deleted_at: null,
          deleted_by: null
        })
        .eq('id', userId);

      if (updateProfileError) {
        console.error('❌ Failed to update profile:', updateProfileError.message);
      } else {
        console.log('✅ Profile updated successfully');
      }
    } else {
      console.log('👤 Creating user profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: testEmail,
          full_name: 'Test Admin',
          role: 'admin',
          organization_id: organizationId,
          avatar_url: null,
          phone: null,
          created_by: userId,
          updated_by: userId
        });

      if (profileError) {
        console.error('❌ Failed to create profile:', profileError.message);
        process.exit(1);
      }
      console.log('✅ Profile created successfully');
    }

    // Step 3: Verify the setup
    console.log('\n🔍 Verifying setup...');
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', userId)
      .single();

    if (finalProfile) {
      console.log('✅ Setup verified successfully!\n');
      console.log('📧 Email:', testEmail);
      console.log('🔑 Password:', testPassword);
      console.log('👤 Name:', finalProfile.full_name);
      console.log('🎭 Role:', finalProfile.role);
      console.log('🏢 Organization:', finalProfile.organizations?.name || 'N/A');
      console.log('\n🚀 You can now login with these credentials!');
    } else {
      console.error('❌ Failed to verify setup');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the setup
setupTestAuth().catch(console.error);