/**
 * Asset Manager Utility
 * Handles loading, caching, and management of game assets
 */

import { ImageItem, ImageDataset } from '@types/mlTypes';
import { SampleImages } from '@assets/index';
import { Image } from 'react-native';

export interface CachedImage {
  uri: string;
  width?: number;
  height?: number;
  size?: number;
  loadTime: number;
  lastAccessed: number;
}

export interface LoadingOptions {
  priority?: 'high' | 'normal' | 'low';
  preload?: boolean;
  resize?: { width: number; height: number };
}

export interface CacheStats {
  totalImages: number;
  totalSize: number;
  hitRate: number;
  averageLoadTime: number;
}

/**
 * Asset Manager Class
 * Manages image loading, caching, and dataset preparation with optimization
 */
export class AssetManager {
  private static instance: AssetManager;
  private imageCache: Map<string, CachedImage> = new Map();
  private loadingPromises: Map<string, Promise<CachedImage>> =
    new Map();
  private dataset: ImageDataset | null = null;
  private preloadQueue: string[] = [];
  private isPreloading = false;
  private cacheHits = 0;
  private cacheMisses = 0;

  // Configuration
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_CACHE_ITEMS = 100;
  private readonly PRELOAD_BATCH_SIZE = 5;
  private readonly CACHE_CLEANUP_INTERVAL = 60000; // 1 minute

