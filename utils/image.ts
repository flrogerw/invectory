// image.ts
/**
 * Image Utilities
 * ---------------
 * Provides functions for image processing, including cropping, resizing, and file conversion.
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

/**
 * Calculates centered crop dimensions for a square crop.
 *
 * @param width - The original image width.
 * @param height - The original image height.
 * @returns {Promise<{ height: number; originX: number; originY: number; width: number }>} 
 *          An object containing the crop dimensions.
 */
export async function getCropDimensions(
  width: number,
  height: number
): Promise<{ height: number; originX: number; originY: number; width: number }> {
  const minSize = Math.min(width, height);
  const cropX = Math.floor((width - minSize) / 2);
  const cropY = Math.floor((height - minSize) / 2);
  return {
    height: minSize,
    originX: cropX,
    originY: cropY,
    width: minSize,
  };
}

/**
 * Processes and saves an image by cropping it to a square and resizing it to 224x224 pixels.
 * The processed image is moved to persistent storage.
 *
 * @param rawUri - The URI of the raw image.
 * @param width - The original image width.
 * @param height - The original image height.
 * @returns {Promise<string>} A promise that resolves with the persistent URI of the processed image.
 */
export async function saveImage(
  rawUri: string,
  width: number,
  height: number
): Promise<string> {
  const context = ImageManipulator.manipulate(rawUri);
  const cropDimensions = await getCropDimensions(width, height);
  context.crop(cropDimensions);
  context.resize({ width: 224, height: 224 });
  const image = await context.renderAsync();
  const { uri } = await image.saveAsync({ format: SaveFormat.JPEG });
  const fileName = `image_${Date.now()}.jpg`;
  const persistentUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.moveAsync({
    from: uri,
    to: persistentUri,
  });
  return persistentUri;
}

/**
 * Converts a Blob object to an ArrayBuffer.
 *
 * @param blob - The Blob to convert.
 * @returns {Promise<ArrayBuffer>} A promise that resolves with the ArrayBuffer.
 */
export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Fetches an image from a local URI and converts it to an ArrayBuffer.
 *
 * @param localUri - The local URI of the image.
 * @returns {Promise<ArrayBuffer>} A promise that resolves with the image's ArrayBuffer.
 */
export async function getImageBuffer(localUri: string): Promise<ArrayBuffer> {
  const response = await fetch(localUri);
  const imageBlob = await response.blob();
  return await blobToArrayBuffer(imageBlob);
}
