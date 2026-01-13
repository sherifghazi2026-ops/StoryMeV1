import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function IntroScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => { navigation.replace('Language'); }, 4000);
  }, []);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/intro.gif')} 
        style={styles.gif}
        resizeMode="cover" 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  gif: { width: width, height: height }
});
