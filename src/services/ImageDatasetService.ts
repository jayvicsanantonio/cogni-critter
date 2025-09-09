import type { ImageDataset, ImageItem } from '@/types/mlTypes'
import {
  getPlaceholderTeachingSet,
  getPlaceholderTestingSet,
} from '@utils/placeholderImages'

/**
 * ImageDatasetService
 *
 * Manages the sample image dataset for apple/not-apple classification.
 * Provides training and testing image sets with proper labeling.
 *
 * Features:
 * - Curated apple and non-apple image collections
 * - Balanced dataset for effective training
 * - Metadata for educational insights
 * - Easy expansion for additional categories
 */
export class ImageDatasetService {
  private static instance: ImageDatasetService
  private dataset: ImageDataset

  private constructor() {
    this.dataset = this.initializeDataset()
  }

  public static getInstance(): ImageDatasetService {
    if (!ImageDatasetService.instance) {
      ImageDatasetService.instance = new ImageDatasetService()
    }
    return ImageDatasetService.instance
  }

  /**
   * Initialize the sample dataset with placeholder images
   * In a real implementation, these would be actual image URLs or local assets
   */
  private initializeDataset(): ImageDataset {
    const apples: ImageItem[] = [
      {
        id: 'apple_1',
        uri: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=224&h=224&fit=crop',
        label: 'apple',
        metadata: {
          variety: 'Red Delicious',
          color: 'red',
          source: 'unsplash',
        },
      },
      {
        id: 'apple_2',
        uri: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=224&h=224&fit=crop',
        label: 'apple',
        metadata: {
          variety: 'Granny Smith',
          color: 'green',
          source: 'unsplash',
        },
      },
      {
        id: 'apple_3',
        uri: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=224&h=224&fit=crop',
        label: 'apple',
        metadata: {
          variety: 'Golden Delicious',
          color: 'yellow',
          source: 'unsplash',
        },
      },
      {
        id: 'apple_4',
        uri: 'https://images.unsplash.com/photo-1590005354167-6da97870c757?w=224&h=224&fit=crop',
        label: 'apple',
        metadata: {
          variety: 'Gala',
          color: 'red-yellow',
          source: 'unsplash',
        },
      },
      {
        id: 'apple_5',
        uri: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=224&h=224&fit=crop',
        label: 'apple',
        metadata: {
          variety: 'Fuji',
          color: 'red',
          source: 'unsplash',
        },
      },
      {
        id: 'apple_6',
        uri: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=224&h=224&fit=crop',
        label: 'apple',
        metadata: {
          variety: 'Honeycrisp',
          color: 'red-yellow',
          source: 'unsplash',
        },
      },
      {
        id: 'apple_7',
        uri: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=224&h=224&fit=crop',
        label: 'apple',
        metadata: {
          variety: 'Pink Lady',
          color: 'pink',
          source: 'unsplash',
        },
      },
      {
        id: 'apple_8',
        uri: 'https://images.unsplash.com/photo-1576179635662-9d1983e97e1e?w=224&h=224&fit=crop',
        label: 'apple',
        metadata: {
          variety: 'Braeburn',
          color: 'red-green',
          source: 'unsplash',
        },
      },
    ]

    const notApples: ImageItem[] = [
      {
        id: 'orange_1',
        uri: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=224&h=224&fit=crop',
        label: 'not_apple',
        metadata: {
          variety: 'Orange',
          color: 'orange',
          source: 'unsplash',
        },
      },
      {
        id: 'banana_1',
        uri: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=224&h=224&fit=crop',
        label: 'not_apple',
        metadata: {
          variety: 'Banana',
          color: 'yellow',
          source: 'unsplash',
        },
      },
      {
        id: 'pear_1',
        uri: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=224&h=224&fit=crop',
        label: 'not_apple',
        metadata: {
          variety: 'Pear',
          color: 'green',
          source: 'unsplash',
        },
      },
      {
        id: 'grape_1',
        uri: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=224&h=224&fit=crop',
        label: 'not_apple',
        metadata: {
          variety: 'Grapes',
          color: 'purple',
          source: 'unsplash',
        },
      },
      {
        id: 'strawberry_1',
        uri: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=224&h=224&fit=crop',
        label: 'not_apple',
        metadata: {
          variety: 'Strawberry',
          color: 'red',
          source: 'unsplash',
        },
      },
      {
        id: 'lemon_1',
        uri: 'https://images.unsplash.com/photo-1590502593747-42a4e0fd2c78?w=224&h=224&fit=crop',
        label: 'not_apple',
        metadata: {
          variety: 'Lemon',
          color: 'yellow',
          source: 'unsplash',
        },
      },
      {
        id: 'peach_1',
        uri: 'https://images.unsplash.com/photo-1629828874514-d71ba34d624b?w=224&h=224&fit=crop',
        label: 'not_apple',
        metadata: {
          variety: 'Peach',
          color: 'orange-pink',
          source: 'unsplash',
        },
      },
      {
        id: 'kiwi_1',
        uri: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=224&h=224&fit=crop',
        label: 'not_apple',
        metadata: {
          variety: 'Kiwi',
          color: 'brown-green',
          source: 'unsplash',
        },
      },
    ]

    return { apples, notApples }
  }

