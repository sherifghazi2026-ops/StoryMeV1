import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Alert, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function GameScreen({ navigation }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const yoyaY = useRef(new Animated.Value(height - 150)).current; 
  const dragonX = useRef(new Animated.Value(width)).current; 
  const birdX = useRef(new Animated.Value(width)).current; 
  const gemX = useRef(new Animated.Value(width)).current; 

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(30);
    runDragon();
    runBird();
    runGem();
  };

  const jump = () => {
    if (!isPlaying) return;
    Animated.sequence([
      Animated.timing(yoyaY, { toValue: height - 350, duration: 400, useNativeDriver: false }),
      Animated.timing(yoyaY, { toValue: height - 150, duration: 400, useNativeDriver: false }),
    ]).start();
  };

  const runDragon = () => {
    dragonX.setValue(width + Math.random() * 300);
    Animated.timing(dragonX, { toValue: -100, duration: 2000, useNativeDriver: false }).start(() => {
      if (isPlaying) runDragon();
    });
  };

  const runBird = () => {
    birdX.setValue(width + 500);
    Animated.timing(birdX, { toValue: -100, duration: 2500, useNativeDriver: false }).start(() => {
      if (isPlaying) runBird();
    });
  };

  const runGem = () => {
    gemX.setValue(width + 100);
    Animated.timing(gemX, { toValue: -100, duration: 1500, useNativeDriver: false }).start(() => {
      if (isPlaying) runGem();
    });
  };

  useEffect(() => {
    let timerInterval;
    let collisionInterval;

    if (isPlaying) {
      timerInterval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { winGame(); return 0; }
          return t - 1;
        });
      }, 1000);

      collisionInterval = setInterval(() => {
        // تصادم التنين (أرضي)
        if (dragonX._value < 70 && dragonX._value > 10 && yoyaY._value > height - 200) gameOver();
        // تصادم الطائر (هوائي)
        if (birdX._value < 70 && birdX._value > 10 && yoyaY._value < height - 200) gameOver();
        // جمع الجواهر
        if (gemX._value < 70 && gemX._value > 10 && Math.abs(yoyaY._value - (height - 250)) < 100) {
          setScore(s => s + 1);
          gemX.setValue(-100);
        }
      }, 100);
    }
    return () => { clearInterval(timerInterval); clearInterval(collisionInterval); };
  }, [isPlaying]);

  const gameOver = () => {
    setIsPlaying(false);
    Alert.alert('Game Over! 🐲', 'حاول مرة أخرى لتصل للـ Checkpoint!');
    navigation.goBack();
  };

  const winGame = async () => {
    setIsPlaying(false);
    const bonus = score >= 20 ? 20 : 5;
    const currentGems = await AsyncStorage.getItem('userGems');
    await AsyncStorage.setItem('userGems', (parseInt(currentGems || '0') + bonus).toString());
    
    Alert.alert(
      'Winner! 🏆✨', 
      `لقد وصلت للنهاية!\nالجواهر المجموعة: ${score}\nجواهر الرصيد المضافة: ${bonus}`,
      [{ text: "احتفال!", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://img.freepik.com/free-vector/nature-forest-landscape-with-lake-trees_1308-68406.jpg' }} 
        style={styles.background}
      >
        <View style={styles.header}>
          <Text style={styles.stats}>💎: {score} | ⏱️: {timeLeft}s</Text>
        </View>

        <TouchableOpacity activeOpacity={1} onPress={jump} style={styles.gameArea}>
          <Animated.View style={[styles.yoya, { top: yoyaY }]}><Text style={{fontSize: 50}}>👦</Text></Animated.View>
          <Animated.View style={[styles.dragon, { left: dragonX }]}><Text style={{fontSize: 45}}>🐲</Text></Animated.View>
          <Animated.View style={[styles.bird, { left: birdX }]}><Text style={{fontSize: 35}}>🐦</Text></Animated.View>
          <Animated.View style={[styles.gem, { left: gemX }]}><Text style={{fontSize: 30}}>💎</Text></Animated.View>
        </TouchableOpacity>

        <View style={styles.ground} />

        {!isPlaying && (
          <View style={styles.overlay}>
            <Text style={styles.goalText}>اجمع 20 جوهرة في 30 ثانية! 🏁</Text>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startBtnText}>انطلاق! 🚀</Text>
            </TouchableOpacity>
          </View>
        )}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, resizeMode: 'cover' },
  header: { paddingTop: 50, alignItems: 'center' },
  stats: { fontSize: 24, fontWeight: 'bold', color: '#FFF', backgroundColor: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: 20 },
  gameArea: { flex: 1 },
  yoya: { position: 'absolute', left: 40 },
  dragon: { position: 'absolute', bottom: 100 },
  bird: { position: 'absolute', top: height/3 },
  gem: { position: 'absolute', top: height/2 },
  ground: { height: 100, backgroundColor: '#3d2b1f', opacity: 0.8 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  goalText: { color: '#FFF', fontSize: 18, marginBottom: 20, fontWeight: 'bold' },
  startBtn: { backgroundColor: '#FFD700', padding: 25, borderRadius: 50, elevation: 10 },
  startBtnText: { fontSize: 22, fontWeight: 'bold' }
});
