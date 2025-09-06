const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xlcsegukheumsadygmgh.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY3NlZ3VraGV1bXNhZHlnbWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM5Mzk3OSwiZXhwIjoyMDY5OTY5OTc5fQ.hWgaYpSST_kClaO8-KHlWXGAH6_FOonXO9Ke_b6Xaac';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPassword() {
  try {
    // Update the password for admin@harryschool.uz
    const { data, error } = await supabase.auth.admin.updateUserById(
      '75bef7b6-c86a-4ac7-b77b-41905c3aacff',
      { password: 'Admin123!' }
    );

    if (error) {
      console.error('Error resetting password:', error);
      return;
    }

    console.log('Password reset successfully!');
    console.log('\n✅ Admin credentials:');
    console.log('Email: admin@harryschool.uz');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

resetAdminPassword();