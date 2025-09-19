# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: CogniCritter — React Native + Expo app with on-device ML (TensorFlow.js) and a gameplay loop that teaches supervised learning via a sorter mini-game.

Quickstart (Node >= 18)
- Install deps: npm install
- iOS (Sim):
  - If ios/ exists: cd ios && pod install
  - If ios/ does NOT exist: npm run prebuild:ios && cd ios && pod install
  - Run: npm run ios
- Android (Emulator running): npm run android
- Expo Dev Client (LAN): npm run start (Metro + Dev Client)
- iOS Dev (concurrent Metro + run iOS): npm run dev:ios

Common commands
- Type check: npm run typecheck
- Lint (Biome): npm run lint
- Lint fix: npm run lint:fix
- Format: npm run format
- Tests (Jest): npm test
- Start Metro (clear cache): npx react-native start --reset-cache
- Download offline model assets (MobileNetV2): npm run download-models

Jest usage examples
- Run one file: npx jest src/services/__tests__/MLService.training.smoke.test.ts
- Pattern by name: npx jest -t "training completes"
- Watch a file: npx jest src/components/__tests__/AnimatedCritter.test.tsx --watch
- Update snapshots: npx jest -u

Important environment notes
- macOS + Xcode/CocoaPods for iOS, Android SDK + JDK 17 for Android (details in docs/getting-started.md)
- If iOS build fails and ios/ is missing, run npm run prebuild:ios then pod install.
- Before bundling for offline ML, run npm run download-models so Metro can include model assets.

High-level architecture and flow
- Entry and runtime init
  - index.js registers App via Expo registerRootComponent.
  - App.tsx initializes TensorFlow.js (initializeTensorFlow) early; shows a loading screen, tolerates init errors (app continues with limited ML).
  - Dev-only features: performance overlay (DevPerfOverlay), debug menu (DevDebugMenu), triple-tap hotspot (top-left) to open debug menu, controlled via devSettings.

- Navigation and first-run logic
  - src/screens/AppNavigator.tsx controls initial route:
    - First-time users → HatchingScreen (personalize critter color and persist)
    - Returning users → GameScreen with persisted color
  - UserPreferencesService persists first-run state and critter color.

- Gameplay loop (phases managed via a finite state machine)
  - GameScreen.tsx orchestrates the entire loop and ties together services, state, and UI:
    - State managed by gameReducer (src/utils/gameStateManager.ts) with explicit transitions:
      INITIALIZING → LOADING_MODEL → TEACHING_PHASE → TRAINING_MODEL → TESTING_PHASE → RESULTS_SUMMARY
    - TeachingPhase: user manually sorts images (labeling); progress gates (min/max examples) and optional auto-transition to training.
    - Training: MLService trains a small classifier on MobileNet embeddings.
    - TestingPhase: model predicts; image animates to chosen bin; critter reacts; score accumulates.
    - ResultsSummaryScreen: shows accuracy and summary; restart available.
  - Image datasets: ImageDatasetService supplies teaching/testing images with basic exclusion between sets.
  - Persistence: ScorePersistenceService saves session summaries; UserPreferencesService stores critter color and first-run flag.
  - App lifecycle: appStateManager handles background/foreground snapshots; memoryManager initializes/cleans up tensor limits.

- ML pipeline (TensorFlow.js)
  - TensorFlow init: src/utils/tensorflowSetup.ts (await tf.ready()).
  - Model loading strategy in MLService (src/services/MLService.ts):
    - Prefer locally bundled MobileNetV2 feature extractor (src/utils/localMobileNet.ts using bundleResourceIO) when assets exist under src/assets/models/mobilenet_v2/.
    - Fallback to @tensorflow-models/mobilenet (network fetch) when local is unavailable.
    - Robust load: timeout + retries; timing recorded via performanceMetrics.
  - Training and classification:
    - Images are preprocessed (imageProcessing) and passed through the feature extractor for embeddings.
    - A small classifier is trained on user-provided examples; classification includes timeout handling and disposes tensors via memoryManager.
  - Model assets and Metro:
    - metro.config.js includes asset extensions (bin, json, etc.) needed for bundling model files.
    - Run npm run download-models to fetch model.json and model_weights.bin into src/assets/models/mobilenet_v2 before building.

- UI/Animation and interaction
  - AnimatedCritter: crossfade transitions between critter states (IDLE/THINKING/HAPPY/CONFUSED), color-tinted sprites, native driver for 60fps.
  - SortingInterface coordinates ImageCard drag-and-drop and SortingBin highlights; consistent bin semantics across phases: Left = Not Apple, Right = Apple.
  - TestingPhase animates image-to-bin paths based on prediction, shows celebratory effects, and updates emotional state with critterEmotionalStateManager.

- Performance instrumentation
  - performanceMonitor and performanceMetrics provide frame rate, memory, and timing collection; operations instrumented: modelLoad, prediction, animation.
  - Dev overlay (DevPerfOverlay) surfaces real-time metrics in development.

Key repo conventions and configs (from CLAUDE.md, tsconfig, metro/babel)
- TypeScript: strict mode; noEmit; React JSX; path aliases configured in tsconfig.json and mirrored via Babel module-resolver and Metro alias:
  - @/* → src/*
  - @components/*, @screens/*, @services/*, @types/*, @utils/*, @assets/*
- Lint/format: Biome (npx @biomejs/biome ...) for linting and formatting.
- Performance targets: 60fps goal; ~250ms animations; prediction timeout ~1s; dispose tensors to avoid leaks.
- CI (GitHub Actions): Node 18, npm ci, npm run typecheck, and Jest (npx jest --ci --runInBand).
- Consistent bin order and scoring: maintained across teaching and testing; critter mood ties to correctness.

Version and tooling notes
- package.json currently declares React Native 0.74.7, Expo SDK 51, and @tensorflow/tfjs ^4.13.x. CLAUDE.md matches these. The README’s older version matrix references RN 0.73.x and tfjs 3.11.x; rely on package.json and the npm overrides in this repo as the source of truth.

When to prefer local model vs network
- For reliable, offline performance: run npm run download-models, verify files exist under src/assets/models/mobilenet_v2/, then rebuild the app so localMobileNet can be bundled and used.
- If the local bundle isn’t present, MLService falls back to @tensorflow-models/mobilenet with network fetch.

Troubleshooting quick tips
- Metro cache hiccups: npx react-native start --reset-cache (or npm run start which clears via Expo start flags).
- iOS build missing pods: ensure ios/ exists (npm run prebuild:ios), then cd ios && pod install.
- Model not found at runtime: confirm model files exist in src/assets/models/mobilenet_v2 and were present before bundling.
