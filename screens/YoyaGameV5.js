import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function YoyaGameV5({ navigation }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState('START');
  const [fishGems, setFishGems] = useState([]);
  
  const dragonAnims = useRef([0, 1, 2].map(() => new Animated.Value(-100))).current;

  useEffect(() => {
    if (gameState === 'PLAYING') {
      const timer = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timer); finishGame(); return 0; }
          return t - 1;
        });
      }, 1000);

      generateFishGems();
      
      // تحريك التنانين في السماء
      dragonAnims.forEach((anim, i) => {
        Animated.loop(
          Animated.timing(anim, {
            toValue: width + 100,
            duration: 3000 + i * 1000,
            useNativeDriver: false
          })
        ).start();
      });

      return () => clearInterval(timer);
    }
  }, [gameState]);

  const generateFishGems = () => {
    let gems = [];
    for (let i = 0; i < 20; i++) {
      gems.push({
        id: 'fg' + i,
        x: new Animated.Value(Math.random() * (width - 50)),
        y: (height / 2) + Math.random() * (height / 3),
      });
    }
    setFishGems(gems);
    
    // حركة متعرجة للجواهر (كأنها تسبح)
    gems.forEach(gem => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(gem.x, { toValue: width - 60, duration: 2000 + Math.random()*2000, useNativeDriver: false }),
          Animated.timing(gem.x, { toValue: 10, duration: 2000 + Math.random()*2000, useNativeDriver: false })
        ])
      ).start();
    });
  };

  const catchGem = (id) => {
    setFishGems(prev => prev.filter(g => g.id !== id));
    setScore(s => {
      if (s + 1 === 20) finishGame();
      return s + 1;
    });
  };

  const finishGame = async () => {
    setGameState('WINNER');
    const saved = await AsyncStorage.getItem('total_gems');
    await AsyncStorage.setItem('total_gems', (parseInt(saved || '0') + score).toString());
  };

  if (gameState === 'START') return (
    <View style={styles.center}>
      <Text style={styles.title}>صيد بحيرة يويا 🎣</Text>
      <TouchableOpacity style={styles.btn} onPress={() => setGameState('PLAYING')}>
        <Text style={styles.btnText}>ابدأ الصيد ⛵</Text>
      </TouchableOpacity>
    </View>
  );

  if (gameState === 'WINNER') return (
    <View style={[styles.center, {backgroundColor: '#3498db'}]}>
      <Text style={{fontSize: 70}}>🏆🎣</Text>
      <Text style={styles.title}>صياد ماهر!</Text>
      <Text style={styles.scoreTxt}>جمعت {score} جوهرة 💎</Text>
      <TouchableOpacity style={styles.btnWhite} onPress={() => navigation.navigate('GamesList')}>
        <Text style={{color: '#3498db', fontWeight: 'bold'}}>العودة</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground source={{ uri: 'https://img.freepik.com/free-vector/forest-scene-with-various-forest-trees_1308-55271.jpg' }} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTxt}>⏱️ {timeLeft} | 💎 {score}/20</Text>
      </View>

      <View style={styles.lakeArea} />

      {/* التنانين الطائرة */}
      {dragonAnims.map((anim, i) => (
        <Animated.View key={i} style={{ position: 'absolute', top: 80 + i * 50, left: anim }}>
          <Text style={{fontSize: 40}}>🐲</Text>
        </Animated.View>
      ))}

      {/* الجواهر السابحة */}
      {fishGems.map(gem => (
        <Animated.View key={gem.id} style={{ position: 'absolute', left: gem.x, top: gem.y }}>
          <TouchableOpacity onPress={() => catchGem(gem.id)}>
            <Text style={{fontSize: 35}}>💎</Text>
            <View style={styles.bubble} />
          </TouchableOpacity>
        </Animated.View>
      ))}

      <View style={styles.yoyaFisher}>
        <Text style={{fontSize: 60}}>👦🎣</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  headerTxt: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  lakeArea: { position: 'absolute', bottom: 0, width: width, height: height / 2, backgroundColor: 'rgba(52, 152, 219, 0.4)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E1F5FE' },
  title: { fontSize: 30, fontWeight: 'bold', color: '#01579B', marginBottom: 20 },
  btn: { backgroundColor: '#0288D1', padding: 15, borderRadius: 25 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  scoreTxt: { fontSize: 20, color: '#FFD700', marginVertical: 20 },
  btnWhite: { backgroundColor: '#FFF', padding: 15, borderRadius: 25, width: 150, alignItems: 'center' },
  bubble: { width: 30, height: 5, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 10 },
  yoyaFisher: { position: 'absolute', bottom: height/2 - 30, left: 20 }
});
