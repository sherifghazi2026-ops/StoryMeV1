import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function YoyaGameScreen({ navigation }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, WINNER
  
  // توليد عناصر اللعبة (20 جوهرة، 5 تنانين، 3 طيور)
  const [items, setItems] = useState([]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('PLAYING');
    generateItems();
  };

  const generateItems = () => {
    let newItems = [];
    // 20 جوهرة
    for (let i = 0; i < 20; i++) {
      newItems.push({ id: `gem${i}`, type: '💎', x: Math.random() * (width - 50), y: Math.random() * (height - 250) + 100, collected: false });
    }
    // 5 تنانين
    for (let i = 0; i < 5; i++) {
      newItems.push({ id: `dragon${i}`, type: '🐲', x: Math.random() * (width - 50), y: Math.random() * (height - 250) + 100, collected: false });
    }
    // 3 طيور
    for (let i = 0; i < 3; i++) {
      newItems.push({ id: `bird${i}`, type: '🐦', x: Math.random() * (width - 50), y: Math.random() * (height - 250) + 100, collected: false });
    }
    setItems(newItems);
  };

  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'PLAYING') {
      endGame();
    }
  }, [timeLeft, gameState]);

  const collectItem = (id) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, collected: true } : item));
    setScore(prev => prev + 1);
  };

  const endGame = async () => {
    setGameState('WINNER');
    // إضافة الجواهر المجمعة للرصيد الحقيقي
    const currentGems = await AsyncStorage.getItem('total_gems');
    const total = parseInt(currentGems || '0') + score;
    await AsyncStorage.setItem('total_gems', total.toString());
  };

  if (gameState === 'START') {
    return (
      <View style={styles.center}>
        <Text style={styles.gameTitle}>لعبة Yoya 🌲</Text>
        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
          <Text style={styles.btnText}>ابدأ اللعبة (30 ثانية) 🚀</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{marginTop: 20}}>خروج</Text></TouchableOpacity>
      </View>
    );
  }

  if (gameState === 'WINNER') {
    return (
      <View style={styles.winnerScreen}>
        <Text style={styles.winnerEmoji}>🎊 🏆 🎊</Text>
        <Text style={styles.winnerText}>WINNER!</Text>
        <Text style={styles.scoreText}>لقد جمعت {score} جوهرة 💎</Text>
        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
          <Text style={styles.btnText}>العب مرة أخرى 🔄</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('MainMenu')} style={{marginTop: 20}}>
          <Text style={{color: '#FFF', fontWeight: 'bold'}}>العودة للقائمة الرئيسية</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={{ uri: 'https://img.freepik.com/free-vector/forest-scene-with-various-forest-trees_1308-55271.jpg' }} 
      style={styles.gameContainer}
    >
      <View style={styles.gameHeader}>
        <Text style={styles.headerText}>⏱️ {timeLeft}</Text>
        <Text style={styles.headerText}>💎 {score}</Text>
      </View>

      {items.map(item => !item.collected && (
        <TouchableOpacity 
          key={item.id} 
          onPress={() => collectItem(item.id)} 
          style={[styles.gameItem, { left: item.x, top: item.y }]}
        >
          <Text style={{fontSize: 30}}>{item.type}</Text>
        </TouchableOpacity>
      ))}
      
      <Text style={styles.lakeEmoji}>🌊</Text>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F5E9' },
  gameContainer: { flex: 1 },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 40, backgroundColor: 'rgba(0,0,0,0.3)' },
  headerText: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  gameTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 30, color: '#2E7D32' },
  startBtn: { backgroundColor: '#FF9F43', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, elevation: 5 },
  btnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  gameItem: { position: 'absolute', padding: 10 },
  lakeEmoji: { position: 'absolute', bottom: 50, left: 100, fontSize: 80, opacity: 0.6 },
  winnerScreen: { flex: 1, backgroundColor: '#27AE60', justifyContent: 'center', alignItems: 'center' },
  winnerEmoji: { fontSize: 80 },
  winnerText: { fontSize: 50, color: '#FFF', fontWeight: 'bold', marginVertical: 10 },
  scoreText: { fontSize: 24, color: '#FFD700', marginBottom: 30 }
});
