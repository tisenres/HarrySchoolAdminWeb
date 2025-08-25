# Mobile Testing CI/CD Pipelines: Harry School CRM

**Agent**: test-runner  
**Date**: 2025-01-21  
**Platform**: GitHub Actions for React Native + Expo (Student App, Teacher App)

## Executive Summary

This comprehensive CI/CD pipeline configuration enables robust testing and deployment for the Harry School CRM mobile applications. Built on the mobile testing strategy from `/docs/tasks/mobile-testing-strategy.md`, this implementation provides parallel test execution, multi-platform support, cultural testing validation, and automated quality gates.

### Key Features

- **Multi-Platform Testing**: iOS and Android builds with EAS Build integration
- **Parallel Execution**: Optimized for speed with intelligent caching
- **Cultural Testing**: Islamic context preservation and i18n validation
- **Offline Testing**: Network simulation and data sync validation
- **Security Testing**: Authentication flows and data protection
- **Performance Testing**: Bundle size, startup times, memory usage
- **Quality Gates**: 90% coverage, accessibility compliance, security scanning

## 1. GitHub Actions Workflow Structure

### Primary Workflows

```
.github/workflows/
├── mobile-ci.yml                 # Main CI pipeline
├── mobile-e2e-ios.yml           # iOS E2E testing
├── mobile-e2e-android.yml       # Android E2E testing
├── mobile-performance.yml       # Performance testing
├── mobile-security.yml          # Security scanning
├── mobile-i18n.yml             # Internationalization testing
└── mobile-release.yml           # Release automation
```

## 2. Main CI Pipeline

### `.github/workflows/mobile-ci.yml`

