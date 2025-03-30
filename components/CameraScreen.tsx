import React, { useRef, useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Camera, useCameraDevice, CameraPermissionStatus, useCameraPermission, useCameraFormat, getCameraFormat, CameraProps } from "react-native-vision-camera";
import { getImageEmbedding, storeEmbedding } from "../utils/database";
import Orientation from "react-native-orientation-locker";
import * as FileSystem from "expo-file-system";
import { Dimensions } from 'react-native';
import Reanimated, { useAnimatedProps, useSharedValue, interpolate, Extrapolation } from 'react-native-reanimated'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';


Reanimated.addWhitelistedNativeProps({
  zoom: true,
})
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)


const CameraScreen = () => {
  const permission = useCameraPermission();
  const [uri, setUri] = useState<string | null>(null);
  const [embedding, setEmbedding] = useState<number[]>([]);
  const [loading, setLoading] = useState(false); // Track processing state
  // const [aspectRatio, setAspectRatio] = useState({ ratio: 0.75, height: 0, width: 0 }); // Track processing state
  const isFocused = useIsFocused(); // Detects when screen is in focus
  const device = useCameraDevice("back"); // Using the back camera

  const cameraRef = useRef<Camera>(null); // Camera reference for Vision Camera
  const format = useCameraFormat(device, [
    // { photoAspectRatio: aspectRatio.ratio },
    //{ photoResolution: { width: 3024, height: 4032 } },
  ]);
  // Orientation.lockToPortrait();

  useEffect(() => {

    if (isFocused) {
      setUri(null);  // Reset image when the screen is focused
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
    if (loading || !cameraRef.current) return; // Prevent multiple clicks
    if (uri) {
      await FileSystem.deleteAsync(uri);
    }
    setUri(null);

    setLoading(true); // Start loading

    try {
      const photo = await cameraRef.current.takePhoto();

      if (photo?.path) {

        const [photoWidth, photoHeight] = [photo.height, photo.width];
        // setAspectRatio({ ratio: photoWidth / photoHeight, width: photoWidth, height: photoHeight })

        // Get image embedding and store it in the database
        const [localUri, vectorEmbedding] = await getImageEmbedding(photo.path, photoWidth, photoHeight);
        setUri(localUri);
        setEmbedding(vectorEmbedding)
      }
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert("Error", "Failed to create image. Please try again.", [{ text: "OK", },]);
    }

    setLoading(false);
  };

  const savePicture = async () => {

    setLoading(true); // Start loading

    try {
      await storeEmbedding(uri, embedding);
      Alert.alert("Success", "Image saved successfully!", [
        {
          text: "OK",
          onPress: () => setUri(null), // Reset the image after success
        },
      ]);
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert("Error", "Failed to save image. Please try again.", [{ text: "OK", },]);
    }

    setLoading(false); // Stop loading
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
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      ) : uri ? (
        <View>
          <Image source={{ uri }}  style={styles.imagePreview} />
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
    borderRadius: 20, // Keeps rounded corners consistent
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
