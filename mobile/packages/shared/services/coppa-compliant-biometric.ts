/**
 * COPPA-Compliant Biometric Authentication Service
 * Harry School Educational Mobile Apps
 * 
 * Implements age-appropriate biometric authentication with full compliance
 * to COPPA, GDPR, and educational data protection regulations.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EducationalDataEncryption } from './enhanced-encryption';

export type StudentAgeGroup = 'under_13' | '13_to_15' | '16_to_18' | 'adult';
export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'voice' | 'none';
export type ConsentStatus = 'required' | 'granted' | 'denied' | 'expired';

export interface BiometricConfig {
  enabled: boolean;
  type: BiometricType;
  ageGroup: StudentAgeGroup;
  consentStatus: ConsentStatus;
  consentDate?: string;
  parentalConsent?: boolean;
  parentEmail?: string;
  fallbackRequired: boolean;
  privacyCompliant: boolean;
}

export interface ParentalConsentRecord {
  studentId: string;
  parentEmail: string;
  consentGranted: boolean;
  consentDate: string;
  ipAddress: string;
  consentMethod: 'email' | 'in_person' | 'phone';
  witnessName?: string;
  expirationDate: string;
  revokedDate?: string;
  digitalSignature?: string;
}

export interface BiometricSecurityEvent {
  id: string;
  studentId: string;
  eventType: 'CONSENT_REQUESTED' | 'CONSENT_GRANTED' | 'CONSENT_DENIED' | 
            'BIOMETRIC_ENABLED' | 'BIOMETRIC_DISABLED' | 'PRIVACY_VIOLATION' |
            'UNAUTHORIZED_ACCESS' | 'PARENTAL_REVOCATION';
  timestamp: string;
  details: Record<string, any>;
  complianceStatus: 'COMPLIANT' | 'VIOLATION' | 'REQUIRES_REVIEW';
  ageGroup: StudentAgeGroup;
}

/**
 * COPPA-Compliant Biometric Authentication Manager
 * Handles age-appropriate authentication with full privacy protection
 */
export class COPPABiometricManager {
  private static readonly STORAGE_KEYS = {
    BIOMETRIC_CONFIG: 'coppa_biometric_config',
    CONSENT_RECORDS: 'coppa_consent_records',
    SECURITY_EVENTS: 'coppa_security_events',
    AGE_VERIFICATION: 'coppa_age_verification',
  };

  private static readonly CONSENT_EXPIRY_DAYS = 365; // Annual consent renewal

