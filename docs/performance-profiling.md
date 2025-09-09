# Performance Profiling Guide

This guide explains how to measure and validate runtime performance for the Sorter Machine gameplay.

## What we track

- Animation FPS and stability (60 fps target, 45 fps minimum)
- Model load time and prediction latency
- Tensor/memory usage over time

## Tools in this repo

- utils/performanceMonitor.ts
  - Collects frame rates, detects drops, and adjusts quality (high/medium/low)
- utils/performanceMetrics.ts
  - Aggregates metrics, records timing for model load and predictions, and produces reports
- utils/performanceValidation.ts
  - Quick animation validation helpers (average/min FPS, frame drops)

## How to run checks

1) Dev run and manual interaction
- Launch the app (iOS/Android). Interact across hatching, teaching, testing.
- Watch JS logs for performance messages (average FPS, drops, memory snapshots). You can add more logs by calling the helper functions in screens/components during development.

2) Programmatic sampling
- You can import PerformanceMonitor in a test component and call testAnimationPerformance(durationMs) to get a snapshot.

3) Model timings
- Model load and prediction are automatically instrumented via performanceMetrics.startTiming().
- After a test session, call performanceMetrics.generateReport() to produce an aggregated summary with issues and recommendations.

## Acceptance thresholds

- Target: 60 fps average; Minimum: 45 fps
- Model load: < 10s; Prediction: < 1s
- Memory: < 150MB in TFJS tracked memory, with no upward leakage trend

## Optimizations if failing

- Prefer the local (bundled) MobileNetV2 feature extractor (no network).
- Ensure all Animated.timing/Animated.spring use useNativeDriver: true.
- Reduce animation complexity or texture sizes on low-end devices.
- Check tensor disposal paths (memoryManager.safeTensorDispose/safeTensorArrayDispose).
- Consider lowering the custom classifier width (units) or epochs for very small datasets.
