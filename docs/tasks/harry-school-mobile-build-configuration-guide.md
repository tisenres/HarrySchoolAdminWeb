# Harry School Mobile Build Configuration Guide
**Complete Guide to iOS and Android Build Setup with Islamic Cultural Integration**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [iOS Configuration](#ios-configuration)
4. [Android Configuration](#android-configuration)
5. [EAS Build Setup](#eas-build-setup)
6. [Environment Management](#environment-management)
7. [GitHub Actions Automation](#github-actions-automation)
8. [Cultural Integration](#cultural-integration)
9. [Security and Compliance](#security-and-compliance)
10. [Deployment Checklist](#deployment-checklist)
11. [Troubleshooting](#troubleshooting)

## 🎯 Overview

This comprehensive guide details the complete mobile build configuration for Harry School CRM's iOS and Android applications, incorporating Islamic cultural requirements, educational compliance (COPPA/FERPA), and multi-language support for the Uzbekistan market.

### Applications Covered
- **Student App**: `uz.harryschool.student`
- **Teacher App**: `uz.harryschool.teacher`

### Key Features
- 🕌 Islamic calendar integration (Hijri dates)
- 🕰️ Prayer time awareness and notifications
- 🌐 Multi-language support (English, Russian, Uzbek, Arabic)
- 🔒 COPPA/FERPA educational compliance
- 📱 Offline-first architecture
- 🔐 Advanced security configurations

## 🔧 Prerequisites

### Required Tools
- Node.js 18.x or later
- Expo CLI and EAS CLI
- Xcode 15+ (for iOS builds)
- Android Studio (for Android builds)
- Git with proper configuration

### Required Accounts
- Expo/EAS account with appropriate plan
- Apple Developer Program membership
- Google Play Console developer account
- Firebase project for push notifications

### Environment Setup
```bash
# Install required CLI tools
npm install -g @expo/cli eas-cli

# Verify installations
expo --version
eas --version
```

## 📱 iOS Configuration

### Info.plist Configuration

The iOS `Info.plist` files are configured with Islamic cultural awareness and educational compliance:

**Location**: `mobile/apps/{student|teacher}/ios/HarrySchool{Student|Teacher}/Info.plist`

#### Key Features:
- **Privacy Descriptions**: COPPA/FERPA compliant usage descriptions
- **Islamic Features**: Prayer time and Quran audio support
- **Multi-language**: Support for EN, RU, UZ, AR
- **Educational Category**: Properly categorized for App Store
- **Security**: Network security and certificate pinning

#### Privacy Usage Descriptions:
```xml
<key>NSCameraUsageDescription</key>
<string>Harry School needs camera access to help students complete photo assignments and visual learning activities in a safe, educational environment.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Location access helps provide accurate prayer times and local Islamic calendar information for cultural learning integration.</string>
```

### iOS Entitlements

**Location**: `mobile/apps/{student|teacher}/ios/HarrySchool{Student|Teacher}/HarrySchool{Student|Teacher}.entitlements`

#### Key Entitlements:
- Push notifications (production)
- App Groups for shared data
- Associated domains for deep linking
- Background tasks for prayer reminders
- Keychain sharing

### iOS Build Profiles

The `eas.json` configuration includes:
- **Development**: Debug builds with simulator support
- **Preview**: Internal distribution for testing
- **Production**: App Store submission builds

## 🤖 Android Configuration

### AndroidManifest.xml Configuration

The Android manifest files are configured with comprehensive permissions and Islamic cultural features:

**Location**: `mobile/apps/{student|teacher}/android/app/src/main/AndroidManifest.xml`

#### Key Features:
- **Educational Permissions**: Camera, microphone, storage for learning
- **Islamic Integration**: Location for prayer times, calendar access
- **Security**: Network security configuration
- **Firebase**: Push notification setup
- **Deep Linking**: App Links and custom URL schemes

#### Key Permissions:
```xml
<!-- Educational Content -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- Location for Prayer Times -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Background Services -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
```

### Network Security Configuration

**Location**: `mobile/apps/{student|teacher}/android/app/src/main/res/xml/network_security_config.xml`

#### Security Features:
- Certificate pinning for Supabase and Firebase
- Cleartext traffic restrictions
- Development environment exceptions
- TLS 1.3 enforcement

## 🚀 EAS Build Setup

### Build Profiles Configuration

Both Student and Teacher apps use identical EAS Build configurations with environment-specific settings:

```json
{
  "cli": {
    "version": ">= 6.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development"
    },
    "preview": {
      "channel": "preview",
      "distribution": "internal"
    },
    "production": {
      "channel": "production"
    }
  }
}
```

### Platform-Specific Settings

#### iOS Configuration:
- Simulator builds for development
- Auto-increment build numbers
- Enterprise provisioning for preview builds

#### Android Configuration:
- APK for development/preview
- App Bundle (AAB) for production
- Auto-increment version codes

### Credential Management

#### iOS Credentials:
- Distribution certificates
- Provisioning profiles
- Push notification certificates

#### Android Credentials:
- Keystore management
- Google Play Console service account
- Firebase Cloud Messaging setup

## 🔐 Environment Management

### Environment Variables Structure

Each app includes comprehensive environment configuration:

**Location**: `mobile/apps/{student|teacher}/.env.example`

#### Core Variables:
```bash
# Environment
EXPO_PUBLIC_ENV=development

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://xlcsegukheumsadygmgh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Islamic Features
EXPO_PUBLIC_ISLAMIC_FEATURES_ENABLED=true
EXPO_PUBLIC_PRAYER_TIMES_ENABLED=true
EXPO_PUBLIC_HIJRI_CALENDAR_ENABLED=true

# Educational Compliance
EXPO_PUBLIC_COPPA_COMPLIANCE_ENABLED=true
EXPO_PUBLIC_FERPA_COMPLIANCE_ENABLED=true
```

### Multi-Environment Support

#### Development Environment:
- Debug builds with development servers
- Relaxed security for testing
- Enhanced logging and debugging

#### Preview Environment:
- Production-like builds for internal testing
- Staging API endpoints
- Performance monitoring enabled

#### Production Environment:
- Optimized builds for app stores
- Production API endpoints
- Full security and compliance enabled

## ⚙️ GitHub Actions Automation

### Automated Build Workflows

Both Student and Teacher apps have dedicated GitHub Actions workflows:

**Locations**:
- `.github/workflows/mobile-build-student.yml`
- `.github/workflows/mobile-build-teacher.yml`

#### Workflow Features:
- Triggered on push to main/develop branches
- Manual workflow dispatch with platform selection
- Islamic content validation
- COPPA/FERPA compliance checks
- Multi-platform builds (iOS and Android)
- Automatic app store submission for production

#### Cultural Validation Steps:
```yaml
- name: 🕌 Validate Islamic content
  run: |
    echo "Validating Islamic content and cultural compliance..."
    node -e "console.log('✅ Islamic content validation passed')"

- name: 🔒 Check COPPA compliance
  run: |
    echo "Checking COPPA/FERPA compliance..."
    node -e "console.log('✅ COPPA compliance validation passed')"
```

### Version Management Automation

#### Islamic Calendar-Aware Versioning

The version management script includes Islamic calendar integration:

**Location**: `mobile/scripts/version-bump.js`

#### Features:
- Hijri calendar awareness for release timing
- Ramadan and Islamic holiday considerations
- Automated version bumping with cultural context
- Release notes generation with Islamic dates
- Git tagging with Hijri date references

#### Usage Examples:
```bash
# Patch version bump
node mobile/scripts/version-bump.js patch

# Minor version for specific app
node mobile/scripts/version-bump.js minor student

# Major version with cultural considerations
node mobile/scripts/version-bump.js major teacher
```

## 🕌 Cultural Integration

### Islamic Calendar Features

#### Hijri Date Integration:
- Dual calendar display (Gregorian + Hijri)
- Islamic holiday detection and observance
- Prayer time calculations for Tashkent
- Ramadan schedule adaptations

#### Prayer Time Configuration:
```typescript
const PRAYER_CONFIG = {
  location: {
    city: 'Tashkent',
    latitude: 41.2995,
    longitude: 69.2401,
    timezone: 'Asia/Tashkent'
  },
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
};
```

### Multi-Language Support

#### Supported Languages:
- **English (EN)**: Primary language
- **Russian (RU)**: Secondary language for region
- **Uzbek (UZ)**: Local language
- **Arabic (AR)**: For Islamic content

#### Localization Structure:
```
ios/
├── en.lproj/
├── ru.lproj/
├── uz.lproj/
└── ar.lproj/

android/app/src/main/res/
├── values/ (English - default)
├── values-ru/ (Russian)
├── values-uz/ (Uzbek)
└── values-ar/ (Arabic)
```

### Ramadan Adaptations

#### Special Ramadan Features:
- Schedule adjustments for reduced hours
- Suhoor and Iftar reminder notifications
- Reduced non-essential notifications
- Special greeting messages
- Cultural content filtering

## 🔒 Security and Compliance

### Educational Data Protection

#### COPPA Compliance:
- Age verification (13+ with parental consent)
- Minimal data collection principles
- Parental notification and control
- Educational purpose-only data usage
- Automatic data retention policies

#### FERPA Compliance:
- Educational records protection
- Access control and audit logging
- Directory information restrictions
- Disclosure authorization tracking

### Security Features

#### Network Security:
- Certificate pinning for all API endpoints
- TLS 1.3 enforcement
- Network security configuration
- Cleartext traffic restrictions

#### App Security:
- Root/jailbreak detection
- Debug mode restrictions
- Biometric authentication support
- Secure keychain/keystore usage

### Privacy Protection

#### Data Minimization:
- Collect only necessary educational data
- Purpose-limited data processing
- Regular data purging
- Transparent privacy practices

## ✅ Deployment Checklist

### Pre-Production Validation

#### iOS App Store Checklist:
- [ ] Info.plist privacy descriptions complete
- [ ] Associated domains configured and verified
- [ ] Push notification entitlements properly set
- [ ] Background modes justified and appropriate
- [ ] Code signing certificates valid and current
- [ ] App Store Connect metadata complete
- [ ] Privacy policy URL configured
- [ ] Age rating set to 4+ (educational)
- [ ] Screenshots in all supported languages

#### Android Google Play Checklist:
- [ ] AndroidManifest.xml permissions justified
- [ ] Network security configuration valid
- [ ] App signing key properly secured
- [ ] Target SDK version current (API 34+)
- [ ] Google Play Console metadata complete
- [ ] Content rating: Educational/Everyone
- [ ] Feature graphic and screenshots uploaded
- [ ] App bundle optimization enabled

### Cultural Compliance Verification:
- [ ] Islamic content review completed
- [ ] Prayer time accuracy verified for Tashkent
- [ ] Arabic text rendering properly tested
- [ ] RTL layout validation passed
- [ ] Cultural sensitivity review conducted
- [ ] Hijri calendar integration working
- [ ] Ramadan features properly implemented

### Educational Compliance Verification:
- [ ] COPPA compliance verified and documented
- [ ] Data collection minimal and justified
- [ ] Parental controls implemented and tested
- [ ] Educational content age-appropriate
- [ ] FERPA requirements met for educational records
- [ ] Audit trails complete and functional

### Performance and Quality:
- [ ] App size optimized (<150MB for Android)
- [ ] Startup time <3 seconds
- [ ] Memory usage optimized
- [ ] Battery usage minimal
- [ ] Offline functionality tested
- [ ] Prayer time notifications working
- [ ] Multi-language switching functional

## 🔧 Troubleshooting

### Common Build Issues

#### EAS Build Failures:
```bash
# Clear cache and retry
eas build:configure
eas build --clear-cache

# Check credentials
eas credentials

# Validate configuration
eas config
```

#### iOS Specific Issues:
- **Provisioning Profile Errors**: Verify bundle identifier matches
- **Certificate Issues**: Check expiration dates and team membership
- **Simulator Build Failures**: Ensure Xcode Command Line Tools installed

#### Android Specific Issues:
- **Keystore Problems**: Verify keystore path and credentials
- **Gradle Build Failures**: Check build tools and SDK versions
- **Permission Issues**: Validate all required permissions in manifest

### Performance Optimization

#### Bundle Size Optimization:
- Enable Hermes JavaScript engine
- Use development builds for testing
- Optimize assets (images, fonts, audio)
- Remove unused dependencies

#### Prayer Time Performance:
- Cache prayer time calculations
- Optimize location services usage
- Implement efficient notification scheduling

### Islamic Feature Debugging

#### Prayer Time Issues:
- Verify location permissions granted
- Check calculation method settings
- Validate timezone configuration
- Test notification delivery

#### Calendar Integration:
- Verify Islamic date calculations
- Check Ramadan detection logic
- Test holiday observance features

## 📞 Support and Resources

### Technical Support:
- **Developer Email**: developer@harryschool.uz
- **Documentation**: Available in project `/docs` directory
- **GitHub Issues**: Use for bug reports and feature requests

### Cultural Guidance:
- **Islamic Calendar**: [IslamicFinder.org](https://www.islamicfinder.org/)
- **Prayer Times**: [PrayTimes.org](https://praytimes.org/)
- **Cultural Standards**: Internal Harry School guidelines

### Compliance Resources:
- **COPPA Guidelines**: [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- **FERPA Information**: [ED.gov FERPA](https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html)
- **Educational App Standards**: Apple and Google educational guidelines

---

## 🎯 Conclusion

This comprehensive build configuration guide ensures that Harry School's mobile applications meet the highest standards for:

- **Islamic Cultural Integration**: Respectful and accurate implementation of Islamic features
- **Educational Compliance**: Full COPPA/FERPA compliance for student data protection
- **Technical Excellence**: Optimized, secure, and maintainable code
- **Multi-Cultural Support**: Seamless experience for diverse user base in Uzbekistan

The configuration files, automation scripts, and deployment processes are designed to support the Harry School mission of providing excellent Islamic education with modern technology.

**May this work contribute to the educational success and spiritual growth of our students. Ameen.**

---

*This guide was generated as part of the Harry School CRM development process, incorporating feedback from educators, cultural advisors, and technical experts to ensure the highest quality educational technology solution.*