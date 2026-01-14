import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ImageBackground, Animated, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function YoyaGameV1({ navigation }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState('START');
  const [items, setItems] = useState([]);
  
  // أنيميشن التنانين
  const dragonAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (gameState === 'PLAYING') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timer); finishGame(); return 0; }
          return prev - 1;
        });
      }, 1000);

      // تحريك التنانين وتفعيل فحص التصادم
      dragonAnims.forEach((anim, index) => {
        const duration = 3000 + (index * 500);
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: width - 60, duration: duration, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0, duration: duration, useNativeDriver: false })
          ])
        ).start();
      });

      return () => clearInterval(timer);
    }
  }, [gameState]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    generateElements();
    setGameState('PLAYING');
  };

  const generateElements = () => {
    let newItems = [];
    for (let i = 0; i < 20; i++) {
      newItems.push({ id: 'gem' + i, type: '💎', x: Math.random() * (width - 60), y: Math.random() * (height - 350) + 150 });
    }
    for (let i = 0; i < 6; i++) {
      newItems.push({ id: 'rock' + i, type: '🪨', x: Math.random() * (width - 60), y: Math.random() * (height - 350) + 150 });
    }
    setItems(newItems);
  };

  const collectItem = (item) => {
    if (item.type === '🪨') {
       Alert.alert("أوبس! 🪨", "اصطدمت بصخرة، فقدت ثانية من الوقت!");
       setTimeLeft(t => Math.max(0, t - 2));
       return;
    }
    setItems(items.filter(i => i.id !== item.id));
    setScore(s => {
        if (s + 1 === 20) finishGame();
        return s + 1;
    });
  };

  const finishGame = async () => {
    setGameState('WINNER');
    const current = await AsyncStorage.getItem('total_gems');
    await AsyncStorage.setItem('total_gems', (parseInt(current || '0') + score).toString());
  };

  if (gameState === 'START') return (
    <View style={styles.center}>
      <Text style={styles.title}>صيد الجواهر 💎</Text>
      <TouchableOpacity style={styles.startBtn} onPress={startGame}><Text style={styles.btnTxt}>ابدأ 🚀</Text></TouchableOpacity>
    </View>
  );

  if (gameState === 'WINNER') return (
    <View style={[styles.center, {backgroundColor: '#2ecc71'}]}>
      <Text style={styles.winnerTitle}>انتهى الوقت! 🎉</Text>
      <Text style={styles.winnerScore}>جمعت {score} جوهرة</Text>
      <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.navigate('GamesList')}><Text>العودة</Text></TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground source={{ uri: 'https://img.freepik.com/free-vector/forest-scene-with-various-forest-trees_1308-55271.jpg' }} style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTxt}>⏱️ {timeLeft} | 💎 {score}/20</Text></View>
      {dragonAnims.map((anim, i) => (
        <Animated.View key={i} style={[styles.item, { top: 150 + i * 80, left: anim }]}>
          <TouchableOpacity onPress={() => { Alert.alert("تنين! 🐲", "خسرت 5 جواهر!"); setScore(s => Math.max(0, s - 5)); }}>
            <Text style={{ fontSize: 45 }}>🐲</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
      {items.map(item => (
        <TouchableOpacity key={item.id} onPress={() => collectItem(item)} style={[styles.item, { left: item.x, top: item.y }]}>
          <Text style={{ fontSize: 40 }}>{item.type}</Text>
        </TouchableOpacity>
      ))}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#34495e' },
  title: { fontSize: 35, color: '#FFF', fontWeight: 'bold', marginBottom: 20 },
  startBtn: { backgroundColor: '#f1c40f', padding: 20, borderRadius: 20 },
  btnTxt: { fontSize: 20, fontWeight: 'bold' },
  header: { paddingTop: 50, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  headerTxt: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  item: { position: 'absolute' },
  winnerTitle: { fontSize: 30, color: '#FFF', fontWeight: 'bold' },
  winnerScore: { fontSize: 22, color: '#f1c40f', marginVertical: 20 },
  exitBtn: { backgroundColor: '#FFF', padding: 15, borderRadius: 15 }
});
