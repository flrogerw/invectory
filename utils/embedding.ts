import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { saveImage, getImageBuffer } from './image';
import { Asset } from 'expo-asset';
import { AppState } from 'react-native';
import Tokenizer from "clip-bpe-js";

let t = new Tokenizer();
let modelImageSession: any = null;
let modelTextSession: any = null;

/**
 * Listens to app state changes and closes the database when the app goes inactive.
 */
AppState.addEventListener('change', (state) => {
  if (state === 'inactive' || state === 'background') {
    if (modelImageSession || modelTextSession) {
      modelImageSession = null;
      modelTextSession = null;
    }
  }
});

/**
 * Initializes and returns the MobileCLIP model instance
 *
 * @returns {Promise<any>} The Image model instance.
 */
const getImageSession = async (): Promise<any> => {
  modelTextSession = null;
  if (!modelImageSession) {
    const asset = Asset.fromModule(require('../assets/models/mobileclip_image.onnx'));
    await asset.downloadAsync();
    const modelPath = asset.localUri; // Use this URI to load the model with onnxruntime-react-native
    modelImageSession = await InferenceSession.create(modelPath);
  }
  return modelImageSession;
};

/**
 * Initializes and returns the MobileCLIP model instance
 *
 * @returns {Promise<any>} The Text model instance.
 */
const getTextSession = async (): Promise<any> => {
  modelImageSession = null;
  if (!modelTextSession) {
    const asset = Asset.fromModule(require('../assets/models/mobileclip_text.onnx'));
    await asset.downloadAsync();
    const modelTextPath = asset.localUri; // Use this URI to load the model with onnxruntime-react-native
    modelTextSession = await InferenceSession.create(modelTextPath);
  }
  return modelTextSession;
};


/**
 * Prepares a vector embedding by cleaning invalid float values.
 *
 * @param vectorEmbedding - Array of numbers representing the embedding.
 * @returns {Float32Array} A cleaned Float32Array embedding.
 */
export function prepEmbedings(vectorEmbedding: number[]): Float32Array {
  const validEmbeddingArray = vectorEmbedding.map((val) => (val === -0 ? 0 : val));
  const cleanedEmbedding = validEmbeddingArray.map(value => (isNaN(value) ? 0 : value));
  return new Float32Array(vectorEmbedding);
}

/**
 * Generates a vector embedding for an image using an ONNX model.
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
): Promise<[string, number[]]> {
  try {
    // Ensure TensorFlow.js is ready for preprocessing
    await tf.ready();
    
    // Process the image (e.g., cropping/resizing) and obtain a local URI
    const localUri = await saveImage(rawUri, width, height);
    const arrayBuffer = await getImageBuffer(localUri);
    
    // Decode the JPEG image and normalize pixel values (assuming the model expects values in [0,1])
    const rawImageTensor = decodeJpeg(new Uint8Array(arrayBuffer))
      .expandDims(0)
      .toFloat()
      .div(tf.scalar(255));

    // Transpose from [1, 224, 224, 3] to [1, 3, 224, 224]
    const imageTensor = rawImageTensor.transpose([0, 3, 1, 2]);
    
    // Get the raw data and shape from the tensor (e.g., [1, 3, 224, 224])
    const inputData = imageTensor.dataSync();
    const shape = imageTensor.shape;
    
    // Create an ONNX Runtime tensor from the preprocessed data
    const onnxInput = new Tensor("float32", inputData, shape);

    const session = await getImageSession()

    const feeds = { "image": onnxInput };
    
    // Run inference with the ONNX model.
    const results = await session.run(feeds);
    
    // Retrieve the output tensor. Adjust "output" to the correct output name if needed.
    const outputTensor = results["image_embedding"];

    const embeddingArray = Array.from(outputTensor.data as number[]);
    
    // Optionally, clean the embedding vector.
    const cleanedEmbedding = new Float32Array(embeddingArray);
    
    return [localUri, Array.from(cleanedEmbedding)];
  } catch (error) {
    console.error("Error generating embedding with ONNX:", error);
    throw error;
  }
}

/**
 * Generates a vector embedding for a text query using the ONNX MobileCLIP text model.
 *
 * @param query - The text query.
 * @returns {Promise<number[]>} A promise that resolves with the text embedding array.
 */
export async function getTextEmbedding(query: string): Promise<number[]> {
  try {
    // Tokenize the text query.
    let tokens = t.encodeForCLIP(query);
    const contextLength = 77;

    // Convert tokens directly to an Int32Array. Assume tokens are numbers.
    const tokenArray = Int32Array.from(tokens.map((x: number) => x));
    const tokenTensor = new Tensor("int32", tokenArray, [1, contextLength]);

    // Load the ONNX model for the text branch.
    // Ensure that the file "mobileclip_text.onnx" is correctly bundled or accessible.
    const session = await getTextSession();

    // Prepare the model's input. Adjust "x" to match your model's expected input name.
    const feeds = { "text": tokenTensor };

    // Run inference.
    const results = await session.run(feeds);

    // Extract the output tensor. Adjust "1302" to your model's output name if needed.
    const outputTensor = results["text_embedding"];
    const embeddingArray = Array.from(outputTensor.data as number[]);

    return embeddingArray;
  } catch (error) {
    console.error("Error generating text embedding with ONNX:", error);
    throw error;
  }
}
