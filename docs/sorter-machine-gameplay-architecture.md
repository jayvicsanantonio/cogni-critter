# Sorter Machine Gameplay Architecture

This document maps the Sorter Machine gameplay specification to the codebase and highlights design decisions, best practices, and maintenance notes.

Overview
- Entry point: App.tsx initializes TensorFlow.js (with error tolerance) and renders the navigator.
- Navigation: src/screens/AppNavigator.tsx controls HatchingScreen -> GameScreen -> ResultsSummary.
- Game orchestration: src/screens/GameScreen.tsx owns the overall phase flow, integrates services, and wires callbacks.
- Teaching: src/components/TeachingPhase.tsx + SortingInterface (ImageCard + SortingBin).
- Testing: src/components/TestingPhase.tsx drives predictions and animations, with critter mood updates.
- Results: src/components/ResultsSummaryScreen.tsx shows accuracy, insights, and restart.

Key Components and Services
- AnimatedCritter: Crossfade sprite animations with color tinting and native driver for 60fps.
- SortingInterface: Coordinates ImageCard and SortingBins.
  - Consistent bin order across phases: Left = “Not Apple”, Right = “Apple”.
- ImageCard: Reanimated drag-and-drop gestures with spring animations and drop zone thresholds.
- SortingBin: Visual highlighting; accessible labels; friendly design.
- MLService (src/services/MLService.ts):
  - Prefers local MobileNetV2 feature extractor (offline) and falls back to @tensorflow-models/mobilenet.
  - Training via transfer learning: extract embeddings, train small dense classifier.
  - Built-in 1s prediction timeout with fallback result.
  - Memory tracked via memoryManager; timings via performanceMetrics.
- Game state (src/utils/gameStateManager.ts): Finite state machine with validated transitions and critter state updates tied to scoring.
- Error handling (src/utils/errorHandler.ts): Centralized, with user-friendly messages and contexts.
- Performance (src/utils/performanceMetrics.ts): Frame rate, memory, timings, and validation helpers.

Spec Compliance Highlights
- First-time flow (HatchingScreen): Color picker, preference persistence, and smooth transition to gameplay.
- Teaching phase: 5–10 examples, progress indicators, automatic transition.
- Training: Transfer learning on embeddings, adaptive hyper-parameters, validation and preprocessing.
- Testing phase: Built-in timeout for predictions, critter thinking, animated image-to-bin transitions, score updates, celebrations.
- Results: Accuracy, insights about bias and training diversity, restart.
- Reliability: Error handling for model loading, prediction timeouts, app state changes, and tensor cleanup.

Recent fixes and improvements
- Consistent bin order between teaching and testing phases (Left = Not Apple, Right = Apple).
- Single source of truth for prediction timeout by delegating to MLService.classifyImage(imageUri, maxPredictionTime).
- Type-safe App dev-settings subscription cleanup in App.tsx.
- Biome config adjusted for valid schema and JSON structure.

Best Practices and Maintenance
- State management: Prefer reducer + action helpers. Validate transitions with helper guards where applicable.
- ML: Always dispose tensors and models via memoryManager helpers. Use built-in imageToTensor pipeline.
- Animations: Use native driver and short durations (around 250ms). Keep animations declarative and self-contained.
- Performance: Periodically validate 60fps with PerformanceMetricsCollector when making UI/ML changes.
- Testing: Keep smoke tests for ML training paths (see src/services/__tests__). Consider adding interaction tests for drag-and-drop.
- Types: Centralize cross-cutting types under src/types; keep prop types co-located or imported from types/.
- Docs: Keep this doc updated when changing phase flows, ML model strategy, or error handling behavior.

Developer Commands
- Type check: npm run typecheck
- Lint: npm run lint
- Tests: npm test
- Download local MobileNetV2 model: npm run download-models

