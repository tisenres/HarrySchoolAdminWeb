/**
 * Educational Device Trust and Session Management
 * Harry School Mobile Apps
 * 
 * Specialized device trust system for educational environments
 * Handles shared devices, institutional oversight, and student safety
 */

import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { EducationalDataEncryption } from './enhanced-encryption';

export type DeviceOwnership = 'personal' | 'shared' | 'institutional' | 'unknown';
export type DeviceTrustLevel = 'untrusted' | 'basic' | 'trusted' | 'verified' | 'institutional';
export type SessionType = 'individual' | 'supervised' | 'group' | 'exam' | 'demo';
export type UserRole = 'student' | 'teacher' | 'admin' | 'guest';

export interface EducationalDeviceProfile {
  deviceId: string;
  deviceName: string;
  platform: string;
  ownership: DeviceOwnership;
  trustLevel: DeviceTrustLevel;
  organizationId: string;
  
  // Device characteristics
  screenSize: { width: number; height: number };
  memoryInfo?: any;
  storageInfo?: any;
  batteryLevel?: number;
  
  // Network and location context
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  };
  networkHistory: NetworkInfo[];
  
  // Educational context
  isSchoolDevice: boolean;
  schoolNetwork: boolean;
  supervisedMode: boolean;
  allowedUsers: string[]; // User IDs allowed on this device
  
  // Security tracking
  securityFingerprint: string;
  lastSecurityScan: string;
  complianceStatus: 'compliant' | 'warning' | 'violation';
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Audit trail
  createdAt: string;
  lastUsed: string;
  usageCount: number;
  lastUserSessions: UserSession[];
}

export interface UserSession {
  sessionId: string;
  userId: string;
  userRole: UserRole;
  sessionType: SessionType;
  deviceId: string;
  
  // Session timing
  startTime: string;
  endTime?: string;
  duration?: number;
  lastActivity: string;
  
  // Security context
  authenticationMethod: 'password' | 'pin' | 'biometric' | 'sso' | 'supervised';
  ipAddress: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  
  // Educational context
  supervisorId?: string; // For supervised sessions
  groupId?: string; // For group sessions
  examMode: boolean;
  restrictedMode: boolean;
  
  // Data access
  dataAccessed: string[]; // Types of data accessed during session
  actionsPerformed: string[]; // Actions performed during session
  
  // Compliance and audit
  complianceViolations: ComplianceViolation[];
  privacyEvents: PrivacyEvent[];
  
  // Session termination
  terminationReason?: 'user_logout' | 'timeout' | 'admin_force' | 'security_violation' | 'device_lost';
  cleanupPerformed: boolean;
}

export interface NetworkInfo {
  type: string;
  ssid?: string;
  ipAddress?: string;
  timestamp: string;
  trusted: boolean;
  schoolNetwork: boolean;
}

export interface ComplianceViolation {
  id: string;
  timestamp: string;
  violationType: 'data_access' | 'time_limit' | 'location' | 'sharing' | 'content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolved: boolean;
  resolutionNotes?: string;
}

export interface PrivacyEvent {
  id: string;
  timestamp: string;
  eventType: 'data_view' | 'data_export' | 'data_share' | 'data_delete' | 'consent_change';
  dataType: string;
  userId: string;
  details: Record<string, any>;
}

export interface DeviceTrustPolicy {
  organizationId: string;
  
  // Trust requirements
  minimumTrustLevel: DeviceTrustLevel;
  requireBiometric: boolean;
  requirePIN: boolean;
  allowSharedDevices: boolean;
  allowPersonalDevices: boolean;
  
  // Session policies
  maxSessionDuration: number; // milliseconds
  idleTimeout: number; // milliseconds
  requireSupervisionUnder13: boolean;
  examModeEnabled: boolean;
  
  // Security policies
  requireLocationServices: boolean;
  allowedNetworks: string[]; // SSIDs
  blockedNetworks: string[]; // SSIDs
  requireSchoolNetwork: boolean;
  
