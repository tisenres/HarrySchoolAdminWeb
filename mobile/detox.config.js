/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.debug.student': {
      type: 'ios.app',
      binaryPath: 'apps/student/ios/build/Build/Products/Debug-iphonesimulator/student.app',
      build: 'xcodebuild -workspace apps/student/ios/student.xcworkspace -scheme student -configuration Debug -sdk iphonesimulator -derivedDataPath apps/student/ios/build'
    },
    'ios.release.student': {
      type: 'ios.app',
      binaryPath: 'apps/student/ios/build/Build/Products/Release-iphonesimulator/student.app',
      build: 'xcodebuild -workspace apps/student/ios/student.xcworkspace -scheme student -configuration Release -sdk iphonesimulator -derivedDataPath apps/student/ios/build'
    },
    'android.debug.student': {
      type: 'android.apk',
      binaryPath: 'apps/student/android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd apps/student/android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug'
    },
    'android.release.student': {
      type: 'android.apk',
      binaryPath: 'apps/student/android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd apps/student/android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
    },
    'ios.debug.teacher': {
      type: 'ios.app',
      binaryPath: 'apps/teacher/ios/build/Build/Products/Debug-iphonesimulator/teacher.app',
      build: 'xcodebuild -workspace apps/teacher/ios/teacher.xcworkspace -scheme teacher -configuration Debug -sdk iphonesimulator -derivedDataPath apps/teacher/ios/build'
    },
    'ios.release.teacher': {
      type: 'ios.app',
      binaryPath: 'apps/teacher/ios/build/Build/Products/Release-iphonesimulator/teacher.app',
      build: 'xcodebuild -workspace apps/teacher/ios/teacher.xcworkspace -scheme teacher -configuration Release -sdk iphonesimulator -derivedDataPath apps/teacher/ios/build'
    },
    'android.debug.teacher': {
      type: 'android.apk',
      binaryPath: 'apps/teacher/android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd apps/teacher/android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug'
    },
    'android.release.teacher': {
      type: 'android.apk',
      binaryPath: 'apps/teacher/android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd apps/teacher/android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro'
      }
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_34'
      }
    }
  },
  configurations: {
    'ios.sim.debug.student': {
      device: 'simulator',
      app: 'ios.debug.student'
    },
    'ios.sim.release.student': {
      device: 'simulator',
      app: 'ios.release.student'
    },
    'android.emu.debug.student': {
      device: 'emulator',
      app: 'android.debug.student'
    },
    'android.emu.release.student': {
      device: 'emulator',
      app: 'android.release.student'
    },
    'ios.sim.debug.teacher': {
      device: 'simulator',
      app: 'ios.debug.teacher'
    },
    'ios.sim.release.teacher': {
      device: 'simulator',
      app: 'ios.release.teacher'
    },
    'android.emu.debug.teacher': {
      device: 'emulator',
      app: 'android.debug.teacher'
    },
    'android.emu.release.teacher': {
      device: 'emulator',
      app: 'android.release.teacher'
    }
  }
};