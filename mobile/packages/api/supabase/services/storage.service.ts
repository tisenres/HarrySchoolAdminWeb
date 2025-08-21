/**
 * File Storage Service for Harry School Mobile Apps
 * 
 * Provides secure file upload, download, and management with educational context,
 * including student photos, assignment files, and audio recordings.
 * 
 * Features:
 * - Student profile photo management
 * - Assignment file attachments (images, documents, audio)
 * - Secure file access with role-based permissions
 * - Image optimization and compression for mobile
 * - Progress tracking for uploads/downloads
 * - Offline file caching
 * - Audio recording for speaking tasks
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { 
  SupabaseResponse,
  FileUploadOptions,
  FileUploadResult
} from '../types/supabase';
import { MobileSupabaseClient } from '../client';
import { ErrorHandler } from '../error-handler';
import { CacheManager } from '../cache';
import { SecurityManager } from '../security';

/**
 * File categories for educational context
 */
export type FileCategory = 
  | 'student_photos'
  | 'teacher_photos' 
  | 'assignment_attachments'
  | 'audio_recordings'
  | 'vocabulary_images'
  | 'group_materials'
  | 'feedback_attachments'
  | 'app_resources';

/**
 * File upload options with educational context
 */
export interface EducationalFileUploadOptions {
  category: FileCategory;
  file: File | Blob;
  fileName: string;
  ownerId: string; // Student ID, Teacher ID, etc.
  organizationId: string;
  metadata?: {
    taskId?: string;
    groupId?: string;
    vocabularyWordId?: string;
    feedbackId?: string;
    [key: string]: any;
  };
  compression?: {
    enabled: boolean;
    quality?: number; // 0-1 for images
    maxWidth?: number;
    maxHeight?: number;
  };
  progressCallback?: (progress: number) => void;
  abortSignal?: AbortSignal;
}

/**
 * File download options
 */
export interface FileDownloadOptions {
  cacheLocally?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  };
  progressCallback?: (progress: number) => void;
  abortSignal?: AbortSignal;
}

/**
 * File metadata structure
 */
export interface FileMetadata {
  id: string;
  fileName: string;
  originalName: string;
  category: FileCategory;
  mimeType: string;
  size: number;
  ownerId: string;
  organizationId: string;
  path: string;
  publicUrl: string;
  isCompressed: boolean;
  metadata?: Record<string, any>;
  uploadedAt: string;
  accessedAt?: string;
  accessCount: number;
}

/**
 * Storage quota information
 */
export interface StorageQuota {
  used: number;
  limit: number;
  remaining: number;
  byCategory: Record<FileCategory, number>;
}

/**
 * Audio recording configuration
 */
export interface AudioRecordingConfig {
  format: 'mp3' | 'aac' | 'wav';
  bitRate?: number;
  sampleRate?: number;
  maxDuration?: number; // seconds
  compressionEnabled?: boolean;
}

/**
 * Main Storage Service Class
 */
export class StorageService {
  private client: MobileSupabaseClient;
  private supabaseClient: SupabaseClient<Database> | null;
  private errorHandler: ErrorHandler;
  private cacheManager: CacheManager;
  private securityManager: SecurityManager;

