import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Types
export interface DeviceFingerprint {
  deviceId: string;
  deviceName: string;
  platform: string;
  version: string;
  model: string;
  brand: string;
  hash: string;
  createdAt: number;
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  deviceId: string;
  userId?: string;
  details: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
  };
  networkInfo?: {
    type: string;
    isConnected: boolean;
    ipAddress?: string;
  };
}

export type SecurityEventType = 
  | 'DEVICE_TRUST_ESTABLISHED'
  | 'DEVICE_TRUST_REVOKED'
  | 'BIOMETRIC_ENABLED'
  | 'BIOMETRIC_DISABLED'
  | 'PIN_SETUP'
  | 'PIN_CHANGED'
  | 'FAILED_BIOMETRIC_ATTEMPT'
  | 'FAILED_PIN_ATTEMPT'
  | 'SUSPICIOUS_ACTIVITY_DETECTED'
  | 'MULTIPLE_FAILED_ATTEMPTS'
  | 'SESSION_HIJACK_ATTEMPT'
  | 'DEVICE_COMPROMISE_DETECTED'
  | 'OFFLINE_AUTH_ENABLED'
  | 'OFFLINE_AUTH_USED'
  | 'TOKEN_ENCRYPTION_FAILED'
  | 'SECURE_STORAGE_BREACH'
  | 'NETWORK_SECURITY_WARNING'
  | 'ROOT_DETECTION'
  | 'DEBUG_MODE_DETECTED'
  | 'EMULATOR_DETECTED';

export interface SecurityConfiguration {
  enableDeviceFingerprinting: boolean;
  enableBiometricFallback: boolean;
  maxFailedAttempts: number;
  sessionTimeout: number;
  requireSecureNetwork: boolean;
  enableRootDetection: boolean;
  enableEmulatorDetection: boolean;
  enableDebugDetection: boolean;
  logSecurityEvents: boolean;
  encryptStoredTokens: boolean;
}

export interface TokenEncryption {
  encryptedData: string;
  iv: string;
  salt: string;
  algorithm: string;
}

export interface NetworkSecurityInfo {
  isSecure: boolean;
  isVPN: boolean;
  isProxyDetected: boolean;
  networkType: string;
  warnings: string[];
}

/**
 * Enhanced Security Manager for mobile authentication
 * Provides device fingerprinting, security monitoring, and threat detection
 */
export class MobileSecurityManager {
  private static readonly STORAGE_KEYS = {
    DEVICE_FINGERPRINT: 'security:device_fingerprint',
    SECURITY_EVENTS: 'security:events',
    SECURITY_CONFIG: 'security:config',
    DEVICE_TRUST_LEVEL: 'security:trust_level',
    THREAT_INDICATORS: 'security:threats',
    ENCRYPTION_KEY: 'security:encryption_key',
  };

  private static readonly DEFAULT_CONFIG: SecurityConfiguration = {
    enableDeviceFingerprinting: true,
    enableBiometricFallback: true,
    maxFailedAttempts: 5,
    sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours
    requireSecureNetwork: false,
    enableRootDetection: true,
    enableEmulatorDetection: true,
    enableDebugDetection: true,
    logSecurityEvents: true,
    encryptStoredTokens: true,
  };

  private configuration: SecurityConfiguration;
  private deviceFingerprint: DeviceFingerprint | null = null;
  private securityEventListeners: Set<(event: SecurityEvent) => void> = new Set();
  private threatDetectionActive = false;

  constructor(config?: Partial<SecurityConfiguration>) {
    this.configuration = { ...MobileSecurityManager.DEFAULT_CONFIG, ...config };
    this.initializeSecurity();
  }

