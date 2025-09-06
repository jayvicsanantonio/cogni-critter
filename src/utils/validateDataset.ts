/**
 * Dataset Validation Utility
 *
 * Simple validation script to ensure the ImageDatasetService works correctly
 */

import { ImageDatasetService } from '../services/ImageDatasetService';

export const validateDataset = () => {
  console.log('🔍 Validating Image Dataset Service...');

  try {
    const service = ImageDatasetService.getInstance();

    // Test basic functionality
    const stats = service.getDatasetStats();
    console.log('📊 Dataset Stats:', stats);

    // Test teaching set
    const teachingSet = service.getTeachingSet(8);
    console.log(`📚 Teaching Set: ${teachingSet.length} images`);
    console.log(
      '   Apple images:',
      teachingSet.filter((img) => img.label === 'apple').length
    );
    console.log(
      '   Non-apple images:',
      teachingSet.filter((img) => img.label === 'not_apple').length
    );

    // Test testing set
    const testingSet = service.getTestingSet(6);
    console.log(`🧪 Testing Set: ${testingSet.length} images`);

    // Test placeholder functionality
    const placeholderTeaching = service.getPlaceholderTeachingSet(6);
    console.log(
      `🎨 Placeholder Teaching Set: ${placeholderTeaching.length} images`
    );

    // Test random image
    const randomImage = service.getRandomImage();
    console.log(
      '🎲 Random Image:',
      randomImage.id,
      randomImage.label
    );

    console.log('✅ Dataset validation completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Dataset validation failed:', error);
    return false;
  }
};

// Run validation if this file is executed directly
if (require.main === module) {
  validateDataset();
}
