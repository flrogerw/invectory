import { open } from '@op-engineering/op-sqlite';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import { AppState } from 'react-native';
import * as FileSystem from "expo-file-system";


let db: any = null;

interface SearchResult {
  id: number;
  path: string;
}

AppState.addEventListener('change', (state) => {
  if (state === 'inactive' || state === 'background') {
    if (db) {
      db.close();
      db = null;
    }
  }
});

/**
 * Initializes and returns the SQLite database instance.
 */
export const getDatabase = async () => {
  if (!db) {
    const dbPath = `${FileSystem.documentDirectory}SQLite/`;
    const cleanPath = dbPath.replace("file://", "");
    db = open({ name: 'database.db', location: cleanPath });
    await db.execute(`
      CREATE TABLE IF NOT EXISTS images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          path TEXT,
          embedding FLOAT32(1024)
      );`);

    await db.execute(`CREATE INDEX IF NOT EXISTS images_idx ON images (libsql_vector_idx(embedding));`);

  }
  return db;
};

function prepEmbedings(vectorEmbedding: number[]): Float32Array<ArrayBuffer> {

  // Ensure all values in the embedding array are valid floats
  const validEmbeddingArray = vectorEmbedding.map((val) => (val === -0 ? 0 : val));
  const cleanedEmbedding = validEmbeddingArray.map(value => (isNaN(value) ? 0 : value));

  return new Float32Array(cleanedEmbedding)
}


async function getCropDemensions(width: number, height: number) {
  const minSize = Math.min(width, height);

  // Calculate crop origin (centered)
  const cropX = Math.floor((width - minSize) / 2);
  const cropY = Math.floor((height - minSize) / 2);

  return {
    height: minSize,
    originX: cropX,
    originY: cropY,
    width: minSize
  }
}

async function saveImage(rawUri: string, width: number, height: number): Promise<string> {
  const context = ImageManipulator.manipulate(rawUri);
  const cropDemensions = await getCropDemensions(width, height);
  // crop the image to a 1:1 aspect ratio
  context.crop(cropDemensions)

  // Resize the image to 224x224 using the non-deprecated 'manipulate'
  context.resize({ height: 224, width: 224 });
  const image = await context.renderAsync();
  const { uri } = await image.saveAsync({
    format: SaveFormat.JPEG,
  });
  // Define persistent path
  const fileName = `image_${Date.now()}.jpg`;
  const persistentUri = `${FileSystem.documentDirectory}${fileName}`;

  // Move file to persistent storage
  await FileSystem.moveAsync({
    from: uri,
    to: persistentUri,
  });

  return persistentUri;
}


function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}


async function getImageBuffer(localUri: string): Promise<ArrayBuffer> {

  // Fetch the processed image as a blob
  const response = await fetch(localUri);
  const imageBlob = await response.blob();

  return await blobToArrayBuffer(imageBlob);

}

export const getImageById = async (imageId: number): Promise<{ id: number, path: string }> => {
  try {
    let db = await getDatabase();
    const { rows } = await db.execute(`SELECT images.id, images.path FROM images WHERE id = ?;`, [imageId]);

    return rows[0]

  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Loads an image and generates its vector embedding using MobileNet.
 * @param {string} rawUri - Path to the image file.
 * @returns {Promise<SearchResult[]>} - The vector embedding.
 */
export async function searchImageEmbeddings(rawUri: string, width: number, height: number): Promise<[]> {
  try {
    let db = await getDatabase();
    const [localUri, vectorEmbedding] = await getImageEmbedding(rawUri, width, height)
    const embedding = prepEmbedings(vectorEmbedding);
    // Clean Up
    await FileSystem.deleteAsync(localUri);

    const { rows } = await db.execute(`
        SELECT images.id, images.path, vector_distance_cos(embedding, ?) as distance
        FROM images
        ORDER BY distance ASC
        LIMIT 6;`, [embedding]);

        return rows;

  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Stores an image embedding and path into an SQLite database.
 * @param {string} localUri - The local resized image file path.
 * @param {number[]} vectorEmbedding - The vector embedding.
 */
export async function storeEmbedding(localUri: string | null, vectorEmbedding: number[]): Promise<void> {
  if (!localUri) {
      console.warn("localUri is null, skipping storage.");
    return;
  }
  try {
    let db = await getDatabase();
    const embedding = prepEmbedings(vectorEmbedding);
    await db.execute('INSERT INTO images (path, embedding) VALUES (?, ?)', [localUri, embedding]);
    console.log("Successfully stored embedding and image.");
  } catch (error) {
      console.error("Error storing embedding:", error);
  }
}

/**
 * Loads an image and generates its vector embedding using MobileNet.
 * @param {string} rawUri - URI of the image.
 * @returns {Promise<number[]>} - The vector embedding.
 */
export async function getImageEmbedding(rawUri: string, width: number, height: number): Promise<[string, number[]]> {
  try {
    // Ensure TensorFlow.js is ready
    await tf.ready();

    const localUri = await saveImage(rawUri, width, height)
    const arrayBuffer = await getImageBuffer(localUri)

    // Decode image to tensor
    const imageTensor = decodeJpeg(new Uint8Array(arrayBuffer))
      .expandDims(0)
      .toFloat()
      .div(tf.scalar(255)); // Normalize pixel values

    // Load MobileNet model
    const model = await mobilenet.load();

    // Get vector embedding
    const embedding = model.infer(imageTensor, true) as tf.Tensor;

    // Convert tensor to array
    return [localUri, Array.from(await embedding.data())];
  } catch (error) {
      console.error("Error generating embedding:", error);
    throw error;
  }
}

// Function to fetch image paths from the database
export const getImagePaths = async (): Promise<{ id: number, path: string }[]> => {
  try {
    let db = await getDatabase();
    const { rows } = await db.execute(`SELECT images.id, images.path FROM images;`);
    return rows;

  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

