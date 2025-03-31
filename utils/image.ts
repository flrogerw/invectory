// image.ts
/**
 * Image Utilities
 * ---------------
 * Provides functions for image processing, including cropping, resizing, and file conversion.
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

/**
 * Calculates centered crop dimensions for a square crop,
 * taking into account a zoom factor.
 *
 * When zoom > 1, the effective field of view is reduced (i.e. width/zoom, height/zoom),
 * and the crop is computed on that smaller region.
 *
 * @param width - The original image width.
 * @param height - The original image height.
 * @param zoom - The zoom factor applied (default is 1, no zoom).
 * @returns {Promise<{ width: number; height: number; originX: number; originY: number }>} 
 *          An object with the dimensions and origin coordinates of the square crop.
 */
export async function getCropDimensions(
  width: number,
  height: number,
  zoom: number = 1
): Promise<{ width: number; height: number; originX: number; originY: number }> {
  // Compute the effective field-of-view dimensions based on the zoom factor.
  const minSize = Math.min(width, height);
 
   // Calculate crop origin (centered)
   const cropY = Math.floor((width - minSize) / 2);
   const cropX = Math.floor((height - minSize) / 2);
 
   return {
     height: minSize,
     originX: cropX,
     originY: cropY,
     width: minSize
   }
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
  height: number,
  zoom: number = 1
): Promise<string> {
  const context = ImageManipulator.manipulate(rawUri);
  const cropDimensions = await getCropDimensions(width, height, zoom);
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
