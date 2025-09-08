/**
 * Test Vocabulary Table Schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testVocabSchema() {
  console.log('🧪 Testing vocabulary_words table schema...\n');

  // Try to insert with minimal data to see error
  const { data, error } = await supabase
    .from('vocabulary_words')
    .insert({
      organization_id: 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'
    })
    .select();

  if (error) {
    console.log('Schema error reveals required fields:', error.message);
  }

  // Try different field names that might exist
  const possibleFields = [
    'word_text',
    'content', 
    'term',
    'vocabulary',
    'english_word'
  ];

  for (const field of possibleFields) {
    console.log(`Testing field: ${field}`);
    const testData = {
      organization_id: 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c'
    };
    testData[field] = 'test';

    const { error: testError } = await supabase
      .from('vocabulary_words')
      .insert(testData)
      .select();

    if (testError) {
      if (testError.message.includes(`Could not find the '${field}' column`)) {
        console.log(`   ❌ ${field} - column doesn't exist`);
      } else {
        console.log(`   ✅ ${field} - column exists! Error: ${testError.message}`);
      }
    } else {
      console.log(`   ✅ ${field} - SUCCESS! Column exists and insert worked`);
    }
  }
}

testVocabSchema().catch(console.error);