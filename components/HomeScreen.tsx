import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RootStackParamList } from '../App';
import { getImagePaths } from '../utils/database';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ImageGrid from '../components/ImageGrid';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const HomeScreen = () => {
  const [images, setImages] = useState<{ id: number; path: string }[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const fetchedImages = await getImagePaths();
          setImages(fetchedImages);
        } catch (error) {
          console.error('Failed to load images from the database:', error);
        }
      })();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>InVectory</Text>
      </View>
      <Text style={styles.sectionTitle}>Collection</Text>
      <ImageGrid
        images={images}
        onImagePress={(id) => navigation.navigate("EditScreen", { imageId: id })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingVertical: 20,
  },
  header: {
    marginTop: 50,
    paddingBottom: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#BB86FC',
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: 'Avenir Next',
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

export default HomeScreen;
