import React, { useRef, useState, useEffect } from "react";
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
import { useIsFocused, useNavigation } from "@react-navigation/native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  CameraProps,
} from "react-native-vision-camera";
import { searchImageEmbeddings } from '../utils/database'
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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import ImageGrid from '../components/ImageGrid';

// Allow native zoom property for reanimated camera
Reanimated.addWhitelistedNativeProps({ zoom: true });
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);


const SearchScreen = () => {
  const permission = useCameraPermission();
  const isFocused = useIsFocused();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [uri, setUri] = useState<string | null>(null);
  const [results, setResults] = useState<{ id: number; path: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isFocused) {
      setUri(null);
      setResults([]);
      setLoading(false);
      if (device) {
        zoom.value = device.neutralZoom ?? 1;
      }
    }
  }, [isFocused, device]);

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
        const searchResults = await searchImageEmbeddings(
          photo.path,
          photo.width,
          photo.height
        );
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
        <View style={[styles.resultContainer]}>
          <Image source={{ uri }} style={styles.imagePreview} />
          <ImageGrid
            images={results}
            onImagePress={(id) => navigation.navigate("EditScreen", { imageId: id })}
          />
          <Pressable style={styles.searchAgainBtn} onPress={resetCamera}>
            <Text style={styles.searchAgainText}>Search Again</Text>
          </Pressable>
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
  button: {
    backgroundColor: "#007AFF",
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
    color: "#ffffff",
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
  resultContainer: {
    //alignItems: "center",
    marginTop: 20,
    flex: 1,
    width: "100%",
  },
  imagePreview: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    marginBottom: 20,
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
  image: {
    width: 130,
    height: 130,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    shadowColor: "#BB86FC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#BB86FC",
  },
});

export default SearchScreen;
