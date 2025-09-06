#!/usr/bin/env node

/**
 * Model Download Script
 * Downloads TensorFlow.js models for local bundling
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const MODELS_DIR = path.join(
  __dirname,
  '..',
  'src',
  'assets',
  'models'
);
const MOBILENET_DIR = path.join(MODELS_DIR, 'mobilenet_v2');

// Model URLs
const MOBILENET_BASE_URL =
  'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1';

/**
 * Download a file from URL
 */
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download ${url}: ${response.statusCode}`
            )
          );
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`Downloaded: ${path.basename(destination)}`);
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(destination, () => {}); // Delete partial file
          reject(err);
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

/**
 * Create directory if it doesn't exist
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

/**
 * Download MobileNetV2 model
 */
async function downloadMobileNet() {
  console.log('Downloading MobileNetV2 model...');

  ensureDir(MOBILENET_DIR);

  try {
    // Download model.json
    await downloadFile(
      `${MOBILENET_BASE_URL}/model.json`,
      path.join(MOBILENET_DIR, 'model.json')
    );

    // Download model weights
    await downloadFile(
      `${MOBILENET_BASE_URL}/model_weights.bin`,
      path.join(MOBILENET_DIR, 'model_weights.bin')
    );

    console.log('✅ MobileNetV2 model downloaded successfully!');

    // Create a manifest file
    const manifest = {
      name: 'MobileNetV2',
      version: '1.0.0',
      downloadDate: new Date().toISOString(),
      files: ['model.json', 'model_weights.bin'],
      totalSize: getTotalSize(MOBILENET_DIR),
    };

    fs.writeFileSync(
      path.join(MOBILENET_DIR, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    console.log(
      `Model manifest created: ${path.join(
        MOBILENET_DIR,
        'manifest.json'
      )}`
    );
  } catch (error) {
    console.error(
      '❌ Failed to download MobileNetV2:',
      error.message
    );
    process.exit(1);
  }
}

/**
 * Get total size of files in directory
 */
function getTotalSize(dirPath) {
  let totalSize = 0;

  try {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    });
  } catch (error) {
    console.warn('Could not calculate total size:', error.message);
  }

  return totalSize;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting model download...');
  console.log(`Models will be saved to: ${MODELS_DIR}`);

  try {
    await downloadMobileNet();

    console.log('\n✅ All models downloaded successfully!');
    console.log('\n📝 Next steps:');
    console.log(
      '1. Verify the downloaded files in src/assets/models/'
    );
    console.log(
      '2. Update your metro.config.js to include .bin and .json extensions'
    );
    console.log('3. Test the app to ensure models load correctly');
  } catch (error) {
    console.error('\n❌ Download failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  downloadMobileNet,
  downloadFile,
  ensureDir,
};
