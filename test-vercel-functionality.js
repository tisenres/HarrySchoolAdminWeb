/**
 * Comprehensive Test Suite for Vercel Deployment
 * Tests all key functionality to ensure parity between local and production
 */

const testEndpoint = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      timeout: 10000,
      ...options
    })
    
    const contentType = response.headers.get('content-type') || ''
    let data
    
    if (contentType.includes('application/json')) {
      data = await response.json()
    } else {
      // For HTML pages, just check if they load
      const text = await response.text()
      data = { 
        type: 'html', 
        length: text.length,
        title: text.match(/<title>(.*?)<\/title>/i)?.[1] || 'Untitled'
      }
    }
    
    return {
      status: response.status,
      success: response.ok,
      data,
      contentType
    }
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    }
  }
}

const runTests = async (baseUrl = 'http://localhost:3001') => {
  console.log(`🧪 Testing Harry School CRM functionality on: ${baseUrl}\n`)
  
  const tests = [
    // Public API Tests
    {
      name: 'Public Student API',
      url: `${baseUrl}/api/public/students/e002f32a-38c0-4503-99e4-99d9cb26192b`,
      expected: response => response.success && response.contentType.includes('json') && response.data && response.data.fullName === 'Alice Williams'
    },
    
    // Admin API Tests (will require authentication in production)
    {
      name: 'Students List API',
      url: `${baseUrl}/api/students`,
      expected: response => response.status === 401 || (response.success && response.contentType.includes('json'))
    },
    
    // Static Pages
    {
      name: 'Public Student Profile Page',
      url: `${baseUrl}/student/e002f32a-38c0-4503-99e4-99d9cb26192b`,
      expected: response => response.status === 200 && response.data.type === 'html'
    },
    
    // API Health Check
    {
      name: 'Database Connection',
      url: `${baseUrl}/api/check-db`,
      expected: response => response.success || response.status === 401
    },
    
    // Credential Management APIs (will require admin auth)
    {
      name: 'Credentials API',
      url: `${baseUrl}/api/students/credentials?without_credentials=true`,
      expected: response => response.status === 401 || response.success
    }
  ]
  
  const results = []
  
  for (const test of tests) {
    process.stdout.write(`Testing ${test.name}... `)
    
    const result = await testEndpoint(test.url)
    const passed = test.expected(result)
    
    results.push({
      name: test.name,
      passed,
      status: result.status,
      details: result.success ? 'OK' : (result.error || result.data?.error || 'Failed')
    })
    
    console.log(passed ? '✅ PASS' : `❌ FAIL (${result.status})`)
    if (!passed && result.data) {
      console.log(`   Details: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`)
    }
  }
  
  console.log('\n📊 Test Results Summary:')
  console.log('========================')
  
  const passed = results.filter(r => r.passed).length
  const total = results.length
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌'
    console.log(`${status} ${result.name} (${result.status}) - ${result.details}`)
  })
  
  console.log(`\n📈 Score: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`)
  
  if (passed === total) {
    console.log('🎉 All tests passed! The deployment is fully functional.')
  } else {
    console.log('⚠️  Some tests failed. Check the details above.')
  }
  
  return results
}

// Test both local and production if URLs are provided
const testBoth = async () => {
  console.log('🚀 Harry School CRM - Comprehensive Functionality Test\n')
  
  // Test local
  console.log('🏠 Testing LOCAL environment...')
  const localResults = await runTests('http://localhost:3001')
  
  console.log('\n' + '='.repeat(80) + '\n')
  
  // Test production (if available)
  const productionUrl = process.argv[2]
  if (productionUrl) {
    console.log('☁️  Testing PRODUCTION environment...')
    const prodResults = await runTests(productionUrl)
    
    console.log('\n🔄 Comparison:')
    console.log('==============')
    localResults.forEach((local, i) => {
      const prod = prodResults[i]
      const match = local.passed === prod.passed
      const status = match ? '✅' : '❌'
      console.log(`${status} ${local.name}: Local(${local.passed ? 'PASS' : 'FAIL'}) vs Prod(${prod.passed ? 'PASS' : 'FAIL'})`)
    })
  } else {
    console.log('💡 To test production, run: node test-vercel-functionality.js https://your-vercel-url.vercel.app')
  }
}

// Run if called directly
if (require.main === module) {
  testBoth().catch(console.error)
}

module.exports = { runTests, testEndpoint }