/**
 * Asset Manager Utility
 * Handles loading, caching, and management of game assets
 */

import { ImageItem, ImageDataset } from '@types/mlTypes';
import { SampleImages } from '@assets/index';

/**
 * Asset Manager Class
 * Manages image loading, caching, and dataset preparation
 */
export class AssetManager {
  private static instance: AssetManager;
  private imageCache: Map<string, any> = new Map();
  private dataset: ImageDataset | null = null;

  private constructor() {}

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
  public getTeachingImages(count: number = 8): ImageItem[] {
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

    return this.shuffleArray([...appleImages, ...notAppleImages]);
  }

  /**
   * Get a random selection of images for testing phase
   * @param count Number of images to select
   * @returns Array of mixed apple and non-apple images
   */
  public getTestingImages(count: number = 5): ImageItem[] {
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

    return this.shuffleArray([...appleImages, ...notAppleImages]);
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
   * Clear image cache
   */
  public clearCache(): void {
    this.imageCache.clear();
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
