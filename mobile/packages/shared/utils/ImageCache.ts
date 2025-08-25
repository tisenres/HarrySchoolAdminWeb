import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { MMKV } from 'react-native-mmkv';
import CryptoJS from 'crypto-js';

// Image cache configuration
export interface ImageCacheConfig {
  maxCacheSize: number; // in MB
  maxCacheAge: number; // in days
  compressionQuality: number; // 0-1
  enableWebP: boolean;
  enableProgressive: boolean;
  enableMemoryCache: boolean;
  enableDiskCache: boolean;
}

export interface CacheItem {
  url: string;
  localPath: string;
  size: number;
  timestamp: number;
  mimeType: string;
  compressed: boolean;
}

class ImageCacheManager {
  private static instance: ImageCacheManager;
  private mmkv: MMKV;
  private memoryCache: Map<string, string> = new Map();
  private cacheDirectory: string;
  private isInitialized = false;

  private readonly defaultConfig: ImageCacheConfig = {
    maxCacheSize: 100, // 100MB
    maxCacheAge: 30, // 30 days
    compressionQuality: 0.8,
    enableWebP: Platform.OS === 'android',
    enableProgressive: true,
    enableMemoryCache: true,
    enableDiskCache: true,
  };

  private config: ImageCacheConfig;

  private constructor(config?: Partial<ImageCacheConfig>) {
    this.config = { ...this.defaultConfig, ...config };
    this.mmkv = new MMKV({
      id: 'image-cache-metadata',
      encryptionKey: 'harry-school-image-cache',
    });
    this.cacheDirectory = `${RNFS.CachesDirectoryPath}/images`;
  }

