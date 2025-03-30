import React, { useRef, useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Image, FlatList } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Camera, useCameraDevice, useCameraPermission, useCameraFormat } from "react-native-vision-camera";
import { searchImageEmbeddings } from "../utils/database";

const SearchScreen = () => {
  const permission = useCameraPermission();
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Track processing state
  const [results, setResults] = useState<{ id: number; path: string }[]>([]);
  const isFocused = useIsFocused(); // Detects when screen is in focus
  const device = useCameraDevice("back"); // Using the back camera
  const cameraRef = useRef<Camera>(null); // Camera reference for Vision Camera
  
  const format = useCameraFormat(device, [
      { photoAspectRatio: 1 },
      { photoResolution: { width: 300, height: 300 } },
  ]);

  useEffect(() => {
      if (isFocused) {
        setUri(null);  // Reset image when the screen is focused
        setResults([]); // Clear search results
        setLoading(false); // Stop loading when screen is focused
      }
    }, [isFocused]);
  

  // If permission is not granted, show the permission request UI
  if (!permission) return null;
  if (!permission.hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to use the camera
        </Text>
        <Pressable onPress={() => permission.requestPermission()} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePhoto();

      if (photo?.path) {
        setUri(photo.path);
        setLoading(true); // Start loading when the picture is taken

        // Search image embeddings after the picture is taken
        const searchResults = await searchImageEmbeddings(photo.path, photo.width, photo.height);

        setResults(searchResults); // Set the results from the search
        setLoading(false); // Stop loading once search is complete
      }
    }
  };

  return (
      <View style={styles.container}>
        {!uri ? (
          <>
            {/* Static Camera Preview */}
            <View style={styles.cameraWrapper}>
              {device != null ? (
                <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isFocused}
                photo={true} // Enable photo capture mode
                format={format}
                photoQualityBalance="quality"
                outputOrientation="device"
                  />
              ) : (
                    <Text style={{ color: "white" }}>Camera not available</Text>
                  )}
            </View>
            
            {/* Capture Button */}
            <View style={styles.controlsContainer}>
              <Pressable onPress={takePicture}>
                {({ pressed }) => (
                  <View style={[styles.shutterBtn, { opacity: pressed ? 0.5 : 1 }]}> 
                    <View style={styles.shutterBtnInner} />
                  </View>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.resultContainer}>
            <Image source={{ uri }} resizeMode="contain" style={styles.imagePreview} />
            
            {/* Show a loading spinner while searching */}
            {loading ? (
              <ActivityIndicator size="large" color="red" />
            ) : (
              <FlatList 
                data={results}
                numColumns={3} 
                keyExtractor={(item) => item.id.toString()} 
                renderItem={({ item }) => (
                  <Image source={{ uri: item.path }} style={styles.resultImage} />
                )}
              />
            )}
            
            {/* Button to take another picture */}
            <Pressable style={styles.searchAgainBtn} onPress={() => setUri(null)}>
              <Text style={styles.searchAgainText}>Search Again</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "flex-start", // Align content to top
  },
  cameraWrapper: {
    width: 300,
    height: 300,
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 40, // Keeps it near the top
  },
  camera: {
    flex: 1,
    aspectRatio: 1,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 50,
    alignItems: "center",
    width: "100%",
  },
  shutterBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 3,
    borderColor: "#ffffff",
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "#ff3b30",
  },
  resultContainer: {
    alignItems: "center",
    marginTop: 20,
    flex: 1, // Ensure it takes up all available space
  },
  imagePreview: {
    width: 300,
    aspectRatio: 1,
    borderRadius: 20, // Keeps rounded corners consistent
    marginBottom: 20,
  },
  resultImage: {
      width: "30%",
      height: 130,
      borderRadius: 12,
      backgroundColor: '#1E1E1E', // Dark card color
      shadowColor: '#BB86FC',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5, // For Android
      borderWidth: 2,
      borderColor: '#BB86FC', // Glowing border effect
      margin: 5,
  },
  searchAgainBtn: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  searchAgainText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SearchScreen;
