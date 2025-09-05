#!/usr/bin/env node

/**
 * E2E Test Setup Validation Script
 * 
 * This script validates that the E2E testing environment is properly configured
 * and ready to run tests against the Harry School Admin application.
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const APP_PORT = 3001
const BASE_URL = `http://localhost:${APP_PORT}`

console.log('🧪 Harry School Admin - E2E Test Setup Validation')
console.log('=' .repeat(60))

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step, description) {
  console.log(`\n${colors.blue}${colors.bright}[${step}]${colors.reset} ${description}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function checkCommand(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net')
    const server = net.createServer()
    
    server.listen(port, () => {
      server.once('close', () => resolve(false))
      server.close()
    })
    
    server.on('error', () => resolve(true))
  })
}

async function checkAppRunning() {
  try {
    const response = await fetch(BASE_URL)
    return response.ok
  } catch {
    return false
  }
}

async function validateEnvironment() {
  logStep('1', 'Validating Environment')
  
  // Check Node.js version
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
  
  if (majorVersion >= 18) {
    logSuccess(`Node.js version: ${nodeVersion}`)
  } else {
    logError(`Node.js version ${nodeVersion} is not supported. Please use Node 18+`)
    return false
  }
  
  // Check npm
  if (checkCommand('npm')) {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
    logSuccess(`npm version: ${npmVersion}`)
  } else {
    logError('npm is not installed or not in PATH')
    return false
  }
  
  return true
}

async function validateProjectStructure() {
  logStep('2', 'Validating Project Structure')
  
  const requiredFiles = [
    'package.json',
    'puppeteer.config.ts',
    'e2e/global-setup.ts',
    'e2e/global-teardown.ts',
    'e2e/helpers/auth.helper.ts',
    'e2e/fixtures/test-data.ts',
    'e2e/teachers/teachers-crud.spec.ts',
    'e2e/groups/groups-crud.spec.ts',
    'e2e/students/students-crud.spec.ts'
  ]
  
  let allFilesExist = true
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      logSuccess(`Found: ${file}`)
    } else {
      logError(`Missing: ${file}`)
      allFilesExist = false
    }
  }
  
  return allFilesExist
}

async function validateDependencies() {
  logStep('3', 'Validating Dependencies')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    
    const requiredDeps = {
      'puppeteer': 'devDependencies',
      'next': 'dependencies',
      'react': 'dependencies'
    }
    
    let allDepsInstalled = true
    
    for (const [dep, type] of Object.entries(requiredDeps)) {
      if (packageJson[type] && packageJson[type][dep]) {
        logSuccess(`${dep}: ${packageJson[type][dep]}`)
      } else {
        logError(`Missing ${type}: ${dep}`)
        allDepsInstalled = false
      }
    }
    
    // Check if node_modules exists
    if (fs.existsSync('node_modules')) {
      logSuccess('node_modules directory exists')
    } else {
      logError('node_modules directory not found. Run: npm install')
      allDepsInstalled = false
    }
    
    return allDepsInstalled
  } catch (error) {
    logError(`Failed to validate dependencies: ${error.message}`)
    return false
  }
}

async function validatePuppeteerSetup() {
  logStep('4', 'Validating Puppeteer Setup')
  
  try {
    // Check if Puppeteer is installed
    execSync('npx puppeteer --version', { stdio: 'ignore' })
    const version = execSync('npx puppeteer --version', { encoding: 'utf8' }).trim()
    logSuccess(`Puppeteer installed: ${version}`)
    
    // Check if browsers are installed
    try {
      execSync('npx puppeteer install --dry-run', { stdio: 'ignore' })
      logSuccess('Puppeteer browsers are installed')
    } catch {
      logWarning('Puppeteer browsers may need installation. Run: npx puppeteer install')
    }
    
    return true
  } catch (error) {
    logError('Puppeteer is not installed properly')
    logWarning('Run: npm install puppeteer && npx puppeteer install')
    return false
  }
}

async function validateApplicationSetup() {
  logStep('5', 'Validating Application Setup')
  
  // Check if port is available or app is running
  const portInUse = await checkPort(APP_PORT)
  
  if (portInUse) {
    const appRunning = await checkAppRunning()
    if (appRunning) {
      logSuccess(`Application is running on port ${APP_PORT}`)
      return true
    } else {
      logError(`Port ${APP_PORT} is in use but app is not responding`)
      logWarning(`Check what's running on port ${APP_PORT} or use a different port`)
      return false
    }
  } else {
    logWarning(`Application is not running on port ${APP_PORT}`)
    logWarning(`Start the app with: npm run dev -- --port ${APP_PORT}`)
    return false
  }
}

async function runSampleTest() {
  logStep('6', 'Running Sample Test')
  
  try {
    log('Running a simple connectivity test...', 'blue')
    
    // Create a simple test file
    const simpleTest = `
import { test, expect } from 'puppeteer'

test('connectivity test', async ({ page }) => {
  await page.goto('${BASE_URL}')
  await expect(page).toHaveTitle(/Harry School|Next.js/)
  console.log('✅ Basic connectivity test passed')
})
`
    
    const testFile = 'e2e/connectivity-test.spec.ts'
    fs.writeFileSync(testFile, simpleTest)
    
    execSync('npx puppeteer test connectivity-test.spec.ts --reporter=line', { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
    // Clean up
    fs.unlinkSync(testFile)
    
    logSuccess('Sample test passed successfully')
    return true
  } catch (error) {
    logError(`Sample test failed: ${error.message}`)
    
    // Clean up on failure
    const testFile = 'e2e/connectivity-test.spec.ts'
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile)
    }
    
    return false
  }
}

async function generateReport() {
  logStep('7', 'Generating Setup Report')
  
  const report = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    testEnvironment: {
      baseUrl: BASE_URL,
      testDir: './e2e',
      configFile: './puppeteer.config.ts'
    },
    availableCommands: {
      'npm run test:e2e': 'Run all E2E tests',
      'npm run test:e2e:ui': 'Run tests with UI',
      'npm run test:e2e:headed': 'Run tests in headed mode',
      'npm run test:e2e:debug': 'Debug tests',
      'npm run test:e2e:teachers': 'Run teachers tests only',
      'npm run test:e2e:groups': 'Run groups tests only',
      'npm run test:e2e:students': 'Run students tests only'
    }
  }
  
  console.log('\n' + '='.repeat(60))
  log('📋 SETUP REPORT', 'bright')
  console.log('='.repeat(60))
  
  console.log(JSON.stringify(report, null, 2))
  
  // Save report to file
  fs.writeFileSync('e2e-setup-report.json', JSON.stringify(report, null, 2))
  logSuccess('Setup report saved to: e2e-setup-report.json')
}

async function main() {
  try {
    const results = []
    
    results.push(await validateEnvironment())
    results.push(await validateProjectStructure())
    results.push(await validateDependencies())
    results.push(await validatePuppeteerSetup())
    results.push(await validateApplicationSetup())
    
    // Only run sample test if application is running
    if (results[4]) {
      results.push(await runSampleTest())
    }
    
    await generateReport()
    
    const passedChecks = results.filter(Boolean).length
    const totalChecks = results.length
    
    console.log('\n' + '='.repeat(60))
    log(`📊 VALIDATION SUMMARY: ${passedChecks}/${totalChecks} checks passed`, 'bright')
    console.log('='.repeat(60))
    
    if (passedChecks === totalChecks) {
      logSuccess('✨ All checks passed! Your E2E testing environment is ready.')
      logSuccess('Run tests with: npm run test:e2e')
    } else {
      logWarning(`⚠️  ${totalChecks - passedChecks} issues need attention before running E2E tests.`)
      logWarning('Please address the issues above and run this script again.')
    }
    
    process.exit(passedChecks === totalChecks ? 0 : 1)
    
  } catch (error) {
    logError(`Setup validation failed: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n🛑 Setup validation interrupted', 'yellow')
  process.exit(1)
})

process.on('SIGTERM', () => {
  log('\n🛑 Setup validation terminated', 'yellow')
  process.exit(1)
})

// Run the validation
main()