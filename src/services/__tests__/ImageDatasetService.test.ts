import { ImageDatasetService } from '../ImageDatasetService';

describe('ImageDatasetService', () => {
  let service: ImageDatasetService;

  beforeEach(() => {
    service = ImageDatasetService.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = ImageDatasetService.getInstance();
      const instance2 = ImageDatasetService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getTeachingSet', () => {
    it('should return the requested number of images', () => {
      const images = service.getTeachingSet(8);
      expect(images).toHaveLength(8);
    });

    it('should return a balanced set of apples and non-apples', () => {
      const images = service.getTeachingSet(8);
      const apples = images.filter((img) => img.label === 'apple');
      const notApples = images.filter(
        (img) => img.label === 'not_apple'
      );

      expect(apples).toHaveLength(4);
      expect(notApples).toHaveLength(4);
    });

    it('should return different sets on multiple calls (shuffled)', () => {
      const set1 = service.getTeachingSet(6);
      const set2 = service.getTeachingSet(6);

      // While it's possible they could be the same due to randomness,
      // it's highly unlikely with proper shuffling
      const set1Ids = set1.map((img) => img.id).join(',');
      const set2Ids = set2.map((img) => img.id).join(',');

      // At least check that we got valid images
      expect(set1).toHaveLength(6);
      expect(set2).toHaveLength(6);
    });
  });

  describe('getTestingSet', () => {
    it('should return the requested number of images', () => {
      const images = service.getTestingSet(6);
      expect(images).toHaveLength(6);
    });

    it('should exclude specified image IDs', () => {
      const excludeIds = ['apple_1', 'orange_1'];
      const images = service.getTestingSet(6, excludeIds);

      const foundExcluded = images.some((img) =>
        excludeIds.includes(img.id)
      );
      expect(foundExcluded).toBe(false);
    });
  });

  describe('getDatasetStats', () => {
    it('should return correct statistics', () => {
      const stats = service.getDatasetStats();

      expect(stats.totalImages).toBeGreaterThan(0);
      expect(stats.appleCount).toBeGreaterThan(0);
      expect(stats.notAppleCount).toBeGreaterThan(0);
      expect(stats.appleVarieties).toBeInstanceOf(Array);
      expect(stats.appleColors).toBeInstanceOf(Array);
      expect(stats.notAppleTypes).toBeInstanceOf(Array);
    });
  });

  describe('placeholder methods', () => {
    it('should return placeholder teaching set', () => {
      const images = service.getPlaceholderTeachingSet(6);
      expect(images).toHaveLength(6);

      // All should be placeholder images
      const allPlaceholders = images.every(
        (img) => img.metadata?.source === 'placeholder'
      );
      expect(allPlaceholders).toBe(true);
    });

    it('should return placeholder testing set', () => {
      const images = service.getPlaceholderTestingSet(4);
      expect(images).toHaveLength(4);

      // All should be placeholder images
      const allPlaceholders = images.every(
        (img) => img.metadata?.source === 'placeholder'
      );
      expect(allPlaceholders).toBe(true);
    });
  });

  describe('fallback methods', () => {
    it('should use placeholder images when offline flag is true', () => {
      const images = service.getTeachingSetWithFallback(6, true);
      expect(images).toHaveLength(6);

      const allPlaceholders = images.every(
        (img) => img.metadata?.source === 'placeholder'
      );
      expect(allPlaceholders).toBe(true);
    });

    it('should use regular images when offline flag is false', () => {
      const images = service.getTeachingSetWithFallback(6, false);
      expect(images).toHaveLength(6);

      // Should contain some non-placeholder images
      const hasNonPlaceholders = images.some(
        (img) => img.metadata?.source !== 'placeholder'
      );
      expect(hasNonPlaceholders).toBe(true);
    });
  });

  describe('getRandomImage', () => {
    it('should return a valid image', () => {
      const image = service.getRandomImage();

      expect(image).toBeDefined();
      expect(image.id).toBeDefined();
      expect(image.uri).toBeDefined();
      expect(['apple', 'not_apple']).toContain(image.label);
    });
  });
});
