#!/usr/bin/env ts-node

import { runEducationalPerformanceTests } from '../packages/shared/tests/PerformanceTests';
import * as fs from 'fs';
import * as path from 'path';

// Performance test configurations for different educational contexts
const testConfigurations = [
  // Student App Tests
  {
    name: 'Student Mobile Performance',
    config: {
      userType: 'student' as const,
      culturalTheme: 'educational' as const,
      respectPrayerTime: true,
      networkCondition: 'fast' as const,
      deviceType: 'mobile' as const,
    },
  },
  {
    name: 'Student Slow Network Performance',
    config: {
      userType: 'student' as const,
      culturalTheme: 'educational' as const,
      respectPrayerTime: true,
      networkCondition: 'slow' as const,
      deviceType: 'mobile' as const,
    },
  },
  
  // Teacher App Tests
  {
    name: 'Teacher Tablet Performance',
    config: {
      userType: 'teacher' as const,
      culturalTheme: 'islamic' as const,
      respectPrayerTime: true,
      networkCondition: 'fast' as const,
      deviceType: 'tablet' as const,
    },
  },
  {
    name: 'Teacher Mobile Performance',
    config: {
      userType: 'teacher' as const,
      culturalTheme: 'islamic' as const,
      respectPrayerTime: true,
      networkCondition: 'fast' as const,
      deviceType: 'mobile' as const,
    },
  },

  // Admin Panel Tests
  {
    name: 'Admin Desktop Performance',
    config: {
      userType: 'admin' as const,
      culturalTheme: 'modern' as const,
      respectPrayerTime: true,
      networkCondition: 'fast' as const,
      deviceType: 'desktop' as const,
    },
  },
];

interface TestResult {
  name: string;
  config: any;
  results: any;
  timestamp: string;
  duration: number;
  passed: boolean;
  score: number;
}

class PerformanceTestRunner {
  private results: TestResult[] = [];
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(__dirname, '../test-results/performance');
    this.ensureOutputDirectory();
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Educational Performance Tests...\n');

    for (const testConfig of testConfigurations) {
      await this.runSingleTest(testConfig);
      
      // Prayer time aware test spacing
      if (this.checkPrayerTime()) {
        console.log('⏸️  Pausing tests during prayer time...');
        await this.sleep(60000); // 1 minute pause during prayer
      } else {
        await this.sleep(5000); // 5 second pause between tests
      }
    }

    // Generate comprehensive report
    await this.generateReport();
    
