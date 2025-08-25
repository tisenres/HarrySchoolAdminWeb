# Mobile Build Configuration Architecture: iOS & Android
Agent: mobile-developer
Date: 2025-01-22T10:15:00Z

## Executive Summary

This document provides comprehensive iOS and Android build configuration specifications for Harry School CRM mobile applications (Student and Teacher apps), incorporating educational compliance (COPPA/FERPA), Islamic cultural requirements, and multi-language support for the Uzbekistan market.

## Configuration Overview

### Platform Requirements Matrix

| Configuration Category | iOS Requirements | Android Requirements |
|------------------------|------------------|---------------------|
| **Privacy Compliance** | Info.plist privacy descriptions | Runtime permissions + manifest |
| **Push Notifications** | APNs entitlements + certificates | FCM + notification channels |
| **Cultural Integration** | Background audio for Quran | Prayer time services + widgets |
| **Multi-language** | Localization bundles | String resources (res/values-*) |
| **Deep Linking** | URL schemes + universal links | Intent filters + App Links |
| **Offline Capabilities** | Background app refresh | Background services + sync |
| **Educational Compliance** | COPPA data protection | Educational data encryption |

## iOS Configuration Architecture

### Info.plist Configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- App Identity -->
    <key>CFBundleDisplayName</key>
    <string>Harry School Student</string>
    <key>CFBundleIdentifier</key>
    <string>uz.harryschool.student</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    
    <!-- Privacy Descriptions (COPPA/FERPA Compliant) -->
    <key>NSCameraUsageDescription</key>
    <string>Harry School needs camera access to help students complete photo assignments and visual learning activities in a safe, educational environment.</string>
    
    <key>NSMicrophoneUsageDescription</key>
    <string>Microphone access enables students to practice pronunciation, record audio responses, and participate in speaking exercises as part of their educational curriculum.</string>
    
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Photo library access allows students to upload homework images and share educational content as part of their learning activities.</string>
    
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Location access helps provide accurate prayer times and local Islamic calendar information for cultural learning integration.</string>
    
    <key>NSUserNotificationsUsageDescription</key>
    <string>Notifications help students stay updated with class schedules, assignment reminders, and important educational announcements.</string>
    
    <key>NSAppleMusicUsageDescription</key>
    <string>Media library access enables educational audio content and Quran recitation features for Islamic studies.</string>
    
    <key>NSCalendarsUsageDescription</key>
    <string>Calendar access helps students manage their study schedule and track Islamic holidays and prayer times.</string>
    
    <!-- Network and Data Privacy -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
        <key>NSExceptionDomains</key>
        <dict>
            <key>supabase.co</key>
            <dict>
                <key>NSExceptionRequiresForwardSecrecy</key>
                <false/>
                <key>NSExceptionMinimumTLSVersion</key>
                <string>TLSv1.2</string>
                <key>NSIncludesSubdomains</key>
                <true/>
            </dict>
        </dict>
    </dict>
    
    <!-- Background Modes -->
    <key>UIBackgroundModes</key>
    <array>
        <string>background-fetch</string>
        <string>background-processing</string>
        <string>remote-notification</string>
        <string>audio</string> <!-- For Quran recitation -->
    </array>
    
    <!-- Push Notification Entitlements -->
    <key>aps-environment</key>
    <string>production</string>
    
    <!-- URL Schemes -->
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLName</key>
            <string>uz.harryschool.student</string>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>harryschool</string>
                <string>harry-student</string>
            </array>
        </dict>
    </array>
    
    <!-- Universal Links -->
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:app.harryschool.uz</string>
        <string>applinks:student.harryschool.uz</string>
    </array>
    
    <!-- Supported Languages -->
    <key>CFBundleLocalizations</key>
    <array>
        <string>en</string>
        <string>ru</string>
        <string>uz</string>
        <string>ar</string> <!-- For Islamic content -->
    </array>
    
    <!-- Educational App Category -->
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.education</string>
    
    <!-- Age Rating (Educational content) -->
    <key>ITSAppUsesNonExemptEncryption</key>
    <false/>
    
    <!-- Cultural Integration -->
    <key>NSAllowsArbitraryLoadsInWebContent</key>
    <false/>
    
    <!-- COPPA Compliance -->
    <key>NSUserActivityTypes</key>
    <array>
        <string>uz.harryschool.student.lesson</string>
        <string>uz.harryschool.student.homework</string>
        <string>uz.harryschool.student.vocabulary</string>
    </array>