  /**
   * Get a balanced set of images for the teaching phase
   * @param count Total number of images to return (will be split evenly)
   */
  public getTeachingSet(count: number = 8): ImageItem[] {
    const halfCount = Math.floor(count / 2)
    const appleImages = this.shuffleArray([...this.dataset.apples]).slice(
      0,
      halfCount
    )
    const notAppleImages = this.shuffleArray([...this.dataset.notApples]).slice(
      0,
      halfCount
    )

    // Combine and shuffle the final set
    return this.shuffleArray([...appleImages, ...notAppleImages])
  }

  /**
   * Get a set of images for the testing phase
   * Uses different images from the teaching set when possible
   * @param count Total number of images to return
   * @param excludeIds Array of image IDs to exclude (from teaching set)
   */
  public getTestingSet(
    count: number = 6,
    excludeIds: string[] = []
  ): ImageItem[] {
    const availableApples = this.dataset.apples.filter(
      (img) => !excludeIds.includes(img.id)
    )
    const availableNotApples = this.dataset.notApples.filter(
      (img) => !excludeIds.includes(img.id)
    )

    const halfCount = Math.floor(count / 2)
    const appleImages = this.shuffleArray(availableApples).slice(0, halfCount)
    const notAppleImages = this.shuffleArray(availableNotApples).slice(
      0,
      halfCount
    )

    return this.shuffleArray([...appleImages, ...notAppleImages])
  }

  /**
   * Get all available images
   */
  public getAllImages(): ImageItem[] {
    return [...this.dataset.apples, ...this.dataset.notApples]
  }

  /**
   * Get images by label
   */
  public getImagesByLabel(label: 'apple' | 'not_apple'): ImageItem[] {
    return label === 'apple' ? this.dataset.apples : this.dataset.notApples
  }

  /**
   * Get dataset statistics for educational insights
   */
  public getDatasetStats() {
    const appleVarieties = new Set(
      this.dataset.apples.map((img) => img.metadata?.variety)
    )
    const appleColors = new Set(
      this.dataset.apples.map((img) => img.metadata?.color)
    )
    const notAppleTypes = new Set(
      this.dataset.notApples.map((img) => img.metadata?.variety)
    )

    return {
      totalImages: this.dataset.apples.length + this.dataset.notApples.length,
      appleCount: this.dataset.apples.length,
      notAppleCount: this.dataset.notApples.length,
      appleVarieties: Array.from(appleVarieties),
      appleColors: Array.from(appleColors),
      notAppleTypes: Array.from(notAppleTypes),
    }
  }

  /**
   * Utility function to shuffle an array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Add a new image to the dataset (for future expansion)
   */
  public addImage(image: ImageItem): void {
    if (image.label === 'apple') {
      this.dataset.apples.push(image)
    } else {
      this.dataset.notApples.push(image)
    }
  }

  /**
   * Get a random image for demonstration purposes
   */
  public getRandomImage(): ImageItem {
    const allImages = this.getAllImages()
    const randomIndex = Math.floor(Math.random() * allImages.length)
    return allImages[randomIndex]
  }

  /**
   * Get placeholder images for offline mode
   */
  public getPlaceholderTeachingSet(count: number = 6): ImageItem[] {
    return getPlaceholderTeachingSet(count)
  }

  /**
   * Get placeholder testing images for offline mode
   */
  public getPlaceholderTestingSet(
    count: number = 4,
    excludeIds: string[] = []
  ): ImageItem[] {
    return getPlaceholderTestingSet(count, excludeIds)
  }

  /**
   * Check if running in offline mode and return appropriate dataset
   */
  public getTeachingSetWithFallback(
    count: number = 8,
    useOffline: boolean = false
  ): ImageItem[] {
    if (useOffline) {
      return this.getPlaceholderTeachingSet(count)
    }
    return this.getTeachingSet(count)
  }

  /**
   * Check if running in offline mode and return appropriate testing dataset
   */
  public getTestingSetWithFallback(
    count: number = 6,
    excludeIds: string[] = [],
    useOffline: boolean = false
  ): ImageItem[] {
    if (useOffline) {
      return this.getPlaceholderTestingSet(count, excludeIds)
    }
    return this.getTestingSet(count, excludeIds)
  }
}
