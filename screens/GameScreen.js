import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Alert, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function GameScreen({ navigation, route }) {
  const { level = 1 } = route.params || {};
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);

  // تدرج السرعة بناءً على المستوى
  const speedBoost = Math.min(level * 100, 1000); 
  const dragonDuration = 2000 - speedBoost;

  const yoyaY = useRef(new Animated.Value(height - 150)).current;
  const dragonX = useRef(new Animated.Value(width)).current;
  const birdX = useRef(new Animated.Value(width)).current;
  const gemX = useRef(new Animated.Value(width)).current;

  const startGame = () => {
    setIsPlaying(true); setScore(0); setTimeLeft(30);
    runDragon(); runBird(); runGem();
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
    Animated.timing(dragonX, { toValue: -100, duration: dragonDuration, useNativeDriver: false }).start(() => {
      if (isPlaying) runDragon();
    });
  };

  const runBird = () => {
    birdX.setValue(width + 500);
    Animated.timing(birdX, { toValue: -100, duration: dragonDuration + 500, useNativeDriver: false }).start(() => {
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
    let timer, collision;
    if (isPlaying) {
      timer = setInterval(() => {
        setTimeLeft(t => { if (t <= 1) { winGame(); return 0; } return t - 1; });
      }, 1000);
      collision = setInterval(() => {
        if (dragonX._value < 70 && dragonX._value > 10 && yoyaY._value > height - 200) gameOver();
        if (birdX._value < 70 && birdX._value > 10 && yoyaY._value < height - 200) gameOver();
        if (gemX._value < 70 && gemX._value > 10 && Math.abs(yoyaY._value - (height - 250)) < 100) {
          setScore(s => s + 1); gemX.setValue(-100);
        }
      }, 100);
    }
    return () => { clearInterval(timer); clearInterval(collision); };
  }, [isPlaying]);

  const gameOver = () => { setIsPlaying(false); Alert.alert('Game Over! 🐲', 'حاول مرة أخرى!'); };

  const winGame = async () => {
    setIsPlaying(false);
    const bonus = score >= 20 ? 20 : 5;
    const current = await AsyncStorage.getItem('total_gems');
    await AsyncStorage.setItem('total_gems', (parseInt(current || '0') + bonus).toString());
    Alert.alert('Winner! 🏆✨', `مستوى ${level} اكتمل!\nجواهرك المكتسبة: ${bonus}`, [{ text: "ممتاز!", onPress: () => navigation.goBack() }]);
  };

  return (
    <ImageBackground source={{ uri: 'https://img.freepik.com/free-vector/nature-forest-landscape-with-lake-trees_1308-68406.jpg' }} style={styles.bg}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Text>🔙</Text></TouchableOpacity>
        <Text style={styles.stats}>💎 {score} | ⏱️ {timeLeft}s | Lv.{level}</Text>
      </View>
      <TouchableOpacity activeOpacity={1} onPress={jump} style={{flex:1}}>
        <Animated.View style={[styles.obj, { top: yoyaY, left: 40 }]}><Text style={{fontSize:50}}>👦</Text></Animated.View>
        <Animated.View style={[styles.obj, { left: dragonX, bottom: 100 }]}><Text style={{fontSize:45}}>🐲</Text></Animated.View>
        <Animated.View style={[styles.obj, { left: birdX, top: height/3 }]}><Text style={{fontSize:35}}>🐦</Text></Animated.View>
        <Animated.View style={[styles.obj, { left: gemX, top: height/2 }]}><Text style={{fontSize:30}}>💎</Text></Animated.View>
      </TouchableOpacity>
      {!isPlaying && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.btn} onPress={startGame}><Text style={styles.btnBtn}>ابدأ المستوى {level} 🚀</Text></TouchableOpacity>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: { paddingTop: 50, flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 20 },
  back: { backgroundColor: '#FFF', padding: 10, borderRadius: 10 },
  stats: { fontSize: 18, color: '#FFF', backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 15 },
  obj: { position: 'absolute' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  btn: { backgroundColor: '#FFD700', padding: 20, borderRadius: 30 },
  btnBtn: { fontSize: 20, fontWeight: 'bold' }
});
