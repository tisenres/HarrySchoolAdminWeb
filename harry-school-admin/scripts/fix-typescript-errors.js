#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Run TypeScript check and capture errors
console.log('🔍 Analyzing TypeScript errors...')
let errors = ''
try {
  execSync('npm run type-check', { encoding: 'utf8' })
  console.log('✅ No TypeScript errors found!')
  process.exit(0)
} catch (e) {
  errors = e.stdout || ''
}

// Parse errors
const errorLines = errors.split('\n')
const parsedErrors = []
let currentError = null

for (const line of errorLines) {
  const match = line.match(/^(.+?):(\d+):(\d+) - error TS(\d+): (.+)$/)
  if (match) {
    if (currentError) parsedErrors.push(currentError)
    currentError = {
      file: match[1],
      line: parseInt(match[2]),
      column: parseInt(match[3]),
      code: match[4],
      message: match[5],
      context: []
    }
  } else if (currentError && line.trim()) {
    currentError.context.push(line)
  }
}
if (currentError) parsedErrors.push(currentError)

console.log(`Found ${parsedErrors.length} errors to fix\n`)

// Group errors by type
const errorsByType = {}
for (const error of parsedErrors) {
  if (!errorsByType[error.code]) {
    errorsByType[error.code] = []
  }
  errorsByType[error.code].push(error)
}

// Fix functions for each error type
const fixes = {
  // TS6133: Variable is declared but never used
  '6133': (errors) => {
    console.log(`🔧 Fixing ${errors.length} unused variable errors...`)
    const fileChanges = {}
    
    for (const error of errors) {
      if (!fileChanges[error.file]) {
        fileChanges[error.file] = fs.readFileSync(error.file, 'utf8').split('\n')
      }
      
      const line = fileChanges[error.file][error.line - 1]
      if (line) {
        // Comment out unused imports
        if (line.includes('import')) {
          fileChanges[error.file][error.line - 1] = '// ' + line + ' // TODO: Remove if not needed'
        }
        // Prefix unused variables with underscore
        else if (line.includes('const ') || line.includes('let ')) {
          const varMatch = line.match(/(const|let)\s+(\w+)/)
          if (varMatch) {
            fileChanges[error.file][error.line - 1] = line.replace(varMatch[2], '_' + varMatch[2])
          }
        }
      }
    }
    
    // Write changes
    for (const [file, lines] of Object.entries(fileChanges)) {
      fs.writeFileSync(file, lines.join('\n'))
      console.log(`  ✅ Fixed ${file}`)
    }
  },
  
  // TS4111: Property must be accessed with bracket notation
  '4111': (errors) => {
    console.log(`🔧 Fixing ${errors.length} bracket notation errors...`)
    const fileChanges = {}
    
    for (const error of errors) {
      if (!fileChanges[error.file]) {
        fileChanges[error.file] = fs.readFileSync(error.file, 'utf8').split('\n')
      }
      
      const line = fileChanges[error.file][error.line - 1]
      if (line) {
        // Extract property name from error message
        const propMatch = error.message.match(/\['([^']+)'\]/)
        if (propMatch) {
          const prop = propMatch[1]
          // Replace dot notation with bracket notation
          fileChanges[error.file][error.line - 1] = line.replace(
            new RegExp(`\\.${prop}`, 'g'),
            `['${prop}']`
          )
        }
      }
    }
    
    // Write changes
    for (const [file, lines] of Object.entries(fileChanges)) {
      fs.writeFileSync(file, lines.join('\n'))
      console.log(`  ✅ Fixed ${file}`)
    }
  },
  
  // TS18048: Value is possibly undefined
  '18048': (errors) => {
    console.log(`🔧 Fixing ${errors.length} possibly undefined errors...`)
    const fileChanges = {}
    
    for (const error of errors) {
      if (!fileChanges[error.file]) {
        fileChanges[error.file] = fs.readFileSync(error.file, 'utf8').split('\n')
      }
      
      const line = fileChanges[error.file][error.line - 1]
      if (line && !line.includes('?') && !line.includes('!')) {
        // Add optional chaining
        fileChanges[error.file][error.line - 1] = line.replace(/\.(\w+)/g, '?.$1')
      }
    }
    
    // Write changes
    for (const [file, lines] of Object.entries(fileChanges)) {
      fs.writeFileSync(file, lines.join('\n'))
      console.log(`  ✅ Fixed ${file}`)
    }
  }
}

// Apply fixes
for (const [code, errorList] of Object.entries(errorsByType)) {
  if (fixes[code]) {
    fixes[code](errorList)
  }
}

console.log('\n🎉 TypeScript error fixes applied!')
console.log('⚠️  Please review the changes and run type-check again.')