```yaml
name: Mobile CI Pipeline

on:
  push:
    branches: [main, develop]
    paths:
      - 'mobile/**'
      - '.github/workflows/mobile-**'
  pull_request:
    branches: [main]
    paths:
      - 'mobile/**'

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '18'
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

jobs:
  # ====================================
  # Phase 1: Setup and Linting
  # ====================================
  setup:
    name: Setup & Cache Dependencies
    runs-on: ubuntu-latest
    outputs:
      cache-hit: ${{ steps.cache-deps.outputs.cache-hit }}
      node-modules-cache-key: ${{ steps.cache-deps.outputs.cache-primary-key }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'mobile/package-lock.json'

      - name: Cache node_modules
        id: cache-deps
        uses: actions/cache@v4
        with:
          path: mobile/node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('mobile/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

      - name: Install dependencies
        if: steps.cache-deps.outputs.cache-hit != 'true'
        working-directory: mobile
        run: npm ci

  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    needs: setup
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Restore node_modules
        uses: actions/cache@v4
        with:
          path: mobile/node_modules
          key: ${{ needs.setup.outputs.node-modules-cache-key }}
          fail-on-cache-miss: true

      - name: Run ESLint
        working-directory: mobile
        run: npm run lint -- --format=github

      - name: Run TypeScript type check
        working-directory: mobile
        run: npm run type-check

      - name: Run Prettier check
        working-directory: mobile
        run: npm run format:check

  # ====================================
  # Phase 2: Unit & Component Testing
  # ====================================
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: setup
    strategy:
      matrix:
        app: [student, teacher]
        shard: [1, 2, 3]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Restore node_modules
        uses: actions/cache@v4
        with:
          path: mobile/node_modules
          key: ${{ needs.setup.outputs.node-modules-cache-key }}
          fail-on-cache-miss: true

      - name: Run unit tests (Shard ${{ matrix.shard }})
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:unit -- \
            --coverage \
            --shard=${{ matrix.shard }}/3 \
            --passWithNoTests \
            --runInBand \
            --ci

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          directory: mobile/apps/${{ matrix.app }}/coverage
          flags: ${{ matrix.app }}-unit-tests-shard-${{ matrix.shard }}
          name: ${{ matrix.app }}-unit-coverage-${{ matrix.shard }}

  component-tests:
    name: Component Tests
    runs-on: ubuntu-latest
    needs: setup
    strategy:
      matrix:
        app: [student, teacher]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Restore node_modules
        uses: actions/cache@v4
        with:
          path: mobile/node_modules
          key: ${{ needs.setup.outputs.node-modules-cache-key }}
          fail-on-cache-miss: true

      - name: Run component tests
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:components -- \
            --coverage \
            --runInBand \
            --ci

      - name: Upload component test reports
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.app }}-component-test-results
          path: mobile/apps/${{ matrix.app }}/test-results/

  # ====================================
  # Phase 3: Integration Testing
  # ====================================
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: setup
    strategy:
      matrix:
        app: [student, teacher]
        test-suite: [auth, offline-sync, data-flow]
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Restore node_modules
        uses: actions/cache@v4
        with:
          path: mobile/node_modules
          key: ${{ needs.setup.outputs.node-modules-cache-key }}
          fail-on-cache-miss: true

      - name: Setup test database
        run: |
          npm run test:db:setup
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run integration tests (${{ matrix.test-suite }})
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:integration:${{ matrix.test-suite }} -- \
            --runInBand \
            --ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

  # ====================================
  # Phase 4: Cultural & i18n Testing
  # ====================================
  i18n-tests:
    name: Internationalization Tests
    runs-on: ubuntu-latest
    needs: setup
    strategy:
      matrix:
        app: [student, teacher]
        locale: [en, ru, uz]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Restore node_modules
        uses: actions/cache@v4
        with:
          path: mobile/node_modules
          key: ${{ needs.setup.outputs.node-modules-cache-key }}
          fail-on-cache-miss: true

      - name: Validate translation keys consistency
        working-directory: mobile/apps/${{ matrix.app }}
        run: npm run test:i18n-keys

      - name: Test locale-specific functionality (${{ matrix.locale }})
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:i18n -- \
            --testNamePattern="${{ matrix.locale }}" \
            --runInBand \
            --ci

      - name: Test Islamic cultural content
        working-directory: mobile/apps/${{ matrix.app }}
        run: npm run test:cultural-content

      - name: Test prayer time calculations
        working-directory: mobile/apps/${{ matrix.app }}
        run: npm run test:prayer-times

  accessibility-tests:
    name: Accessibility Tests
    runs-on: ubuntu-latest
    needs: setup
    strategy:
      matrix:
        app: [student, teacher]
        age-group: [elementary, secondary]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Restore node_modules
        uses: actions/cache@v4
        with:
          path: mobile/node_modules
          key: ${{ needs.setup.outputs.node-modules-cache-key }}
          fail-on-cache-miss: true

      - name: Run accessibility tests (${{ matrix.age-group }})
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:accessibility -- \
            --testNamePattern="${{ matrix.age-group }}" \
            --runInBand \
            --ci

  # ====================================
  # Phase 5: Offline Testing
  # ====================================
  offline-tests:
    name: Offline Functionality Tests
    runs-on: ubuntu-latest
    needs: setup
    strategy:
      matrix:
        app: [student, teacher]
        scenario: [attendance-offline, lesson-progress, sync-conflicts]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Restore node_modules
        uses: actions/cache@v4
        with:
          path: mobile/node_modules
          key: ${{ needs.setup.outputs.node-modules-cache-key }}
          fail-on-cache-miss: true

      - name: Test offline scenarios (${{ matrix.scenario }})
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:offline:${{ matrix.scenario }} -- \
            --runInBand \
            --ci

      - name: Test data synchronization
        working-directory: mobile/apps/${{ matrix.app }}
        run: npm run test:sync

  # ====================================
  # Phase 6: Build Validation
  # ====================================
  build-validation:
    name: Build Validation
    runs-on: ubuntu-latest
    needs: [lint, unit-tests]
    strategy:
      matrix:
        app: [student, teacher]
        platform: [android, ios]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Setup Expo CLI
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Restore node_modules
        uses: actions/cache@v4
        with:
          path: mobile/node_modules
          key: ${{ needs.setup.outputs.node-modules-cache-key }}
          fail-on-cache-miss: true

      - name: EAS Build (Development)
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          eas build \
            --platform ${{ matrix.platform }} \
            --profile development \
            --non-interactive \
            --no-wait \
            --json > build-${{ matrix.platform }}.json

      - name: Upload build metadata
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.app }}-${{ matrix.platform }}-build-metadata
          path: mobile/apps/${{ matrix.app }}/build-${{ matrix.platform }}.json

  # ====================================
  # Phase 7: Coverage Validation
  # ====================================
  coverage-validation:
    name: Coverage Validation
    runs-on: ubuntu-latest
    needs: [unit-tests, component-tests]
    steps:
      - name: Download all coverage reports
        uses: actions/download-artifact@v3

      - name: Merge coverage reports
        run: |
          npx nyc merge coverage-reports/ merged-coverage.json
          npx nyc report --reporter=lcov --reporter=text-summary --temp-dir=.nyc_output

      - name: Check coverage thresholds
        run: |
          npx nyc check-coverage \
            --lines 90 \
            --functions 90 \
            --branches 90 \
            --statements 90

      - name: Upload merged coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: merged-coverage
          name: harry-school-mobile-coverage

  # ====================================
  # Phase 8: Final Quality Gates
  # ====================================
  quality-gates:
    name: Quality Gates
    runs-on: ubuntu-latest
    needs: [
      lint,
      unit-tests,
      component-tests,
      integration-tests,
      i18n-tests,
      accessibility-tests,
      offline-tests,
      build-validation,
      coverage-validation
    ]
    steps:
      - name: Validate all tests passed
        run: |
          echo "✅ All quality gates passed"
          echo "✅ Linting and type checking completed"
          echo "✅ Unit tests: ${{ needs.unit-tests.result }}"
          echo "✅ Component tests: ${{ needs.component-tests.result }}"
          echo "✅ Integration tests: ${{ needs.integration-tests.result }}"
          echo "✅ i18n tests: ${{ needs.i18n-tests.result }}"
          echo "✅ Accessibility tests: ${{ needs.accessibility-tests.result }}"
          echo "✅ Offline tests: ${{ needs.offline-tests.result }}"
          echo "✅ Build validation: ${{ needs.build-validation.result }}"
          echo "✅ Coverage validation: ${{ needs.coverage-validation.result }}"

      - name: Post summary to PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const summary = `
            ## 📱 Mobile CI Pipeline Results
            
            ### ✅ Quality Gates Passed
            - **Linting & Type Check**: ✅ Passed  
            - **Unit Tests**: ✅ Passed (90%+ coverage)
            - **Component Tests**: ✅ Passed  
            - **Integration Tests**: ✅ Passed
            - **i18n & Cultural Tests**: ✅ Passed
            - **Accessibility Tests**: ✅ Passed  
            - **Offline Tests**: ✅ Passed
            - **Build Validation**: ✅ Passed
            
            ### 📊 Test Summary
            - **Platforms**: Android & iOS
            - **Applications**: Student App, Teacher App
            - **Languages**: English, Russian, Uzbek
            - **Age Groups**: Elementary (10-12), Secondary (13-18)
            
            Ready for deployment! 🚀
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: summary
            });
