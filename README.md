# Cover Match

Cover Match is a React Native mobile application that performs vector-based image searches entirely on the mobile device. The app allows users to take pictures of album covers or CD covers and search for similar images using on-device vector embeddings.

## Features

- Capture images using the device camera.
- Store image embeddings in a local SQLite database.
- Perform on-device vector-based searches.
- Offline functionality with no need for an internet connection.

## Tech Stack

- **React Native** - Cross-platform mobile framework.
- **Expo** - Simplifies development and deployment.
- **SQLite (expo-sqlite)** - Local database storage.
- **sqlite-vec / Faiss** - Vector search implementation.
- **expo-camera** - Capture images within the app.

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/cover-match.git
   cd cover-match
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   expo start
   ```

## Usage

- Open the app on your mobile device.
- Navigate to the camera screen to capture an album cover.
- Save the image and its vector embedding.
- Search for similar album covers within your collection.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.

---

### Notes

- This app is in active development. More features and improvements are planned for future updates.
- Ensure your device has camera permissions enabled for full functionality.

