// components/ImageGrid.tsx
import React from 'react';
import { FlatList, Pressable, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type ImageItem = {
  id: number;
  path: string;
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
          <Image source={{ uri: item.path }} style={styles.image} />
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
});

export default ImageGrid;