  // Initialization
  private async initializeSecurity(): Promise<void> {
    try {
      // Generate or load device fingerprint
      await this.generateDeviceFingerprint();
      
      // Load security configuration
      await this.loadSecurityConfiguration();
      
      // Start threat detection if enabled
      if (this.configuration.enableRootDetection || 
          this.configuration.enableEmulatorDetection || 
          this.configuration.enableDebugDetection) {
        await this.startThreatDetection();
      }

      // Clean up old security events
      await this.cleanupSecurityEvents();

    } catch (error) {
      console.error('Security manager initialization failed:', error);
      await this.logSecurityEvent('SECURITY_INIT_FAILED', 'critical', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Device Fingerprinting
  async generateDeviceFingerprint(): Promise<DeviceFingerprint> {
    try {
      if (this.deviceFingerprint) {
        return this.deviceFingerprint;
      }

      // Load existing fingerprint
      const stored = await SecureStore.getItemAsync(
        MobileSecurityManager.STORAGE_KEYS.DEVICE_FINGERPRINT
      );

      if (stored) {
        this.deviceFingerprint = JSON.parse(stored);
        return this.deviceFingerprint;
      }

      // Generate new fingerprint
      const deviceInfo = {
        deviceName: Device.deviceName || 'Unknown Device',
        platform: Platform.OS,
        version: Platform.Version.toString(),
        model: Device.modelName || 'Unknown Model',
        brand: Device.brand || 'Unknown Brand',
      };

      // Create unique device ID
      const deviceString = JSON.stringify(deviceInfo) + Date.now();
      const deviceId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        deviceString
      );

      // Create fingerprint hash
      const fingerprintData = `${deviceId}-${deviceInfo.platform}-${deviceInfo.version}`;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fingerprintData
      );

      this.deviceFingerprint = {
        deviceId,
        deviceName: deviceInfo.deviceName,
        platform: deviceInfo.platform,
        version: deviceInfo.version,
        model: deviceInfo.model,
        brand: deviceInfo.brand,
        hash,
        createdAt: Date.now(),
      };

      // Store securely
      await SecureStore.setItemAsync(
        MobileSecurityManager.STORAGE_KEYS.DEVICE_FINGERPRINT,
        JSON.stringify(this.deviceFingerprint)
      );

      await this.logSecurityEvent('DEVICE_FINGERPRINT_CREATED', 'low', {
        deviceId: this.deviceFingerprint.deviceId,
        platform: this.deviceFingerprint.platform,
      });

      return this.deviceFingerprint;

    } catch (error) {
      console.error('Device fingerprint generation failed:', error);
      throw new Error('Failed to generate device fingerprint');
    }
  }

  async getDeviceFingerprint(): Promise<DeviceFingerprint> {
    if (!this.deviceFingerprint) {
      return await this.generateDeviceFingerprint();
    }
    return this.deviceFingerprint;
  }

  async validateDeviceFingerprint(expectedFingerprint: DeviceFingerprint): Promise<boolean> {
    try {
      const currentFingerprint = await this.getDeviceFingerprint();
      
      // Compare critical fields
      const isValid = (
        currentFingerprint.deviceId === expectedFingerprint.deviceId &&
        currentFingerprint.platform === expectedFingerprint.platform &&
        currentFingerprint.hash === expectedFingerprint.hash
      );

      if (!isValid) {
        await this.logSecurityEvent('DEVICE_FINGERPRINT_MISMATCH', 'high', {
          expected: expectedFingerprint.deviceId,
          actual: currentFingerprint.deviceId,
        });
      }

      return isValid;
    } catch (error) {
      await this.logSecurityEvent('DEVICE_FINGERPRINT_VALIDATION_FAILED', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Token Encryption
  async encryptToken(token: string): Promise<TokenEncryption> {
    try {
      if (!this.configuration.encryptStoredTokens) {
        throw new Error('Token encryption is disabled');
      }

      // Generate encryption key if not exists
      let encryptionKey = await SecureStore.getItemAsync(
        MobileSecurityManager.STORAGE_KEYS.ENCRYPTION_KEY
      );

      if (!encryptionKey) {
        encryptionKey = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${Date.now()}-${Math.random()}-${this.deviceFingerprint?.deviceId}`
        );
        await SecureStore.setItemAsync(
          MobileSecurityManager.STORAGE_KEYS.ENCRYPTION_KEY,
          encryptionKey
        );
      }

      // Generate salt and IV
      const salt = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${encryptionKey}-${Date.now()}`
      );

      const iv = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${salt}-${Date.now()}`
      );

      // Simple XOR encryption (in production, use proper AES encryption)
      const encryptedData = this.xorEncrypt(token, encryptionKey + salt);

      return {
        encryptedData,
        iv: iv.substring(0, 16), // Use first 16 chars as IV
        salt: salt.substring(0, 16), // Use first 16 chars as salt
        algorithm: 'XOR-SHA256',
      };

    } catch (error) {
      await this.logSecurityEvent('TOKEN_ENCRYPTION_FAILED', 'high', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Token encryption failed');
    }
  }

  async decryptToken(encryptedToken: TokenEncryption): Promise<string> {
    try {
      const encryptionKey = await SecureStore.getItemAsync(
        MobileSecurityManager.STORAGE_KEYS.ENCRYPTION_KEY
      );

      if (!encryptionKey) {
        throw new Error('Encryption key not found');
      }

      // Reconstruct decryption key
      const decryptionKey = encryptionKey + encryptedToken.salt;

      // Decrypt using XOR
      const decryptedData = this.xorEncrypt(encryptedToken.encryptedData, decryptionKey);

      return decryptedData;

    } catch (error) {
      await this.logSecurityEvent('TOKEN_DECRYPTION_FAILED', 'high', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Token decryption failed');
    }
  }

  private xorEncrypt(data: string, key: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result); // Base64 encode
  }

  // Biometric Security
  async validateBiometricSecurity(): Promise<{
    isAvailable: boolean;
    isEnrolled: boolean;
    supportedTypes: LocalAuthentication.AuthenticationType[];
    securityLevel: 'none' | 'weak' | 'strong';
    warnings: string[];
  }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      let securityLevel: 'none' | 'weak' | 'strong' = 'none';
      const warnings: string[] = [];

      if (!hasHardware) {
        warnings.push('Biometric hardware not available');
      } else if (!isEnrolled) {
        warnings.push('No biometric data enrolled');
      } else if (supportedTypes.length === 0) {
        warnings.push('No biometric authentication methods available');
      } else {
        // Determine security level based on supported types
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) ||
            supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          securityLevel = 'strong';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          securityLevel = 'strong';
        } else {
          securityLevel = 'weak';
          warnings.push('Only weak biometric authentication available');
        }
      }

      return {
        isAvailable: hasHardware,
        isEnrolled,
        supportedTypes,
        securityLevel,
        warnings,
      };

    } catch (error) {
      await this.logSecurityEvent('BIOMETRIC_VALIDATION_FAILED', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        isAvailable: false,
        isEnrolled: false,
        supportedTypes: [],
        securityLevel: 'none',
        warnings: ['Biometric validation failed'],
      };
    }
  }

  // Network Security
  async validateNetworkSecurity(): Promise<NetworkSecurityInfo> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      
      const securityInfo: NetworkSecurityInfo = {
        isSecure: false,
        isVPN: false,
        isProxyDetected: false,
        networkType: networkState.type,
        warnings: [],
      };

      // Check if network is secure (HTTPS/encrypted)
      if (networkState.type === 'WIFI') {
        // In a real app, you'd check if WiFi is using WPA2/WPA3
        securityInfo.isSecure = true; // Assume secure for demo
      } else if (networkState.type === 'CELLULAR') {
        securityInfo.isSecure = true; // Cellular is generally secure
      } else {
        securityInfo.warnings.push('Unknown network type detected');
      }

      // Check for VPN (simplified detection)
      // In a real app, you'd use more sophisticated VPN detection
      if (Platform.OS === 'ios') {
        // iOS VPN detection would require native module
        securityInfo.isVPN = false;
      } else {
        // Android VPN detection would require native module
        securityInfo.isVPN = false;
      }

      // Check for proxy (simplified)
      // Real implementation would check system proxy settings
      securityInfo.isProxyDetected = false;

      // Add warnings based on configuration
      if (this.configuration.requireSecureNetwork && !securityInfo.isSecure) {
        securityInfo.warnings.push('Insecure network detected');
      }

      if (!networkState.isConnected) {
        securityInfo.warnings.push('No network connection');
      }

      return securityInfo;

    } catch (error) {
      await this.logSecurityEvent('NETWORK_SECURITY_CHECK_FAILED', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        isSecure: false,
        isVPN: false,
        isProxyDetected: false,
        networkType: 'unknown',
        warnings: ['Network security check failed'],
      };
    }
  }

  // Threat Detection
  private async startThreatDetection(): Promise<void> {
    if (this.threatDetectionActive) {
      return;
    }

    this.threatDetectionActive = true;

    try {
      // Check for root/jailbreak
      if (this.configuration.enableRootDetection) {
        await this.detectRootAccess();
      }

      // Check for emulator
      if (this.configuration.enableEmulatorDetection) {
        await this.detectEmulator();
      }

      // Check for debug mode
      if (this.configuration.enableDebugDetection) {
        await this.detectDebugMode();
      }

    } catch (error) {
      console.error('Threat detection failed:', error);
      await this.logSecurityEvent('THREAT_DETECTION_FAILED', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async detectRootAccess(): Promise<void> {
    try {
      // Simplified root detection
      // In a real app, you'd use a proper root detection library
      
      let isRooted = false;
      const rootIndicators: string[] = [];

      if (Platform.OS === 'android') {
        // Check for common root apps/files
        // This is a simplified check - real implementation would be more comprehensive
        isRooted = false; // Placeholder
      } else if (Platform.OS === 'ios') {
        // Check for jailbreak indicators
        // This would require native iOS code
        isRooted = false; // Placeholder
      }

      if (isRooted) {
        await this.logSecurityEvent('ROOT_DETECTION', 'critical', {
          platform: Platform.OS,
          indicators: rootIndicators,
        });
      }

    } catch (error) {
      console.error('Root detection failed:', error);
    }
  }

  private async detectEmulator(): Promise<void> {
    try {
      let isEmulator = false;
      const emulatorIndicators: string[] = [];

      // Check device properties that indicate emulator
      if (Platform.OS === 'android') {
        const brand = Device.brand?.toLowerCase();
        const model = Device.modelName?.toLowerCase();
        
        if (brand === 'google' && model?.includes('sdk')) {
          isEmulator = true;
          emulatorIndicators.push('Android SDK emulator detected');
        }
      } else if (Platform.OS === 'ios') {
        // iOS Simulator detection
        if (Device.isDevice === false) {
          isEmulator = true;
          emulatorIndicators.push('iOS Simulator detected');
        }
      }

      if (isEmulator) {
        await this.logSecurityEvent('EMULATOR_DETECTED', 'high', {
          platform: Platform.OS,
          indicators: emulatorIndicators,
        });
      }

    } catch (error) {
      console.error('Emulator detection failed:', error);
    }
  }

  private async detectDebugMode(): Promise<void> {
    try {
      if (__DEV__) {
        await this.logSecurityEvent('DEBUG_MODE_DETECTED', 'medium', {
          platform: Platform.OS,
          isDevelopment: true,
        });
      }
    } catch (error) {
      console.error('Debug mode detection failed:', error);
    }
  }

  // Security Event Logging
  async logSecurityEvent(
    type: SecurityEventType,
    severity: SecurityEvent['severity'],
    details: Record<string, any>,
    userId?: string
  ): Promise<void> {
    if (!this.configuration.logSecurityEvents) {
      return;
    }

    try {
      const deviceFingerprint = await this.getDeviceFingerprint();
      const networkInfo = await Network.getNetworkStateAsync();

      const event: SecurityEvent = {
        id: await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${type}-${Date.now()}-${Math.random()}`
        ),
        type,
        severity,
        timestamp: Date.now(),
        deviceId: deviceFingerprint.deviceId,
        userId,
        details,
        networkInfo: {
          type: networkInfo.type,
          isConnected: networkInfo.isConnected,
        },
      };

      // Store event
      await this.storeSecurityEvent(event);

      // Notify listeners
      this.securityEventListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Security event listener error:', error);
        }
      });

      // Log critical events to console in development
      if (__DEV__ && severity === 'critical') {
        console.warn('[SecurityManager] Critical security event:', event);
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private async storeSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Get existing events
      const stored = await AsyncStorage.getItem(
        MobileSecurityManager.STORAGE_KEYS.SECURITY_EVENTS
      );
      
      const events: SecurityEvent[] = stored ? JSON.parse(stored) : [];
      events.push(event);

      // Keep only last 500 events
      const limitedEvents = events.slice(-500);

      await AsyncStorage.setItem(
        MobileSecurityManager.STORAGE_KEYS.SECURITY_EVENTS,
        JSON.stringify(limitedEvents)
      );

    } catch (error) {
      console.error('Failed to store security event:', error);
    }
  }

