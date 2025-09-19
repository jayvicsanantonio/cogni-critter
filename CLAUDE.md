# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Essential Commands:**
- `npm run typecheck` - TypeScript type checking (required before commits)
- `npm run lint` - Biome linting
- `npm run lint:fix` - Auto-fix Biome lint issues
- `npm run format` - Format code with Biome
- `npm test` - Run Jest tests
- `npm run download-models` - Download MobileNetV2 model for offline ML

**React Native Development:**
- `npm run start` - Start Expo dev server with dev client
- `npm run ios` - Run on iOS simulator (React Native CLI)
- `npm run ios:expo` - Run on iOS via Expo
- `npm run dev:ios` - Concurrent Metro + iOS development
- `npm run prebuild:ios` - Expo prebuild for iOS

**iOS Setup:** `cd ios && pod install && cd ..`

## Architecture Overview

**Tech Stack:**
- React Native 0.74.7 with Expo SDK 51
- TypeScript with strict mode enabled
- TensorFlow.js 4.13.0 for on-device ML
- MobileNet model for image classification
- Biome for linting and formatting

**Core Application Flow:**
1. **HatchingScreen** - First-time user onboarding with critter customization
2. **GameScreen** - Main gameplay orchestration and phase management
3. **TeachingPhase** - User teaches the model with 5-10 labeled examples
4. **Training** - Transfer learning on MobileNet embeddings
5. **TestingPhase** - Model predicts on new images with critter reactions
6. **ResultsSummary** - Shows accuracy and provides restart option

**Key Services:**
- `MLService` - Handles model loading, training, and predictions with timeout handling
- `gameStateManager` - Finite state machine for game progression
- `performanceMetrics` - Frame rate, memory, and timing monitoring
- `errorHandler` - Centralized error handling with user-friendly messages

**Directory Structure:**
- `src/components/` - React components including AnimatedCritter, SortingInterface
- `src/screens/` - Screen-level components and navigation
- `src/services/` - Business logic and ML services
- `src/utils/` - Utility functions for performance, error handling, asset management
- `src/types/` - TypeScript type definitions
- `src/assets/` - Sprites, fonts, and bundled ML models

## ML Model Strategy

**Local Model Bundling:**
- Prefers locally bundled MobileNetV2 for offline gameplay
- Falls back to `@tensorflow-models/mobilenet` from CDN if local model unavailable
- Run `npm run download-models` to bundle model assets before building
- Model files located at `src/assets/models/mobilenet_v2/`

**Transfer Learning:**
- Extracts embeddings from MobileNet
- Trains small dense classifier on user-provided examples
- Built-in prediction timeout (1s) with fallback results
- Memory management with tensor disposal

## Code Conventions

**TypeScript:**
- Strict mode enabled with path mapping configured
- Import aliases: `@/`, `@components/`, `@screens/`, `@services/`, `@types/`, `@utils/`, `@assets/`
- Centralized types in `src/types/` directory

**Biome Configuration:**
- 2-space indentation
- Single quotes for strings
- Minimal semicolons
- ES5 trailing commas
- Comprehensive linting rules including a11y, performance, security

**Performance Requirements:**
- Target 60fps with native driver animations
- Validate performance with `PerformanceMetricsCollector` when making UI/ML changes
- Short animation durations (~250ms)
- Proper tensor and model disposal

## Testing

**CI Pipeline:**
- GitHub Actions runs on all branches and PRs
- Node.js 18 required
- Runs `npm run typecheck` and `npm test`
- Uses `jest --ci --runInBand` for test execution

**Test Structure:**
- Smoke tests for ML training paths in `src/services/__tests__/`
- Performance validation helpers available
- Exclude test files from TypeScript compilation

## Consistent Game Logic

**Sorting Bins:**
- Left bin = "Not Apple"
- Right bin = "Apple"
- Order maintained across teaching and testing phases

**State Management:**
- Reducer pattern with action helpers
- Validated state transitions
- Critter mood tied to scoring results

**Error Handling:**
- Centralized error management
- User-friendly messages with context
- Graceful fallbacks for model loading and prediction failures