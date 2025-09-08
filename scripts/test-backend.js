/**
 * Test Backend Functionality
 * Direct testing of auth and vocabulary
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBackend() {
  console.log('🧪 Testing Backend Functionality\n');

  // 1. Test student lookup
  console.log('1. Testing Student Lookup:');
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select(`
      *,
      student_rankings (*)
    `)
    .eq('email', 'john.smith@harry-school.test')
    .single();

  if (studentError) {
    console.log('❌ Student lookup failed:', studentError.message);
  } else {
    console.log('✅ Student found:', student.first_name, student.last_name);
    console.log('   Points:', student.total_points);
    console.log('   Level:', student.current_level);
  }

  // 2. Test vocabulary fetch
  console.log('\n2. Testing Vocabulary:');
  const { data: vocabulary, error: vocabError } = await supabase
    .from('vocabulary_words')
    .select('*')
    .eq('organization_id', 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c')
    .limit(5);

  if (vocabError) {
    console.log('❌ Vocabulary fetch failed:', vocabError.message);
  } else {
    console.log('✅ Vocabulary words found:', vocabulary.length);
    vocabulary.forEach(word => {
      console.log(`   - ${word.word} (${word.part_of_speech})`);
    });
  }

  // 3. Test groups
  console.log('\n3. Testing Groups:');
  const { data: groups, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('organization_id', 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c');

  if (groupError) {
    console.log('❌ Groups fetch failed:', groupError.message);
  } else {
    console.log('✅ Groups found:', groups.length);
    groups.forEach(group => {
      console.log(`   - ${group.name} (${group.level})`);
    });
  }

  // 4. Test homework
  console.log('\n4. Testing Homework:');
  const { data: homework, error: homeworkError } = await supabase
    .from('hometasks')
    .select('*')
    .eq('organization_id', 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c')
    .limit(3);

  if (homeworkError) {
    console.log('❌ Homework fetch failed:', homeworkError.message);
  } else {
    console.log('✅ Homework tasks found:', homework.length);
    homework.forEach(task => {
      console.log(`   - ${task.title}`);
    });
  }

  // 5. Create simple API response format
  console.log('\n📱 Mobile API Response Example:');
  const mobileResponse = {
    student: {
      id: student?.id,
      name: `${student?.first_name} ${student?.last_name}`,
      email: student?.email,
      points: student?.total_points,
      level: student?.current_level
    },
    vocabulary_sample: vocabulary?.slice(0, 3).map(word => ({
      id: word.id,
      word: word.word,
      definition: word.phonetics || 'Basic word',
      part_of_speech: word.part_of_speech
    })),
    groups: groups?.map(group => ({
      id: group.id,
      name: group.name,
      level: group.level
    }))
  };

  console.log(JSON.stringify(mobileResponse, null, 2));
}

testBackend().catch(console.error);