  private constructor() {
    // Start periodic cache cleanup
    setInterval(() => {
      this.cleanupCache();
    }, this.CACHE_CLEANUP_INTERVAL);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Initialize the asset manager and preload essential assets
   */
  public async initialize(): Promise<void> {
    console.log('AssetManager: Initializing...');

    // Prepare the image dataset
    this.dataset = {
      apples: SampleImages.apples.map((img) => ({
        id: img.id,
        uri: img.uri,
        label: img.label,
        metadata: {
          source: 'bundled',
        },
      })),
      notApples: SampleImages.notApples.map((img) => ({
        id: img.id,
        uri: img.uri,
        label: img.label,
        metadata: {
          source: 'bundled',
        },
      })),
    };

    // Preload critical images
    await this.preloadCriticalImages();

    console.log('AssetManager: Initialized successfully');
  }

  /**
   * Get the complete image dataset
   */
  public getImageDataset(): ImageDataset {
    if (!this.dataset) {
      throw new Error(
        'AssetManager not initialized. Call initialize() first.'
      );
    }
    return this.dataset;
  }

  /**
   * Get a random selection of images for teaching phase
   * @param count Number of images to select
   * @returns Array of mixed apple and non-apple images
   */
  public async getTeachingImages(
    count: number = 8
  ): Promise<ImageItem[]> {
    if (!this.dataset) {
      throw new Error(
        'AssetManager not initialized. Call initialize() first.'
      );
    }

    const halfCount = Math.floor(count / 2);
    const appleImages = this.shuffleArray([
      ...this.dataset.apples,
    ]).slice(0, halfCount);
    const notAppleImages = this.shuffleArray([
      ...this.dataset.notApples,
    ]).slice(0, count - halfCount);

    const selectedImages = this.shuffleArray([
      ...appleImages,
      ...notAppleImages,
    ]);

    // Preload the selected images for smooth gameplay
    const imageUris = selectedImages.map((img) => img.uri);
    await this.preloadImages(imageUris, { priority: 'high' });

    return selectedImages;
  }

  /**
   * Get a random selection of images for testing phase
   * @param count Number of images to select
   * @returns Array of mixed apple and non-apple images
   */
  public async getTestingImages(
    count: number = 5
  ): Promise<ImageItem[]> {
    if (!this.dataset) {
      throw new Error(
        'AssetManager not initialized. Call initialize() first.'
      );
    }

    const halfCount = Math.floor(count / 2);
    const appleImages = this.shuffleArray([
      ...this.dataset.apples,
    ]).slice(0, halfCount);
    const notAppleImages = this.shuffleArray([
      ...this.dataset.notApples,
    ]).slice(0, count - halfCount);

    const selectedImages = this.shuffleArray([
      ...appleImages,
      ...notAppleImages,
    ]);

    // Preload the selected images for smooth gameplay
    const imageUris = selectedImages.map((img) => img.uri);
    await this.preloadImages(imageUris, { priority: 'high' });

    return selectedImages;
  }

  /**
   * Cache an image asset
   * @param key Cache key
   * @param asset Asset to cache
   */
  public cacheImage(key: string, asset: any): void {
    this.imageCache.set(key, asset);
  }

  /**
   * Get cached image asset
   * @param key Cache key
   * @returns Cached asset or null
   */
  public getCachedImage(key: string): any | null {
    return this.imageCache.get(key) || null;
  }

  /**
   * Load and cache an image with optimization
   */
  public async loadImage(
    uri: string,
    options: LoadingOptions = {}
  ): Promise<CachedImage> {
    // Check cache first
    const cached = this.imageCache.get(uri);
    if (cached) {
      cached.lastAccessed = Date.now();
      this.cacheHits++;
      return cached;
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(uri);
    if (existingPromise) {
      return existingPromise;
    }

    // Start loading
    this.cacheMisses++;
    const loadingPromise = this.performImageLoad(uri, options);
    this.loadingPromises.set(uri, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadingPromises.delete(uri);
      return result;
    } catch (error) {
      this.loadingPromises.delete(uri);
      throw error;
    }
  }

  /**
   * Preload images for smooth gameplay
   */
  public async preloadImages(
    uris: string[],
    options: LoadingOptions = {}
  ): Promise<void> {
    const preloadOptions = { ...options, preload: true };

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < uris.length; i += this.PRELOAD_BATCH_SIZE) {
      const batch = uris.slice(i, i + this.PRELOAD_BATCH_SIZE);

      await Promise.all(
        batch.map((uri) =>
          this.loadImage(uri, preloadOptions).catch((error) => {
            console.warn(`Failed to preload image ${uri}:`, error);
          })
        )
      );

      // Small delay between batches to prevent blocking
      if (i + this.PRELOAD_BATCH_SIZE < uris.length) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
  }

  /**
   * Preload critical images (first few from each category)
   */
  public async preloadCriticalImages(): Promise<void> {
    if (!this.dataset) return;

    const criticalImages = [
      ...this.dataset.apples.slice(0, 3).map((img) => img.uri),
      ...this.dataset.notApples.slice(0, 3).map((img) => img.uri),
    ];

    console.log('AssetManager: Preloading critical images...');
    await this.preloadImages(criticalImages, { priority: 'high' });
    console.log('AssetManager: Critical images preloaded');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): CacheStats {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate =
      totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

    let totalSize = 0;
    let totalLoadTime = 0;
    let imageCount = 0;

    this.imageCache.forEach((cached) => {
      if (cached.size) totalSize += cached.size;
      totalLoadTime += cached.loadTime;
      imageCount++;
    });

    return {
      totalImages: imageCount,
      totalSize,
      hitRate: Math.round(hitRate * 10) / 10,
      averageLoadTime:
        imageCount > 0 ? Math.round(totalLoadTime / imageCount) : 0,
    };
  }

  /**
   * Clear image cache
   */
  public clearCache(): void {
    this.imageCache.clear();
    this.loadingPromises.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    console.log('AssetManager: Cache cleared');
  }

  /**
   * Optimize cache by removing least recently used items
   */
  public optimizeCache(): void {
    const stats = this.getCacheStats();

    if (
      stats.totalImages <= this.MAX_CACHE_ITEMS &&
      stats.totalSize <= this.MAX_CACHE_SIZE
    ) {
      return; // No optimization needed
    }

    console.log('AssetManager: Optimizing cache...');

    // Sort by last accessed time (oldest first)
    const entries = Array.from(this.imageCache.entries()).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed
    );

    // Remove oldest entries until we're under limits
    let removedCount = 0;
    let removedSize = 0;

    for (const [uri, cached] of entries) {
      if (
        this.imageCache.size <= this.MAX_CACHE_ITEMS * 0.8 &&
        stats.totalSize - removedSize <= this.MAX_CACHE_SIZE * 0.8
      ) {
        break;
      }

      this.imageCache.delete(uri);
      removedCount++;
      if (cached.size) removedSize += cached.size;
    }

    console.log(
      `AssetManager: Removed ${removedCount} items (${(
        removedSize /
        1024 /
        1024
      ).toFixed(1)}MB) from cache`
    );
  }

  /**
   * Perform the actual image loading
   */
  private async performImageLoad(
    uri: string,
    options: LoadingOptions
  ): Promise<CachedImage> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => {
          const loadTime = Date.now() - startTime;
          const cached: CachedImage = {
            uri,
            width,
            height,
            loadTime,
            lastAccessed: Date.now(),
          };

          // Cache the image
          this.imageCache.set(uri, cached);

          // Preload the actual image data
          if (options.preload) {
            Image.prefetch(uri).catch((error) => {
              console.warn(`Failed to prefetch ${uri}:`, error);
            });
          }

          resolve(cached);
        },
        (error) => {
          console.error(`Failed to load image ${uri}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Clean up old cache entries periodically
   */
  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    let removedCount = 0;

    this.imageCache.forEach((cached, uri) => {
      if (now - cached.lastAccessed > maxAge) {
        this.imageCache.delete(uri);
        removedCount++;
      }
    });

    if (removedCount > 0) {
      console.log(
        `AssetManager: Cleaned up ${removedCount} old cache entries`
      );
    }

    // Also optimize if cache is getting too large
    this.optimizeCache();
  }

  /**
   * Shuffle array utility
   * @param array Array to shuffle
   * @returns Shuffled copy of array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
