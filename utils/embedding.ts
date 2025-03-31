// embedding.ts
/**
 * Embedding Utilities
 * -------------------
 * Provides functions for generating and handling image embeddings using TensorFlow and MobileNet.
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';
import { saveImage, getImageBuffer } from './image';

/**
 * Prepares a vector embedding by cleaning invalid float values.
 *
 * @param vectorEmbedding - Array of numbers representing the embedding.
 * @returns {Float32Array} A cleaned Float32Array embedding.
 */
export function prepEmbedings(vectorEmbedding: number[]): Float32Array {
  const validEmbeddingArray = vectorEmbedding.map((val) => (val === -0 ? 0 : val));
  const cleanedEmbedding = validEmbeddingArray.map(value => (isNaN(value) ? 0 : value));
  return new Float32Array(cleanedEmbedding);
}

/**
 * Generates a vector embedding for an image using MobileNet.
 *
 * @param rawUri - URI of the raw image.
 * @param width - Width of the image.
 * @param height - Height of the image.
 * @returns {Promise<[string, number[]]>} A promise resolving with the processed image URI and its embedding array.
 */
export async function getImageEmbedding(
  rawUri: string,
  width: number,
  height: number,
  zoom: number = 1
): Promise<[string, number[]]> {
  try {
    await tf.ready();
    const localUri = await saveImage(rawUri, width, height, zoom);
    const arrayBuffer = await getImageBuffer(localUri);
    const imageTensor = decodeJpeg(new Uint8Array(arrayBuffer))
      .expandDims(0)
      .toFloat()
      .div(tf.scalar(255));
    const model = await mobilenet.load();
    const embeddingTensor = model.infer(imageTensor, true) as tf.Tensor;
    const embeddingArray = Array.from(await embeddingTensor.data());
    return [localUri, embeddingArray];
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

