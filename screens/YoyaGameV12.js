import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ImageBackground, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function YoyaGameV12({ navigation, route }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState('START');
  const [items, setItems] = useState([]);
  const movementType = "static";

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('PLAYING');
    generateItems();
  };

  const generateItems = () => {
    let newItems = [];
    // 20 جوهرة مبعثرة
    for (let j = 0; j < 20; j++) {
      newItems.push({
        id: 'gem'+j,
        type: '💎',
        x: Math.random() * (width - 60),
        y: movementType === "falling" ? -50 : Math.random() * (height - 300) + 100,
        anim: new Animated.Value(0)
      });
    }
    // 6 صخور ثابتة كعوائق
    for (let j = 0; j < 6; j++) {
      newItems.push({ id: 'rock'+j, type: '🪨', x: Math.random() * (width - 60), y: Math.random() * (height - 300) + 100 });
    }
    setItems(newItems);
  };

  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => {
        if (t <= 1) { finishGame(); return 0; }
        return t - 1;
      }), 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft]);

  const collectItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setScore(s => {
      const newScore = s + 1;
      if (newScore === 20) setGameState('WINNER');
      return newScore;
    });
  };

  const finishGame = async () => {
    setGameState('WINNER');
    const saved = await AsyncStorage.getItem('total_gems');
    await AsyncStorage.setItem('total_gems', (parseInt(saved || '0') + score).toString());
  };

  if (gameState === 'START') return (
    <View style={styles.center}>
      <Text style={styles.title}>{route.params?.gameName || 'لعبة متنوعة 12'}</Text>
      <TouchableOpacity style={styles.startBtn} onPress={startGame}><Text style={styles.btnText}>ابدأ المغامرة 🚀</Text></TouchableOpacity>
    </View>
  );

  if (gameState === 'WINNER') return (
    <View style={styles.winner}>
      <Text style={styles.winnerText}>انتهى التحدي! 🎉</Text>
      <Text style={styles.scoreText}>الجواهر: {score}</Text>
      <TouchableOpacity style={styles.startBtn} onPress={() => navigation.navigate('GamesList')}><Text style={styles.btnText}>العودة للألعاب</Text></TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground source={{ uri: 'https://img.freepik.com/free-vector/forest-scene-with-various-forest-trees_1308-55271.jpg' }} style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTxt}>⏱️ {timeLeft} | 💎 {score}/20</Text></View>
      
      {/* 5 تنانين تتحرك ببطء */}
      {[1,2,3,4,5].map(d => (
        <Text key={'d'+d} style={[styles.dragon, { top: 150 + (d*60), left: (timeLeft * (d*5)) % width }]}>🐲</Text>
      ))}

      {items.map(item => (
        <TouchableOpacity 
          key={item.id} 
          onPress={() => item.type === '💎' && collectItem(item.id)}
          style={[styles.item, { left: item.x, top: item.y }]}
        >
          <Text style={{fontSize: item.type === '🪨' ? 45 : 35}}>{item.type}</Text>
        </TouchableOpacity>
      ))}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9FF' },
  container: { flex: 1 },
  header: { paddingTop: 50, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  headerTxt: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30 },
  startBtn: { backgroundColor: '#FF9F43', padding: 15, borderRadius: 25 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  item: { position: 'absolute' },
  dragon: { position: 'absolute', fontSize: 40, opacity: 0.8 },
  winner: { flex: 1, backgroundColor: '#27AE60', justifyContent: 'center', alignItems: 'center' },
  winnerText: { fontSize: 35, color: '#FFF', fontWeight: 'bold' },
  scoreText: { fontSize: 22, color: '#FFD700', marginVertical: 20 }
});