```

## 3. iOS E2E Testing Pipeline

### `.github/workflows/mobile-e2e-ios.yml`

```yaml
name: iOS E2E Tests

on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'
  pull_request:
    branches: [main]
    paths:
      - 'mobile/**'
  workflow_dispatch:
    inputs:
      test_suite:
        description: 'Test suite to run'
        required: false
        default: 'all'
        type: choice
        options:
          - all
          - student-journey
          - teacher-workflow
          - islamic-features

env:
  NODE_VERSION: '18'
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

jobs:
  ios-e2e:
    name: iOS E2E Tests
    runs-on: macos-latest
    timeout-minutes: 60
    strategy:
      fail-fast: false
      matrix:
        app: [student, teacher]
        test-suite: [auth, lessons, prayer-times, offline]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'mobile/package-lock.json'

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'
          bundler-cache: true
          working-directory: mobile/apps/${{ matrix.app }}/ios

      - name: Cache CocoaPods
        uses: actions/cache@v4
        with:
          path: mobile/apps/${{ matrix.app }}/ios/Pods
          key: ${{ runner.os }}-pods-${{ hashFiles('mobile/apps/${{ matrix.app }}/ios/Podfile.lock') }}
          restore-keys: |
            ${{ runner.os }}-pods-

      - name: Install applesimutils
        run: |
          brew tap wix/brew
          brew install applesimutils

      - name: Install dependencies
        working-directory: mobile
        run: npm ci

      - name: Setup Expo CLI
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install CocoaPods
        working-directory: mobile/apps/${{ matrix.app }}/ios
        run: pod install

      - name: Cache Detox builds
        uses: actions/cache@v4
        with:
          path: |
            mobile/apps/${{ matrix.app }}/ios/build
            ~/Library/Developer/Xcode/DerivedData
          key: ${{ runner.os }}-detox-${{ matrix.app }}-${{ hashFiles('mobile/apps/${{ matrix.app }}/ios/**/*.pbxproj') }}
          restore-keys: |
            ${{ runner.os }}-detox-${{ matrix.app }}-

      - name: Build iOS app for Detox
        working-directory: mobile/apps/${{ matrix.app }}
        run: npx detox build --configuration ios.sim.debug

      - name: Run Detox tests (${{ matrix.test-suite }})
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npx detox test \
            --configuration ios.sim.debug \
            --testNamePattern="${{ matrix.test-suite }}" \
            --cleanup \
            --headless \
            --record-videos failing \
            --record-logs failing

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: ios-e2e-artifacts-${{ matrix.app }}-${{ matrix.test-suite }}
          path: |
            mobile/apps/${{ matrix.app }}/e2e/artifacts/**
            mobile/apps/${{ matrix.app }}/detox_tests_log.txt

  ios-cultural-e2e:
    name: iOS Cultural E2E Tests
    runs-on: macos-latest
    timeout-minutes: 45
    strategy:
      matrix:
        app: [student, teacher]
        language: [en, ru, uz]
        
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'mobile/package-lock.json'

      - name: Setup Expo CLI
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        working-directory: mobile
        run: npm ci

      - name: Install applesimutils
        run: |
          brew tap wix/brew
          brew install applesimutils

      - name: Build iOS app for cultural testing
        working-directory: mobile/apps/${{ matrix.app }}
        run: npx detox build --configuration ios.sim.debug

      - name: Run cultural E2E tests (${{ matrix.language }})
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npx detox test \
            --configuration ios.sim.debug \
            --testNamePattern="cultural.*${{ matrix.language }}" \
            --cleanup \
            --record-videos failing

      - name: Test prayer time notifications
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npx detox test \
            --configuration ios.sim.debug \
            --testNamePattern="prayer.*notification" \
            --cleanup

      - name: Upload cultural test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: ios-cultural-artifacts-${{ matrix.app }}-${{ matrix.language }}
          path: mobile/apps/${{ matrix.app }}/e2e/artifacts/**
```

## 4. Android E2E Testing Pipeline

### `.github/workflows/mobile-e2e-android.yml`

```yaml
name: Android E2E Tests

on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'
  pull_request:
    branches: [main]
    paths:
      - 'mobile/**'
  workflow_dispatch:

env:
  NODE_VERSION: '18'
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

jobs:
  android-e2e:
    name: Android E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 90
    strategy:
      fail-fast: false
      matrix:
        app: [student, teacher]
        api-level: [29, 31]
        test-suite: [student-journey, teacher-workflow, offline-sync]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'mobile/package-lock.json'

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install dependencies
        working-directory: mobile
        run: npm ci

      - name: Setup Expo CLI
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Enable KVM group perms
        run: |
          echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
          sudo udevadm control --reload-rules
          sudo udevadm trigger --name-match=kvm

      - name: Cache Gradle
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
            mobile/apps/${{ matrix.app }}/android/.gradle
          key: ${{ runner.os }}-gradle-${{ hashFiles('mobile/apps/${{ matrix.app }}/android/gradle/wrapper/gradle-wrapper.properties') }}
          restore-keys: |
            ${{ runner.os }}-gradle-

      - name: Cache AVD
        uses: actions/cache@v4
        id: avd-cache
        with:
          path: |
            ~/.android/avd/*
            ~/.android/adb*
          key: avd-${{ matrix.api-level }}-harry-school

      - name: Create AVD and generate snapshot
        if: steps.avd-cache.outputs.cache-hit != 'true'
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: ${{ matrix.api-level }}
          target: google_apis
          arch: x86_64
          profile: Nexus 6
          cores: 2
          ram-size: 4096M
          heap-size: 512M
          emulator-options: -no-window -gpu swiftshader_indirect -noaudio -no-boot-anim -camera-back none
          disable-animations: true
          script: echo "Generated AVD snapshot for caching."

      - name: Build Android app for Detox
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          cd android
          ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug

      - name: Run Detox E2E tests (${{ matrix.test-suite }})
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: ${{ matrix.api-level }}
          target: google_apis
          arch: x86_64
          profile: Nexus 6
          cores: 2
          ram-size: 4096M
          heap-size: 512M
          emulator-options: -no-window -gpu swiftshader_indirect -noaudio -no-boot-anim -camera-back none
          disable-animations: true
          script: |
            cd mobile/apps/${{ matrix.app }}
            npx detox test \
              --configuration android.emu.debug \
              --testNamePattern="${{ matrix.test-suite }}" \
              --cleanup \
              --headless \
              --record-videos failing \
              --record-logs failing

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: android-e2e-artifacts-${{ matrix.app }}-api${{ matrix.api-level }}-${{ matrix.test-suite }}
          path: |
            mobile/apps/${{ matrix.app }}/e2e/artifacts/**
            mobile/apps/${{ matrix.app }}/detox_tests_log.txt

  android-islamic-e2e:
    name: Android Islamic Features E2E
    runs-on: ubuntu-latest
    timeout-minutes: 60
    strategy:
      matrix:
        app: [student, teacher]
        feature: [prayer-times, qibla-direction, islamic-calendar]
        
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'mobile/package-lock.json'

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Install dependencies
        working-directory: mobile
        run: npm ci

      - name: Setup Expo CLI
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Cache AVD
        uses: actions/cache@v4
        id: avd-cache
        with:
          path: |
            ~/.android/avd/*
            ~/.android/adb*
          key: avd-29-islamic-features

      - name: Build Android app
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          cd android
          ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug

      - name: Run Islamic features E2E tests
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 29
          target: google_apis
          arch: x86_64
          profile: Nexus 6
          disable-animations: true
          script: |
            cd mobile/apps/${{ matrix.app }}
            npx detox test \
              --configuration android.emu.debug \
              --testNamePattern="${{ matrix.feature }}" \
              --cleanup \
              --location="41.2995,69.2401" \
              --timezone="Asia/Tashkent"

      - name: Upload Islamic features artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: android-islamic-artifacts-${{ matrix.app }}-${{ matrix.feature }}
          path: mobile/apps/${{ matrix.app }}/e2e/artifacts/**
```

## 5. Performance Testing Pipeline

### `.github/workflows/mobile-performance.yml`

```yaml
name: Mobile Performance Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

env:
  NODE_VERSION: '18'
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

jobs:
  bundle-analysis:
    name: Bundle Size Analysis
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [student, teacher]
        
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'mobile/package-lock.json'

      - name: Install dependencies
        working-directory: mobile
        run: npm ci

      - name: Setup Expo CLI
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build production bundle
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npx expo export --platform all --output-dir dist
          
      - name: Analyze bundle size
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npx react-native-bundle-visualizer --format json --output bundle-analysis.json
          
      - name: Check bundle size limits
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          node ../../scripts/check-bundle-size.js \
            --app=${{ matrix.app }} \
            --max-size=500kb \
            --analysis=bundle-analysis.json

      - name: Upload bundle analysis
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.app }}-bundle-analysis
          path: mobile/apps/${{ matrix.app }}/bundle-analysis.json

  startup-performance:
    name: App Startup Performance
    runs-on: macos-latest
    strategy:
      matrix:
        app: [student, teacher]
        
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'mobile/package-lock.json'

      - name: Install dependencies
        working-directory: mobile
        run: npm ci

      - name: Setup Expo CLI
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install applesimutils
        run: |
          brew tap wix/brew
          brew install applesimutils

      - name: Build iOS app for performance testing
        working-directory: mobile/apps/${{ matrix.app }}
        run: npx detox build --configuration ios.sim.debug

      - name: Run startup performance tests
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npx detox test \
            --configuration ios.sim.debug \
            --testNamePattern="performance.*startup" \
            --cleanup \
            --headless

      - name: Extract performance metrics
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          node ../../scripts/extract-performance-metrics.js \
            --app=${{ matrix.app }} \
            --output=performance-metrics.json

      - name: Upload performance metrics
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.app }}-performance-metrics
          path: mobile/apps/${{ matrix.app }}/performance-metrics.json

  memory-profiling:
    name: Memory Usage Profiling
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [student, teacher]
        scenario: [normal-usage, heavy-usage, stress-test]
        
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'mobile/package-lock.json'

      - name: Install dependencies
        working-directory: mobile
        run: npm ci

      - name: Run memory profiling tests
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:performance:memory -- \
            --scenario=${{ matrix.scenario }} \
            --duration=300 \
            --ci

      - name: Generate memory report
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          node ../../scripts/generate-memory-report.js \
            --scenario=${{ matrix.scenario }} \
            --output=memory-report-${{ matrix.scenario }}.html

      - name: Upload memory reports
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.app }}-memory-report-${{ matrix.scenario }}
          path: mobile/apps/${{ matrix.app }}/memory-report-${{ matrix.scenario }}.html

  performance-summary:
    name: Performance Summary
    runs-on: ubuntu-latest
    needs: [bundle-analysis, startup-performance, memory-profiling]
    steps:
      - name: Download all performance artifacts
        uses: actions/download-artifact@v3

      - name: Generate performance dashboard
        run: |
          node scripts/generate-performance-dashboard.js \
            --input-dir=. \
            --output=performance-dashboard.html

      - name: Upload performance dashboard
        uses: actions/upload-artifact@v3
        with:
          name: performance-dashboard
          path: performance-dashboard.html

      - name: Comment PR with performance results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const summary = fs.readFileSync('performance-summary.md', 'utf8');
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: summary
            });
```

## 6. Security Testing Pipeline

### `.github/workflows/mobile-security.yml`

```yaml
name: Mobile Security Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'mobile/**'
  pull_request:
    branches: [main]
    paths:
      - 'mobile/**'
  schedule:
    - cron: '0 3 * * 1' # Weekly on Monday at 3 AM

env:
  NODE_VERSION: '18'

jobs:
  dependency-audit:
    name: Dependency Security Audit
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [student, teacher]
        
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'mobile/package-lock.json'

      - name: Install dependencies
        working-directory: mobile
        run: npm ci

      - name: Run npm audit
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm audit --audit-level high --json > npm-audit.json || true
          
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --file=mobile/apps/${{ matrix.app }}/package.json --json > snyk-results.json || true

      - name: Check for critical vulnerabilities
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          node ../../scripts/check-security-vulnerabilities.js \
            --npm-audit=npm-audit.json \
            --snyk-results=snyk-results.json \
            --app=${{ matrix.app }}

      - name: Upload security scan results
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.app }}-security-scan
          path: |
            mobile/apps/${{ matrix.app }}/npm-audit.json
            mobile/apps/${{ matrix.app }}/snyk-results.json

  secrets-scan:
    name: Secrets and Sensitive Data Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          path: mobile/
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --debug --only-verified

      - name: Run GitLeaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}

  auth-security-tests:
    name: Authentication Security Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [student, teacher]
        
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'mobile/package-lock.json'

      - name: Install dependencies
        working-directory: mobile
        run: npm ci

      - name: Run authentication security tests
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:security:auth -- \
            --runInBand \
            --ci

      - name: Run authorization tests
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:security:authorization -- \
            --runInBand \
            --ci

      - name: Test session management security
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:security:sessions -- \
            --runInBand \
            --ci

  data-protection-tests:
    name: Data Protection Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [student, teacher]
        
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'mobile/package-lock.json'

      - name: Install dependencies
        working-directory: mobile
        run: npm ci

      - name: Test data encryption
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:security:encryption -- \
            --runInBand \
            --ci

      - name: Test secure storage
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:security:storage -- \
            --runInBand \
            --ci

      - name: Test data transmission security
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:security:transmission -- \
            --runInBand \
            --ci

  privacy-compliance-tests:
    name: Privacy Compliance Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [student, teacher]
        
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'mobile/package-lock.json'

      - name: Install dependencies
        working-directory: mobile
        run: npm ci

      - name: Test GDPR compliance
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:privacy:gdpr -- \
            --runInBand \
            --ci

      - name: Test data minimization
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:privacy:minimization -- \
            --runInBand \
            --ci

      - name: Test student data protection (FERPA)
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          npm run test:privacy:ferpa -- \
            --runInBand \
            --ci

  security-summary:
    name: Security Summary
    runs-on: ubuntu-latest
    needs: [dependency-audit, secrets-scan, auth-security-tests, data-protection-tests, privacy-compliance-tests]
    steps:
      - name: Download all security artifacts
        uses: actions/download-artifact@v3

      - name: Generate security report
        run: |
          node scripts/generate-security-report.js \
            --input-dir=. \
            --output=security-report.html

      - name: Upload security report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-report.html

      - name: Check security status
        run: |
          if [ -f security-failures.txt ]; then
            echo "❌ Security vulnerabilities found:"
            cat security-failures.txt
            exit 1
          else
            echo "✅ All security checks passed"
          fi
```

## 7. Release Pipeline

### `.github/workflows/mobile-release.yml`

```yaml
name: Mobile Release Pipeline

on:
  push:
    tags:
      - 'mobile/v*'
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version'
        required: true
        type: string
      release_type:
        description: 'Release type'
        required: true
        type: choice
        options:
          - production
          - preview
          - internal

env:
  NODE_VERSION: '18'
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

jobs:
  pre-release-checks:
    name: Pre-release Checks
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
      
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Extract version
        id: version
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            VERSION="${{ github.event.inputs.version }}"
          else
            VERSION=${GITHUB_REF#refs/tags/mobile/v}
          fi
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Validate version format
        run: |
          if [[ ! "${{ steps.version.outputs.version }}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "❌ Invalid version format: ${{ steps.version.outputs.version }}"
            exit 1
          fi

      - name: Check changelog exists
        run: |
          if [ ! -f "mobile/CHANGELOG.md" ]; then
            echo "❌ CHANGELOG.md not found"
            exit 1
          fi
          
          if ! grep -q "${{ steps.version.outputs.version }}" mobile/CHANGELOG.md; then
            echo "❌ Version ${{ steps.version.outputs.version }} not found in CHANGELOG.md"
            exit 1
          fi

  build-release:
    name: Build Release
    runs-on: ubuntu-latest
    needs: pre-release-checks
    strategy:
      matrix:
        app: [student, teacher]
        platform: [android, ios]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'mobile/package-lock.json'

      - name: Install dependencies
        working-directory: mobile
        run: npm ci

      - name: Setup Expo CLI
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Update app version
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          node ../../scripts/update-app-version.js \
            --version=${{ needs.pre-release-checks.outputs.version }} \
            --platform=${{ matrix.platform }}

      - name: Build production app
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          PROFILE="production"
          if [ "${{ github.event.inputs.release_type }}" = "preview" ]; then
            PROFILE="preview"
          elif [ "${{ github.event.inputs.release_type }}" = "internal" ]; then
            PROFILE="internal"
          fi
          
          eas build \
            --platform ${{ matrix.platform }} \
            --profile $PROFILE \
            --non-interactive \
            --wait \
            --json > build-${{ matrix.platform }}.json

      - name: Extract build URLs
        working-directory: mobile/apps/${{ matrix.app }}
        run: |
          BUILD_URL=$(jq -r '.[] | select(.platform == "${{ matrix.platform }}") | .artifacts.buildUrl' build-${{ matrix.platform }}.json)
          echo "BUILD_URL=$BUILD_URL" >> $GITHUB_ENV
          echo "Build URL: $BUILD_URL"

      - name: Upload build metadata
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.app }}-${{ matrix.platform }}-build-metadata
          path: mobile/apps/${{ matrix.app }}/build-${{ matrix.platform }}.json

  create-release:
    name: Create GitHub Release
    runs-on: ubuntu-latest
    needs: [pre-release-checks, build-release]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build metadata
        uses: actions/download-artifact@v3

      - name: Extract changelog
        run: |
          VERSION="${{ needs.pre-release-checks.outputs.version }}"
          sed -n "/## \[$VERSION\]/,/## \[/p" mobile/CHANGELOG.md | head -n -1 > release-notes.md

      - name: Create release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: mobile/v${{ needs.pre-release-checks.outputs.version }}
          name: Mobile Release v${{ needs.pre-release-checks.outputs.version }}
          body_path: release-notes.md
          draft: false
          prerelease: ${{ github.event.inputs.release_type != 'production' }}
          files: |
            **/build-*.json

  notify-release:
    name: Notify Release
    runs-on: ubuntu-latest
    needs: [pre-release-checks, create-release]
    
    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: |
            🚀 Mobile Release v${{ needs.pre-release-checks.outputs.version }} is ready!
            
            📱 Student App: Available on App Store & Play Store
            👨‍🏫 Teacher App: Available on App Store & Play Store
            
            🔗 Release Notes: https://github.com/${{ github.repository }}/releases/tag/mobile/v${{ needs.pre-release-checks.outputs.version }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 8. Package.json Scripts Configuration