  public static getInstance(config?: Partial<ImageCacheConfig>): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager(config);
    }
    return ImageCacheManager.instance;
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create cache directory if it doesn't exist
      const dirExists = await RNFS.exists(this.cacheDirectory);
      if (!dirExists) {
        await RNFS.mkdir(this.cacheDirectory);
      }

      // Clean up old cache entries on initialization
      await this.cleanupCache();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  private generateCacheKey(url: string): string {
    return CryptoJS.MD5(url).toString();
  }

  private getLocalFilePath(cacheKey: string, mimeType: string = 'image/jpeg'): string {
    const extension = this.getFileExtension(mimeType);
    return `${this.cacheDirectory}/${cacheKey}${extension}`;
  }

  private getFileExtension(mimeType: string): string {
    switch (mimeType) {
      case 'image/webp':
        return '.webp';
      case 'image/png':
        return '.png';
      case 'image/gif':
        return '.gif';
      case 'image/jpeg':
      case 'image/jpg':
      default:
        return '.jpg';
    }
  }

  private async downloadAndCacheImage(url: string, cacheKey: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      const localPath = this.getLocalFilePath(cacheKey, mimeType);
      const arrayBuffer = await response.arrayBuffer();
      const base64Data = this.arrayBufferToBase64(arrayBuffer);

      // Write to disk
      await RNFS.writeFile(localPath, base64Data, 'base64');

      // Get file stats
      const stats = await RNFS.stat(localPath);

      // Store metadata in MMKV
      const cacheItem: CacheItem = {
        url,
        localPath,
        size: stats.size,
        timestamp: Date.now(),
        mimeType,
        compressed: false,
      };

      this.mmkv.set(cacheKey, JSON.stringify(cacheItem));

      // Add to memory cache if enabled
      if (this.config.enableMemoryCache) {
        this.memoryCache.set(cacheKey, `file://${localPath}`);
      }

      return `file://${localPath}`;
    } catch (error) {
      console.error('Failed to download and cache image:', error);
      return null;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  public async getCachedImageURI(url: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!url || typeof url !== 'string') {
      return url; // Return original if invalid
    }

    const cacheKey = this.generateCacheKey(url);

    // Check memory cache first
    if (this.config.enableMemoryCache && this.memoryCache.has(cacheKey)) {
      const cachedPath = this.memoryCache.get(cacheKey);
      if (cachedPath && await RNFS.exists(cachedPath.replace('file://', ''))) {
        return cachedPath;
      } else {
        this.memoryCache.delete(cacheKey);
      }
    }

    // Check disk cache
    const cacheItemJson = this.mmkv.getString(cacheKey);
    if (cacheItemJson) {
      try {
        const cacheItem: CacheItem = JSON.parse(cacheItemJson);
        
        // Check if cache item is still valid
        const isExpired = Date.now() - cacheItem.timestamp > (this.config.maxCacheAge * 24 * 60 * 60 * 1000);
        const fileExists = await RNFS.exists(cacheItem.localPath);

        if (!isExpired && fileExists) {
          // Add to memory cache
          if (this.config.enableMemoryCache) {
            this.memoryCache.set(cacheKey, `file://${cacheItem.localPath}`);
          }
          return `file://${cacheItem.localPath}`;
        } else {
          // Clean up expired or missing cache entry
          this.mmkv.delete(cacheKey);
          if (fileExists) {
            await RNFS.unlink(cacheItem.localPath);
          }
        }
      } catch (error) {
        console.error('Error parsing cache item:', error);
        this.mmkv.delete(cacheKey);
      }
    }

    // Image not in cache, download it
    const cachedPath = await this.downloadAndCacheImage(url, cacheKey);
    return cachedPath || url; // Fallback to original URL if caching fails
  }

  public async preloadImages(urls: string[]): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const downloadPromises = urls.map(async (url) => {
      try {
        await this.getCachedImageURI(url);
      } catch (error) {
        console.error(`Failed to preload image: ${url}`, error);
      }
    });

    await Promise.allSettled(downloadPromises);
  }

  public async clearMemoryCache(): Promise<void> {
    this.memoryCache.clear();
  }

  public async clearDiskCache(): Promise<void> {
    try {
      // Clear MMKV metadata
      this.mmkv.clearAll();
      
      // Clear memory cache
      this.memoryCache.clear();

      // Remove all cached files
      const dirExists = await RNFS.exists(this.cacheDirectory);
      if (dirExists) {
        await RNFS.unlink(this.cacheDirectory);
        await RNFS.mkdir(this.cacheDirectory);
      }
    } catch (error) {
      console.error('Failed to clear disk cache:', error);
    }
  }

  public async getCacheSize(): Promise<number> {
    try {
      let totalSize = 0;
      const files = await RNFS.readDir(this.cacheDirectory);
      
      for (const file of files) {
        totalSize += file.size;
      }
      
      return totalSize; // in bytes
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  }

  private async cleanupCache(): Promise<void> {
    try {
      const currentCacheSize = await this.getCacheSize();
      const maxCacheSizeBytes = this.config.maxCacheSize * 1024 * 1024; // Convert MB to bytes

      if (currentCacheSize <= maxCacheSizeBytes) {
        return;
      }

      // Get all cache items sorted by timestamp (oldest first)
      const allKeys = this.mmkv.getAllKeys();
      const cacheItems: (CacheItem & { cacheKey: string })[] = [];

      for (const key of allKeys) {
        try {
          const itemJson = this.mmkv.getString(key);
          if (itemJson) {
            const item: CacheItem = JSON.parse(itemJson);
            cacheItems.push({ ...item, cacheKey: key });
          }
        } catch (error) {
          // Invalid cache item, remove it
          this.mmkv.delete(key);
        }
      }

      // Sort by timestamp (oldest first)
      cacheItems.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest items until we're under the size limit
      let removedSize = 0;
      for (const item of cacheItems) {
        try {
          // Remove file
          const fileExists = await RNFS.exists(item.localPath);
          if (fileExists) {
            await RNFS.unlink(item.localPath);
            removedSize += item.size;
          }
          
          // Remove metadata
          this.mmkv.delete(item.cacheKey);
          
          // Remove from memory cache
          this.memoryCache.delete(item.cacheKey);

          // Check if we've freed enough space
          if (currentCacheSize - removedSize <= maxCacheSizeBytes * 0.8) { // 80% of max size
            break;
          }
        } catch (error) {
          console.error('Error removing cache item:', error);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }

  public async getCacheStats(): Promise<{
    totalSize: number;
    totalFiles: number;
    memoryItems: number;
    oldestItem?: Date;
    newestItem?: Date;
  }> {
    const totalSize = await this.getCacheSize();
    const allKeys = this.mmkv.getAllKeys();
    const memoryItems = this.memoryCache.size;
    
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;
    
    for (const key of allKeys) {
      try {
        const itemJson = this.mmkv.getString(key);
        if (itemJson) {
          const item: CacheItem = JSON.parse(itemJson);
          if (item.timestamp < oldestTimestamp) {
            oldestTimestamp = item.timestamp;
          }
          if (item.timestamp > newestTimestamp) {
            newestTimestamp = item.timestamp;
          }
        }
      } catch (error) {
        // Invalid item, skip
      }
    }

    return {
      totalSize,
      totalFiles: allKeys.length,
      memoryItems,
      oldestItem: oldestTimestamp !== Infinity ? new Date(oldestTimestamp) : undefined,
      newestItem: newestTimestamp !== 0 ? new Date(newestTimestamp) : undefined,
    };
  }
}

export default ImageCacheManager;