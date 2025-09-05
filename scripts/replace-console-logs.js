#!/usr/bin/env node

/**
 * Script to replace console.log/error/warn/debug statements with proper logger calls
 * Run: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Directories to process
const SOURCE_DIRS = [
  'src/**/*.{ts,tsx,js,jsx}',
  '!src/**/*.test.{ts,tsx,js,jsx}',
  '!src/**/*.spec.{ts,tsx,js,jsx}',
  '!src/__tests__/**/*',
  '!src/lib/utils/logger.ts'
];

// Mapping of console methods to logger methods
const CONSOLE_TO_LOGGER_MAP = {
  'console.log': 'logInfo',
  'console.info': 'logInfo',
  'console.debug': 'logDebug',
  'console.warn': 'logWarn',
  'console.error': 'logError'
};

let totalReplacements = 0;
let filesModified = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let hasLoggerImport = false;

  // Check if file already imports logger
  if (content.includes('from \'@/lib/utils/logger\'') || 
      content.includes('from "@/lib/utils/logger"')) {
    hasLoggerImport = true;
  }

  // Replace console statements
  Object.entries(CONSOLE_TO_LOGGER_MAP).forEach(([consoleMethod, loggerMethod]) => {
    const regex = new RegExp(`${consoleMethod.replace('.', '\\.')}\\(`, 'g');
    const matches = content.match(regex);
    
    if (matches && matches.length > 0) {
      content = content.replace(regex, `${loggerMethod}(`);
      modified = true;
      totalReplacements += matches.length;
      console.log(`  Replaced ${matches.length} ${consoleMethod} calls with ${loggerMethod}`);
    }
  });

  // Add logger import if needed and file was modified
  if (modified && !hasLoggerImport) {
    // Find the right place to add import
    const importRegex = /^import\s+.*$/m;
    const lastImport = content.match(/^import\s+.*$/gm);
    
    if (lastImport && lastImport.length > 0) {
      // Add after last import
      const lastImportIndex = content.lastIndexOf(lastImport[lastImport.length - 1]);
      const endOfLine = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLine + 1) + 
                'import { logInfo, logDebug, logWarn, logError } from \'@/lib/utils/logger\'\n' +
                content.slice(endOfLine + 1);
    } else {
      // Add at the beginning of file
      const useClientMatch = content.match(/^['"]use client['"]$/m);
      if (useClientMatch) {
        const useClientEnd = content.indexOf('\n', content.indexOf(useClientMatch[0]));
        content = content.slice(0, useClientEnd + 1) + 
                  '\nimport { logInfo, logDebug, logWarn, logError } from \'@/lib/utils/logger\'\n' +
                  content.slice(useClientEnd + 1);
      } else {
        content = 'import { logInfo, logDebug, logWarn, logError } from \'@/lib/utils/logger\'\n\n' + content;
      }
    }
  }

  // Write back if modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
    console.log(`✅ Modified: ${filePath}`);
  }
}

function main() {
  console.log('🔍 Searching for console statements to replace...\n');

  SOURCE_DIRS.forEach(pattern => {
    if (pattern.startsWith('!')) return; // Skip exclusion patterns
    
    const files = glob.sync(pattern, {
      ignore: SOURCE_DIRS.filter(p => p.startsWith('!')).map(p => p.slice(1))
    });

    files.forEach(file => {
      const fullPath = path.resolve(file);
      processFile(fullPath);
    });
  });

  console.log('\n📊 Summary:');
  console.log(`Files modified: ${filesModified}`);
  console.log(`Total replacements: ${totalReplacements}`);
  
  if (filesModified > 0) {
    console.log('\n⚠️  Please review the changes and test your application!');
    console.log('💡 You may need to adjust some logger calls to provide better context.');
  }
}

// Check if glob is installed
try {
  require.resolve('glob');
  main();
} catch (e) {
  console.error('❌ Please install glob first: npm install --save-dev glob');
  process.exit(1);
}