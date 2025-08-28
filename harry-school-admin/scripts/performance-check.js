#!/usr/bin/env node

const { performance } = require('perf_hooks');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PerformanceChecker {
  constructor() {
    this.results = {
      startTime: new Date().toISOString(),
      checks: {},
      summary: {}
    };
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const proc = spawn(command, args, {
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });

      let stdout = '';
      let stderr = '';

      if (options.silent) {
        proc.stdout?.on('data', (data) => stdout += data.toString());
        proc.stderr?.on('data', (data) => stderr += data.toString());
      }

      proc.on('close', (code) => {
        const duration = performance.now() - startTime;
        resolve({
          code,
          duration: Math.round(duration),
          stdout,
          stderr
        });
      });
    });
  }

  async checkTypeScript() {
    console.log('🔍 Checking TypeScript compilation performance...');
    
    // Check with production config
    const prodResult = await this.runCommand('npx', ['tsc', '--noEmit'], { silent: true });
    
    // Check with development config
    const devResult = await this.runCommand('npx', ['tsc', '--project', 'tsconfig.dev.json', '--noEmit'], { silent: true });
    
    this.results.checks.typescript = {
      production: {
        duration: prodResult.duration,
        hasErrors: prodResult.code !== 0,
        errorCount: prodResult.stderr ? (prodResult.stderr.match(/error TS/g) || []).length : 0
      },
      development: {
        duration: devResult.duration,
        hasErrors: devResult.code !== 0,
        errorCount: devResult.stderr ? (devResult.stderr.match(/error TS/g) || []).length : 0
      },
      improvement: Math.round(((prodResult.duration - devResult.duration) / prodResult.duration) * 100)
    };

    console.log(`  📊 Production config: ${prodResult.duration}ms`);
    console.log(`  📊 Development config: ${devResult.duration}ms`);
    console.log(`  📈 Performance improvement: ${this.results.checks.typescript.improvement}%`);
  }

  async checkESLint() {
    console.log('\n📋 Checking ESLint performance...');
    
    // Check with production config
    const prodResult = await this.runCommand('npx', ['eslint', 'src/', '--format', 'compact'], { silent: true });
    
    // Check with development config
    const devResult = await this.runCommand('npx', ['eslint', '--config', 'eslint.config.dev.mjs', 'src/', '--format', 'compact'], { silent: true });
    
    this.results.checks.eslint = {
      production: {
        duration: prodResult.duration,
        hasIssues: prodResult.code !== 0,
        warningCount: prodResult.stdout ? (prodResult.stdout.match(/warning/g) || []).length : 0,
        errorCount: prodResult.stdout ? (prodResult.stdout.match(/error/g) || []).length : 0
      },
      development: {
        duration: devResult.duration,
        hasIssues: devResult.code !== 0,
        warningCount: devResult.stdout ? (devResult.stdout.match(/warning/g) || []).length : 0,
        errorCount: devResult.stdout ? (devResult.stdout.match(/error/g) || []).length : 0
      },
      improvement: Math.round(((prodResult.duration - devResult.duration) / prodResult.duration) * 100)
    };

    console.log(`  📊 Production config: ${prodResult.duration}ms`);
    console.log(`  📊 Development config: ${devResult.duration}ms`);
    console.log(`  📈 Performance improvement: ${this.results.checks.eslint.improvement}%`);
  }

  async checkBundleSize() {
    console.log('\n📦 Checking bundle analysis...');
    
    // Check if .next directory exists
    const nextDir = path.join(process.cwd(), '.next');
    if (!fs.existsSync(nextDir)) {
      console.log('  ⚠️  No build found. Run "npm run build" first.');
      return;
    }

    // Look for build stats
    const buildManifest = path.join(nextDir, 'build-manifest.json');
    if (fs.existsSync(buildManifest)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
        const pages = Object.keys(manifest.pages || {});
        
        this.results.checks.bundle = {
          totalPages: pages.length,
          staticFiles: manifest.devFiles ? manifest.devFiles.length : 0,
          lowPriorityFiles: manifest.lowPriorityFiles ? manifest.lowPriorityFiles.length : 0
        };

        console.log(`  📊 Total pages: ${pages.length}`);
        console.log(`  📊 Static files: ${this.results.checks.bundle.staticFiles}`);
      } catch (error) {
        console.log(`  ❌ Failed to read build manifest: ${error.message}`);
      }
    }
  }

  async checkCacheEffectiveness() {
    console.log('\n💾 Checking cache effectiveness...');
    
    const cacheDir = path.join(process.cwd(), '.next', 'cache');
    if (!fs.existsSync(cacheDir)) {
      console.log('  ⚠️  No cache directory found.');
      return;
    }

    const webpackCacheDir = path.join(cacheDir, 'webpack');
    const tsBuildInfo = path.join(cacheDir, 'tsconfig.tsbuildinfo');
    const buildMetrics = path.join(cacheDir, 'build-metrics.json');

    this.results.checks.cache = {
      webpackCacheExists: fs.existsSync(webpackCacheDir),
      typescriptCacheExists: fs.existsSync(tsBuildInfo),
      metricsHistoryExists: fs.existsSync(buildMetrics),
      cacheSize: 0
    };

    if (this.results.checks.cache.webpackCacheExists) {
      try {
        const stats = this.getDirSize(webpackCacheDir);
        this.results.checks.cache.cacheSize = stats;
        console.log(`  📊 Webpack cache size: ${(stats / 1024 / 1024).toFixed(2)}MB`);
      } catch (error) {
        console.log(`  ⚠️  Could not measure cache size: ${error.message}`);
      }
    }

    console.log(`  📊 Webpack cache: ${this.results.checks.cache.webpackCacheExists ? '✅' : '❌'}`);
    console.log(`  📊 TypeScript cache: ${this.results.checks.cache.typescriptCacheExists ? '✅' : '❌'}`);
    console.log(`  📊 Metrics history: ${this.results.checks.cache.metricsHistoryExists ? '✅' : '❌'}`);
  }

  getDirSize(dirPath) {
    let totalSize = 0;
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        totalSize += this.getDirSize(itemPath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  generateSummary() {
    console.log('\n📊 Performance Summary Report');
    console.log('═'.repeat(50));
    
    const ts = this.results.checks.typescript;
    const eslint = this.results.checks.eslint;
    const cache = this.results.checks.cache;

    // Calculate overall score
    let score = 100;
    let issues = [];

    if (ts) {
      if (ts.development.duration > 5000) {
        score -= 20;
        issues.push('TypeScript compilation is slow (>5s)');
      } else if (ts.development.duration > 2000) {
        score -= 10;
        issues.push('TypeScript compilation could be faster (>2s)');
      }

      if (ts.development.hasErrors) {
        score -= 15;
        issues.push(`TypeScript has ${ts.development.errorCount} errors`);
      }
    }

    if (eslint) {
      if (eslint.development.duration > 3000) {
        score -= 15;
        issues.push('ESLint is slow (>3s)');
      } else if (eslint.development.duration > 1000) {
        score -= 5;
        issues.push('ESLint could be faster (>1s)');
      }
    }

    if (cache && !cache.webpackCacheExists) {
      score -= 10;
      issues.push('Webpack cache not configured');
    }

    this.results.summary = {
      score: Math.max(score, 0),
      issues,
      recommendations: this.generateRecommendations()
    };

    console.log(`Overall Performance Score: ${this.results.summary.score}/100`);
    
    if (issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      issues.forEach(issue => console.log(`   • ${issue}`));
    }

    if (this.results.summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.results.summary.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    // Save results
    this.saveResults();
  }

  generateRecommendations() {
    const recommendations = [];
    const ts = this.results.checks.typescript;
    const eslint = this.results.checks.eslint;
    const cache = this.results.checks.cache;

    if (ts && ts.development.duration > 2000) {
      recommendations.push('Use "npm run type-check:fast" for development');
      recommendations.push('Consider incremental TypeScript compilation');
    }

    if (eslint && eslint.development.duration > 1000) {
      recommendations.push('Use "npm run lint:fast" for development');
      recommendations.push('Disable expensive ESLint rules in development');
    }

    if (!cache?.webpackCacheExists) {
      recommendations.push('Enable webpack filesystem caching in next.config.ts');
    }

    if (ts && ts.development.hasErrors) {
      recommendations.push('Fix TypeScript errors to improve compilation speed');
    }

    recommendations.push('Use "npm run dev:fast" for optimal development experience');
    recommendations.push('Run this check regularly to monitor performance');

    return recommendations;
  }

  saveResults() {
    const resultsFile = path.join(process.cwd(), '.next', 'cache', 'performance-results.json');
    
    try {
      let history = [];
      if (fs.existsSync(resultsFile)) {
        history = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      }

      history.push(this.results);
      
      // Keep only last 10 results
      if (history.length > 10) {
        history = history.slice(-10);
      }

      fs.writeFileSync(resultsFile, JSON.stringify(history, null, 2));
      console.log(`\n💾 Results saved to ${path.relative(process.cwd(), resultsFile)}`);
    } catch (error) {
      console.log(`❌ Failed to save results: ${error.message}`);
    }
  }

  async run() {
    console.log('🚀 Starting comprehensive performance check...\n');
    
    try {
      await this.checkTypeScript();
      await this.checkESLint();
      await this.checkBundleSize();
      await this.checkCacheEffectiveness();
      
      this.generateSummary();
      
    } catch (error) {
      console.log(`❌ Performance check failed: ${error.message}`);
    }
  }
}

// CLI interface
if (require.main === module) {
  const checker = new PerformanceChecker();
  checker.run();
}

module.exports = PerformanceChecker;