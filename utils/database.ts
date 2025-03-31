// database.ts
/**
 * Database Utilities
 * ------------------
 * Provides functions for initializing and interacting with the SQLite database.
 */

import { open } from '@op-engineering/op-sqlite';
import * as FileSystem from 'expo-file-system';
import { AppState, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getImageEmbedding, prepEmbedings }from './embedding';

const DB_NAME = 'database.db';
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

let db: any = null;

export interface SearchResult {
    id: number;
    path: string;
    distance?: number; // Optional: cosine distance value
  }

/**
 * Listens to app state changes and closes the database when the app goes inactive.
 */
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
 * Creates the 'images' table and its index if they do not exist.
 *
 * @returns {Promise<any>} The database instance.
 */
export const getDatabase = async (): Promise<any> => {
  if (!db) {
    const dbDir = `${FileSystem.documentDirectory}SQLite/`;
    const cleanPath = dbDir.replace("file://", "");
    db = open({ name: DB_NAME, location: cleanPath });
    await db.execute(`
      CREATE TABLE IF NOT EXISTS images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          path TEXT,
          embedding FLOAT32(1024)
      );
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS images_idx ON images (libsql_vector_idx(embedding));`);
  }
  return db;
};

/**
 * Deletes the SQLite database file and resets the first launch flag.
 */
export const deleteDatabase = async (): Promise<void> => {
  try {
    const dbExists = await FileSystem.getInfoAsync(DB_PATH);
    if (dbExists.exists) {
      await FileSystem.deleteAsync(DB_PATH);
      await AsyncStorage.removeItem('isFirstLaunch');
      Alert.alert("Success", "Database deleted successfully. Restart the app to take effect.");
    } else {
      Alert.alert("Info", "Database does not exist.");
    }
  } catch (error) {
    console.error("Error deleting database:", error);
    Alert.alert("Error", "Failed to delete the database.");
  }
};

/**
 * Retrieves an image record by its ID.
 *
 * @param imageId - The ID of the image.
 * @returns {Promise<{ id: number; path: string }>} The image record.
 */
export const getImageById = async (imageId: number): Promise<{ id: number; path: string }> => {
  try {
    const database = await getDatabase();
    const { rows } = await database.execute(
      `SELECT images.id, images.path FROM images WHERE id = ?;`,
      [imageId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error fetching image by ID:', error);
    throw error;
  }
};

/**
 * Stores an image path and its vector embedding into the database.
 *
 * @param localUri - The local URI of the image.
 * @param vectorEmbedding - The vector embedding of the image.
 */
export const storeEmbedding = async (
  localUri: string | null,
  vectorEmbedding: number[]
): Promise<void> => {
  if (!localUri) {
    console.warn("localUri is null, skipping storage.");
    return;
  }
  try {
    const database = await getDatabase();
    // Dynamically import the embedding utility to clean the vector.
    const embedding = prepEmbedings(vectorEmbedding);
    await database.execute('INSERT INTO images (path, embedding) VALUES (?, ?)', [localUri, embedding]);
    console.log("Successfully stored embedding and image.");
  } catch (error) {
    console.error("Error storing embedding:", error);
  }
};

/**
 * Retrieves all image records from the database.
 *
 * @returns {Promise<{ id: number; path: string }[]>} An array of image records.
 */
export const getImagePaths = async (): Promise<{ id: number; path: string }[]> => {
  try {
    const database = await getDatabase();
    const { rows } = await database.execute(`SELECT images.id, images.path FROM images;`);
    return rows;
  } catch (error) {
    console.error('Error fetching image paths:', error);
    throw error;
  }
};

/**
 * Searches for similar images based on their embeddings.
 *
 * @param rawUri - URI of the image to search for.
 * @param width - Width of the image.
 * @param height - Height of the image.
 * @returns {Promise<SearchResult[]>} A promise resolving with an array of search results.
 */
export async function searchImageEmbeddings(
    rawUri: string,
    width: number,
    height: number
  ): Promise<SearchResult[]> {
    try {
      const database = await getDatabase();
      const [localUri, vectorEmbedding] = await getImageEmbedding(rawUri, width, height);
      const embedding = prepEmbedings(vectorEmbedding);
      // Remove the temporary processed image.
      await FileSystem.deleteAsync(localUri);
      const { rows } = await database.execute(
        `
        SELECT images.id, images.path, vector_distance_cos(embedding, ?) as distance
        FROM images
        ORDER BY distance ASC
        LIMIT 6;
        `,
        [embedding]
      );
      return rows;
    } catch (error) {
      console.error('Error searching image embeddings:', error);
      throw error;
    }
  }