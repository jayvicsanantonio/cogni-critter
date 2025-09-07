/**
 * Memory Manager for TensorFlow.js Operations
 * Provides comprehensive memory management and cleanup for tensor operations
 * Requirements: 8.6
 */

import * as tf from '@tensorflow/tfjs';
import { errorHandler } from './errorHandler';

export interface MemoryThresholds {
  maxTensors: number;
  maxBytes: number;
  warningTensors: number;
  warningBytes: number;
}

export interface MemorySnapshot {
  numTensors: number;
  numDataBuffers: number;
  numBytes: number;
  timestamp: number;
  context?: string;
}

/**
 * Memory Manager Class
 * Handles tensor memory management, monitoring, and cleanup
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private snapshots: MemorySnapshot[] = [];
  private cleanupCallbacks: (() => void)[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  // Default thresholds
  private thresholds: MemoryThresholds = {
    maxTensors: 150,
    maxBytes: 150 * 1024 * 1024, // 150MB
    warningTensors: 100,
    warningBytes: 100 * 1024 * 1024, // 100MB
  };

  // Configuration
  private readonly SNAPSHOT_HISTORY_SIZE = 20;
  private readonly MONITORING_INTERVAL = 5000; // 5 seconds
  private readonly CLEANUP_BATCH_SIZE = 10;

  private constructor() {}

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Initialize memory monitoring
   */
  public initialize(
    customThresholds?: Partial<MemoryThresholds>
  ): void {
    if (customThresholds) {
      this.thresholds = { ...this.thresholds, ...customThresholds };
    }

    this.startMonitoring();
    this.takeSnapshot('initialization');

    console.log(
      'Memory manager initialized with thresholds:',
      this.thresholds
    );
  }

  /**
   * Cleanup memory manager
   */
  public cleanup(): void {
    this.stopMonitoring();
    this.executeCleanupCallbacks();
    this.snapshots = [];
    console.log('Memory manager cleaned up');
  }

  /**
   * Start memory monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.MONITORING_INTERVAL);

    this.isMonitoring = true;
    console.log('Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    console.log('Memory monitoring stopped');
  }

  /**
   * Take a memory snapshot
   */
  public takeSnapshot(context?: string): MemorySnapshot {
    const memory = tf.memory();
    const snapshot: MemorySnapshot = {
      numTensors: memory.numTensors,
      numDataBuffers: memory.numDataBuffers,
      numBytes: memory.numBytes,
      timestamp: Date.now(),
      context,
    };

    this.snapshots.push(snapshot);

    // Keep history size manageable
    if (this.snapshots.length > this.SNAPSHOT_HISTORY_SIZE) {
      this.snapshots = this.snapshots.slice(
        -this.SNAPSHOT_HISTORY_SIZE
      );
    }

    return snapshot;
  }

  /**
   * Execute function with memory tracking and cleanup
   */
  public async withMemoryTracking<T>(
    fn: () => Promise<T> | T,
    context?: string
  ): Promise<T> {
    const beforeSnapshot = this.takeSnapshot(`${context}_before`);

    try {
      const result = await fn();

      const afterSnapshot = this.takeSnapshot(`${context}_after`);
      this.logMemoryDelta(beforeSnapshot, afterSnapshot, context);

      return result;
    } catch (error) {
      // Take snapshot even on error for debugging
      this.takeSnapshot(`${context}_error`);

      errorHandler.handleTensorError(error as Error, {
        context,
        beforeMemory: beforeSnapshot,
      });

      throw error;
    }
  }

  /**
   * Safely dispose of tensor with error handling
   */
  public safeTensorDispose(
    tensor: tf.Tensor | null | undefined
  ): void {
    if (!tensor) {
      return;
    }

    try {
      if (!tensor.isDisposed) {
        tensor.dispose();
      }
    } catch (error) {
      errorHandler.handleTensorError(error as Error, {
        action: 'safeTensorDispose',
        tensorShape: tensor.shape,
      });
    }
  }

  /**
   * Safely dispose of multiple tensors
   */
  public safeTensorArrayDispose(
    tensors: (tf.Tensor | null | undefined)[]
  ): void {
    tensors.forEach((tensor, index) => {
      try {
        this.safeTensorDispose(tensor);
      } catch (error) {
        errorHandler.handleTensorError(error as Error, {
          action: 'safeTensorArrayDispose',
          tensorIndex: index,
        });
      }
    });
  }

  /**
   * Force garbage collection with error handling
   */
  public forceGarbageCollection(): void {
    try {
      const beforeMemory = tf.memory();

      // Dispose variables
      tf.disposeVariables();

      // Backend-specific cleanup
      this.performBackendSpecificCleanup();

      const afterMemory = tf.memory();

      console.log('Garbage collection completed:', {
        before: beforeMemory,
        after: afterMemory,
        freed: {
          tensors: beforeMemory.numTensors - afterMemory.numTensors,
          bytes: beforeMemory.numBytes - afterMemory.numBytes,
        },
      });
    } catch (error) {
      errorHandler.handleMemoryError(error as Error, {
        action: 'forceGarbageCollection',
      });
    }
  }

  /**
   * Register cleanup callback
   */
  public registerCleanupCallback(callback: () => void): () => void {
    this.cleanupCallbacks.push(callback);

    // Return unregister function
    return () => {
      const index = this.cleanupCallbacks.indexOf(callback);
      if (index > -1) {
        this.cleanupCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current memory usage
   */
  public getCurrentMemoryUsage(): tf.MemoryInfo {
    return tf.memory();
  }

  /**
   * Get memory usage history
   */
  public getMemoryHistory(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Check if memory usage is within safe limits
   */
  public isMemoryUsageSafe(): boolean {
    const memory = tf.memory();
    return (
      memory.numTensors <= this.thresholds.maxTensors &&
      memory.numBytes <= this.thresholds.maxBytes
    );
  }

  /**
   * Get memory usage percentage
   */
  public getMemoryUsagePercentage(): {
    tensors: number;
    bytes: number;
  } {
    const memory = tf.memory();
    return {
      tensors: (memory.numTensors / this.thresholds.maxTensors) * 100,
      bytes: (memory.numBytes / this.thresholds.maxBytes) * 100,
    };
  }

  /**
   * Perform emergency cleanup when memory is critical
   */
  public performEmergencyCleanup(): void {
    console.warn('Performing emergency memory cleanup');

    try {
      // Execute all cleanup callbacks
      this.executeCleanupCallbacks();

      // Force garbage collection
      this.forceGarbageCollection();

      // Take snapshot after cleanup
      this.takeSnapshot('emergency_cleanup');

      // Check if cleanup was successful
      if (!this.isMemoryUsageSafe()) {
        console.error(
          'Emergency cleanup failed to bring memory usage to safe levels'
        );

        errorHandler.handleMemoryError(
          new Error('Emergency cleanup insufficient'),
          {
            memoryAfterCleanup: tf.memory(),
            thresholds: this.thresholds,
          }
        );
      }
    } catch (error) {
      errorHandler.handleMemoryError(error as Error, {
        action: 'performEmergencyCleanup',
      });
    }
  }

  /**
   * Check memory usage and take action if needed
   */
  private checkMemoryUsage(): void {
    const memory = tf.memory();

    // Check for critical memory usage
    if (
      memory.numTensors > this.thresholds.maxTensors ||
      memory.numBytes > this.thresholds.maxBytes
    ) {
      console.error('Critical memory usage detected:', memory);
      this.performEmergencyCleanup();
      return;
    }

    // Check for warning levels
    if (
      memory.numTensors > this.thresholds.warningTensors ||
      memory.numBytes > this.thresholds.warningBytes
    ) {
      console.warn('High memory usage detected:', memory);

      // Perform gentle cleanup
      this.forceGarbageCollection();
    }
  }

  /**
   * Log memory delta between snapshots
   */
  private logMemoryDelta(
    before: MemorySnapshot,
    after: MemorySnapshot,
    context?: string
  ): void {
    const delta = {
      tensors: after.numTensors - before.numTensors,
      bytes: after.numBytes - before.numBytes,
      duration: after.timestamp - before.timestamp,
    };

    if (delta.tensors > 0 || Math.abs(delta.bytes) > 1024 * 1024) {
      // Log if tensors increased or bytes changed by >1MB
      console.log(`Memory delta ${context || ''}:`, {
        tensors:
          delta.tensors > 0 ? `+${delta.tensors}` : delta.tensors,
        bytes: `${delta.bytes > 0 ? '+' : ''}${(
          delta.bytes /
          1024 /
          1024
        ).toFixed(2)}MB`,
        duration: `${delta.duration}ms`,
      });
    }
  }

  /**
   * Execute all registered cleanup callbacks
   */
  private executeCleanupCallbacks(): void {
    this.cleanupCallbacks.forEach((callback, index) => {
      try {
        callback();
      } catch (error) {
        errorHandler.handleMemoryError(error as Error, {
          action: 'executeCleanupCallback',
          callbackIndex: index,
        });
      }
    });
  }

  /**
   * Perform backend-specific cleanup
   */
  private performBackendSpecificCleanup(): void {
    const backend = tf.getBackend();

    try {
      if (backend === 'webgl') {
        const webglBackend = tf.backend() as any;

        // Check for WebGL-specific cleanup methods
        if (
          webglBackend &&
          typeof webglBackend.checkCompileCompletion === 'function'
        ) {
          webglBackend.checkCompileCompletion();
        }

        if (
          webglBackend &&
          typeof webglBackend.getUniformLocations === 'function'
        ) {
          // Clear uniform location cache if available
          const locations = webglBackend.getUniformLocations();
          if (locations && typeof locations.clear === 'function') {
            locations.clear();
          }
        }
      }
    } catch (error) {
      console.warn('Backend-specific cleanup failed:', error);
    }
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();
