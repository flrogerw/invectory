import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from "react-native";
import { getImageById } from "../utils/database";

type ViewScreenProps = {
  imageId: number;
  onClose: () => void;
};

const ViewScreen: React.FC<ViewScreenProps> = ({ imageId, onClose }) => {
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        // Assume getImageById returns an object like { id, path }
        const imageRecord = await getImageById(imageId);
        setImagePath(imageRecord.path);
      } catch (error) {
        console.error("Error fetching image:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [imageId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Editing Image: {imageId}</Text>
      {imagePath ? (
        <Image source={{ uri: imagePath }} style={styles.image} />
      ) : (
        <Text>Image not found.</Text>
      )}
      <Pressable onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeText}>Close</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "90%",
    height: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: "70%",
    resizeMode: "contain",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
  },
  closeText: {
    color: "white",
    fontSize: 16,
  },
});

export default ViewScreen;
