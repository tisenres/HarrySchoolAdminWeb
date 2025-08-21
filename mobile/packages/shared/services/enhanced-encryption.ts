/**
 * Enhanced Encryption Service for Harry School Mobile Apps
 * COPPA/GDPR Compliant Token and Data Encryption
 * 
 * Uses AES-256-GCM for all sensitive data encryption
 * Implements proper key derivation and management
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
  tag: string;
  algorithm: 'AES-256-GCM';
}

export interface KeyDerivationConfig {
  iterations: number;
  keyLength: number;
  saltLength: number;
}

export class EducationalDataEncryption {
  private static readonly KEY_DERIVATION_CONFIG: KeyDerivationConfig = {
    iterations: 100000, // PBKDF2 iterations (NIST recommended)
    keyLength: 32, // 256-bit key
    saltLength: 16, // 128-bit salt
  };

  private static readonly STORAGE_KEYS = {
    MASTER_KEY_SALT: 'edu_master_key_salt',
    ENCRYPTION_METADATA: 'edu_encryption_meta',
  };

  /**
   * Encrypt sensitive educational data (tokens, student info, etc.)
   * Complies with COPPA requirements for protecting children's data
   */
  static async encryptSensitiveData(
    plaintext: string,
    userId: string,
    dataType: 'token' | 'student_data' | 'teacher_data' | 'assessment'
  ): Promise<EncryptedData> {
    try {
      // Generate or retrieve master key
      const masterKey = await this.getMasterKey();
      
      // Generate unique salt for this operation
      const salt = await this.generateSecureRandom(this.KEY_DERIVATION_CONFIG.saltLength);
      
      // Derive encryption key using PBKDF2
      const derivedKey = await this.deriveKey(masterKey, salt, userId);
      
      // Generate random IV for AES-GCM
      const iv = await this.generateSecureRandom(12); // 96-bit IV for GCM
      
      // Create additional authenticated data (AAD)
      const aad = await this.createAAD(userId, dataType);
      
      // Encrypt using AES-256-GCM
      const encrypted = await this.aesGcmEncrypt(plaintext, derivedKey, iv, aad);
      
      // Log encryption event for audit compliance
      await this.logEncryptionEvent(userId, dataType, 'ENCRYPT_SUCCESS');
      
      return {
        encryptedData: encrypted.ciphertext,
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(salt),
        tag: encrypted.tag,
        algorithm: 'AES-256-GCM',
      };
      
    } catch (error) {
      await this.logEncryptionEvent(userId, dataType, 'ENCRYPT_FAILED', error);
      throw new Error('Educational data encryption failed');
    }
  }

  /**
   * Decrypt educational data with full audit logging
   */
  static async decryptSensitiveData(
    encryptedData: EncryptedData,
    userId: string,
    dataType: 'token' | 'student_data' | 'teacher_data' | 'assessment'
  ): Promise<string> {
    try {
      // Validate encryption metadata
      if (encryptedData.algorithm !== 'AES-256-GCM') {
        throw new Error('Unsupported encryption algorithm');
      }
      
      // Get master key
      const masterKey = await this.getMasterKey();
      
      // Convert base64 back to ArrayBuffer
      const salt = this.base64ToArrayBuffer(encryptedData.salt);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      
      // Derive the same key used for encryption
      const derivedKey = await this.deriveKey(masterKey, salt, userId);
      
      // Create AAD for verification
      const aad = await this.createAAD(userId, dataType);
      
      // Decrypt using AES-256-GCM
      const decrypted = await this.aesGcmDecrypt(
        encryptedData.encryptedData,
        encryptedData.tag,
        derivedKey,
        iv,
        aad
      );
      
      // Log successful decryption
      await this.logEncryptionEvent(userId, dataType, 'DECRYPT_SUCCESS');
      
      return decrypted;
      
    } catch (error) {
      await this.logEncryptionEvent(userId, dataType, 'DECRYPT_FAILED', error);
      throw new Error('Educational data decryption failed');
    }
  }

  /**
   * Generate or retrieve master encryption key
   * Stored in secure hardware keystore when available
   */
  private static async getMasterKey(): Promise<ArrayBuffer> {
    try {
      // Check if master key exists
      let masterKeyData = await SecureStore.getItemAsync(this.STORAGE_KEYS.MASTER_KEY_SALT);
      
      if (!masterKeyData) {
        // Generate new master key
        const masterKey = await this.generateSecureRandom(32); // 256-bit master key
        masterKeyData = this.arrayBufferToBase64(masterKey);
        
        // Store in secure keystore
        await SecureStore.setItemAsync(
          this.STORAGE_KEYS.MASTER_KEY_SALT,
          masterKeyData,
          {
            requireAuthentication: true, // Require biometric/PIN to access
            keychainService: 'HarrySchoolEducation',
            accessGroup: 'edu.harryschool.secure',
          }
        );
        
        // Log master key generation for compliance
        await this.logEncryptionEvent('system', 'master_key', 'KEY_GENERATED');
      }
      
      return this.base64ToArrayBuffer(masterKeyData);
      
    } catch (error) {
      console.error('Master key retrieval failed:', error);
      throw new Error('Unable to access encryption keys');
    }
  }

  /**
   * Derive encryption key using PBKDF2
   * Includes user ID in derivation for user-specific encryption
   */
  private static async deriveKey(
    masterKey: ArrayBuffer,
    salt: ArrayBuffer,
    userId: string
  ): Promise<ArrayBuffer> {
    // Combine salt with user ID for user-specific derivation
    const userSalt = new TextEncoder().encode(userId);
    const combinedSalt = new Uint8Array(salt.byteLength + userSalt.byteLength);
    combinedSalt.set(new Uint8Array(salt), 0);
    combinedSalt.set(userSalt, salt.byteLength);
    
    // Use Web Crypto API for PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      masterKey,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: combinedSalt,
        iterations: this.KEY_DERIVATION_CONFIG.iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * AES-256-GCM encryption with authenticated data
   */
  private static async aesGcmEncrypt(
    plaintext: string,
    key: ArrayBuffer | CryptoKey,
    iv: ArrayBuffer,
    aad: ArrayBuffer
  ): Promise<{ ciphertext: string; tag: string }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const cryptoKey = key instanceof ArrayBuffer 
      ? await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt'])
      : key;
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        additionalData: aad,
        tagLength: 128, // 128-bit authentication tag
      },
      cryptoKey,
      data
    );
    
    // Split ciphertext and tag
    const encryptedArray = new Uint8Array(encrypted);
    const ciphertext = encryptedArray.slice(0, -16); // All but last 16 bytes
    const tag = encryptedArray.slice(-16); // Last 16 bytes
    
    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      tag: this.arrayBufferToBase64(tag),
    };
  }

  /**
   * AES-256-GCM decryption with authentication verification
   */
  private static async aesGcmDecrypt(
    ciphertext: string,
    tag: string,
    key: ArrayBuffer | CryptoKey,
    iv: ArrayBuffer,
    aad: ArrayBuffer
  ): Promise<string> {
    const ciphertextBuffer = this.base64ToArrayBuffer(ciphertext);
    const tagBuffer = this.base64ToArrayBuffer(tag);
    
    // Combine ciphertext and tag
    const combined = new Uint8Array(ciphertextBuffer.byteLength + tagBuffer.byteLength);
    combined.set(new Uint8Array(ciphertextBuffer), 0);
    combined.set(new Uint8Array(tagBuffer), ciphertextBuffer.byteLength);
    
    const cryptoKey = key instanceof ArrayBuffer
      ? await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt'])
      : key;
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        additionalData: aad,
        tagLength: 128,
      },
      cryptoKey,
      combined
    );
    
    return new TextDecoder().decode(decrypted);
  }

  /**
   * Create Additional Authenticated Data (AAD) for GCM mode
   * Includes context information for enhanced security
   */
  private static async createAAD(userId: string, dataType: string): Promise<ArrayBuffer> {
    const aadString = `harry-school-edu:${userId}:${dataType}:${Date.now()}`;
    return new TextEncoder().encode(aadString);
  }

  /**
   * Generate cryptographically secure random bytes
   */
  private static async generateSecureRandom(length: number): Promise<ArrayBuffer> {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array.buffer;
  }

  /**
   * Utility: Convert ArrayBuffer to Base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Convert Base64 to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Log encryption/decryption events for educational compliance
   */
  private static async logEncryptionEvent(
    userId: string,
    dataType: string,
    operation: string,
    error?: any
  ): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        userId,
        dataType,
        operation,
        success: !error,
        error: error ? error.message : null,
        compliance: 'COPPA_GDPR',
      };
      
      // Store in secure audit log
      // In production, this would be sent to a secure logging service
      console.log('[ENCRYPTION_AUDIT]', logEntry);
      
    } catch (logError) {
      console.error('Failed to log encryption event:', logError);
    }
  }

  /**
   * Rotate encryption keys (should be called periodically)
   */
  static async rotateEncryptionKeys(): Promise<void> {
    try {
      // Generate new master key
      const newMasterKey = await this.generateSecureRandom(32);
      
      // Store with timestamp
      await SecureStore.setItemAsync(
        `${this.STORAGE_KEYS.MASTER_KEY_SALT}_${Date.now()}`,
        this.arrayBufferToBase64(newMasterKey),
        { requireAuthentication: true }
      );
      
      // Mark current key for deprecation
      await this.logEncryptionEvent('system', 'master_key', 'KEY_ROTATED');
      
      // TODO: Re-encrypt existing data with new key
      
    } catch (error) {
      console.error('Key rotation failed:', error);
      throw error;
    }
  }

  /**
   * Clear all encryption keys and data (for user logout/data purge)
   */
  static async clearEncryptionData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.STORAGE_KEYS.MASTER_KEY_SALT);
      await SecureStore.deleteItemAsync(this.STORAGE_KEYS.ENCRYPTION_METADATA);
      
      await this.logEncryptionEvent('system', 'all', 'ENCRYPTION_DATA_CLEARED');
      
    } catch (error) {
      console.error('Failed to clear encryption data:', error);
    }
  }
}

export default EducationalDataEncryption;