# Expo Official Documentation - Harry School Project Reference

*Comprehensive guide extracted from https://docs.expo.dev/ for Harry School CRM mobile apps*

## 🚀 Development Workflow

### Starting Development
```bash
# Start the development server
npx expo start

# Development server options
npx expo start --tunnel    # Use tunnel for connection issues
npx expo start --android   # Open on Android
npx expo start --ios       # Open on iOS
npx expo start --web       # Open in web browser
```

### Key Development Commands
```bash
# Create new Expo project
npx create-expo-app@latest ProjectName

# Install dependencies
npx expo install package-name

# Run on specific platforms
npx expo run:android
npx expo run:ios
```

## 🏗️ EAS Build Service

### What is EAS Build?
EAS Build is a hosted service for building app binaries for Expo and React Native projects.

### Key Features:
- **Automated Build Process**: Simplifies app binary creation
- **Credentials Management**: Handles app signing automatically
- **Cross-Platform**: Supports Android, iOS, and web
- **Team Collaboration**: Easy build sharing
- **Integration**: Works with EAS Submit for app store submissions

### Build Configuration (`eas.json`)
```json
{
  "cli": {
    "version": ">= 3.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build Commands
```bash
# Configure EAS Build
npx eas build:configure

# Build for specific platform
npx eas build --platform android
npx eas build --platform ios
npx eas build --platform all

# Build and submit automatically
npx eas build --platform all --auto-submit

# List builds
npx eas build:list

# Check build status
npx eas build:view [BUILD_ID]
```

## 📱 App Versioning

### Version Types
1. **User-facing version**: Visible in app stores (`version`)
2. **Build version**: Internal tracking (`android.versionCode`, `ios.buildNumber`)

### Version Source Options

#### Remote Version Source (Recommended)
```json
{
  "cli": {
    "appVersionSource": "remote"
  }
}
```
- EAS servers manage build versions
- Automatic increment
- No local file modifications needed

#### Local Version Source
```json
{
  "cli": {
    "appVersionSource": "local"
  }
}
```
- Versions controlled in project files
- Manual version management
- Requires commits for version changes

### Best Practices
- Use remote version source for build versions
- Manually update user-facing versions for releases
- Use `Application.nativeApplicationVersion` for display
- Use `Application.nativeBuildVersion` for debugging

## 🔧 Project Configuration

### Essential Files

#### `app.json` / `app.config.js`
```json
{
  "expo": {
    "name": "Harry School Student",
    "slug": "harry-school-student",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#1d7452"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "uz.harryschool.student"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1d7452"
      },
      "package": "uz.harryschool.student"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

#### `package.json` Scripts
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  }
}
```

## 📦 EAS Submit (App Store Submission)

### Submission Commands
```bash
# Submit to app stores
npx eas submit --platform android
npx eas submit --platform ios
npx eas submit --platform all

# Submit specific build
npx eas submit --platform android --latest
npx eas submit --platform ios --id BUILD_ID
```

### Submission Requirements

#### iOS Requirements
- Apple Developer account
- App Store Connect configuration
- App-specific password (for automation)
- Valid provisioning profiles

#### Android Requirements
- Google Play Console account
- Google Service Account JSON
- App signing key configuration

## 🛠️ Development Best Practices

### 1. Project Structure
```
harry-school-student/
├── app/                 # File-based routing
├── assets/             # Images, icons, fonts
├── components/         # Reusable UI components
├── constants/          # App constants
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
├── app.json           # Expo configuration
├── eas.json           # EAS Build configuration
└── package.json       # Dependencies
```

### 2. Development Workflow
1. `npx expo start` - Start development server
2. Scan QR code or press 'a'/'i' for emulators
3. Edit code - changes auto-reload
4. Test on multiple platforms
5. Build with EAS when ready

### 3. Environment Management
```javascript
// Use environment variables
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

// Access in app.config.js
export default {
  expo: {
    extra: {
      apiUrl: process.env.API_URL,
    },
  },
};
```

### 4. Asset Management
- Use `./assets/` for static assets
- Optimize images for mobile
- Use appropriate formats (PNG for icons, JPG for photos)
- Consider different screen densities

## 🔐 Credentials Management

### Automatic Credentials
```bash
# Let EAS manage credentials
npx eas credentials

# For Android keystore
npx eas credentials --platform android

# For iOS certificates
npx eas credentials --platform ios
```

### Manual Credentials
- Upload existing keystores/certificates
- Configure signing manually
- Use for enterprise or specific requirements

## 📊 Monitoring and Analytics

### Build Monitoring
```bash
# Check build status
npx eas build:list

# View specific build
npx eas build:view BUILD_ID

# Monitor logs
npx eas build:view --logs BUILD_ID
```

### App Analytics
- Use Expo Analytics for usage tracking
- Implement crash reporting
- Monitor performance metrics
- Track user engagement

## 🚨 Troubleshooting Common Issues

### Development Issues
1. **Connection Problems**
   - Use `--tunnel` flag
   - Check Wi-Fi network
   - Restart Metro bundler

2. **Build Failures**
   - Check `eas.json` configuration
   - Verify credentials
   - Review build logs
   - Check platform-specific requirements

3. **Submission Issues**
   - Validate app store requirements
   - Check bundle identifiers
   - Verify signing certificates
   - Review app store guidelines

### Performance Optimization
- Use development builds for debugging
- Optimize images and assets
- Implement proper error boundaries
- Use lazy loading for components

## 📚 Additional Resources

### Official Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Reference](https://docs.expo.dev/build/introduction/)
- [EAS Submit Reference](https://docs.expo.dev/submit/introduction/)
- [App Store Guidelines](https://docs.expo.dev/distribution/app-stores/)

### Community Resources
- [Expo Discord](https://chat.expo.dev/)
- [GitHub Repository](https://github.com/expo/expo)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

### Harry School Specific Notes
- Use Islamic color scheme (#1d7452)
- Implement multi-language support (EN/RU/UZ/AR)
- Follow COPPA/FERPA compliance requirements
- Integrate with Supabase backend
- Support offline-first functionality

---

*This documentation serves as the primary reference for Expo development in the Harry School CRM project. Always refer to the official Expo documentation for the latest updates and detailed information.*

*Last Updated: 2025-08-22*
*Project: Harry School CRM Mobile Apps*