### Mobile Root `mobile/package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern='__tests__/.*\\.test\\.(ts|tsx)$'",
    "test:components": "jest --testPathPattern='components/.*\\.test\\.(ts|tsx)$'",
    "test:integration": "jest --testPathPattern='integration/.*\\.test\\.(ts|tsx)$'",
    "test:i18n": "jest --testPathPattern='i18n/.*\\.test\\.(ts|tsx)$'",
    "test:i18n-keys": "node scripts/validate-i18n-keys.js",
    "test:cultural-content": "jest --testPathPattern='cultural/.*\\.test\\.(ts|tsx)$'",
    "test:accessibility": "jest --testPathPattern='accessibility/.*\\.test\\.(ts|tsx)$'",
    "test:offline": "jest --testPathPattern='offline/.*\\.test\\.(ts|tsx)$'",
    "test:sync": "jest --testPathPattern='sync/.*\\.test\\.(ts|tsx)$'",
    "test:performance": "jest --testPathPattern='performance/.*\\.test\\.(ts|tsx)$'",
    "test:performance:memory": "node scripts/memory-profiler.js",
    "test:security:auth": "jest --testPathPattern='security/auth.*\\.test\\.(ts|tsx)$'",
    "test:security:authorization": "jest --testPathPattern='security/authorization.*\\.test\\.(ts|tsx)$'",
    "test:security:sessions": "jest --testPathPattern='security/sessions.*\\.test\\.(ts|tsx)$'",
    "test:security:encryption": "jest --testPathPattern='security/encryption.*\\.test\\.(ts|tsx)$'",
    "test:security:storage": "jest --testPathPattern='security/storage.*\\.test\\.(ts|tsx)$'",
    "test:security:transmission": "jest --testPathPattern='security/transmission.*\\.test\\.(ts|tsx)$'",
    "test:privacy:gdpr": "jest --testPathPattern='privacy/gdpr.*\\.test\\.(ts|tsx)$'",
    "test:privacy:minimization": "jest --testPathPattern='privacy/minimization.*\\.test\\.(ts|tsx)$'",
    "test:privacy:ferpa": "jest --testPathPattern='privacy/ferpa.*\\.test\\.(ts|tsx)$'",
    "test:coverage": "jest --coverage",
    "test:coverage-check": "jest --coverage --coverageThreshold='{\"global\":{\"branches\":90,\"functions\":90,\"lines\":90,\"statements\":90}}'",
    "test:watch": "jest --watch",
    "test:db:setup": "node scripts/setup-test-db.js",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "analyze:bundle": "npx react-native-bundle-visualizer",
    "security:scan": "npm audit && snyk test"
  }
}
```

### App-specific Scripts `mobile/apps/student/package.json`

```json
{
  "scripts": {
    "test:e2e:ios": "detox test --configuration ios.sim.debug",
    "test:e2e:android": "detox test --configuration android.emu.debug",
    "test:e2e:cultural": "detox test --configuration ios.sim.debug --testNamePattern='cultural'",
    "test:offline:attendance-offline": "jest --testPathPattern='offline/attendance.*\\.test\\.(ts|tsx)$'",
    "test:offline:lesson-progress": "jest --testPathPattern='offline/lesson-progress.*\\.test\\.(ts|tsx)$'",
    "test:offline:sync-conflicts": "jest --testPathPattern='offline/sync-conflicts.*\\.test\\.(ts|tsx)$'",
    "test:integration:auth": "jest --testPathPattern='integration/auth.*\\.test\\.(ts|tsx)$'",
    "test:integration:offline-sync": "jest --testPathPattern='integration/offline-sync.*\\.test\\.(ts|tsx)$'",
    "test:integration:data-flow": "jest --testPathPattern='integration/data-flow.*\\.test\\.(ts|tsx)$'",
    "test:prayer-times": "jest --testPathPattern='prayer-times.*\\.test\\.(ts|tsx)$'",
    "build:ios": "detox build --configuration ios.sim.debug",
    "build:android": "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug"
  }
}
```

## 9. Caching Strategy

### Dependency Caching

```yaml
# Node.js dependencies
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: mobile/node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('mobile/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

# CocoaPods cache
- name: Cache CocoaPods
  uses: actions/cache@v4
  with:
    path: mobile/apps/${{ matrix.app }}/ios/Pods
    key: ${{ runner.os }}-pods-${{ hashFiles('mobile/apps/${{ matrix.app }}/ios/Podfile.lock') }}
    restore-keys: |
      ${{ runner.os }}-pods-

# Gradle cache
- name: Cache Gradle
  uses: actions/cache@v4
  with:
    path: |
      ~/.gradle/caches
      ~/.gradle/wrapper
      mobile/apps/${{ matrix.app }}/android/.gradle
    key: ${{ runner.os }}-gradle-${{ hashFiles('mobile/apps/${{ matrix.app }}/android/gradle/wrapper/gradle-wrapper.properties') }}
    restore-keys: |
      ${{ runner.os }}-gradle-

# Detox builds cache
- name: Cache Detox builds
  uses: actions/cache@v4
  with:
    path: |
      mobile/apps/${{ matrix.app }}/ios/build
      ~/Library/Developer/Xcode/DerivedData
    key: ${{ runner.os }}-detox-${{ matrix.app }}-${{ hashFiles('mobile/apps/${{ matrix.app }}/ios/**/*.pbxproj') }}
    restore-keys: |
      ${{ runner.os }}-detox-${{ matrix.app }}-

# Android AVD cache
- name: Cache AVD
  uses: actions/cache@v4
  with:
    path: |
      ~/.android/avd/*
      ~/.android/adb*
    key: avd-${{ matrix.api-level }}-${{ runner.os }}
```

### Test Results Caching

```yaml
# Jest cache
- name: Cache Jest
  uses: actions/cache@v4
  with:
    path: mobile/apps/${{ matrix.app }}/.jest-cache
    key: ${{ runner.os }}-jest-${{ hashFiles('mobile/apps/${{ matrix.app }}/jest.config.js') }}

# Coverage cache
- name: Cache Coverage
  uses: actions/cache@v4
  with:
    path: mobile/apps/${{ matrix.app }}/coverage
    key: ${{ runner.os }}-coverage-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-coverage-
```

## 10. Optimization Strategies

### Parallel Execution

- **Test Sharding**: Unit tests split across 3 shards per app
- **Matrix Strategy**: Multiple apps, platforms, and test suites run in parallel
- **Conditional Execution**: Tests only run when relevant files change

### Build Optimization

- **Incremental Builds**: Cache build artifacts between runs
- **Selective Building**: Only build changed apps
- **Pre-built Images**: Use cached Android AVD snapshots

### Resource Management

- **Timeout Controls**: Prevent hanging tests
- **Concurrency Groups**: Cancel redundant workflows
- **Resource Limits**: Optimize runner usage

## 11. Quality Gates Configuration

### Required Checks for PR Approval

```yaml
required_status_checks:
  strict: true
  contexts:
    - "Lint & Type Check"
    - "Unit Tests"
    - "Component Tests"
    - "Integration Tests"
    - "Internationalization Tests"
    - "Accessibility Tests"
    - "Offline Tests"
    - "Build Validation"
    - "Coverage Validation"
    - "Quality Gates"
```

### Coverage Requirements

- **Unit Tests**: ≥90% coverage
- **Component Tests**: ≥85% coverage
- **Integration Tests**: ≥75% coverage
- **Overall Coverage**: ≥90% lines, functions, branches, statements

### Performance Benchmarks

- **App Startup**: <3 seconds
- **Bundle Size**: <500KB initial, <2MB total
- **Memory Usage**: <200MB baseline, <100MB growth
- **API Response**: <200ms average

## 12. Monitoring and Reporting

### Test Results Dashboard

- **Real-time Status**: Live test execution status
- **Historical Trends**: Test success rates over time
- **Performance Metrics**: Startup times, memory usage trends
- **Coverage Evolution**: Coverage improvements/regressions

### Notification Strategy

- **Slack Integration**: Real-time notifications for failures
- **PR Comments**: Automated test result summaries
- **Email Alerts**: Critical security vulnerabilities
- **Dashboard Updates**: Live metrics updates

## 13. Security & Compliance

### Secret Management

```yaml
secrets:
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
  SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
  CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

### Compliance Checks

- **GDPR**: Data protection validation
- **FERPA**: Student privacy compliance
- **OWASP**: Security vulnerability scanning
- **Accessibility**: WCAG 2.1 compliance

## 14. Troubleshooting Guide

### Common Issues and Solutions

#### Detox Tests Failing
```bash
# Clear Detox cache
npx detox clean-framework-cache
npx detox build --configuration ios.sim.debug

# Reset iOS simulator
xcrun simctl shutdown all
xcrun simctl erase all
```

#### Android Emulator Issues
```bash
# Kill existing emulators
adb kill-server
adb start-server

# Clean and restart emulator
avdmanager delete avd -n test_emulator
avdmanager create avd -n test_emulator -k "system-images;android-29;google_apis;x86_64"
```

#### Cache Issues
```bash
# Clear all caches
npm run clean
rm -rf node_modules
npm ci

# Clear specific caches
rm -rf .jest-cache
rm -rf coverage
```

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Use swap file on CI
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 15. Implementation Timeline

### Phase 1: Foundation (Week 1)
- [ ] Set up basic CI pipeline with linting and unit tests
- [ ] Configure caching for dependencies
- [ ] Implement test sharding for parallel execution

### Phase 2: Comprehensive Testing (Week 2)
- [ ] Add component and integration tests
- [ ] Implement i18n and cultural testing
- [ ] Set up accessibility testing

### Phase 3: E2E Testing (Week 3)
- [ ] Configure Detox for iOS and Android
- [ ] Set up Android emulator and iOS simulator
- [ ] Implement cultural E2E tests

### Phase 4: Performance & Security (Week 4)
- [ ] Add performance testing pipeline
- [ ] Implement security scanning
- [ ] Configure privacy compliance tests

### Phase 5: Release Automation (Week 5)
- [ ] Set up EAS Build integration
- [ ] Configure release pipeline
- [ ] Implement notification systems

## Conclusion

This comprehensive CI/CD pipeline configuration provides a robust foundation for testing and deploying the Harry School CRM mobile applications. The implementation emphasizes:

1. **Cultural Sensitivity**: Comprehensive testing of Islamic features and multi-language support
2. **Educational Focus**: Age-appropriate testing and student privacy compliance
3. **Offline-First**: Thorough validation of offline functionality and data synchronization
4. **Quality Assurance**: Multiple layers of testing with strict quality gates
5. **Performance**: Optimized for speed with intelligent caching and parallel execution
6. **Security**: Comprehensive security scanning and compliance validation

The pipeline supports the unique requirements of educational software while maintaining technical excellence and ensuring reliable deployments for both Student and Teacher applications.