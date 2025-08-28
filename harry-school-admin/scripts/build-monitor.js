#!/usr/bin/env node

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

class BuildMonitor {
  constructor() {
    this.metrics = {};
    this.startTime = performance.now();
    this.sessionId = Date.now();
    this.logFile = path.join(process.cwd(), '.next', 'cache', 'build-metrics.json');
    
    // Ensure log directory exists
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  logPhase(phase) {
    const now = performance.now();
    const duration = now - this.startTime;
    
    console.log(`⏱️  ${phase}: ${Math.round(duration)}ms`);
    
    this.metrics[phase] = {
      duration: Math.round(duration),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage()
    };
    
    this.startTime = now;
    return duration;
  }

  async logTypeCheck() {
    const startTime = performance.now();
    console.log('🔍 Starting TypeScript type check...');
    
    try {
      const { spawn } = require('child_process');
      
      return new Promise((resolve) => {
        const tsc = spawn('npx', ['tsc', '--project', 'tsconfig.dev.json', '--noEmit'], {
          stdio: 'pipe'
        });
        
        let output = '';
        tsc.stderr.on('data', (data) => {
          output += data.toString();
        });
        
        tsc.on('close', (code) => {
          const duration = performance.now() - startTime;
          const hasErrors = code !== 0;
          
          this.metrics['typescript-check'] = {
            duration: Math.round(duration),
            hasErrors,
            errorCount: hasErrors ? (output.match(/error TS/g) || []).length : 0,
            timestamp: new Date().toISOString()
          };
          
          console.log(`🔍 TypeScript check: ${Math.round(duration)}ms (${hasErrors ? 'with errors' : 'clean'})`);
          resolve(duration);
        });
      });
    } catch (error) {
      console.log(`❌ TypeScript check failed: ${error.message}`);
      return 0;
    }
  }

  async logLinting() {
    const startTime = performance.now();
    console.log('📋 Starting ESLint check...');
    
    try {
      const { spawn } = require('child_process');
      
      return new Promise((resolve) => {
        const eslint = spawn('npx', ['eslint', '--config', 'eslint.config.dev.mjs', 'src/', '--format', 'compact'], {
          stdio: 'pipe'
        });
        
        let output = '';
        eslint.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        eslint.on('close', (code) => {
          const duration = performance.now() - startTime;
          const hasErrors = code !== 0;
          
          this.metrics['eslint-check'] = {
            duration: Math.round(duration),
            hasErrors,
            warningCount: (output.match(/warning/g) || []).length,
            errorCount: (output.match(/error/g) || []).length,
            timestamp: new Date().toISOString()
          };
          
          console.log(`📋 ESLint check: ${Math.round(duration)}ms (${hasErrors ? 'with issues' : 'clean'})`);
          resolve(duration);
        });
      });
    } catch (error) {
      console.log(`❌ ESLint check failed: ${error.message}`);
      return 0;
    }
  }

  generateReport() {
    const total = Object.values(this.metrics)
      .reduce((acc, metric) => acc + (metric.duration || 0), 0);
    
    console.log('\n📊 Build Performance Report:');
    console.log(`Session ID: ${this.sessionId}`);
    console.log(`Total Time: ${Math.round(total)}ms`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);
    
    // Sort by duration
    const sortedMetrics = Object.entries(this.metrics)
      .sort(([,a], [,b]) => (b.duration || 0) - (a.duration || 0));
    
    sortedMetrics.forEach(([phase, data]) => {
      const duration = data.duration || 0;
      const percentage = total > 0 ? ((duration / total) * 100).toFixed(1) : '0.0';
      const memUsage = data.memory ? ` (${Math.round(data.memory.heapUsed / 1024 / 1024)}MB heap)` : '';
      
      console.log(`${phase.padEnd(20)} ${String(duration).padStart(6)}ms (${percentage.padStart(4)}%)${memUsage}`);
    });
    
    // Performance insights
    console.log('\n💡 Performance Insights:');
    
    const typeCheck = this.metrics['typescript-check'];
    if (typeCheck) {
      if (typeCheck.duration > 5000) {
        console.log('⚠️  TypeScript compilation is slow (>5s). Consider using tsconfig.dev.json');
      } else if (typeCheck.duration < 2000) {
        console.log('✅ TypeScript compilation is optimized (<2s)');
      }
    }
    
    const eslintCheck = this.metrics['eslint-check'];
    if (eslintCheck) {
      if (eslintCheck.duration > 3000) {
        console.log('⚠️  ESLint is slow (>3s). Consider using eslint.config.dev.mjs');
      } else if (eslintCheck.duration < 500) {
        console.log('✅ ESLint is optimized (<500ms)');
      }
    }
    
    if (total > 10000) {
      console.log('⚠️  Total build time is slow (>10s). Review optimization strategies');
    } else if (total < 5000) {
      console.log('✅ Build time is optimized (<5s)');
    }
    
    // Save to log file
    this.saveMetrics();
  }

  saveMetrics() {
    try {
      let existingData = [];
      if (fs.existsSync(this.logFile)) {
        const content = fs.readFileSync(this.logFile, 'utf8');
        existingData = JSON.parse(content);
      }
      
      const sessionData = {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        totalDuration: Object.values(this.metrics).reduce((acc, m) => acc + (m.duration || 0), 0),
        metrics: this.metrics
      };
      
      existingData.push(sessionData);
      
      // Keep only last 50 sessions
      if (existingData.length > 50) {
        existingData = existingData.slice(-50);
      }
      
      fs.writeFileSync(this.logFile, JSON.stringify(existingData, null, 2));
      console.log(`\n💾 Metrics saved to ${path.relative(process.cwd(), this.logFile)}`);
      
    } catch (error) {
      console.log(`❌ Failed to save metrics: ${error.message}`);
    }
  }

  async runFullCheck() {
    console.log('🚀 Running full build performance check...\n');
    
    const initTime = this.logPhase('Initialization');
    
    await this.logTypeCheck();
    await this.logLinting();
    
    this.logPhase('Cleanup');
    this.generateReport();
  }

  // Static method to show historical data
  static showHistory() {
    const logFile = path.join(process.cwd(), '.next', 'cache', 'build-metrics.json');
    
    if (!fs.existsSync(logFile)) {
      console.log('📊 No build metrics history found.');
      return;
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      const recent = data.slice(-10); // Last 10 sessions
      
      console.log('\n📈 Build Performance History (Last 10 Sessions):');
      console.log('Session'.padEnd(20) + 'Total Time'.padEnd(12) + 'TS Check'.padEnd(10) + 'ESLint'.padEnd(10) + 'Timestamp');
      console.log('─'.repeat(70));
      
      recent.forEach(session => {
        const tsTime = session.metrics['typescript-check']?.duration || 0;
        const eslintTime = session.metrics['eslint-check']?.duration || 0;
        const timestamp = new Date(session.timestamp).toLocaleTimeString();
        
        console.log(
          session.sessionId.toString().slice(-10).padEnd(20) +
          `${session.totalDuration}ms`.padEnd(12) +
          `${tsTime}ms`.padEnd(10) +
          `${eslintTime}ms`.padEnd(10) +
          timestamp
        );
      });
      
      // Show trend
      if (recent.length > 3) {
        const latest = recent.slice(-3).reduce((acc, s) => acc + s.totalDuration, 0) / 3;
        const earlier = recent.slice(0, 3).reduce((acc, s) => acc + s.totalDuration, 0) / 3;
        const trend = ((latest - earlier) / earlier * 100).toFixed(1);
        
        console.log(`\n📊 Recent trend: ${trend > 0 ? '+' : ''}${trend}% vs earlier sessions`);
      }
      
    } catch (error) {
      console.log(`❌ Failed to read metrics history: ${error.message}`);
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'history') {
    BuildMonitor.showHistory();
  } else {
    const monitor = new BuildMonitor();
    monitor.runFullCheck();
  }
}

module.exports = BuildMonitor;