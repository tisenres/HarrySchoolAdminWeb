/**
 * Schema Discovery Script
 * Maps actual Supabase table structures
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function discoverSchema() {
  console.log('🔍 Discovering Supabase Schema...\n');

  const tables = [
    'organizations',
    'students',
    'teachers',
    'groups',
    'student_profiles',
    'student_group_enrollments',
    'student_rankings',
    'vocabulary_words',
    'student_vocabulary_progress',
    'lessons',
    'homework_assignments',
    'homework_submissions'
  ];

  for (const table of tables) {
    console.log(`\n📊 Table: ${table}`);
    console.log('='  .repeat(50));
    
    try {
      // Try to get one row to see the structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log('❌ Table does not exist');
        } else {
          console.log('⚠️ Error:', error.message);
        }
      } else {
        if (data && data.length > 0) {
          console.log('✅ Columns found:');
          Object.keys(data[0]).forEach(col => {
            const value = data[0][col];
            const type = value === null ? 'null' : typeof value;
            console.log(`   - ${col}: ${type}`);
          });
        } else {
          // Table exists but is empty, try to insert and catch error
          console.log('📝 Table exists but empty, testing insert...');
          
          // Try minimal insert to see required fields
          const testInsert = await supabase
            .from(table)
            .insert({})
            .select();
            
          if (testInsert.error) {
            console.log('   Insert error reveals schema:', testInsert.error.message);
          }
        }
      }
    } catch (err) {
      console.log('❌ Unexpected error:', err.message);
    }
  }

  console.log('\n\n🎯 Testing specific table structures...\n');

  // Test students table specifically
  console.log('Testing students table insert:');
  const { error: studentError } = await supabase
    .from('students')
    .insert({
      organization_id: 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c',
      first_name: 'Test',
      last_name: 'Schema'
    })
    .select();
  
  if (studentError) {
    console.log('Students table requirements:', studentError.message);
  }

  // Test groups table
  console.log('\nTesting groups table insert:');
  const { error: groupError } = await supabase
    .from('groups')
    .insert({
      organization_id: 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c',
      name: 'Test Group'
    })
    .select();
  
  if (groupError) {
    console.log('Groups table requirements:', groupError.message);
  }
}

discoverSchema().catch(console.error);