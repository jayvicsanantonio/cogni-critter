/**
 * Error Handling Types
 */

export interface ErrorHandler {
  handleModelLoadError(error: Error): void
  handlePredictionError(error: Error): void
  handleAnimationError(error: Error): void
  showUserFriendlyError(message: string): void
}

export interface PerformanceMetrics {
  frameRate: number // Target: 60fps, Minimum: 45fps
  modelLoadTime: number // Target: <5s, Maximum: 10s
  predictionTime: number // Target: <500ms, Maximum: 1s
  memoryUsage: number // Target: <100MB, Maximum: 150MB
}
