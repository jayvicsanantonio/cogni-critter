import * as tf from '@tensorflow/tfjs'
import { bundleResourceIO } from '@tensorflow/tfjs-react-native'

/**
 * Local MobileNetV2 Loader (Offline)
 *
 * Loads a TFJS Layers MobileNetV2 model that is bundled with the app and
 * returns a feature extractor model (truncated at the global average pooling layer)
 * suitable for transfer learning. Assumes model files exist at:
 *   src/assets/models/mobilenet_v2/model.json
 *   src/assets/models/mobilenet_v2/model_weights.bin
 *
 * NOTE: You must run `npm run download-models` before bundling so that the
 * model files exist and Metro can package them.
 */
export interface LocalMobileNet {
  featureExtractor: tf.LayersModel
  embeddingSize: number
  dispose: () => void
}

export async function loadLocalMobileNetV2(): Promise<LocalMobileNet> {
  // Static resource requires – these files must exist at bundle time
  const modelJson = require('../assets/models/mobilenet_v2/model.json')
  const modelWeights = require('../assets/models/mobilenet_v2/model_weights.bin')

  // Load base MobileNetV2 (TFJS Layers) from bundled resources
  const base = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights))

  // Try to locate a suitable pooling layer for feature extraction
  let poolingLayer: tf.layers.Layer | null = null
  try {
    poolingLayer = base.getLayer('global_average_pooling2d')
  } catch {
    // Fallback: find a layer that looks like a global pool/flatten layer
    const candidates = base.layers.filter(
      (l) =>
        l.name.includes('global_average') ||
        l.name.includes('pool') ||
        l.name.includes('flatten')
    )
    poolingLayer = candidates.length > 0 ? candidates[candidates.length - 1] : null
  }

  // As a last resort, take the penultimate layer
  if (!poolingLayer) {
    poolingLayer = base.layers[Math.max(0, base.layers.length - 2)]
  }

  const featureExtractor = tf.model({
    inputs: base.inputs,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outputs: (poolingLayer as any).output,
    name: 'mobilenet_v2_feature_extractor',
  })

  // We can dispose the base classification model to save memory
  try {
    base.dispose()
  } catch {}

  const outShape = featureExtractor.outputs[0].shape || []
  const embeddingSize = (outShape[outShape.length - 1] as number) || 1280

  return {
    featureExtractor,
    embeddingSize,
    dispose: () => {
      try {
        featureExtractor.dispose()
      } catch {}
    },
  }
}
