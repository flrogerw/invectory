import React, { useRef, useState, useEffect, useCallback } from "react";
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
import { useIsFocused } from "@react-navigation/native";
import {
  Camera,
  CameraProps,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { getImageEmbedding } from '../utils/embedding';
import { storeEmbedding } from '../utils/database';
import * as FileSystem from "expo-file-system";
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

// Allow native zoom property for reanimated camera
Reanimated.addWhitelistedNativeProps({ zoom: true });
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

const CameraScreen = () => {
  const permission = useCameraPermission();
  const isFocused = useIsFocused();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);

  const [uri, setUri] = useState<string | null>(null);
  const [embedding, setEmbedding] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Shared zoom values for pinch gesture
  const zoom = useSharedValue(device?.neutralZoom ?? 1);
  const zoomOffset = useSharedValue(0);

  useEffect(() => {
    if (isFocused) {
      setUri(null);
      setLoading(false);
      if (device) {
        zoom.value = device.neutralZoom ?? 1;
      }
    }
  }, [isFocused, device, zoom]);

  // Define pinch gesture to adjust camera zoom
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
    () => ({
      zoom: zoom.value,
    }),
    [zoom]
  );

  // Take a picture and process it
  const takePicture = useCallback(async () => {
    if (loading || !cameraRef.current) return;
    if (uri) {
      await FileSystem.deleteAsync(uri);
    }
    setUri(null);
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePhoto();
      if (photo?.path) {
        const { width: photoWidth, height: photoHeight } = photo;
        const [localUri, vectorEmbedding] = await getImageEmbedding(
          photo.path,
          photoWidth,
          photoHeight,
          zoom.value
        );
        setUri(localUri);
        setEmbedding(vectorEmbedding);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert("Error", "Failed to create image. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, uri]);

  // Save the picture embedding to the database
  const savePicture = useCallback(async () => {
    setLoading(true);
    try {
      await storeEmbedding(uri, embedding);
      Alert.alert("Success", "Image saved successfully!", [
        {
          text: "OK",
          onPress: () => setUri(null),
        },
      ]);
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert("Error", "Failed to save image. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [uri, embedding]);

  const resetCamera = useCallback(() => {
    setUri(null);
  }, []);

  const { width: screenWidth } = Dimensions.get("window");
  const squareSize = Math.floor(screenWidth);
  console.log(squareSize)

  // If permission is still loading
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

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      ) : uri ? (
        <View>
          <Image source={{ uri }} style={styles.imagePreview} />
          <Text style={styles.processingText}>Processing image...</Text>
          <View style={styles.buttonsContainer}>
            <Pressable onPress={resetCamera} style={styles.button}>
              <Text style={styles.buttonText}>Retake Picture</Text>
            </Pressable>
            <Pressable onPress={savePicture} disabled={loading} style={styles.button}>
              <Text style={styles.buttonText}>Save Picture</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.cameraContainer} />
          {device ? (
            <GestureHandlerRootView style={{ flex: 1, width: "100%" }}>
              <GestureDetector gesture={gesture}>
                <ReanimatedCamera
                  ref={cameraRef}
                  style={[styles.camera, StyleSheet.absoluteFill]}
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
                  <View style={styles.shutterBtnInner} />
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
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionText: {
    textAlign: "center",
    color: "white",
    marginBottom: 20,
    fontSize: 16,
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
  imagePreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    marginBottom: 20,
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
});

export default CameraScreen;
