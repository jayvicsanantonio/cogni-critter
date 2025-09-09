/**
 * MLService Training Smoke Test
 * Ensures transfer-learning training and classification complete without errors
 */

import { MLServiceImpl } from '../MLService'

// Mock Mobilenet to avoid network and heavy compute
jest.mock('@tensorflow-models/mobilenet', () => ({
  load: jest.fn(async () => {
    // Fake MobileNet with deterministic embedding output
    return {
      infer: jest.fn(() => {
        // Minimal fake tensor representing embeddings [1, 1280]
        const featureSize = 1280
        return {
          shape: [1, featureSize],
          // Not used in training path because shape is already [1, N]
          expandDims: jest.fn().mockReturnThis(),
          async data() {
            // Used only during validation to check for invalid values
            return new Float32Array(featureSize)
          },
          dispose: jest.fn(),
          isDisposed: false,
        }
      }),
    }
  }),
}))

// Mock image processing to return expected image tensor
jest.mock('../../utils/imageProcessing', () => ({
  imageToTensor: jest.fn(async () => ({
    shape: [1, 224, 224, 3],
    dispose: jest.fn(),
    isDisposed: false,
  })),
}))

// Light-weight TFJS mocks sufficient for training flow
jest.mock('@tensorflow/tfjs', () => {
  const fitHistory = { history: { loss: [0.1], acc: [0.95] } }

  const fakeTensor = (shape: number[]) => ({
    shape,
    reshape: jest.fn((newShape: number[]) => fakeTensor(newShape)),
    dispose: jest.fn(),
    isDisposed: false,
  })

  const sequential = () => {
    const model = {
      compile: jest.fn(),
      fit: jest.fn().mockResolvedValue(fitHistory),
      // Classification returns apple confidence, we will convert to [p, 1-p]
      predict: jest.fn(() => ({
        async data() {
          return new Float32Array([0.8])
        },
        dispose: jest.fn(),
      })),
      dispose: jest.fn(),
    }
    return model
  }

  return {
    // Ops used by MLService
    stack: jest.fn((tensors: any[]) => fakeTensor([tensors.length, 1, 1280])),
    tensor1d: jest.fn((arr: number[]) => fakeTensor([arr.length])),

    sequential: jest.fn(sequential),
    layers: {
      dense: jest.fn(() => ({})),
      dropout: jest.fn(() => ({})),
    },
    train: {
      adam: jest.fn(() => ({})),
    },

    // Introspection APIs used by memory manager and info methods
    memory: jest.fn(() => ({
      numTensors: 1,
      numBytes: 1024,
      numDataBuffers: 1,
      unreliable: false,
    })),
    getBackend: jest.fn(() => 'cpu'),
    disposeVariables: jest.fn(),
  }
})

// Note: memoryManager is intentionally not mocked; its safe disposes handle fake tensors

describe('MLService training smoke', () => {
  it('trains a custom classifier and performs classification', async () => {
    const svc = new MLServiceImpl()

    // Load base model (mocked mobilenet)
    await svc.loadModel()
    expect(svc.isReadyForTraining()).toBe(true)

    // Minimal balanced training data
    const trainingData = [
      { id: 'a1', imageUri: 'apple1.jpg', userLabel: 'apple' as const, timestamp: Date.now() },
      { id: 'n1', imageUri: 'not1.jpg', userLabel: 'not_apple' as const, timestamp: Date.now() },
    ]

    // Train custom classifier (mocked tf fits quickly)
    await svc.trainModel(trainingData)
    expect(svc.isReadyForClassification()).toBe(true)

    // Classify an image (mocked to return 0.8 for apple)
    const result = await svc.classifyImage('any.jpg', 1000)

    expect(result).toHaveLength(2)
    // p and 1-p
    expect(result[0]).toBeGreaterThanOrEqual(0)
    expect(result[0]).toBeLessThanOrEqual(1)
    expect(result[1]).toBeGreaterThanOrEqual(0)
    expect(result[1]).toBeLessThanOrEqual(1)
    expect(result[0] + result[1]).toBeCloseTo(1, 5)
  })
})

