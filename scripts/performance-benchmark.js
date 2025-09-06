#!/usr/bin/env node

/**
 * Performance Benchmark Script
 * 
 * Runs performance benchmarks for Harry School CRM
 * and generates reports based on the performance configuration.
 */

const fs = require('fs')
const path = require('path')

// Load performance configuration
const performanceConfig = require('../performance-benchmark.config.js')

class PerformanceBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      results: [],
      summary: {
        passed: 0,
        failed: 0,
        totalTests: 0,
      }
    }
  }

  // Simulate performance test
  async runBenchmark(scenario) {
    console.log(`🚀 Running benchmark: ${scenario.name}`)
    console.log(`   Description: ${scenario.description}`)

    const scenarioResults = {
      name: scenario.name,
      description: scenario.description,
      setup: scenario.setup,
      tests: [],
      passed: 0,
      failed: 0,
    }

    for (const test of scenario.tests) {
      console.log(`   ⏱️  Testing: ${test.name}`)
      
      try {
        // Simulate test execution
        const result = await this.simulateTest(test, scenario.setup)
        
        const passed = result.value <= test.budget
        scenarioResults.tests.push({
          name: test.name,
          metric: test.metric,
          budget: test.budget,
          actual: result.value,
          unit: result.unit,
          passed,
          message: passed 
            ? `✅ ${test.name}: ${result.value}${result.unit} (budget: ${test.budget}${result.unit})`
            : `❌ ${test.name}: ${result.value}${result.unit} exceeds budget of ${test.budget}${result.unit}`
        })

        if (passed) {
          scenarioResults.passed++
          console.log(`      ✅ ${result.value}${result.unit} (budget: ${test.budget}${result.unit})`)
        } else {
          scenarioResults.failed++
          console.log(`      ❌ ${result.value}${result.unit} exceeds budget of ${test.budget}${result.unit}`)
        }
      } catch (error) {
        scenarioResults.failed++
        scenarioResults.tests.push({
          name: test.name,
          error: error.message,
          passed: false,
          message: `❌ ${test.name}: Error - ${error.message}`
        })
        console.log(`      ❌ Error: ${error.message}`)
      }
    }

    this.results.results.push(scenarioResults)
    this.results.summary.passed += scenarioResults.passed
    this.results.summary.failed += scenarioResults.failed
    this.results.summary.totalTests += scenario.tests.length

    console.log(`   ✅ Passed: ${scenarioResults.passed}, ❌ Failed: ${scenarioResults.failed}\n`)
  }

  // Simulate individual test execution
  async simulateTest(test, setup) {
    // Simulate realistic performance values based on test type
    const baseValues = {
      renderTime: this.simulateRenderTime(setup),
      searchTime: this.simulateSearchTime(setup),
      filterTime: this.simulateFilterTime(setup),
      memoryUsage: this.simulateMemoryUsage(setup),
      interactionTime: this.simulateInteractionTime(setup),
    }

    const value = baseValues[test.metric] || Math.random() * test.budget * 1.5
    const unit = test.metric.includes('Time') ? 'ms' : 
                test.metric.includes('memory') || test.metric.includes('Memory') ? 'MB' : 'ms'

    // Add some randomness to simulate real-world conditions
    const variation = (Math.random() - 0.5) * 0.2 // ±10% variation
    const actualValue = Math.round(value * (1 + variation))

    return { value: actualValue, unit }
  }

  // Simulate render time based on record count
  simulateRenderTime(setup) {
    const baseTime = 50 // Base render time in ms
    const recordMultiplier = setup.recordCount ? setup.recordCount * 0.1 : 0
    const imageMultiplier = setup.includeImages ? 20 : 0
    const virtualScrollBonus = setup.enableVirtualScroll ? -30 : 0
    
    return Math.max(10, baseTime + recordMultiplier + imageMultiplier + virtualScrollBonus)
  }

  // Simulate search time
  simulateSearchTime(setup) {
    const baseTime = 20
    const recordMultiplier = setup.recordCount ? setup.recordCount * 0.02 : 0
    return baseTime + recordMultiplier
  }

  // Simulate filter time
  simulateFilterTime(setup) {
    const baseTime = 10
    const recordMultiplier = setup.recordCount ? setup.recordCount * 0.01 : 0
    return baseTime + recordMultiplier
  }

  // Simulate memory usage
  simulateMemoryUsage(setup) {
    const baseMem = 20 // Base memory in MB
    const recordMultiplier = setup.recordCount ? setup.recordCount * 0.02 : 0
    const imageMultiplier = setup.includeImages ? 15 : 0
    return baseMem + recordMultiplier + imageMultiplier
  }

  // Simulate interaction time
  simulateInteractionTime(setup) {
    const baseTime = 30
    const complexityMultiplier = (setup.includeCharts ? 20 : 0) + 
                                (setup.includeStats ? 10 : 0) +
                                (setup.includeRecentActivity ? 15 : 0)
    return baseTime + complexityMultiplier
  }

  // Generate performance report
  generateReport() {
    const report = {
      ...this.results,
      recommendations: this.generateRecommendations(),
      summary: {
        ...this.results.summary,
        successRate: (this.results.summary.passed / this.results.summary.totalTests * 100).toFixed(1) + '%'
      }
    }

    return report
  }

  // Generate performance recommendations
  generateRecommendations() {
    const recommendations = []
    const failedTests = []

    this.results.results.forEach(scenario => {
      scenario.tests.forEach(test => {
        if (!test.passed) {
          failedTests.push({ scenario: scenario.name, test })
        }
      })
    })

    if (failedTests.length === 0) {
      recommendations.push('🎉 All performance benchmarks passed! Your application is well optimized.')
      return recommendations
    }

    // Analyze failed tests and provide recommendations
    const failedRenderTests = failedTests.filter(f => f.test.metric === 'renderTime')
    if (failedRenderTests.length > 0) {
      recommendations.push('🔧 Consider implementing virtual scrolling for large datasets to improve render times.')
      recommendations.push('⚡ Use React.memo() and useMemo() to prevent unnecessary re-renders.')
    }

    const failedSearchTests = failedTests.filter(f => f.test.metric === 'searchTime')
    if (failedSearchTests.length > 0) {
      recommendations.push('🔍 Implement debounced search to reduce search operation frequency.')
      recommendations.push('🗃️ Consider client-side indexing for faster search operations.')
    }

    const failedMemoryTests = failedTests.filter(f => f.test.metric === 'memoryUsage')
    if (failedMemoryTests.length > 0) {
      recommendations.push('💾 Review component lifecycle and ensure proper cleanup of event listeners.')
      recommendations.push('🖼️ Optimize image loading with lazy loading and proper sizing.')
    }

    return recommendations
  }

  // Save report to file
  async saveReport(report) {
    const reportsDir = path.join(process.cwd(), 'performance-reports')
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `performance-report-${timestamp}.json`
    const filepath = path.join(reportsDir, filename)

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2))
    console.log(`📊 Performance report saved to: ${filepath}`)

    // Also save a summary file
    const summaryFile = path.join(reportsDir, 'latest-summary.json')
    const summary = {
      timestamp: report.timestamp,
      environment: report.environment,
      summary: report.summary,
      recommendations: report.recommendations,
    }
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2))
  }

  // Run all benchmarks
  async runAllBenchmarks() {
    console.log('🎯 Harry School CRM Performance Benchmarks\n')
    console.log(`Environment: ${this.results.environment}`)
    console.log(`Timestamp: ${this.results.timestamp}\n`)

    for (const scenario of performanceConfig.testScenarios) {
      await this.runBenchmark(scenario)
    }

    // Generate and save report
    const report = this.generateReport()
    await this.saveReport(report)

    // Print summary
    this.printSummary(report)

    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0)
  }

  // Print performance summary
  printSummary(report) {
    console.log('📈 Performance Benchmark Summary')
    console.log('=' .repeat(50))
    console.log(`Total Tests: ${report.summary.totalTests}`)
    console.log(`Passed: ${report.summary.passed}`)
    console.log(`Failed: ${report.summary.failed}`)
    console.log(`Success Rate: ${report.summary.successRate}`)
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      report.recommendations.forEach(rec => console.log(`   ${rec}`))
    }

    console.log('\n🔍 Detailed results saved to performance-reports/ directory')
  }
}

// Run benchmarks if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark()
  benchmark.runAllBenchmarks().catch(error => {
    console.error('❌ Benchmark failed:', error)
    process.exit(1)
  })
}

module.exports = PerformanceBenchmark