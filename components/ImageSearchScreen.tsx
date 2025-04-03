import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from "react-native";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  CameraProps,
} from "react-native-vision-camera";
import { searchImageEmbeddings } from "../utils/database";
import Reanimated, {
  useAnimatedProps,
  useSharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import ImageGrid from "./ImageGrid";
import ViewScreen from "./ViewScreen";
import { getImageEmbedding, getTextEmbedding, prepEmbedings } from "../utils/embedding";
import * as FileSystem from 'expo-file-system';

Reanimated.addWhitelistedNativeProps({ zoom: true });
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

const SearchScreen = () => {
  const permission = useCameraPermission();
  const isFocused = useIsFocused();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);

  const [uri, setUri] = useState<string | null>(null);
  const [results, setResults] = useState<{ id: number; path: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  // Reset state when the screen loses focus (for example, when switching tabs)
  useFocusEffect(
    React.useCallback(() => {
      // When focused, do nothing
      return () => {
        // On blur, reset state so that when you return the screen starts fresh
        setUri(null);
        setResults([]);
        setLoading(false);
        setSelectedImageId(null);
      };
    }, [])
  );

  if (!permission) return null;
  if (!permission.hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          We need your permission to use the camera
        </Text>
        <Pressable onPress={() => permission.requestPermission()} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const zoom = useSharedValue(device?.neutralZoom ?? 1);
  const zoomOffset = useSharedValue(0);

  const gesture = Gesture.Pinch()
    .onBegin(() => {
      zoomOffset.value = zoom.value;
    })
    .onUpdate((event) => {
      const z = zoomOffset.value * event.scale;
      const minZoom = device?.minZoom ?? 1;
      const maxZoom = device?.maxZoom ?? 200;
      zoom.value = interpolate(z, [1, 200], [minZoom, maxZoom], Extrapolation.CLAMP);
    });

  const animatedProps = useAnimatedProps<CameraProps>(
    () => ({ zoom: zoom.value }),
    [zoom]
  );

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePhoto();
    if (photo?.path) {
      setUri(photo.path);
      setLoading(true);
      try {

        //const txtEmbed = await getTextEmbedding("television")

        const [localUri, vectorEmbedding] = await getImageEmbedding( 
          photo.path,
          photo.width,
          photo.height);
        
        // const embedding = prepEmbedings(vectorEmbedding);
        const embedding = prepEmbedings(vectorEmbedding);
        // Remove the temporary processed image.
        await FileSystem.deleteAsync(localUri);

        const searchResults = await searchImageEmbeddings(embedding);
        setResults(searchResults);
      } catch (error) {
        console.error("Error searching image embeddings:", error);
        Alert.alert("Error", "Failed to search image. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const resetCamera = () => {
    setUri(null);
    setResults([]);
    setSelectedImageId(null);
  };

  const { width: screenWidth } = Dimensions.get("window");
  const squareSize = Math.floor(screenWidth - 8);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : uri ? (
        <View style={styles.resultContainer}>
          <View style={styles.imageContainer}>
            <Image source={{ uri }} style={styles.imagePreview} />
          </View>
          <ImageGrid
            images={results}
            onImagePress={(id) => setSelectedImageId(id)}
          />
          <Pressable style={styles.searchAgainBtn} onPress={resetCamera}>
            <Text style={styles.searchAgainText}>Search Again</Text>
          </Pressable>
          {selectedImageId !== null && (
            <View style={styles.editOverlay}>
              <ViewScreen
                imageId={selectedImageId}
                onClose={() => setSelectedImageId(null)}
              />
            </View>
          )}
        </View>
      ) : (
        <>
          <View style={styles.cameraContainer} />
          {device ? (
            <GestureHandlerRootView style={{ flex: 1, width: "100%" }}>
              <GestureDetector gesture={gesture}>
                <ReanimatedCamera
                  ref={cameraRef}
                  style={styles.camera}
                  device={device}
                  animatedProps={animatedProps}
                  isActive={isFocused}
                  resizeMode="contain"
                  photo
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionText: {
    textAlign: "center",
    color: "white",
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#316b99",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: "#316b99",
  },
  cameraContainer: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
    ...StyleSheet.absoluteFillObject,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
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
    marginTop: 20,
    flex: 1,
    width: "100%",
  },
  imageContainer: {
    width: "80%",
    aspectRatio: 1,
    borderRadius: 5,
    marginBottom: 20,
    alignSelf: 'center',
    backgroundColor: 'white', // Ensure a background color is set
    shadowColor: '#fff',
    shadowOffset: { width: 12, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5, // This affects Android
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 5,
  },
  searchAgainBtn: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "#316b99",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: "center",
    width: "70%",
  },
  searchAgainText: {
    color: "#e69d50",
    fontSize: 16,
    fontWeight: "600",
    alignSelf: "center",
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
    flex: 1 / 3,
    alignItems: "center",
    padding: 8,
  },
  editOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SearchScreen;
