# CogniCritter

Sorter Machine Gameplay and on-device ML using React Native + TensorFlow.js.

## Version Matrix (pinned)

- React Native: 0.73.6 (Hermes)
- React: 18.2.0
- @tensorflow/tfjs: 3.11.0
- @tensorflow/tfjs-react-native: ^0.8.0
- @tensorflow-models/mobilenet: ^2.1.0

We pin the TFJS transitive packages using npm overrides to avoid accidental upgrades:

```
"overrides": {
  "@tensorflow/tfjs": "3.11.0",
  "@tensorflow/tfjs-core": "3.11.0",
  "@tensorflow/tfjs-backend-cpu": "3.11.0",
  "@tensorflow/tfjs-backend-webgl": "3.11.0"
}
```

## Setup

- New here? Follow the beginner guide: docs/getting-started.md
- iOS: `cd ios && pod install && cd ..`
- Start: `npx react-native start --reset-cache`
- Run iOS: `npx react-native run-ios`
- Run Android: `npx react-native run-android`

## Development notes

- Gameplay architecture: see docs/sorter-machine-gameplay-architecture.md for how the spec maps to the codebase and recent implementation notes.

- Mobilenet embeddings via `@tensorflow-models/mobilenet`. We fine-tune a small dense classifier on embeddings for apple vs not_apple.
- Image preprocessing uses `tfjs-react-native` (decodeJpeg + resize + normalize) — compatible with RN, no DOM APIs.

## CI

GitHub Actions runs typecheck and tests. See `.github/workflows/ci.yml`.

## Performance profiling

See `docs/performance-profiling.md` for steps to profile inference latency and memory on device.

## Offline model bundling (MobileNetV2)

The app prefers a locally bundled MobileNetV2 feature extractor for offline gameplay. To set it up:

1. Download the model assets into the repo (bundled with the app):
   - npm run download-models
   - This places files under src/assets/models/mobilenet_v2/{model.json, model_weights.bin}
2. Ensure Metro is configured to include .bin and .json assets (already configured in metro.config.js).
3. Rebuild the app (the local model will be used automatically). If the local model is not found, the app falls back to @tensorflow-models/mobilenet (network).

Notes:
- You must run the download step before bundling so Metro can package the assets.
- Model load time and prediction time are instrumented; see the profiling guide.

## Assets (sprites and fonts)

- Place grayscale critter sprites under src/assets/:
  - critter_idle_grayscale.png
  - critter_thinking_grayscale.png
  - critter_happy_grayscale.png
  - critter_confused_grayscale.png
- Add Nunito (ExtraBold) and Poppins (Regular) fonts under src/assets/fonts and link them via react-native.config.js, then run pod install on iOS.

