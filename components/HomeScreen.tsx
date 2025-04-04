import React, { useState, useCallback } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { RootStackParamList } from '../App';
import { getImagePaths } from '../utils/database';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ImageGrid from '../components/ImageGrid';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const HomeScreen = () => {
  const [images, setImages] = useState<{ id: number; path: string }[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const backgroundSource = require('../assets/icon.png');

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
      <Image
        source={backgroundSource}
        style={styles.imageBackground}
      />
      <View style={styles.imageGridContainer}>
        <ImageGrid
          images={images}
          onImagePress={(id) => navigation.navigate("EditScreen", { imageId: id })}
        />
      </View>
      <View style={styles.clickEdit}>
        <Text>CLICK AN IMAGE TO EDIT</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageBackground: {
    height: 200,       // or whatever height your top image should have
    width: '100%',
    resizeMode: 'cover',
  },
  imageGridContainer: {
    flex: 1,           // This will fill the remaining vertical space
  },
  clickEdit: {
    height: 50,        // Fixed height for the bottom view
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0caa2',
  },
});
export default HomeScreen;
