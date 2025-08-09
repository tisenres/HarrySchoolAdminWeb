const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xlcsegukheumsadygmgh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY3NlZ3VraGV1bXNhZHlnbWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM5Mzk3OSwiZXhwIjoyMDY5OTY5OTc5fQ.hWgaYpSST_kClaO8-KHlWXGAH6_FOonXO9Ke_b6Xaac';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@harryschool.uz',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Harry School Admin'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('Created auth user:', authData.user.id);

    // Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'admin@harryschool.uz',
        full_name: 'Harry School Admin',
        role: 'superadmin',
        organization_id: '550e8400-e29b-41d4-a716-446655440000',
        language_preference: 'en',
        timezone: 'Asia/Tashkent',
        notification_preferences: {
          email_notifications: true,
          system_notifications: true,
          student_updates: true,
          payment_reminders: true
        }
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Try to delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }

    console.log('Created profile for user');
    console.log('\nTest user created successfully!');
    console.log('Email: admin@harryschool.uz');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestUser();