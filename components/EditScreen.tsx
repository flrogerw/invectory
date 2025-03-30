import React, { useEffect, useState } from "react";
import { View, Image, Text, StyleSheet, PanResponder, } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { getImageById } from "../utils/database"; // Function to fetch image from DB
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { runOnJS, runOnUI, useSharedValue, withSpring } from "react-native-reanimated";


type EditScreenRouteProp = RouteProp<{ EditScreen: { imageId: string } }, "EditScreen">;

const EditScreen = () => {
    const route = useRoute<EditScreenRouteProp>();
  const { imageId } = route.params; // Get ID from navigation
  const [image, setImage] = useState<{ id: number; path: string } | null>(null);

  const navigation = useNavigation();
  const translationX = useSharedValue(0);
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dx > 20; // Activate if moved at least 20 pixels horizontally
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > 50) {
        // Swipe right detected
        navigation.goBack();
      }
    },
  });


  useEffect(() => {
    const fetchImage = async () => {
      const img = await getImageById(parseInt(imageId)); // Fetch from DB
      setImage(img);
    };
    fetchImage();
  }, [imageId]);

  if (!image) return <Text>Loading...</Text>;

  return (

    <View style={styles.imageContainer}  {...panResponder.panHandlers}>
      <Image source={{ uri: image.path }} style={styles.previewImage} />
      <Text>Editing Image {imageId}</Text>
    </View>
 
  );
};

const styles = StyleSheet.create({
    imageContainer: {
        flex: 1, 
        alignItems: "center",  // Centers horizontally
        justifyContent: "center", // Centers vertically

      },
      previewImage: {
        width: 300,
        height: 300,
        borderRadius: 10,
        marginVertical: 20,
        alignSelf: "center",
    position: "absolute",
    top: 0, // Puts it at the very top
      },
      container: {
        flex: 1,
      },
      content: {
        justifyContent: "center",
        alignItems: "center",
      },
})

export default EditScreen;