</dict>
</plist>
```

### iOS Entitlements Configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Push Notifications -->
    <key>aps-environment</key>
    <string>production</string>
    
    <!-- App Groups (for widget support) -->
    <key>com.apple.security.application-groups</key>
    <array>
        <string>group.uz.harryschool.shared</string>
    </array>
    
    <!-- Associated Domains -->
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:app.harryschool.uz</string>
        <string>applinks:student.harryschool.uz</string>
    </array>
    
    <!-- Background Processing -->
    <key>com.apple.developer.background-tasks</key>
    <array>
        <string>uz.harryschool.student.sync</string>
        <string>uz.harryschool.student.prayer-reminder</string>
    </array>
    
    <!-- Keychain Sharing -->
    <key>keychain-access-groups</key>
    <array>
        <string>$(AppIdentifierPrefix)uz.harryschool.shared</string>
    </array>
</dict>
</plist>
```

## Android Configuration Architecture

### AndroidManifest.xml Configuration

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="uz.harryschool.student">

    <!-- Network and Internet Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Camera and Media Permissions (Educational Content) -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
        android:maxSdkVersion="28" />
    
    <!-- Push Notifications -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
    
    <!-- Location for Prayer Times -->
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    
    <!-- Background Services -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
    
    <!-- Calendar Integration -->
    <uses-permission android:name="android.permission.READ_CALENDAR" />
    <uses-permission android:name="android.permission.WRITE_CALENDAR" />
    
    <!-- Audio Playback (Quran Recitation) -->
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    
    <!-- App Features -->
    <uses-feature 
        android:name="android.hardware.camera" 
        android:required="false" />
    <uses-feature 
        android:name="android.hardware.camera.autofocus" 
        android:required="false" />
    <uses-feature 
        android:name="android.hardware.microphone" 
        android:required="false" />
    <uses-feature 
        android:name="android.hardware.location" 
        android:required="false" />
    <uses-feature 
        android:name="android.hardware.location.gps" 
        android:required="false" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/AppTheme"
        android:allowBackup="false"
        android:usesCleartextTraffic="false"
        android:networkSecurityConfig="@xml/network_security_config"
        android:requestLegacyExternalStorage="false"
        android:extractNativeLibs="false"
        tools:targetApi="31">

        <!-- Main Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:windowSoftInputMode="adjustResize"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
            android:screenOrientation="portrait">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Deep Linking -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="harryschool" />
                <data android:scheme="harry-student" />
            </intent-filter>
            
            <!-- App Links -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https"
                      android:host="app.harryschool.uz" />
                <data android:scheme="https"
                      android:host="student.harryschool.uz" />
            </intent-filter>
        </activity>

        <!-- Firebase Cloud Messaging -->
        <service
            android:name=".firebase.HarrySchoolFirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>

        <!-- Background Sync Service -->
        <service
            android:name=".services.OfflineSyncService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="dataSync" />

        <!-- Prayer Time Service -->
        <service
            android:name=".services.PrayerTimeService"
            android:enabled="true"
            android:exported="false" />

        <!-- Boot Receiver -->
        <receiver
            android:name=".receivers.BootCompletedReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

        <!-- Notification Receiver -->
        <receiver
            android:name=".receivers.NotificationReceiver"
            android:enabled="true"
            android:exported="false" />

        <!-- File Provider (COPPA compliant) -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="uz.harryschool.student.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

        <!-- Firebase Configuration -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/notification_color" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="harry_school_general" />

        <!-- Expo Configuration -->
        <meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="https://u.expo.dev/xlcsegukheumsadygmgh" />
        <meta-data android:name="expo.modules.updates.EXPO_UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY" android:value="expo-channel-name" />
        <meta-data android:name="expo.modules.updates.EXPO_UPDATES_CONFIGURATION_REQUEST_HEADERS_VALUE" android:value="production" />
        <meta-data android:name="expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS" android:value="0" />

        <!-- App Restrictions (COPPA Compliance) -->
        <meta-data
            android:name="android.content.APP_RESTRICTIONS"
            android:resource="@xml/app_restrictions" />

    </application>
</manifest>
```

### Android Network Security Configuration

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">supabase.co</domain>
        <domain includeSubdomains="true">xlcsegukheumsadygmgh.supabase.co</domain>
        <domain includeSubdomains="true">harryschool.uz</domain>
        <domain includeSubdomains="true">firebaseapp.com</domain>
        <domain includeSubdomains="true">googleapis.com</domain>
        
        <pin-set expiration="2026-01-01">
            <pin digest="SHA-256">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</pin>
            <pin digest="SHA-256">BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=</pin>
        </pin-set>
    </domain-config>
    
    <!-- Allow cleartext for development -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.1.0/24</domain>
    </domain-config>
</network-security-config>
```