  async getSecurityEvents(
    limit: number = 50,
    severityFilter?: SecurityEvent['severity']
  ): Promise<SecurityEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(
        MobileSecurityManager.STORAGE_KEYS.SECURITY_EVENTS
      );
      
      let events: SecurityEvent[] = stored ? JSON.parse(stored) : [];

      // Filter by severity if specified
      if (severityFilter) {
        events = events.filter(event => event.severity === severityFilter);
      }

      // Return most recent events first
      return events.slice(-limit).reverse();

    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  }

  private async cleanupSecurityEvents(): Promise<void> {
    try {
      const events = await this.getSecurityEvents(1000); // Get all events
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      // Keep only events from last 30 days
      const recentEvents = events.filter(event => event.timestamp > thirtyDaysAgo);
      
      await AsyncStorage.setItem(
        MobileSecurityManager.STORAGE_KEYS.SECURITY_EVENTS,
        JSON.stringify(recentEvents)
      );

    } catch (error) {
      console.error('Security events cleanup failed:', error);
    }
  }

  // Configuration Management
  private async loadSecurityConfiguration(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(
        MobileSecurityManager.STORAGE_KEYS.SECURITY_CONFIG
      );
      
      if (stored) {
        const storedConfig = JSON.parse(stored);
        this.configuration = { ...this.configuration, ...storedConfig };
      }
    } catch (error) {
      console.error('Failed to load security configuration:', error);
    }
  }

  async updateSecurityConfiguration(
    updates: Partial<SecurityConfiguration>
  ): Promise<void> {
    try {
      this.configuration = { ...this.configuration, ...updates };
      
      await AsyncStorage.setItem(
        MobileSecurityManager.STORAGE_KEYS.SECURITY_CONFIG,
        JSON.stringify(this.configuration)
      );

      await this.logSecurityEvent('SECURITY_CONFIG_UPDATED', 'low', {
        updates: Object.keys(updates),
      });

    } catch (error) {
      console.error('Failed to update security configuration:', error);
      throw error;
    }
  }

  getSecurityConfiguration(): SecurityConfiguration {
    return { ...this.configuration };
  }

  // Event Listeners
  addEventListener(listener: (event: SecurityEvent) => void): () => void {
    this.securityEventListeners.add(listener);
    return () => this.securityEventListeners.delete(listener);
  }

  // Cleanup
  cleanup(): void {
    this.threatDetectionActive = false;
    this.securityEventListeners.clear();
  }
}

// Singleton instance
let securityManagerInstance: MobileSecurityManager | null = null;

export const getSecurityManager = (
  config?: Partial<SecurityConfiguration>
): MobileSecurityManager => {
  if (!securityManagerInstance) {
    securityManagerInstance = new MobileSecurityManager(config);
  }
  return securityManagerInstance;
};

export default MobileSecurityManager;