import React from 'react';
import { FlatList, Pressable, Image, StyleSheet, View, Text } from 'react-native';

type ImageItem = {
  id: number;
  path: string;
  distance?: number | null | undefined;
};

type ImageGridProps = {
  images: ImageItem[];
  onImagePress: (imageId: number) => void;
};

const ImageGrid: React.FC<ImageGridProps> = ({ images, onImagePress }) => (
  <>
    <FlatList
      style={{ width: "100%", alignSelf: 'center', backgroundColor: "#e0caa2",  }}
      data={images}
      numColumns={3}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <Pressable onPress={() => onImagePress(item.id)} style={styles.imageCard}>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: item.path }} style={styles.image} />
            {item.distance !== undefined && (
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>{item.distance?.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </Pressable>
      )}
    />
  </>
);

const styles = StyleSheet.create({
  imageCard: {
    flex: 1 / 3,
    alignItems: 'center',
    padding: 8,
    shadowColor: '#2a241d',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5, // This affects Android
    marginVertical: 5,
    marginHorizontal: 1,
  },
  imageWrapper: {
    position: 'relative', // allows overlay positioning
  },
  image: {
    width: 120,
    height: 120,
    aspectRatio: 1,
    borderRadius: 5,
    alignSelf: 'center',
    backgroundColor: "#e69d50", // Ensure a background color is set
  },
  overlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  overlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ImageGrid;