  // Data policies
  dataRetentionDays: number;
  autoCleanupEnabled: boolean;
  encryptStoredData: boolean;
  
  // Audit requirements
  auditAllSessions: boolean;
  notifyParentsOfAccess: boolean; // For under-13 students
  reportViolations: boolean;
}

/**
 * Educational Device Trust Manager
 * Specialized for school environments with shared devices
 */
export class EducationalDeviceTrust {
  private static readonly STORAGE_KEYS = {
    DEVICE_PROFILE: 'edu_device_profile',
    TRUST_POLICY: 'edu_trust_policy',
    ACTIVE_SESSIONS: 'edu_active_sessions',
    SESSION_HISTORY: 'edu_session_history',
    COMPLIANCE_LOG: 'edu_compliance_log',
  };

  private deviceProfile: EducationalDeviceProfile | null = null;
  private trustPolicy: DeviceTrustPolicy | null = null;
  private activeSessions: Map<string, UserSession> = new Map();

  constructor(private organizationId: string) {
    this.initializeDeviceTrust();
  }

  /**
   * Initialize device trust with educational policies
   */
  private async initializeDeviceTrust(): Promise<void> {
    try {
      // Load or create device profile
      this.deviceProfile = await this.loadOrCreateDeviceProfile();
      
      // Load trust policy
      this.trustPolicy = await this.loadTrustPolicy();
      
      // Load active sessions
      await this.loadActiveSessions();
      
      // Perform initial security scan
      await this.performSecurityScan();
      
      // Set up session monitoring
      this.startSessionMonitoring();

    } catch (error) {
      console.error('Device trust initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create new user session with educational controls
   */
  async createUserSession(
    userId: string,
    userRole: UserRole,
    sessionType: SessionType,
    authenticationMethod: string,
    supervisorId?: string
  ): Promise<UserSession> {
    try {
      // Validate device trust level
      if (!this.deviceProfile || !this.trustPolicy) {
        throw new Error('Device trust not properly initialized');
      }

      // Check if device is allowed for this user
      await this.validateDeviceAccess(userId, userRole);

      // Check trust level requirements
      if (this.deviceProfile.trustLevel < this.mapTrustLevel(this.trustPolicy.minimumTrustLevel)) {
        throw new Error(`Device trust level ${this.deviceProfile.trustLevel} insufficient`);
      }

      // Get current network and location
      const networkState = await Network.getNetworkStateAsync();
      const location = await this.getCurrentLocation();

      // Create session
      const session: UserSession = {
        sessionId: `${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        userId,
        userRole,
        sessionType,
        deviceId: this.deviceProfile.deviceId,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        authenticationMethod: authenticationMethod as any,
        ipAddress: await this.getIPAddress(),
        location,
        supervisorId,
        examMode: sessionType === 'exam',
        restrictedMode: this.shouldEnableRestrictedMode(userRole, sessionType),
        dataAccessed: [],
        actionsPerformed: [],
        complianceViolations: [],
        privacyEvents: [],
        cleanupPerformed: false,
      };

      // Validate session against policies
      await this.validateSessionPolicies(session);

      // Store session
      this.activeSessions.set(session.sessionId, session);
      await this.storeActiveSessions();

      // Log session start
      await this.logComplianceEvent('SESSION_STARTED', session);

      // Set up session timeout
      this.setupSessionTimeout(session.sessionId);

      // Update device usage
      this.deviceProfile.lastUsed = new Date().toISOString();
      this.deviceProfile.usageCount++;
      await this.storeDeviceProfile();

      return session;

    } catch (error) {
      console.error('Session creation failed:', error);
      throw error;
    }
  }

  /**
   * Validate device access for specific user
   */
  private async validateDeviceAccess(userId: string, userRole: UserRole): Promise<void> {
    if (!this.deviceProfile || !this.trustPolicy) {
      throw new Error('Device profile not available');
    }

    // Check if device allows this user
    if (this.deviceProfile.allowedUsers.length > 0 && 
        !this.deviceProfile.allowedUsers.includes(userId)) {
      throw new Error('User not authorized for this device');
    }

    // Check ownership restrictions
    if (this.deviceProfile.ownership === 'personal' && userRole !== 'student') {
      // Personal devices should only be used by their owner
      // This would need additional verification logic
    }

    // Check shared device policies
    if (this.deviceProfile.ownership === 'shared' && !this.trustPolicy.allowSharedDevices) {
      throw new Error('Shared devices not allowed by policy');
    }

    // Check for concurrent sessions on shared devices
    if (this.deviceProfile.ownership === 'shared') {
      const activeUserSessions = Array.from(this.activeSessions.values())
        .filter(session => session.userId !== userId);
      
      if (activeUserSessions.length > 0) {
        // End previous sessions on shared device
        await this.cleanupSharedDeviceSessions(userId);
      }
    }

    // Location validation for institutional devices
    if (this.deviceProfile.isSchoolDevice && this.trustPolicy.requireLocationServices) {
      const location = await this.getCurrentLocation();
      if (!location || !await this.isLocationOnSchoolPremises(location)) {
        throw new Error('Device must be used on school premises');
      }
    }
  }

  /**
   * Validate session against educational policies
   */
  private async validateSessionPolicies(session: UserSession): Promise<void> {
    if (!this.trustPolicy) return;

    // Check supervision requirements for minors
    if (this.trustPolicy.requireSupervisionUnder13) {
      // This would need age information from user profile
      // For now, assume we need to check if supervision is required
    }

    // Check network restrictions
    const networkState = await Network.getNetworkStateAsync();
    if (this.trustPolicy.requireSchoolNetwork && !this.deviceProfile?.schoolNetwork) {
      throw new Error('Must be connected to school network');
    }

    // Validate against blocked networks
    if (networkState.type === 'WIFI' && this.trustPolicy.blockedNetworks.length > 0) {
      // Network SSID checking would need platform-specific implementation
    }

    // Check time-based restrictions
    const now = new Date();
    const hour = now.getHours();
    
    // Example: Restrict student access outside school hours
    if (session.userRole === 'student' && (hour < 7 || hour > 22)) {
      await this.logComplianceEvent('TIME_RESTRICTION_VIOLATION', session);
    }
  }

  /**
   * Update session activity and perform checks
   */
  async updateSessionActivity(sessionId: string, action?: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.lastActivity = new Date().toISOString();
    
    if (action) {
      session.actionsPerformed.push(`${new Date().toISOString()}: ${action}`);
    }

    // Check for idle timeout
    if (this.trustPolicy) {
      const idleTime = Date.now() - new Date(session.lastActivity).getTime();
      if (idleTime > this.trustPolicy.idleTimeout) {
        await this.terminateSession(sessionId, 'timeout');
        return;
      }

      // Check maximum session duration
      const sessionDuration = Date.now() - new Date(session.startTime).getTime();
      if (sessionDuration > this.trustPolicy.maxSessionDuration) {
        await this.terminateSession(sessionId, 'timeout');
        return;
      }
    }

    // Update stored sessions
    await this.storeActiveSessions();
  }

  /**
   * Terminate user session with cleanup
   */
  async terminateSession(
    sessionId: string, 
    reason: UserSession['terminationReason']
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Set end time and reason
    session.endTime = new Date().toISOString();
    session.duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
    session.terminationReason = reason;

    // Perform session cleanup
    await this.performSessionCleanup(session);
    session.cleanupPerformed = true;

    // Move to session history
    await this.archiveSession(session);

    // Remove from active sessions
    this.activeSessions.delete(sessionId);
    await this.storeActiveSessions();

    // Log termination
    await this.logComplianceEvent('SESSION_TERMINATED', session);
  }

  /**
   * Perform session cleanup (clear cached data, etc.)
   */
  private async performSessionCleanup(session: UserSession): Promise<void> {
    try {
      // Clear user-specific cached data
      await this.clearUserCache(session.userId);

      // Clear sensitive data from memory
      if (this.deviceProfile?.ownership === 'shared') {
        await this.clearSharedDeviceData(session.userId);
      }

      // Clear temporary files
      await this.clearTemporaryFiles(session.sessionId);

      // Reset device state if needed
      if (session.examMode) {
        await this.resetExamModeSettings();
      }

    } catch (error) {
      console.error('Session cleanup failed:', error);
      // Log cleanup failure but don't throw
      await this.logComplianceEvent('CLEANUP_FAILED', { 
        sessionId: session.sessionId, 
        error: error.message 
      });
    }
  }

  /**
   * Clean up shared device sessions when new user logs in
   */
  private async cleanupSharedDeviceSessions(newUserId: string): Promise<void> {
    const activeSessions = Array.from(this.activeSessions.values());
    
    for (const session of activeSessions) {
      if (session.userId !== newUserId) {
        await this.terminateSession(session.sessionId, 'admin_force');
      }
    }
  }

  /**
   * Load or create device profile
   */
  private async loadOrCreateDeviceProfile(): Promise<EducationalDeviceProfile> {
    try {
      const stored = await SecureStore.getItemAsync(this.STORAGE_KEYS.DEVICE_PROFILE);
      
      if (stored) {
        const encrypted = JSON.parse(stored);
        const decrypted = await EducationalDataEncryption.decryptSensitiveData(
          encrypted,
          'device_system',
          'student_data'
        );
        return JSON.parse(decrypted);
      }

      // Create new device profile
      return await this.createNewDeviceProfile();

    } catch (error) {
      console.error('Failed to load device profile:', error);
      return await this.createNewDeviceProfile();
    }
  }

  /**
   * Create new device profile
   */
  private async createNewDeviceProfile(): Promise<EducationalDeviceProfile> {
    const deviceId = await this.generateDeviceFingerprint();
    const networkState = await Network.getNetworkStateAsync();
    
    const profile: EducationalDeviceProfile = {
      deviceId,
      deviceName: Device.deviceName || 'Unknown Device',
      platform: Platform.OS,
      ownership: await this.detectDeviceOwnership(),
      trustLevel: 'untrusted',
      organizationId: this.organizationId,
      
      screenSize: { width: 0, height: 0 }, // Would be populated from Dimensions
      networkHistory: [],
      
      isSchoolDevice: false, // Would be determined by network/enrollment
      schoolNetwork: await this.isSchoolNetwork(networkState),
      supervisedMode: false,
      allowedUsers: [],
      
      securityFingerprint: await this.generateSecurityFingerprint(),
      lastSecurityScan: new Date().toISOString(),
      complianceStatus: 'compliant',
      threatLevel: 'low',
      
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      usageCount: 0,
      lastUserSessions: [],
    };

    await this.storeDeviceProfile();
    return profile;
  }

  /**
   * Store device profile securely
   */
  private async storeDeviceProfile(): Promise<void> {
    if (!this.deviceProfile) return;

    const encrypted = await EducationalDataEncryption.encryptSensitiveData(
      JSON.stringify(this.deviceProfile),
      'device_system',
      'student_data'
    );

    await SecureStore.setItemAsync(
      this.STORAGE_KEYS.DEVICE_PROFILE,
      JSON.stringify(encrypted)
    );
  }

  /**
   * Generate device fingerprint
   */
  private async generateDeviceFingerprint(): Promise<string> {
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      model: Device.modelName,
      brand: Device.brand,
      deviceName: Device.deviceName,
      timestamp: Date.now(),
    };

    const fingerprint = JSON.stringify(deviceInfo);
    return btoa(fingerprint); // Simple base64 encoding for demo
  }

  /**
   * Generate security fingerprint
   */
  private async generateSecurityFingerprint(): Promise<string> {
    // This would include various security characteristics
    const securityInfo = {
      platform: Platform.OS,
      isRooted: false, // Would use proper root detection
      hasSecureStorage: await SecureStore.isAvailableAsync(),
      biometricsAvailable: true, // Would check actual biometric availability
      screenLockEnabled: true, // Would check if device has screen lock
      timestamp: Date.now(),
    };

    return btoa(JSON.stringify(securityInfo));
  }

  /**
   * Detect device ownership type
   */
  private async detectDeviceOwnership(): Promise<DeviceOwnership> {
    // This is a simplified detection - real implementation would be more sophisticated
    
    // Check if device is enrolled in MDM
    const isMDMEnrolled = false; // Would check actual MDM status
    if (isMDMEnrolled) return 'institutional';
    
    // Check network characteristics
    const networkState = await Network.getNetworkStateAsync();
    const isSchoolNetwork = await this.isSchoolNetwork(networkState);
    if (isSchoolNetwork) return 'shared';
    
    return 'personal';
  }

  /**
   * Check if connected to school network
   */
  private async isSchoolNetwork(networkState: any): Promise<boolean> {
    // This would check against known school SSIDs/IP ranges
    if (networkState.type === 'WIFI') {
      // Check SSID against known school networks
      // This requires platform-specific implementation
    }
    
    return false; // Placeholder
  }

  /**
   * Additional helper methods would be implemented here:
   * - loadTrustPolicy()
   * - loadActiveSessions()
   * - storeActiveSessions()
   * - performSecurityScan()
   * - startSessionMonitoring()
   * - setupSessionTimeout()
   * - getCurrentLocation()
   * - isLocationOnSchoolPremises()
   * - getIPAddress()
   * - shouldEnableRestrictedMode()
   * - mapTrustLevel()
   * - clearUserCache()
   * - clearSharedDeviceData()
   * - clearTemporaryFiles()
   * - resetExamModeSettings()
   * - archiveSession()
   * - logComplianceEvent()
   */

  // Placeholder implementations for brevity
  private async loadTrustPolicy(): Promise<DeviceTrustPolicy | null> {
    // Would load organization-specific trust policy
    return null;
  }

  private async loadActiveSessions(): Promise<void> {
    // Would load active sessions from storage
  }

  private async storeActiveSessions(): Promise<void> {
    // Would store active sessions
  }

  private async performSecurityScan(): Promise<void> {
    // Would perform security assessment
  }

  private startSessionMonitoring(): void {
    // Would set up periodic session checks
  }

  private setupSessionTimeout(sessionId: string): void {
    // Would set up session timeout handling
  }

  private async getCurrentLocation(): Promise<any> {
    // Would get current location if permissions allow
    return null;
  }

  private async isLocationOnSchoolPremises(location: any): Promise<boolean> {
    // Would check if location is within school boundaries
    return true;
  }

  private async getIPAddress(): Promise<string> {
    // Would get current IP address
    return '0.0.0.0';
  }

  private shouldEnableRestrictedMode(userRole: UserRole, sessionType: SessionType): boolean {
    return sessionType === 'exam' || userRole === 'guest';
  }

  private mapTrustLevel(level: string): number {
    const mapping = { untrusted: 0, basic: 1, trusted: 2, verified: 3, institutional: 4 };
    return mapping[level as keyof typeof mapping] || 0;
  }

  private async clearUserCache(userId: string): Promise<void> {
    // Would clear user-specific cache
  }

  private async clearSharedDeviceData(userId: string): Promise<void> {
    // Would clear user data from shared device
  }

  private async clearTemporaryFiles(sessionId: string): Promise<void> {
    // Would clear session temporary files
  }

  private async resetExamModeSettings(): Promise<void> {
    // Would reset exam mode restrictions
  }

  private async archiveSession(session: UserSession): Promise<void> {
    // Would move session to history storage
  }

  private async logComplianceEvent(eventType: string, data: any): Promise<void> {
    console.log(`[EDUCATIONAL_COMPLIANCE] ${eventType}:`, data);
  }
}

export default EducationalDeviceTrust;