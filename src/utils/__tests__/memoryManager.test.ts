/**
 * Memory Manager Tests
 * Tests for tensor memory management and cleanup
 * Requirements: 8.6
 */

import * as tf from '@tensorflow/tfjs';
import { memoryManager, MemoryManager } from '../memoryManager';

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  memory: jest.fn(),
  disposeVariables: jest.fn(),
  getBackend: jest.fn(),
  backend: jest.fn(),
}));

// Mock error handler
jest.mock('../errorHandler', () => ({
  errorHandler: {
    handleMemoryError: jest.fn(),
    handleTensorError: jest.fn(),
  },
}));

describe('MemoryManager', () => {
  const mockMemory = tf.memory as jest.MockedFunction<
    typeof tf.memory
  >;
  const mockDisposeVariables =
    tf.disposeVariables as jest.MockedFunction<
      typeof tf.disposeVariables
    >;
  const mockGetBackend = tf.getBackend as jest.MockedFunction<
    typeof tf.getBackend
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default memory state
    mockMemory.mockReturnValue({
      numTensors: 10,
      numDataBuffers: 5,
      numBytes: 1024 * 1024, // 1MB
      unreliable: false,
    });

    mockGetBackend.mockReturnValue('cpu');
  });

  afterEach(() => {
    memoryManager.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with default thresholds', () => {
      memoryManager.initialize();

      expect(memoryManager.isMemoryUsageSafe()).toBe(true);
    });

    it('should initialize with custom thresholds', () => {
      const customThresholds = {
        maxTensors: 50,
        maxBytes: 50 * 1024 * 1024,
      };

      memoryManager.initialize(customThresholds);

      expect(memoryManager.isMemoryUsageSafe()).toBe(true);
    });
  });

  describe('Memory Monitoring', () => {
    it('should start and stop monitoring', () => {
      memoryManager.startMonitoring();
      memoryManager.stopMonitoring();

      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should detect high memory usage', () => {
      // Mock high memory usage
      mockMemory.mockReturnValue({
        numTensors: 200, // Above default threshold
        numDataBuffers: 100,
        numBytes: 200 * 1024 * 1024, // 200MB
        unreliable: false,
      });

      expect(memoryManager.isMemoryUsageSafe()).toBe(false);
    });

    it('should calculate memory usage percentage', () => {
      mockMemory.mockReturnValue({
        numTensors: 75, // 50% of default 150
        numDataBuffers: 10,
        numBytes: 75 * 1024 * 1024, // 50% of default 150MB
        unreliable: false,
      });

      const percentages = memoryManager.getMemoryUsagePercentage();

      expect(percentages.tensors).toBe(50);
      expect(percentages.bytes).toBe(50);
    });
  });

  describe('Memory Snapshots', () => {
    it('should take memory snapshots', () => {
      const snapshot = memoryManager.takeSnapshot('test');

      expect(snapshot).toHaveProperty('numTensors');
      expect(snapshot).toHaveProperty('numBytes');
      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot.context).toBe('test');
    });

    it('should maintain snapshot history', () => {
      memoryManager.takeSnapshot('test1');
      memoryManager.takeSnapshot('test2');
      memoryManager.takeSnapshot('test3');

      const history = memoryManager.getMemoryHistory();
      expect(history.length).toBe(3);
    });

    it('should limit snapshot history size', () => {
      // Take more snapshots than the limit
      for (let i = 0; i < 25; i++) {
        memoryManager.takeSnapshot(`test${i}`);
      }

      const history = memoryManager.getMemoryHistory();
      expect(history.length).toBeLessThanOrEqual(20); // SNAPSHOT_HISTORY_SIZE
    });
  });

  describe('Memory Tracking', () => {
    it('should track memory usage during function execution', async () => {
      const testFunction = jest.fn().mockResolvedValue('result');

      const result = await memoryManager.withMemoryTracking(
        testFunction,
        'test'
      );

      expect(result).toBe('result');
      expect(testFunction).toHaveBeenCalled();
    });

    it('should handle errors during memory tracking', async () => {
      const testFunction = jest
        .fn()
        .mockRejectedValue(new Error('Test error'));

      await expect(
        memoryManager.withMemoryTracking(testFunction, 'test')
      ).rejects.toThrow('Test error');
    });
  });

  describe('Tensor Disposal', () => {
    it('should safely dispose of valid tensors', () => {
      const mockTensor = {
        isDisposed: false,
        dispose: jest.fn(),
        shape: [1, 224, 224, 3],
      } as any;

      memoryManager.safeTensorDispose(mockTensor);

      expect(mockTensor.dispose).toHaveBeenCalled();
    });

    it('should handle already disposed tensors', () => {
      const mockTensor = {
        isDisposed: true,
        dispose: jest.fn(),
        shape: [1, 224, 224, 3],
      } as any;

      memoryManager.safeTensorDispose(mockTensor);

      expect(mockTensor.dispose).not.toHaveBeenCalled();
    });

    it('should handle null/undefined tensors', () => {
      expect(() => {
        memoryManager.safeTensorDispose(null);
        memoryManager.safeTensorDispose(undefined);
      }).not.toThrow();
    });

    it('should dispose of tensor arrays', () => {
      const mockTensors = [
        {
          isDisposed: false,
          dispose: jest.fn(),
          shape: [1, 224, 224, 3],
        },
        { isDisposed: false, dispose: jest.fn(), shape: [1, 128] },
        null,
        undefined,
      ] as any[];

      memoryManager.safeTensorArrayDispose(mockTensors);

      expect(mockTensors[0].dispose).toHaveBeenCalled();
      expect(mockTensors[1].dispose).toHaveBeenCalled();
    });
  });

  describe('Garbage Collection', () => {
    it('should force garbage collection', () => {
      memoryManager.forceGarbageCollection();

      expect(mockDisposeVariables).toHaveBeenCalled();
    });

    it('should handle WebGL backend cleanup', () => {
      const mockBackend = {
        checkCompileCompletion: jest.fn(),
        getUniformLocations: jest.fn().mockReturnValue({
          clear: jest.fn(),
        }),
      };

      mockGetBackend.mockReturnValue('webgl');
      (
        tf.backend as jest.MockedFunction<typeof tf.backend>
      ).mockReturnValue(mockBackend);

      memoryManager.forceGarbageCollection();

      expect(mockBackend.checkCompileCompletion).toHaveBeenCalled();
    });
  });

  describe('Emergency Cleanup', () => {
    it('should perform emergency cleanup when memory is critical', () => {
      // Mock critical memory usage
      mockMemory.mockReturnValue({
        numTensors: 200, // Above threshold
        numDataBuffers: 100,
        numBytes: 200 * 1024 * 1024,
        unreliable: false,
      });

      const cleanupCallback = jest.fn();
      memoryManager.registerCleanupCallback(cleanupCallback);

      memoryManager.performEmergencyCleanup();

      expect(cleanupCallback).toHaveBeenCalled();
      expect(mockDisposeVariables).toHaveBeenCalled();
    });
  });

  describe('Cleanup Callbacks', () => {
    it('should register and execute cleanup callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unregister1 =
        memoryManager.registerCleanupCallback(callback1);
      const unregister2 =
        memoryManager.registerCleanupCallback(callback2);

      memoryManager.performEmergencyCleanup();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();

      // Test unregistering
      unregister1();
      callback1.mockClear();
      callback2.mockClear();

      memoryManager.performEmergencyCleanup();

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('Memory Information', () => {
    it('should return current memory usage', () => {
      const memoryInfo = memoryManager.getCurrentMemoryUsage();

      expect(memoryInfo).toHaveProperty('numTensors');
      expect(memoryInfo).toHaveProperty('numBytes');
    });

    it('should return memory history', () => {
      memoryManager.takeSnapshot('test1');
      memoryManager.takeSnapshot('test2');

      const history = memoryManager.getMemoryHistory();

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(2);
    });
  });
});