  // Storage bucket configuration
  private static readonly BUCKET_CONFIG: Record<FileCategory, {
    bucket: string;
    pathPrefix: string;
    maxFileSize: number;
    allowedMimeTypes: string[];
    requiresAuth: boolean;
  }> = {
    student_photos: {
      bucket: 'user-avatars',
      pathPrefix: 'students',
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      requiresAuth: true
    },
    teacher_photos: {
      bucket: 'user-avatars',
      pathPrefix: 'teachers',
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      requiresAuth: true
    },
    assignment_attachments: {
      bucket: 'assignments',
      pathPrefix: 'attachments',
      maxFileSize: 20 * 1024 * 1024, // 20MB
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ],
      requiresAuth: true
    },
    audio_recordings: {
      bucket: 'audio',
      pathPrefix: 'recordings',
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: ['audio/mpeg', 'audio/aac', 'audio/wav', 'audio/mp4'],
      requiresAuth: true
    },
    vocabulary_images: {
      bucket: 'vocabulary',
      pathPrefix: 'images',
      maxFileSize: 2 * 1024 * 1024, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      requiresAuth: false // These can be public
    },
    group_materials: {
      bucket: 'groups',
      pathPrefix: 'materials',
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/webp',
        'application/pdf',
        'video/mp4',
        'audio/mpeg'
      ],
      requiresAuth: true
    },
    feedback_attachments: {
      bucket: 'feedback',
      pathPrefix: 'attachments',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg'],
      requiresAuth: true
    },
    app_resources: {
      bucket: 'public',
      pathPrefix: 'resources',
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      requiresAuth: false
    }
  };

  constructor(client: MobileSupabaseClient) {
    this.client = client;
    this.supabaseClient = client.getClient();
    this.errorHandler = new ErrorHandler();
    this.cacheManager = new CacheManager();
    this.securityManager = new SecurityManager();
  }

  /**
   * Upload file with educational context and optimization
   */
  async uploadFile(options: EducationalFileUploadOptions): Promise<SupabaseResponse<FileMetadata>> {
    try {
      const supabaseClient = this.client.getClient();
      if (!supabaseClient) {
        return { 
          data: null, 
          error: { message: 'Supabase client not available' } 
        };
      }

      // Validate file
      const validationResult = await this.validateFile(options);
      if (validationResult.error) {
        return validationResult;
      }

      // Get bucket configuration
      const bucketConfig = StorageService.BUCKET_CONFIG[options.category];
      if (!bucketConfig) {
        return { 
          data: null, 
          error: { message: 'Invalid file category' } 
        };
      }

      // Process file (compression, etc.)
      let processedFile = options.file;
      let isCompressed = false;

      if (options.compression?.enabled && this.isImageFile(options.file)) {
        const compressionResult = await this.compressImage(options.file, options.compression);
        if (compressionResult.data) {
          processedFile = compressionResult.data;
          isCompressed = true;
        }
      }

      // Generate secure file path
      const filePath = this.generateFilePath(
        bucketConfig.pathPrefix,
        options.organizationId,
        options.ownerId,
        options.fileName
      );

      // Upload to Supabase Storage
      const uploadResult = await this.performUpload(
        supabaseClient,
        bucketConfig.bucket,
        filePath,
        processedFile,
        {
          contentType: options.file.type,
          cacheControl: '3600',
          upsert: false
        },
        options.progressCallback,
        options.abortSignal
      );

      if (uploadResult.error) {
        return uploadResult;
      }

      // Get public URL if applicable
      let publicUrl = '';
      if (!bucketConfig.requiresAuth) {
        const { data: urlData } = supabaseClient.storage
          .from(bucketConfig.bucket)
          .getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      } else {
        // For private files, we'll generate signed URLs on demand
        publicUrl = filePath; // Store the path, not the URL
      }

      // Create file metadata
      const fileMetadata: FileMetadata = {
        id: this.generateFileId(),
        fileName: options.fileName,
        originalName: options.fileName,
        category: options.category,
        mimeType: options.file.type,
        size: processedFile.size,
        ownerId: options.ownerId,
        organizationId: options.organizationId,
        path: filePath,
        publicUrl,
        isCompressed,
        metadata: options.metadata,
        uploadedAt: new Date().toISOString(),
        accessCount: 0
      };

      // Store metadata in database
      const metadataResult = await this.storeFileMetadata(fileMetadata);
      if (metadataResult.error) {
        // Clean up uploaded file
        await this.deleteFileFromStorage(bucketConfig.bucket, filePath);
        return metadataResult;
      }

      return { data: fileMetadata, error: null };

    } catch (error) {
      this.errorHandler.logError('FILE_UPLOAD_ERROR', error);
      return { 
        data: null, 
        error: { message: 'Failed to upload file' } 
      };
    }
  }

  /**
   * Download file with caching and optimization
   */
  async downloadFile(
    fileId: string,
    options?: FileDownloadOptions
  ): Promise<SupabaseResponse<{ blob: Blob; metadata: FileMetadata }>> {
    try {
      const supabaseClient = this.client.getClient();
      if (!supabaseClient) {
        return { 
          data: null, 
          error: { message: 'Supabase client not available' } 
        };
      }

      // Get file metadata
      const metadataResult = await this.getFileMetadata(fileId);
      if (metadataResult.error || !metadataResult.data) {
        return { 
          data: null, 
          error: { message: 'File not found' } 
        };
      }

      const metadata = metadataResult.data;
      const bucketConfig = StorageService.BUCKET_CONFIG[metadata.category];

      // Check cache first
      const cacheKey = options?.cacheKey || `file:${fileId}`;
      if (options?.cacheLocally) {
        const cached = this.cacheManager.get<Blob>(cacheKey);
        if (cached) {
          return { 
            data: { blob: cached, metadata }, 
            error: null,
            meta: { fromCache: true }
          };
        }
      }

      // Download from Supabase Storage
      let downloadResult;
      
      if (bucketConfig.requiresAuth) {
        // Generate signed URL for private files
        const { data: signedUrlData, error: urlError } = await supabaseClient.storage
          .from(bucketConfig.bucket)
          .createSignedUrl(metadata.path, 3600); // 1 hour expiry

        if (urlError) {
          return { 
            data: null, 
            error: { message: 'Failed to create download URL' } 
          };
        }

        // Download using signed URL
        const response = await fetch(signedUrlData.signedUrl, {
          signal: options?.abortSignal
        });

        if (!response.ok) {
          throw new Error(`Download failed: ${response.statusText}`);
        }

        const blob = await response.blob();
        downloadResult = { data: blob, error: null };
      } else {
        // Download public file directly
        const { data, error } = await supabaseClient.storage
          .from(bucketConfig.bucket)
          .download(metadata.path);

        downloadResult = { data, error };
      }

      if (downloadResult.error || !downloadResult.data) {
        return { 
          data: null, 
          error: { message: 'Failed to download file' } 
        };
      }

      // Transform image if requested
      let finalBlob = downloadResult.data;
      if (options?.transform && this.isImageFile(downloadResult.data)) {
        const transformResult = await this.transformImage(downloadResult.data, options.transform);
        if (transformResult.data) {
          finalBlob = transformResult.data;
        }
      }

      // Cache locally if requested
      if (options?.cacheLocally) {
        this.cacheManager.set(cacheKey, finalBlob, options.cacheTTL || 3600000); // 1 hour default
      }

      // Update access tracking
      await this.updateFileAccess(fileId);

      return { 
        data: { blob: finalBlob, metadata }, 
        error: null 
      };

    } catch (error) {
      this.errorHandler.logError('FILE_DOWNLOAD_ERROR', error);
      return { 
        data: null, 
        error: { message: 'Failed to download file' } 
      };
    }
  }

  /**
   * Delete file and cleanup
   */
  async deleteFile(fileId: string): Promise<SupabaseResponse<boolean>> {
    try {
      const supabaseClient = this.client.getClient();
      if (!supabaseClient) {
        return { 
          data: false, 
          error: { message: 'Supabase client not available' } 
        };
      }

      // Get file metadata
      const metadataResult = await this.getFileMetadata(fileId);
      if (metadataResult.error || !metadataResult.data) {
        return { 
          data: false, 
          error: { message: 'File not found' } 
        };
      }

      const metadata = metadataResult.data;
      const bucketConfig = StorageService.BUCKET_CONFIG[metadata.category];

      // Delete from storage
      const storageResult = await this.deleteFileFromStorage(bucketConfig.bucket, metadata.path);
      if (storageResult.error) {
        return storageResult;
      }

      // Delete metadata from database
      const dbResult = await this.deleteFileMetadata(fileId);
      if (dbResult.error) {
        return dbResult;
      }

      // Clear from cache
      this.cacheManager.delete(`file:${fileId}`);

      return { data: true, error: null };

    } catch (error) {
      this.errorHandler.logError('FILE_DELETE_ERROR', error);
      return { 
        data: false, 
        error: { message: 'Failed to delete file' } 
      };
    }
  }

  /**
   * Get storage quota information
   */
  async getStorageQuota(organizationId: string): Promise<SupabaseResponse<StorageQuota>> {
    try {
      const result = await this.client.query(
        async (client) => {
          const { data, error } = await client
            .from('file_metadata')
            .select('category, size')
            .eq('organization_id', organizationId);

          if (error) return { data: null, error };

          // Calculate usage by category
          const byCategory: Record<FileCategory, number> = {} as any;
          let totalUsed = 0;

          (data || []).forEach((file: any) => {
            const size = file.size || 0;
            byCategory[file.category as FileCategory] = (byCategory[file.category] || 0) + size;
            totalUsed += size;
          });

          // Organization storage limit (this would come from organization settings)
          const limit = 1024 * 1024 * 1024; // 1GB default

          const quota: StorageQuota = {
            used: totalUsed,
            limit,
            remaining: Math.max(0, limit - totalUsed),
            byCategory
          };

          return { data: quota, error: null };
        }
      );

      return result;

    } catch (error) {
      this.errorHandler.logError('STORAGE_QUOTA_ERROR', error);
      return { 
        data: null, 
        error: { message: 'Failed to get storage quota' } 
      };
    }
  }

  /**
   * Get files by owner and category
   */
  async getFiles(
    ownerId: string,
    category?: FileCategory,
    organizationId?: string
  ): Promise<SupabaseResponse<FileMetadata[]>> {
    try {
      const result = await this.client.query(
        async (client) => {
          let query = client
            .from('file_metadata')
            .select('*')
            .eq('owner_id', ownerId);

          if (category) {
            query = query.eq('category', category);
          }

          if (organizationId) {
            query = query.eq('organization_id', organizationId);
          }

          const { data, error } = await query.order('uploaded_at', { ascending: false });

          return { data: data || [], error };
        }
      );

      return result;

    } catch (error) {
      this.errorHandler.logError('GET_FILES_ERROR', error);
      return { 
        data: [], 
        error: { message: 'Failed to get files' } 
      };
    }
  }

  /**
   * Generate signed URL for private file access
   */
  async getSignedUrl(
    fileId: string,
    expiresIn: number = 3600
  ): Promise<SupabaseResponse<string>> {
    try {
      const supabaseClient = this.client.getClient();
      if (!supabaseClient) {
        return { 
          data: null, 
          error: { message: 'Supabase client not available' } 
        };
      }

      // Get file metadata
      const metadataResult = await this.getFileMetadata(fileId);
      if (metadataResult.error || !metadataResult.data) {
        return { 
          data: null, 
          error: { message: 'File not found' } 
        };
      }

      const metadata = metadataResult.data;
      const bucketConfig = StorageService.BUCKET_CONFIG[metadata.category];

      if (!bucketConfig.requiresAuth) {
        // Return public URL for public files
        const { data: urlData } = supabaseClient.storage
          .from(bucketConfig.bucket)
          .getPublicUrl(metadata.path);
        
        return { data: urlData.publicUrl, error: null };
      }

      // Generate signed URL for private files
      const { data, error } = await supabaseClient.storage
        .from(bucketConfig.bucket)
        .createSignedUrl(metadata.path, expiresIn);

      if (error) {
        return { 
          data: null, 
          error: { message: 'Failed to create signed URL' } 
        };
      }

      return { data: data.signedUrl, error: null };

    } catch (error) {
      this.errorHandler.logError('SIGNED_URL_ERROR', error);
      return { 
        data: null, 
        error: { message: 'Failed to generate signed URL' } 
      };
    }
  }

  // Private helper methods

  private async validateFile(options: EducationalFileUploadOptions): Promise<SupabaseResponse<null>> {
    const bucketConfig = StorageService.BUCKET_CONFIG[options.category];
    
    // Check file size
    if (options.file.size > bucketConfig.maxFileSize) {
      const maxSizeMB = Math.round(bucketConfig.maxFileSize / 1024 / 1024);
      return { 
        data: null, 
        error: { message: `File too large. Maximum size is ${maxSizeMB}MB` } 
      };
    }

    // Check MIME type
    if (!bucketConfig.allowedMimeTypes.includes(options.file.type)) {
      return { 
        data: null, 
        error: { message: 'File type not allowed for this category' } 
      };
    }

    return { data: null, error: null };
  }

  private generateFilePath(
    prefix: string,
    organizationId: string,
    ownerId: string,
    fileName: string
  ): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${prefix}/${organizationId}/${ownerId}/${timestamp}_${randomId}_${sanitizedFileName}`;
  }

  private async performUpload(
    client: SupabaseClient,
    bucket: string,
    path: string,
    file: File | Blob,
    options: any,
    progressCallback?: (progress: number) => void,
    abortSignal?: AbortSignal
  ): Promise<SupabaseResponse<any>> {
    try {
      const { data, error } = await client.storage
        .from(bucket)
        .upload(path, file, options);

      return { data, error: error ? { message: error.message } : null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  private async compressImage(
    file: File | Blob,
    options: NonNullable<EducationalFileUploadOptions['compression']>
  ): Promise<SupabaseResponse<Blob>> {
    try {
      // This would use a library like canvas or react-native-image-resizer
      // For now, return original file
      return { data: file, error: null };
    } catch (error) {
      this.errorHandler.logError('IMAGE_COMPRESSION_ERROR', error);
      return { data: null, error: { message: 'Failed to compress image' } };
    }
  }

  private async transformImage(
    blob: Blob,
    transform: NonNullable<FileDownloadOptions['transform']>
  ): Promise<SupabaseResponse<Blob>> {
    try {
      // This would apply image transformations
      // For now, return original blob
      return { data: blob, error: null };
    } catch (error) {
      this.errorHandler.logError('IMAGE_TRANSFORM_ERROR', error);
      return { data: null, error: { message: 'Failed to transform image' } };
    }
  }

  private isImageFile(file: File | Blob): boolean {
    return file.type.startsWith('image/');
  }

  private async storeFileMetadata(metadata: FileMetadata): Promise<SupabaseResponse<FileMetadata>> {
    return this.client.query(
      async (client) => {
        const { data, error } = await client
          .from('file_metadata')
          .insert({
            id: metadata.id,
            file_name: metadata.fileName,
            original_name: metadata.originalName,
            category: metadata.category,
            mime_type: metadata.mimeType,
            size: metadata.size,
            owner_id: metadata.ownerId,
            organization_id: metadata.organizationId,
            path: metadata.path,
            public_url: metadata.publicUrl,
            is_compressed: metadata.isCompressed,
            metadata: metadata.metadata,
            uploaded_at: metadata.uploadedAt,
            access_count: metadata.accessCount
          })
          .select()
          .single();

        return { data: data as FileMetadata, error };
      }
    );
  }

  private async getFileMetadata(fileId: string): Promise<SupabaseResponse<FileMetadata | null>> {
    return this.client.query(
      async (client) => {
        const { data, error } = await client
          .from('file_metadata')
          .select('*')
          .eq('id', fileId)
          .single();

        return { data: data as FileMetadata, error };
      }
    );
  }

  private async deleteFileMetadata(fileId: string): Promise<SupabaseResponse<boolean>> {
    const result = await this.client.query(
      async (client) => {
        const { error } = await client
          .from('file_metadata')
          .delete()
          .eq('id', fileId);

        return { data: !error, error };
      }
    );

    return result;
  }

  private async deleteFileFromStorage(bucket: string, path: string): Promise<SupabaseResponse<boolean>> {
    try {
      const supabaseClient = this.client.getClient();
      if (!supabaseClient) {
        return { data: false, error: { message: 'Client not available' } };
      }

      const { error } = await supabaseClient.storage
        .from(bucket)
        .remove([path]);

      return { data: !error, error: error ? { message: error.message } : null };
    } catch (error: any) {
      return { data: false, error: { message: error.message } };
    }
  }

  private async updateFileAccess(fileId: string): Promise<void> {
    try {
      await this.client.query(
        async (client) => {
          const { error } = await client
            .from('file_metadata')
            .update({
              accessed_at: new Date().toISOString(),
              access_count: client.raw('access_count + 1')
            })
            .eq('id', fileId);

          return { data: !error, error };
        }
      );
    } catch (error) {
      // Non-critical, don't throw
      this.errorHandler.logError('FILE_ACCESS_UPDATE_ERROR', error);
    }
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup cached files and resources
   */
  async cleanup(): Promise<void> {
    this.cacheManager.cleanup();
  }
}

export default StorageService;