## EAS Build Configuration Updates

### Student App eas.json

```json
{
  "cli": {
    "version": ">= 6.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "ios": {
        "simulator": true,
        "buildConfiguration": "Debug"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      },
      "env": {
        "EXPO_PUBLIC_ENV": "development",
        "EXPO_PUBLIC_SUPABASE_URL": "$DEV_SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$DEV_SUPABASE_ANON_KEY",
        "EXPO_PUBLIC_OPENAI_API_KEY": "$DEV_OPENAI_API_KEY"
      }
    },
    "preview": {
      "channel": "preview",
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release",
        "enterpriseProvisioning": "adhoc"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "env": {
        "EXPO_PUBLIC_ENV": "preview",
        "EXPO_PUBLIC_SUPABASE_URL": "$STAGING_SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$STAGING_SUPABASE_ANON_KEY",
        "EXPO_PUBLIC_OPENAI_API_KEY": "$STAGING_OPENAI_API_KEY"
      }
    },
    "production": {
      "channel": "production",
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "EXPO_PUBLIC_ENV": "production",
        "EXPO_PUBLIC_SUPABASE_URL": "$PRODUCTION_SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$PRODUCTION_SUPABASE_ANON_KEY",
        "EXPO_PUBLIC_OPENAI_API_KEY": "$PRODUCTION_OPENAI_API_KEY"
      }
    },
    "production-ios": {
      "extends": "production",
      "ios": {
        "buildConfiguration": "Release",
        "autoIncrement": "buildNumber"
      }
    },
    "production-android": {
      "extends": "production",
      "android": {
        "buildType": "app-bundle",
        "autoIncrement": "versionCode"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "teacher@harryschool.uz",
        "ascAppId": "6448123456",
        "appleTeamId": "ABCD123456"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

## Multi-language Support Configuration

### iOS Localization Structure

```
ios/
├── en.lproj/
│   ├── Localizable.strings
│   ├── InfoPlist.strings
│   └── LaunchScreen.storyboard
├── ru.lproj/
│   ├── Localizable.strings
│   ├── InfoPlist.strings
│   └── LaunchScreen.storyboard
├── uz.lproj/
│   ├── Localizable.strings
│   ├── InfoPlist.strings
│   └── LaunchScreen.storyboard
└── ar.lproj/
    ├── Localizable.strings
    ├── InfoPlist.strings
    └── LaunchScreen.storyboard
```

### Android String Resources Structure

```
android/app/src/main/res/
├── values/
│   ├── strings.xml (English - default)
│   ├── colors.xml
│   └── styles.xml
├── values-ru/
│   └── strings.xml (Russian)
├── values-uz/
│   └── strings.xml (Uzbek Latin)
├── values-ar/
│   └── strings.xml (Arabic)
└── values-night/
    ├── colors.xml
    └── styles.xml
