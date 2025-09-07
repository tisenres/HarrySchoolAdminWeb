const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service key exists:', !!supabaseServiceKey);

async function testConnection() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/organizations?select=count`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.text();
    console.log('Response:', data);
    
  } catch (error) {
    console.error('Connection error:', error.message);
  }
}

testConnection();