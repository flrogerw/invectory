import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { saveImage, getImageBuffer } from './image';
import { Asset } from 'expo-asset';
import { AppState } from 'react-native';

let modelSession: any = null;

/**
 * Listens to app state changes and closes the database when the app goes inactive.
 */
AppState.addEventListener('change', (state) => {
  if (state === 'inactive' || state === 'background') {
    if (modelSession) {
      modelSession = null;
    }
  }
});

/**
 * Initializes and returns the MobileCLIP model instance.
 *
 * @returns {Promise<any>} The model instance.
 */
const getSession = async (): Promise<any> => {
  if (!modelSession) {
    const asset = Asset.fromModule(require('../assets/models/mobileclip_blt.onnx'));
    await asset.downloadAsync();
    const modelPath = asset.localUri; // Use this URI to load the model with onnxruntime-react-native
    modelSession = await InferenceSession.create(modelPath);
  }
  return modelSession;
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
  return new Float32Array(cleanedEmbedding);
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

    const session = await getSession()
    
    // Prepare the model inputs. The key "input" must match your model's expected input name.
    const feeds = { "x": onnxInput };
    
    // Run inference with the ONNX model.
    const results = await session.run(feeds);
    
    // Retrieve the output tensor. Adjust "output" to the correct output name if needed.
    const outputTensor = results["1302"];

    const embeddingArray = Array.from(outputTensor.data as number[]);
    
    // Optionally, clean the embedding vector.
    const cleanedEmbedding = prepEmbedings(embeddingArray);
    
    return [localUri, Array.from(cleanedEmbedding)];
  } catch (error) {
    console.error("Error generating embedding with ONNX:", error);
    throw error;
  }
}

/**
 * Hypothetical tokenizer function that returns an array of token IDs (numbers) for a given query.
 * You should replace this with your actual tokenizer implementation.
 *
 * @param query - The text to tokenize.
 * @returns {number[]} An array of token IDs.
 */
function tokenize(query: string): number[] {
  // This is a stub implementation.
  // In practice, use a real tokenizer that matches MobileCLIP's text preprocessing.
  const tokens = query.split(" ").map(word => word.length); // dummy: tokens are word lengths
  return tokens;
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
    let tokens = tokenize(query);
    const contextLength = 77; // Example: CLIP's context length is often 77.

    // Pad or truncate tokens to exactly contextLength.
    if (tokens.length > contextLength) {
      tokens = tokens.slice(0, contextLength);
    } else if (tokens.length < contextLength) {
      tokens = tokens.concat(new Array(contextLength - tokens.length).fill(0));
    }

    // Convert tokens to a BigInt64Array if the model expects int64.
    // If your model accepts int32, you could use Int32Array instead.
    const tokenArray = BigInt64Array.from(tokens.map(x => BigInt(x)));

    // Create an ONNX Runtime Tensor with shape [1, contextLength].
    const tokenTensor = new Tensor("int64", tokenArray, [1, contextLength]);

    // Load the ONNX model for the text branch.
    // Ensure that the file "mobileclip_text.onnx" is correctly bundled or accessible.
    const session = await InferenceSession.create("mobileclip_text.onnx");

    // Prepare the model's input. Adjust "input_ids" to match your model's expected input name.
    const feeds = { "input_ids": tokenTensor };

    // Run inference.
    const results = await session.run(feeds);

    // Extract the output tensor. Adjust "output" to the name of your model's output.
    const outputTensor = results["output"];
    const embeddingArray = Array.from(outputTensor.data as number[]);

    return embeddingArray;
  } catch (error) {
    console.error("Error generating text embedding with ONNX:", error);
    throw error;
  }
}