    console.log('✅ All performance tests completed!');
  }

  private async runSingleTest(testConfig: { name: string; config: any }): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`📊 Running: ${testConfig.name}`);
      console.log(`   User Type: ${testConfig.config.userType}`);
      console.log(`   Cultural Theme: ${testConfig.config.culturalTheme}`);
      console.log(`   Device: ${testConfig.config.deviceType}`);
      console.log(`   Network: ${testConfig.config.networkCondition}`);
      
      const results = await runEducationalPerformanceTests(testConfig.config);
      const duration = Date.now() - startTime;
      const score = this.calculatePerformanceScore(results);
      const passed = score >= 70; // 70% threshold for passing

      const testResult: TestResult = {
        name: testConfig.name,
        config: testConfig.config,
        results,
        timestamp: new Date().toISOString(),
        duration,
        passed,
        score,
      };

      this.results.push(testResult);

      // Log results
      console.log(`   ⏱️  Duration: ${duration}ms`);
      console.log(`   📈 Score: ${score}/100`);
      console.log(`   ${passed ? '✅' : '❌'} ${passed ? 'PASSED' : 'FAILED'}`);
      
      if (!passed) {
        console.log('   🔧 Recommendations:');
        results.recommendations.forEach((rec: string) => {
          console.log(`      • ${rec}`);
        });
      }
      
      console.log(''); // Empty line for spacing

      // Save individual test result
      await this.saveTestResult(testResult);

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Test failed: ${testConfig.name}`);
      console.error(`   Error: ${error}`);
      
      const failedResult: TestResult = {
        name: testConfig.name,
        config: testConfig.config,
        results: { error: error.toString() },
        timestamp: new Date().toISOString(),
        duration,
        passed: false,
        score: 0,
      };
      
      this.results.push(failedResult);
    }
  }

  private calculatePerformanceScore(results: any): number {
    let score = 100;

    // Core Web Vitals scoring
    const { overall } = results;
    
    // Largest Contentful Paint (0-25 points)
    if (overall.largestContentfulPaint > 4000) score -= 25;
    else if (overall.largestContentfulPaint > 2500) score -= 15;
    else if (overall.largestContentfulPaint > 1500) score -= 5;

    // First Contentful Paint (0-20 points)
    if (overall.firstContentfulPaint > 3000) score -= 20;
    else if (overall.firstContentfulPaint > 1800) score -= 10;
    else if (overall.firstContentfulPaint > 1000) score -= 5;

    // Cumulative Layout Shift (0-15 points)
    if (overall.cumulativeLayoutShift > 0.25) score -= 15;
    else if (overall.cumulativeLayoutShift > 0.1) score -= 8;

    // Time to Interactive (0-20 points)
    if (overall.timeToInteractive > 5000) score -= 20;
    else if (overall.timeToInteractive > 3500) score -= 10;
    else if (overall.timeToInteractive > 2000) score -= 5;

    // Bundle size (0-10 points)
    if (results.bundles.bundleSize > 1000000) score -= 10; // 1MB
    else if (results.bundles.bundleSize > 500000) score -= 5; // 500KB

    // Memory usage (0-10 points)
    if (results.memory.memoryLeaks) score -= 10;
    else if (results.memory.peakMemory > 100) score -= 5; // 100MB

    return Math.max(0, Math.min(100, score));
  }

  private async generateReport(): Promise<void> {
    const reportData = {
      summary: this.generateSummary(),
      results: this.results,
      recommendations: this.generateGlobalRecommendations(),
      cultural: this.analyzeCulturalPerformance(),
      educational: this.analyzeEducationalPerformance(),
      timestamp: new Date().toISOString(),
    };

    // Save comprehensive report
    const reportPath = path.join(this.outputDir, 'comprehensive-report.json');
    await fs.promises.writeFile(reportPath, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    await this.generateHtmlReport(reportData);

    console.log('📊 Performance Report Generated:');
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${reportPath.replace('.json', '.html')}`);
  }

  private generateSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const averageScore = this.results.reduce((sum, r) => sum + r.score, 0) / total;
    const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;

    return {
      totalTests: total,
      passed,
      failed,
      passRate: (passed / total) * 100,
      averageScore: Math.round(averageScore),
      averageDuration: Math.round(averageDuration),
    };
  }

  private generateGlobalRecommendations(): string[] {
    const recommendations = new Set<string>();

    // Analyze all results for common issues
    this.results.forEach(result => {
      if (result.results.recommendations) {
        result.results.recommendations.forEach((rec: string) => {
          recommendations.add(rec);
        });
      }

      // Add specific recommendations based on patterns
      if (result.score < 50) {
        recommendations.add(`Critical performance issues in ${result.name} - immediate optimization required`);
      }

      if (result.config.networkCondition === 'slow' && !result.passed) {
        recommendations.add('Implement aggressive caching for slow network conditions');
      }

      if (result.config.userType === 'student' && !result.passed) {
        recommendations.add('Optimize student app for mobile devices with limited resources');
      }
    });

    return Array.from(recommendations);
  }

  private analyzeCulturalPerformance() {
    const culturalResults = this.results.map(r => ({
      name: r.name,
      culturalTheme: r.config.culturalTheme,
      respectPrayerTime: r.config.respectPrayerTime,
      score: r.score,
      passed: r.passed,
    }));

    const byTheme = culturalResults.reduce((acc, result) => {
      if (!acc[result.culturalTheme]) {
        acc[result.culturalTheme] = { scores: [], passed: 0, total: 0 };
      }
      acc[result.culturalTheme].scores.push(result.score);
      acc[result.culturalTheme].total++;
      if (result.passed) acc[result.culturalTheme].passed++;
      return acc;
    }, {} as any);

    return {
      byTheme,
      prayerTimeAware: culturalResults.filter(r => r.respectPrayerTime).length,
      culturalOptimizations: culturalResults.filter(r => r.passed && r.respectPrayerTime).length,
    };
  }

  private analyzeEducationalPerformance() {
    const educationalResults = this.results.map(r => ({
      name: r.name,
      userType: r.config.userType,
      deviceType: r.config.deviceType,
      score: r.score,
      passed: r.passed,
    }));

    const byUserType = educationalResults.reduce((acc, result) => {
      if (!acc[result.userType]) {
        acc[result.userType] = { scores: [], passed: 0, total: 0 };
      }
      acc[result.userType].scores.push(result.score);
      acc[result.userType].total++;
      if (result.passed) acc[result.userType].passed++;
      return acc;
    }, {} as any);

    const byDevice = educationalResults.reduce((acc, result) => {
      if (!acc[result.deviceType]) {
        acc[result.deviceType] = { scores: [], passed: 0, total: 0 };
      }
      acc[result.deviceType].scores.push(result.score);
      acc[result.deviceType].total++;
      if (result.passed) acc[result.deviceType].passed++;
      return acc;
    }, {} as any);

    return {
      byUserType,
      byDevice,
      mobileOptimization: educationalResults.filter(r => r.deviceType === 'mobile' && r.passed).length,
      crossPlatformCompatibility: this.calculateCrossPlatformScore(educationalResults),
    };
  }

  private calculateCrossPlatformScore(results: any[]): number {
    const deviceTypes = [...new Set(results.map(r => r.deviceType))];
    const averageScores = deviceTypes.map(device => {
      const deviceResults = results.filter(r => r.deviceType === device);
      return deviceResults.reduce((sum, r) => sum + r.score, 0) / deviceResults.length;
    });
    
    const minScore = Math.min(...averageScores);
    const maxScore = Math.max(...averageScores);
    
    // Cross-platform compatibility is better when scores are similar across devices
    return 100 - ((maxScore - minScore) / maxScore * 100);
  }

  private async generateHtmlReport(reportData: any): Promise<void> {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Educational App Performance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #1d7452; text-align: center; margin-bottom: 30px; }
        h2 { color: #2563eb; border-bottom: 2px solid #dbeafe; padding-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f0f9f0; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #1d7452; }
        .metric-label { color: #6b7280; margin-top: 5px; }
        .results-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .results-table th, .results-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .results-table th { background: #f9fafb; font-weight: 600; }
        .passed { color: #059669; font-weight: bold; }
        .failed { color: #dc2626; font-weight: bold; }
        .recommendations { background: #fef3c7; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .recommendations ul { margin: 10px 0; padding-left: 20px; }
        .cultural-section { background: #f0f9f0; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .educational-section { background: #f0f4ff; padding: 20px; border-radius: 8px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 Educational App Performance Report</h1>
        <p style="text-align: center; color: #6b7280;">Generated on ${new Date(reportData.timestamp).toLocaleString()}</p>
        
        <h2>📊 Summary</h2>
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${reportData.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value">${reportData.summary.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${reportData.summary.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(reportData.summary.passRate)}%</div>
                <div class="metric-label">Pass Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${reportData.summary.averageScore}</div>
                <div class="metric-label">Avg Score</div>
            </div>
        </div>

        <h2>🧪 Test Results</h2>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Test Name</th>
                    <th>User Type</th>
                    <th>Device</th>
                    <th>Network</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Duration</th>
                </tr>
            </thead>
            <tbody>
                ${reportData.results.map((result: TestResult) => `
                    <tr>
                        <td>${result.name}</td>
                        <td>${result.config.userType}</td>
                        <td>${result.config.deviceType}</td>
                        <td>${result.config.networkCondition}</td>
                        <td>${result.score}/100</td>
                        <td class="${result.passed ? 'passed' : 'failed'}">${result.passed ? 'PASSED' : 'FAILED'}</td>
                        <td>${result.duration}ms</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="cultural-section">
            <h2>🕌 Cultural Performance Analysis</h2>
            <p><strong>Prayer Time Aware Tests:</strong> ${reportData.cultural.prayerTimeAware}/${reportData.summary.totalTests}</p>
            <p><strong>Cultural Optimizations:</strong> ${reportData.cultural.culturalOptimizations} tests passed with cultural awareness</p>
        </div>

        <div class="educational-section">
            <h2>🎓 Educational Context Analysis</h2>
            <p><strong>Student App Performance:</strong> ${reportData.educational.byUserType.student ? `${reportData.educational.byUserType.student.passed}/${reportData.educational.byUserType.student.total} passed` : 'No tests'}</p>
            <p><strong>Teacher App Performance:</strong> ${reportData.educational.byUserType.teacher ? `${reportData.educational.byUserType.teacher.passed}/${reportData.educational.byUserType.teacher.total} passed` : 'No tests'}</p>
            <p><strong>Mobile Optimization:</strong> ${reportData.educational.mobileOptimization} mobile tests passed</p>
            <p><strong>Cross-Platform Compatibility:</strong> ${Math.round(reportData.educational.crossPlatformCompatibility)}%</p>
        </div>

        <div class="recommendations">
            <h2>🔧 Recommendations</h2>
            <ul>
                ${reportData.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(this.outputDir, 'comprehensive-report.html');
    await fs.promises.writeFile(htmlPath, htmlContent);
  }

  private async saveTestResult(result: TestResult): Promise<void> {
    const filename = `${result.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    const filepath = path.join(this.outputDir, filename);
    await fs.promises.writeFile(filepath, JSON.stringify(result, null, 2));
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private checkPrayerTime(): boolean {
    const hour = new Date().getHours();
    return [5, 12, 15, 18, 20].includes(hour);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const runner = new PerformanceTestRunner();
  
  runner.runAllTests().catch(error => {
    console.error('❌ Performance test runner failed:', error);
    process.exit(1);
  });
}

export default PerformanceTestRunner;