import React from 'react';
import { FlatList, Pressable, Image, StyleSheet, View, Text } from 'react-native';

type ImageItem = {
  id: number;
  path: string;
  distance?: number; 
};

type ImageGridProps = {
  images: ImageItem[];
  onImagePress: (imageId: number) => void;
};

const ImageGrid: React.FC<ImageGridProps> = ({ images, onImagePress }) => (
  <FlatList
    data={images}
    numColumns={3}
    keyExtractor={(item) => item.id.toString()}
    renderItem={({ item }) => (
      <Pressable onPress={() => onImagePress(item.id)} style={styles.imageCard}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.path }} style={styles.image} />
          {item.distance !== undefined && (
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>{(item.distance*100).toFixed(2)}</Text>
            </View>
          )}
        </View>
      </Pressable>
    )}
  />
);

const styles = StyleSheet.create({
  imageCard: {
    flex: 1 / 3,
    alignItems: 'center',
    padding: 8,
  },
  imageWrapper: {
    position: 'relative', // allows overlay positioning
  },
  image: {
    width: 130,
    height: 130,
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
    shadowColor: '#BB86FC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#BB86FC',
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
