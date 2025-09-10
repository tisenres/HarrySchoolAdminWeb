/**
 * Script to find and test potential Vercel deployment URLs
 */

const { testEndpoint } = require('./test-vercel-functionality.js');

const potentialUrls = [
  'https://harry-school-admin-web.vercel.app',
  'https://harry-school-admin-web-git-main.vercel.app',
  'https://harry-school-admin-web-tisenres.vercel.app',
  'https://harryschooladminweb.vercel.app',
  'https://harry-school-crm.vercel.app',
  'https://harry-school.vercel.app'
];

const findActiveDeployment = async () => {
  console.log('🔍 Searching for active Vercel deployment...\n');
  
  for (const url of potentialUrls) {
    process.stdout.write(`Testing ${url}... `);
    
    try {
      const result = await testEndpoint(url);
      if (result.success) {
        console.log('✅ FOUND!');
        console.log(`🌐 Active deployment found at: ${url}`);
        
        // Test a key API endpoint
        console.log('\n🧪 Testing key functionality...');
        const apiTest = await testEndpoint(`${url}/api/public/students/e002f32a-38c0-4503-99e4-99d9cb26192b`);
        
        if (apiTest.success && apiTest.data.fullName) {
          console.log('✅ Student API working - deployment is functional!');
          console.log(`📋 To run full tests: node test-vercel-functionality.js ${url}`);
          return url;
        } else {
          console.log('⚠️  Deployment found but API may not be working');
          console.log('❌ API response:', apiTest.status, apiTest.data?.error || 'Unknown error');
        }
      } else {
        console.log(`❌ ${result.status || 'No response'}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n❓ No active deployment found at common URLs.');
  console.log('💡 You may need to:');
  console.log('   1. Check your Vercel dashboard for the actual URL');
  console.log('   2. Ensure the GitHub integration deployed successfully');
  console.log('   3. Run `vercel --prod` after logging in with `vercel login`');
  
  return null;
};

if (require.main === module) {
  findActiveDeployment().catch(console.error);
}

module.exports = { findActiveDeployment, potentialUrls };