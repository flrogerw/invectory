import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Pressable } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { getImagePaths } from '../utils/database';
import { useFocusEffect } from '@react-navigation/native';

// Define navigation prop type
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [images, setImages] = useState<{ id: number, path: string }[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const fetchedImages = await getImagePaths();
        setImages(fetchedImages);
      } catch (error) {
        console.error('Failed to load images from the database:', error);
      }
    };
    fetchImages();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchImages = async () => {
        try {
          const fetchedImages = await getImagePaths();
          setImages(fetchedImages);
        } catch (error) {
          console.error('Failed to load images from the database:', error);
        }
      };
      fetchImages();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>InVectory</Text>
      </View>

      {/* Featured Albums Section */}
      <Text style={styles.sectionTitle}>Collection</Text>
      <FlatList
        data={images}
        numColumns={3}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("EditScreen", { imageId: item.id })}
            style={styles.imageCard}
          >
            <Image source={{ uri: item.path }} style={styles.image} />
          </Pressable>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background
    paddingVertical: 20,
  },
  header: {
    marginTop: 50,
    paddingBottom: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#BB86FC', // Neon accent
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: 'Avenir Next', // Modern font
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#BB86FC',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  imageCard: {
    flex: 1 / 3, // Ensures three images per row
    alignItems: 'center',
    padding: 8,
  },
  image: {
    width: 130,
    height: 130,
    borderRadius: 12,
    backgroundColor: '#1E1E1E', // Dark card color
    shadowColor: '#BB86FC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5, // For Android
    borderWidth: 2,
    borderColor: '#BB86FC', // Glowing border effect
  },
});

export default HomeScreen;