```

## Cultural Integration Architecture

### Islamic Calendar Integration

```typescript
// Islamic calendar and cultural features
export const ISLAMIC_FEATURES = {
  calendar: {
    enabled: true,
    displayFormat: 'gregorian_islamic', // Show both calendars
    locale: 'uz', // Primary locale for Islamic dates
    calculation: {
      method: 'MWL', // Muslim World League
      adjustments: {
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0
      }
    }
  },
  
  prayerTimes: {
    enabled: true,
    location: {
      city: 'Tashkent',
      latitude: 41.2995,
      longitude: 69.2401,
      timezone: 'Asia/Tashkent'
    },
    notifications: {
      beforeMinutes: [10, 5],
      categories: ['harry_school_cultural'],
      sounds: {
        default: 'prayer_reminder',
        adhan: 'adhan_tashkent' // Optional Adhan sound
      }
    },
    display: {
      showInDashboard: true,
      showNextPrayer: true,
      format24Hour: false
    }
  },
  
  ramadan: {
    adaptations: {
      scheduleAdjustments: true, // Adjust class times during Ramadan
      suhoorReminder: {
        enabled: true,
        minutesBeforeFajr: 30
      },
      iftarReminder: {
        enabled: true,
        minutesBeforeMaghrib: 15
      },
      specialGreetings: true,
      reducedNotifications: true // Reduce non-essential notifications
    }
  },
  
  islamicHolidays: {
    observance: [
      {
        name: 'eid_al_fitr',
        durationDays: 3,
        classAdjustments: 'suspended',
        specialContent: true
      },
      {
        name: 'eid_al_adha',
        durationDays: 4,
        classAdjustments: 'suspended',
        specialContent: true
      },
      {
        name: 'ramadan',
        durationDays: 30,
        classAdjustments: 'modified',
        specialContent: true
      }
    ]
  },
  
  contentFiltering: {
    enabled: true,
    guidelines: {
      imageModesty: true,
      languageAppropriate: true,
      culturalSensitivity: true,
      religiousRespect: true
    }
  }
};
```

## Security and Compliance Configuration

### COPPA/FERPA Compliance Settings

```typescript
// Educational data protection configuration
export const EDUCATIONAL_COMPLIANCE = {
  coppa: {
    enabled: true,
    ageVerification: {
      required: true,
      minimumAge: 13,
      parentalConsentRequired: true
    },
    dataCollection: {
      minimal: true,
      educationalPurposeOnly: true,
      parentalNotification: true,
      optOutAvailable: true
    },
    dataRetention: {
      automaticDeletion: true,
      retentionPeriod: '7years', // Educational records retention
      graduationCleanup: true
    }
  },
  
  ferpa: {
    enabled: true,
    directoryInformation: {
      restricted: true,
      parentalControl: true
    },
    educationalRecords: {
      accessControl: 'strict',
      auditLogging: true,
      encryptionRequired: true
    },
    disclosure: {
      authorized_officials_only: true,
      emergency_exceptions: true,
      audit_trail: true
    }
  },
  
  dataProtection: {
    encryption: {
      atRest: 'AES-256',
      inTransit: 'TLS-1.3',
      keyManagement: 'HSM'
    },
    access: {
      roleBasedAccess: true,
      principleOfLeastPrivilege: true,
      regularAudit: true
    },
    monitoring: {
      dataAccessLogging: true,
      anomalyDetection: true,
      complianceReporting: true
    }
  }
};
```

## Build Automation Scripts

### iOS Build Script

```bash
#!/bin/bash
# ios-build.sh - iOS build automation for Harry School apps

set -e

APP_NAME=$1
BUILD_TYPE=$2
ENVIRONMENT=$3

if [ -z "$APP_NAME" ] || [ -z "$BUILD_TYPE" ] || [ -z "$ENVIRONMENT" ]; then
    echo "Usage: ./ios-build.sh [student|teacher] [development|preview|production] [dev|staging|prod]"
    exit 1
fi

echo "🍎 Building iOS app: $APP_NAME ($BUILD_TYPE - $ENVIRONMENT)"

# Navigate to app directory
cd "mobile/apps/$APP_NAME"

# Set environment variables
export EXPO_PUBLIC_ENV=$ENVIRONMENT

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run pre-build checks
echo "🔍 Running pre-build checks..."
npx expo doctor

# Cultural content validation
echo "🕌 Validating cultural content..."
node scripts/validate-islamic-content.js

# COPPA compliance check
echo "🔒 Checking COPPA compliance..."
node scripts/check-coppa-compliance.js

# Build the app
echo "🚀 Starting EAS build..."
case $BUILD_TYPE in
    "development")
        npx eas build --platform ios --profile development --non-interactive
        ;;
    "preview")
        npx eas build --platform ios --profile preview --non-interactive
        ;;
    "production")
        npx eas build --platform ios --profile production-ios --non-interactive
        ;;
    *)
        echo "Invalid build type: $BUILD_TYPE"
        exit 1
        ;;
esac

echo "✅ iOS build completed for $APP_NAME"
```

### Android Build Script

```bash
#!/bin/bash
# android-build.sh - Android build automation for Harry School apps

set -e

APP_NAME=$1
BUILD_TYPE=$2
ENVIRONMENT=$3

if [ -z "$APP_NAME" ] || [ -z "$BUILD_TYPE" ] || [ -z "$ENVIRONMENT" ]; then
    echo "Usage: ./android-build.sh [student|teacher] [development|preview|production] [dev|staging|prod]"
    exit 1
fi

echo "🤖 Building Android app: $APP_NAME ($BUILD_TYPE - $ENVIRONMENT)"

# Navigate to app directory
cd "mobile/apps/$APP_NAME"

# Set environment variables
export EXPO_PUBLIC_ENV=$ENVIRONMENT

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run pre-build checks
echo "🔍 Running pre-build checks..."
npx expo doctor

# Validate Arabic/RTL support
echo "🌐 Validating RTL support..."
node scripts/validate-rtl-support.js