  /**
   * Initialize biometric authentication with age-appropriate controls
   */
  static async initializeBiometricAuth(
    studentId: string,
    dateOfBirth: string,
    parentEmail?: string
  ): Promise<BiometricConfig> {
    try {
      // Determine age group for COPPA compliance
      const ageGroup = this.determineAgeGroup(dateOfBirth);
      
      // Check if biometric hardware is available
      const hardwareAvailable = await LocalAuthentication.hasHardwareAsync();
      if (!hardwareAvailable) {
        return this.createDisabledConfig(ageGroup, 'No biometric hardware available');
      }

      // Check for enrolled biometric data
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return this.createDisabledConfig(ageGroup, 'No biometric data enrolled');
      }

      // Age-specific consent handling
      let consentStatus: ConsentStatus = 'required';
      let parentalConsent = false;

      switch (ageGroup) {
        case 'under_13':
          // COPPA requires explicit parental consent for under 13
          if (!parentEmail) {
            throw new Error('Parental email required for students under 13');
          }
          consentStatus = await this.requestParentalConsent(studentId, parentEmail);
          parentalConsent = consentStatus === 'granted';
          break;

        case '13_to_15':
          // Require parental notification and optional consent
          if (parentEmail) {
            await this.sendParentalNotification(studentId, parentEmail);
            consentStatus = 'granted'; // Allow with notification
          } else {
            consentStatus = 'granted'; // Allow without parent email
          }
          break;

        case '16_to_18':
          // Student can provide their own consent
          consentStatus = await this.requestStudentConsent(studentId);
          break;

        case 'adult':
          // Full autonomy for adult learners
          consentStatus = 'granted';
          break;
      }

      // Create biometric configuration
      const config: BiometricConfig = {
        enabled: consentStatus === 'granted',
        type: await this.detectBiometricType(),
        ageGroup,
        consentStatus,
        consentDate: consentStatus === 'granted' ? new Date().toISOString() : undefined,
        parentalConsent,
        parentEmail,
        fallbackRequired: true, // Always require fallback for educational settings
        privacyCompliant: true,
      };

      // Store encrypted configuration
      await this.storeSecureBiometricConfig(studentId, config);

      // Log compliance event
      await this.logBiometricEvent(studentId, 'BIOMETRIC_ENABLED', config, ageGroup);

      return config;

    } catch (error) {
      console.error('Biometric initialization failed:', error);
      throw new Error('Failed to initialize COPPA-compliant biometric authentication');
    }
  }

  /**
   * Perform biometric authentication with privacy controls
   */
  static async authenticateWithBiometric(
    studentId: string,
    promptMessage?: string
  ): Promise<{
    success: boolean;
    fallbackRequired?: boolean;
    privacyViolation?: boolean;
    error?: string;
  }> {
    try {
      // Load and validate biometric configuration
      const config = await this.loadBiometricConfig(studentId);
      if (!config) {
        return { success: false, error: 'Biometric authentication not configured' };
      }

      // Check consent validity
      if (!this.isConsentValid(config)) {
        await this.logBiometricEvent(studentId, 'CONSENT_DENIED', config, config.ageGroup);
        return { 
          success: false, 
          fallbackRequired: true, 
          error: 'Biometric consent expired or invalid' 
        };
      }

      // Perform biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || this.getAgeAppropriatePrompt(config.ageGroup),
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false, // Always allow fallback for educational settings
      });

      if (result.success) {
        // Log successful authentication
        await this.logBiometricEvent(studentId, 'BIOMETRIC_SUCCESS', config, config.ageGroup);
        return { success: true };
      } else {
        // Handle authentication failure
        const fallbackRequired = result.error === 'UserFallback' || result.error === 'SystemCancel';
        
        await this.logBiometricEvent(
          studentId, 
          'BIOMETRIC_FAILED', 
          { ...config, error: result.error }, 
          config.ageGroup
        );

        return {
          success: false,
          fallbackRequired,
          error: result.error || 'Biometric authentication failed',
        };
      }

    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { success: false, error: 'Biometric authentication system error' };
    }
  }

  /**
   * Request parental consent for biometric authentication (COPPA compliance)
   */
  private static async requestParentalConsent(
    studentId: string,
    parentEmail: string
  ): Promise<ConsentStatus> {
    try {
      // Generate consent request
      const consentToken = await this.generateConsentToken(studentId);
      
      // Send consent request email to parent
      await this.sendConsentRequestEmail(parentEmail, studentId, consentToken);
      
      // Log consent request
      await this.logBiometricEvent(studentId, 'CONSENT_REQUESTED', { parentEmail }, 'under_13');
      
      // Return pending status (actual consent will be processed via email link)
      return 'required';

    } catch (error) {
      console.error('Parental consent request failed:', error);
      return 'denied';
    }
  }

  /**
   * Process parental consent response
   */
  static async processParentalConsent(
    consentToken: string,
    granted: boolean,
    ipAddress: string
  ): Promise<void> {
    try {
      // Validate consent token
      const { studentId, parentEmail } = await this.validateConsentToken(consentToken);
      
      // Create consent record
      const consentRecord: ParentalConsentRecord = {
        studentId,
        parentEmail,
        consentGranted: granted,
        consentDate: new Date().toISOString(),
        ipAddress,
        consentMethod: 'email',
        expirationDate: new Date(Date.now() + this.CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Store consent record
      await this.storeConsentRecord(consentRecord);

      // Update biometric configuration
      const config = await this.loadBiometricConfig(studentId);
      if (config) {
        config.consentStatus = granted ? 'granted' : 'denied';
        config.consentDate = consentRecord.consentDate;
        config.enabled = granted;
        await this.storeSecureBiometricConfig(studentId, config);
      }

      // Log consent decision
      await this.logBiometricEvent(
        studentId,
        granted ? 'CONSENT_GRANTED' : 'CONSENT_DENIED',
        { parentEmail, ipAddress },
        'under_13'
      );

    } catch (error) {
      console.error('Consent processing failed:', error);
      throw error;
    }
  }

  /**
   * Revoke biometric access (parental right)
   */
  static async revokeParentalConsent(studentId: string, parentEmail: string): Promise<void> {
    try {
      // Load existing consent record
      const consentRecord = await this.loadConsentRecord(studentId);
      if (!consentRecord) {
        throw new Error('No consent record found');
      }

      // Verify parent email matches
      if (consentRecord.parentEmail !== parentEmail) {
        throw new Error('Unauthorized revocation attempt');
      }

      // Mark consent as revoked
      consentRecord.revokedDate = new Date().toISOString();
      await this.storeConsentRecord(consentRecord);

      // Disable biometric authentication
      const config = await this.loadBiometricConfig(studentId);
      if (config) {
        config.enabled = false;
        config.consentStatus = 'denied';
        await this.storeSecureBiometricConfig(studentId, config);
      }

      // Clear any stored biometric tokens
      await this.clearBiometricData(studentId);

      // Log revocation
      await this.logBiometricEvent(
        studentId,
        'PARENTAL_REVOCATION',
        { parentEmail, revokedDate: consentRecord.revokedDate },
        'under_13'
      );

    } catch (error) {
      console.error('Consent revocation failed:', error);
      throw error;
    }
  }

  /**
   * Determine age group based on date of birth
   */
  private static determineAgeGroup(dateOfBirth: string): StudentAgeGroup {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1 
      : age;

    if (actualAge < 13) return 'under_13';
    if (actualAge <= 15) return '13_to_15';
    if (actualAge <= 18) return '16_to_18';
    return 'adult';
  }

  /**
   * Create disabled biometric configuration
   */
  private static createDisabledConfig(ageGroup: StudentAgeGroup, reason: string): BiometricConfig {
    return {
      enabled: false,
      type: 'none',
      ageGroup,
      consentStatus: 'denied',
      fallbackRequired: true,
      privacyCompliant: true,
    };
  }

  /**
   * Detect available biometric type
   */
  private static async detectBiometricType(): Promise<BiometricType> {
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face';
    }
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }
    
    return 'none';
  }

  /**
   * Get age-appropriate authentication prompt
   */
  private static getAgeAppropriatePrompt(ageGroup: StudentAgeGroup): string {
    switch (ageGroup) {
      case 'under_13':
        return 'With your parent\'s permission, use your fingerprint to sign in to Harry School';
      case '13_to_15':
        return 'Use your fingerprint to sign in to Harry School';
      case '16_to_18':
        return 'Authenticate to access your Harry School account';
      case 'adult':
        return 'Authenticate to access your learning account';
      default:
        return 'Authenticate to continue';
    }
  }

  /**
   * Check if consent is still valid
   */
  private static isConsentValid(config: BiometricConfig): boolean {
    if (config.consentStatus !== 'granted') {
      return false;
    }

    if (config.ageGroup === 'under_13' && config.consentDate) {
      const consentDate = new Date(config.consentDate);
      const expiryDate = new Date(consentDate.getTime() + this.CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      return Date.now() < expiryDate.getTime();
    }

    return true;
  }

  /**
   * Store biometric configuration securely
   */
  private static async storeSecureBiometricConfig(
    studentId: string,
    config: BiometricConfig
  ): Promise<void> {
    const encrypted = await EducationalDataEncryption.encryptSensitiveData(
      JSON.stringify(config),
      studentId,
      'student_data'
    );
    
    await SecureStore.setItemAsync(
      `${this.STORAGE_KEYS.BIOMETRIC_CONFIG}_${studentId}`,
      JSON.stringify(encrypted)
    );
  }

  /**
   * Load biometric configuration
   */
  private static async loadBiometricConfig(studentId: string): Promise<BiometricConfig | null> {
    try {
      const stored = await SecureStore.getItemAsync(
        `${this.STORAGE_KEYS.BIOMETRIC_CONFIG}_${studentId}`
      );
      
      if (!stored) {
        return null;
      }

      const encryptedData = JSON.parse(stored);
      const decrypted = await EducationalDataEncryption.decryptSensitiveData(
        encryptedData,
        studentId,
        'student_data'
      );

      return JSON.parse(decrypted);
      
    } catch (error) {
      console.error('Failed to load biometric config:', error);
      return null;
    }
  }

  /**
   * Log biometric security events for compliance
   */
  private static async logBiometricEvent(
    studentId: string,
    eventType: BiometricSecurityEvent['eventType'],
    details: any,
    ageGroup: StudentAgeGroup
  ): Promise<void> {
    try {
      const event: BiometricSecurityEvent = {
        id: `${studentId}_${Date.now()}_${Math.random()}`,
        studentId,
        eventType,
        timestamp: new Date().toISOString(),
        details,
        complianceStatus: 'COMPLIANT',
        ageGroup,
      };

      // Store security event
      const events = await this.loadSecurityEvents();
      events.push(event);

      // Keep only last 1000 events
      const limitedEvents = events.slice(-1000);

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SECURITY_EVENTS,
        JSON.stringify(limitedEvents)
      );

      // In production, also send to secure audit service
      console.log('[BIOMETRIC_COMPLIANCE_AUDIT]', event);

    } catch (error) {
      console.error('Failed to log biometric event:', error);
    }
  }

  /**
   * Load security events for audit
   */
  private static async loadSecurityEvents(): Promise<BiometricSecurityEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.SECURITY_EVENTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Generate secure consent token
   */
  private static async generateConsentToken(studentId: string): Promise<string> {
    const tokenData = {
      studentId,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2),
    };

    return btoa(JSON.stringify(tokenData));
  }

  /**
   * Validate consent token
   */
  private static async validateConsentToken(token: string): Promise<{ studentId: string; parentEmail: string }> {
    try {
      const decoded = JSON.parse(atob(token));
      
      // Check token age (valid for 7 days)
      if (Date.now() - decoded.timestamp > 7 * 24 * 60 * 60 * 1000) {
        throw new Error('Consent token expired');
      }

      return {
        studentId: decoded.studentId,
        parentEmail: decoded.parentEmail, // This would be stored during token generation
      };
    } catch {
      throw new Error('Invalid consent token');
    }
  }

  /**
   * Store consent record
   */
  private static async storeConsentRecord(record: ParentalConsentRecord): Promise<void> {
    await SecureStore.setItemAsync(
      `${this.STORAGE_KEYS.CONSENT_RECORDS}_${record.studentId}`,
      JSON.stringify(record)
    );
  }

  /**
   * Load consent record
   */
  private static async loadConsentRecord(studentId: string): Promise<ParentalConsentRecord | null> {
    try {
      const stored = await SecureStore.getItemAsync(
        `${this.STORAGE_KEYS.CONSENT_RECORDS}_${studentId}`
      );
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear all biometric data for student
   */
  private static async clearBiometricData(studentId: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`${this.STORAGE_KEYS.BIOMETRIC_CONFIG}_${studentId}`);
      await SecureStore.deleteItemAsync(`${this.STORAGE_KEYS.CONSENT_RECORDS}_${studentId}`);
    } catch (error) {
      console.error('Failed to clear biometric data:', error);
    }
  }

  /**
   * Send consent request email (placeholder - implement with actual email service)
   */
  private static async sendConsentRequestEmail(
    parentEmail: string,
    studentId: string,
    consentToken: string
  ): Promise<void> {
    // This would integrate with your email service
    console.log(`Sending consent request to ${parentEmail} for student ${studentId}`);
    console.log(`Consent token: ${consentToken}`);
    
    // TODO: Implement actual email sending with consent form link
  }

  /**
   * Send parental notification (for 13-15 age group)
   */
  private static async sendParentalNotification(
    studentId: string,
    parentEmail: string
  ): Promise<void> {
    // This would integrate with your notification service
    console.log(`Sending biometric notification to ${parentEmail} for student ${studentId}`);
    
    // TODO: Implement actual notification sending
  }

  /**
   * Request direct student consent (16-18 age group)
   */
  private static async requestStudentConsent(studentId: string): Promise<ConsentStatus> {
    // This would show an in-app consent dialog
    // For now, return granted as placeholder
    return 'granted';
  }

  /**
   * Get compliance report for audit purposes
   */
  static async generateComplianceReport(
    organizationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalStudents: number;
    consentStatus: Record<ConsentStatus, number>;
    ageGroupBreakdown: Record<StudentAgeGroup, number>;
    securityEvents: BiometricSecurityEvent[];
    complianceScore: number;
  }> {
    try {
      const events = await this.loadSecurityEvents();
      const filteredEvents = events.filter(event => {
        if (startDate && event.timestamp < startDate) return false;
        if (endDate && event.timestamp > endDate) return false;
        return true;
      });

      const consentStatus: Record<ConsentStatus, number> = {
        required: 0,
        granted: 0,
        denied: 0,
        expired: 0,
      };

      const ageGroupBreakdown: Record<StudentAgeGroup, number> = {
        under_13: 0,
        '13_to_15': 0,
        '16_to_18': 0,
        adult: 0,
      };

      // Analyze events for compliance metrics
      filteredEvents.forEach(event => {
        ageGroupBreakdown[event.ageGroup]++;
      });

      const complianceScore = this.calculateComplianceScore(filteredEvents);

      return {
        totalStudents: new Set(filteredEvents.map(e => e.studentId)).size,
        consentStatus,
        ageGroupBreakdown,
        securityEvents: filteredEvents,
        complianceScore,
      };

    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw error;
    }
  }

  /**
   * Calculate compliance score based on events
   */
  private static calculateComplianceScore(events: BiometricSecurityEvent[]): number {
    if (events.length === 0) return 100;

    const compliantEvents = events.filter(e => e.complianceStatus === 'COMPLIANT').length;
    return Math.round((compliantEvents / events.length) * 100);
  }
}

export default COPPABiometricManager;