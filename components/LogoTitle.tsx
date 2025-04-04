// LogoTitle.tsx
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const LogoTitle: React.FC = () => {
  return (
    <View style={styles.logoContainer}>
  <Image
    source={require('../assets/images/vinyl_vectors.png')}
    style={styles.logo}
    //resizeMode="contain"
  />
</View>
  );
};

const styles = StyleSheet.create({
    logoContainer: {
      width: "100%",    // or a fixed value
      height: 35,      // fixed height
      alignSelf: 'center',
    },
    logo: {
      flex: 1,
      height: 35,
    },
  });

export default LogoTitle;
