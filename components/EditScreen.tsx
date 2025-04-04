import React, { useEffect, useState } from "react";
import { View, Image, Text, StyleSheet, PanResponder, } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { getImageById } from "../utils/database";


type EditScreenRouteProp = RouteProp<{ EditScreen: { imageId: string } }, "EditScreen">;

const EditScreen = () => {
  const route = useRoute<EditScreenRouteProp>();
  const { imageId } = route.params; // Get ID from navigation
  const [image, setImage] = useState<{ id: number; path: string } | null>(null);

  const navigation = useNavigation();
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
    <View style={styles.container}  {...panResponder.panHandlers}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: image.path }} style={styles.previewImage} />
      </View>
      <View>
        <Text>Editing Image {imageId}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#e0caa2'
  },
  imageContainer: {
    width: "80%",
    aspectRatio: 1,
    borderRadius: 5,
    marginBottom: 20,
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#e69d50', // Ensure a background color is set
    shadowColor: "#2a241d",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5, // This affects Android

  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 5,
    alignSelf: "center",

  },
  content: {
    justifyContent: "center",
    alignItems: "center",
  },
})

export default EditScreen;