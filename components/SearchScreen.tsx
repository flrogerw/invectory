import React, { useRef, useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, Image, FlatList } from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { Camera, useCameraDevice, CameraPermissionStatus, useCameraPermission, useCameraFormat, getCameraFormat, CameraProps } from "react-native-vision-camera";
import { getImageEmbedding, searchImageEmbeddings, storeEmbedding } from "../utils/database";
import Orientation from "react-native-orientation-locker";
import * as FileSystem from "expo-file-system";
import { Dimensions } from 'react-native';
import Reanimated, { useAnimatedProps, useSharedValue, interpolate, Extrapolation } from 'react-native-reanimated'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";

Reanimated.addWhitelistedNativeProps({
  zoom: true,
})
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)


const SearchScreen = () => {
  const permission = useCameraPermission();
  const [uri, setUri] = useState<string | null>(null);
  const [embedding, setEmbedding] = useState<number[]>([]);
  const [results, setResults] = useState<{ id: number; path: string }[]>([]);
  const [loading, setLoading] = useState(false); // Track processing state
  // const [aspectRatio, setAspectRatio] = useState({ ratio: 0.75, height: 0, width: 0 }); // Track processing state
  const isFocused = useIsFocused(); // Detects when screen is in focus
  const device = useCameraDevice("back"); // Using the back camera

  const cameraRef = useRef<Camera>(null); // Camera reference for Vision Camera
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {

    if (isFocused) {
      setUri(null);  // Reset image when the screen is focused
      setResults([]); // Clear search results
      setLoading(false); // Stop loading when screen is focused
      if (isFocused && device) {
        zoom.value = device?.neutralZoom ?? 1;
      }
    }
  }, [isFocused, device]);

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


  // Ensure default values are provided if `minZoom` or `maxZoom` are undefined
  const zoom = useSharedValue(device?.neutralZoom ?? 1); // Fallback to 1 if undefined
  const zoomOffset = useSharedValue(0);

  const gesture = Gesture.Pinch()
    .onBegin(() => {
      zoomOffset.value = zoom.value;
    })
    .onUpdate(event => {
      const z = zoomOffset.value * event.scale;
      const minZoom = device?.minZoom ?? 1; // Default to 1 if undefined
      const maxZoom = device?.maxZoom ?? 200; // Default to 10 if undefined

      zoom.value = interpolate(z, [1, 200], [minZoom, maxZoom], Extrapolation.CLAMP);
    });

  const animatedProps = useAnimatedProps<CameraProps>(
    () => ({ zoom: zoom.value }),
    [zoom]
  )

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

  const { width: screenWidth } = Dimensions.get('window');

  console.log(device?.sensorOrientation)
  const squareSize = Math.floor(screenWidth - 8);

  // Function to reset the camera view
  const resetCamera = () => {
    setUri(null); // Reset the displayed image
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : uri ? (
        <View style={[
          styles.resultContainer,
          StyleSheet.absoluteFill]}>
          <Image source={{ uri }} style={styles.imagePreview} />

          {/* Show a loading spinner while searching */}
          {loading ? (
            <ActivityIndicator size="large" color="red" />
          ) : (

            <FlatList
              data={results}
              numColumns={3}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => navigation.navigate("EditScreen", { imageId: item.id })}
                  style={styles.imageCard}
                >
                  <Image source={{ uri: item.path }} style={styles.image} />
                </Pressable>
              )}
              keyExtractor={(item) => item.id.toString()}
            />



          )}

          {/* Button to take another picture */}
          <Pressable style={styles.searchAgainBtn} onPress={() => setUri(null)}>
            <Text style={styles.searchAgainText}>Search Again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={[styles.cameraContainer, {}]} />
          {device != null ? (
            <GestureHandlerRootView style={[{ flex: 1, width: "100%" }]}>
              <GestureDetector gesture={gesture} >
                <ReanimatedCamera
                  ref={cameraRef}
                  style={[
                    styles.camera,
                    StyleSheet.absoluteFill,
                    {
                      // borderRadius: 10,
                      backgroundColor: "#222",
                      //aspectRatio: aspectRatio.ratio,
                    }
                  ]}
                  //zoom={0}
                  device={device}
                  animatedProps={animatedProps}
                  isActive={isFocused}
                  photo={true}
                  //format={format}
                  photoQualityBalance="quality"
                  outputOrientation="device"
                />
              </GestureDetector>
            </GestureHandlerRootView>

          ) : (
            <Text style={{ color: "white" }}>Camera not available</Text>
          )}


          <View style={[styles.overlay, { width: squareSize, height: squareSize }]}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <View style={styles.controlsContainer}>
            <Pressable onPress={takePicture} disabled={loading}>
              {({ pressed }) => (
                <View style={[styles.shutterBtn, { opacity: pressed ? 0.5 : 1 }]}>
                  <View style={[styles.shutterBtnInner, { backgroundColor: "black" }]} />
                </View>
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: "#ffffff",
  },
  processingText: {
    marginTop: 10,
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
  },
  cameraContainer: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
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
    width: "100%",
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
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    padding: 20,
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
  overlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",

  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "white",
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderRadius: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderRadius: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderRadius: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRadius: 3,
  },
  imageCard: {
    flex: 1 / 3, // Ensures three images per row
    alignItems: 'center',
    padding: 8,
  },
  image: {
    width: 130,
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
  },
});

export default SearchScreen;
