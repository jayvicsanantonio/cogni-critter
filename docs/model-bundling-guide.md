# Model Bundling Guide

This guide explains how to bundle TensorFlow.js models locally for offline functionality in the CogniCritter app.

## Overview

The app uses MobileNetV2 for image classification. By default, the model is loaded from a remote URL, but for production apps, it's recommended to bundle the model locally for:

- Offline functionality
- Faster loading times
- Reduced network usage
- Better user experience

## Quick Start

1. **Download the models:**

   ```bash
   npm run download-models
   ```

2. **Verify the download:**
   Check that the following files exist:

   ```
   src/assets/models/mobilenet_v2/
   ├── model.json
   ├── model_weights.bin
   └── manifest.json
   ```

3. **Test the app:**
   The MLService will automatically detect and use the local models.

## Manual Download

If the automatic script doesn't work, you can download the models manually:

1. **Create the directory:**

   ```bash
   mkdir -p src/assets/models/mobilenet_v2
   ```

2. **Download model files:**

```bash
# Download tfjs-layers MobileNetV2 model.json
curl -o src/assets/models/mobilenet_v2/model.json \
  "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/model.json"

# Download model weights (the JSON references weights shards; download them if necessary)
# Typically metro bundling works best with bundleResourceIO. Alternatively, keep remote fallback.
```

## File Structure

```
src/assets/models/
├── README.md                 # Documentation
├── mobilenet_v2/            # MobileNetV2 model
│   ├── model.json          # Model architecture (~50KB)
│   ├── model_weights.bin   # Model weights (~14MB)
│   └── manifest.json       # Download metadata
└── [future models]/         # Additional models
```

## Configuration

### Metro Configuration

The `metro.config.js` has been updated to include the necessary asset extensions:

```javascript
resolver: {
  assetExts: ['bin', 'txt', 'jpg', 'png', 'json', 'mp4', 'ttf', 'otf', 'xml', 'svg'],
}
```

### Model Loading Logic

The `MLService` uses a fallback mechanism:

1. **First:** Try to load from local bundle (tfjs-layers model)
2. **Fallback:** Load from remote URL if local fails

This ensures the app works even if models aren't bundled.

## Build Considerations

### Bundle Size Impact

- **model.json:** ~50KB
- **model_weights.bin:** ~14MB
- **Total:** ~14MB added to app bundle

### Platform-Specific Notes

#### iOS

- Models are included in the app bundle automatically
- No additional configuration needed

#### Android

- Models are included in the APK
- Consider using App Bundle for dynamic delivery of large assets

## Verification

### Check Local Model Loading

Look for these console messages:

```
Loading MobileNetV2 from local bundle...
MobileNetV2 loaded successfully from local bundle
```

### Check Remote Fallback

If local models aren't found:

```
Loading MobileNetV2 from remote URL...
MobileNetV2 loaded successfully from remote
```

## Troubleshooting

### Models Not Loading Locally

1. **Check file paths:** Ensure files are in the correct directory
2. **Check file integrity:** Verify files aren't corrupted
3. **Check Metro config:** Ensure asset extensions are configured
4. **Clear cache:** Run `npx react-native start --reset-cache`

### Large Bundle Size

If the 14MB model size is too large:

1. **Use dynamic delivery:** Consider downloading models on first app launch
2. **Model optimization:** Use quantized or pruned models
3. **Progressive loading:** Load models as needed

### Network Issues During Download

1. **Check connectivity:** Ensure stable internet connection
2. **Use VPN:** Some regions may have restricted access to TensorFlow Hub
3. **Manual download:** Use the manual download method as fallback

## Future Enhancements

- **Model versioning:** Automatic model updates
- **Multiple models:** Support for different model variants
- **Compression:** Model compression for smaller bundle size
- **Caching:** Smart caching strategies for downloaded models

## Security Considerations

- **Model integrity:** Verify model checksums
- **Source validation:** Only download from trusted sources
- **Local storage:** Secure local model storage