# Prayer time configuration check
echo "🕌 Checking prayer time configuration..."
node scripts/validate-prayer-config.js

# Build the app
echo "🚀 Starting EAS build..."
case $BUILD_TYPE in
    "development")
        npx eas build --platform android --profile development --non-interactive
        ;;
    "preview")
        npx eas build --platform android --profile preview --non-interactive
        ;;
    "production")
        npx eas build --platform android --profile production-android --non-interactive
        ;;
    *)
        echo "Invalid build type: $BUILD_TYPE"
        exit 1
        ;;
esac

echo "✅ Android build completed for $APP_NAME"
```

## Performance Optimization Configuration

### Bundle Optimization

```typescript
// Performance configuration
export const PERFORMANCE_CONFIG = {
  bundleOptimization: {
    codesplitting: {
      enabled: true,
      strategy: 'route-based',
      culturalContentSeparation: true
    },
    treeshaking: {
      enabled: true,
      preserveIslamicContent: true
    },
    compression: {
      gzip: true,
      brotli: true
    }
  },
  
  assetOptimization: {
    images: {
      webp: true,
      responsive: true,
      culturalImages: {
        optimization: 'careful', // Preserve cultural sensitivity
        formats: ['webp', 'jpg']
      }
    },
    fonts: {
      subset: true,
      arabicSupport: true,
      cyrillicSupport: true
    },
    audio: {
      compression: 'lossless', // For Quran recitation
      formats: ['m4a', 'mp3']
    }
  },
  
  caching: {
    strategy: 'stale-while-revalidate',
    islamicContent: {
      longTermCache: true,
      prayerTimes: 'daily-update',
      quranAudio: 'persistent'
    }
  }
};
```

## Deployment Validation Checklist

### Pre-Production Checklist

```markdown
## iOS Deployment Checklist

### App Store Compliance
- [ ] App Store Connect metadata complete
- [ ] Privacy policy URL configured
- [ ] Age rating set to 4+ (educational)
- [ ] Educational category selected
- [ ] Screenshots in all supported languages
- [ ] App preview videos (optional)

### Technical Requirements
- [ ] Info.plist privacy descriptions complete
- [ ] Associated domains configured
- [ ] Push notification entitlements
- [ ] Background modes justified
- [ ] Code signing certificates valid
- [ ] Provisioning profiles updated

### Cultural Compliance
- [ ] Islamic content review complete
- [ ] Prayer time accuracy verified
- [ ] Arabic text rendering tested
- [ ] RTL layout validation
- [ ] Cultural sensitivity review

### Educational Compliance
- [ ] COPPA compliance verified
- [ ] Data collection minimal
- [ ] Parental controls implemented
- [ ] Educational content appropriate
- [ ] Age-appropriate design

## Android Deployment Checklist

### Google Play Compliance
- [ ] Google Play Console metadata complete
- [ ] Privacy policy URL configured
- [ ] Content rating: Educational/Everyone
- [ ] Educational category selected
- [ ] Screenshots in all supported languages
- [ ] Feature graphic uploaded

### Technical Requirements
- [ ] AndroidManifest.xml permissions justified
- [ ] Network security config valid
- [ ] App signing key secure
- [ ] Target SDK version current
- [ ] ProGuard rules configured

### Cultural Features
- [ ] Notification channels configured
- [ ] Islamic calendar integration
- [ ] Prayer time notifications
- [ ] Multi-language resources
- [ ] Cultural content validation

### Performance
- [ ] APK/AAB size optimized (<150MB)
- [ ] Startup time <3 seconds
- [ ] Memory usage optimized
- [ ] Battery usage minimal
- [ ] Offline functionality tested
```

## References and Documentation

### Technical Documentation
- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Firebase Setup](https://rnfirebase.io/)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/guidelines/)
- [Google Play Console Policies](https://play.google.com/about/developer-content-policy/)
- [COPPA Compliance Guide](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)

### Cultural and Religious Resources
- [Islamic Calendar Calculations](https://www.islamicfinder.org/)
- [Prayer Time Calculation Methods](https://praytimes.org/manual)
- [Arabic Typography Guidelines](https://arabictypography.com/)
- [Islamic Content Guidelines](https://islamic-content-guidelines.org/)

### Security Standards
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [App Security Best Practices](https://developer.android.com/topic/security/best-practices)
- [iOS Security Guide](https://support.apple.com/guide/security/)

This comprehensive mobile build configuration architecture provides the foundation for deploying culturally-aware, educationally-compliant, and technically robust Harry School mobile applications on both iOS and Android platforms.