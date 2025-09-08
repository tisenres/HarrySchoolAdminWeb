/**
 * Add Vocabulary Words with Minimal Schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVocabulary() {
  console.log('📚 Adding vocabulary words...\n');

  const words = [
    { word: 'Hello', part_of_speech: 'word' },
    { word: 'Goodbye', part_of_speech: 'word' }, 
    { word: 'Thank you', part_of_speech: 'phrase' },
    { word: 'Please', part_of_speech: 'word' },
    { word: 'Brilliant', part_of_speech: 'adjective' }
  ];

  for (const word of words) {
    const { data, error } = await supabase
      .from('vocabulary_words')
      .insert({
        organization_id: 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c',
        word: word.word,
        part_of_speech: word.part_of_speech,
        is_active: true
      })
      .select();

    if (error) {
      console.log(`❌ ${word.word}:`, error.message);
    } else {
      console.log(`✅ Added: ${word.word}`);
    }
  }

  // Test final count
  const { data: allWords } = await supabase
    .from('vocabulary_words')
    .select('word')
    .eq('organization_id', 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c');

  console.log(`\n📊 Total vocabulary words: ${allWords?.length || 0}`);
}

addVocabulary().catch(console.error);