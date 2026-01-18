import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions,
  ImageBackground, StatusBar, PanResponder, Animated, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const ExplorationGame2D = ({ navigation }) => {
  const [playerPosition, setPlayerPosition] = useState({ x: width / 2, y: height / 2 });
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const collectItem = () => {
    setScore(s => s + 10);
    Alert.alert('رائع!', 'لقد وجدت كنزاً مخفياً');
  };

  if (!gameStarted) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.btn} onPress={() => setGameStarted(true)}>
          <Text style={styles.btnText}>ابدأ المغامرة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground source={require('../assets/world-bg.jpg')} style={styles.background}>
        <View style={[styles.player, { left: playerPosition.x, top: playerPosition.y }]}>
          <Text style={{fontSize: 40}}>👤</Text>
        </View>
        <View style={styles.ui}>
          <Text style={styles.score}>Score: {score}</Text>
          <TouchableOpacity style={styles.action} onPress={collectItem}><Text>Collect</Text></TouchableOpacity>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}><Text>Exit</Text></TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2c3e50' },
  background: { width: '100%', height: '100%' },
  btn: { backgroundColor: '#2ecc71', padding: 20, borderRadius: 10 },
  btnText: { color: 'white', fontSize: 20 },
  player: { position: 'absolute' },
  ui: { position: 'absolute', top: 50, left: 20 },
  score: { fontSize: 24, color: 'white', fontWeight: 'bold' },
  action: { backgroundColor: 'gold', padding: 10, marginTop: 10 },
  back: { backgroundColor: 'red', padding: 10, marginTop: 10 }
});

export default ExplorationGame2D;
