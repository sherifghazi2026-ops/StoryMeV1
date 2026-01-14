import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function YoyaGameV4({ navigation }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState('START');
  const [balloons, setBalloons] = useState([]);
  const dragonAnims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (gameState === 'PLAYING') {
      const timer = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timer); finishGame(); return 0; }
          return t - 1;
        });
      }, 1000);

      const gen = setInterval(addBalloon, 800);

      dragonAnims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: width - 60, duration: 2000 + i * 500, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0, duration: 2000 + i * 500, useNativeDriver: false })
          ])
        ).start();
      });

      return () => { clearInterval(timer); clearInterval(gen); };
    }
  }, [gameState]);

  const addBalloon = () => {
    const id = Math.random().toString();
    const animY = new Animated.Value(height);
    setBalloons(prev => [...prev, { id, x: Math.random() * (width - 60), animY }]);
    Animated.timing(animY, { toValue: -100, duration: 4000, useNativeDriver: false }).start();
  };

  const finishGame = async () => {
    setGameState('WINNER');
    const saved = await AsyncStorage.getItem('total_gems');
    await AsyncStorage.setItem('total_gems', (parseInt(saved || '0') + score).toString());
  };

  return (
    <ImageBackground source={{ uri: 'https://img.freepik.com/free-vector/nature-forest-landscape-with-lake-trees_1308-68406.jpg' }} style={styles.container}>
      {gameState === 'PLAYING' ? (
        <>
          <View style={styles.header}><Text style={styles.headerTxt}>⏱️ {timeLeft} | 💎 {score}</Text></View>
          {dragonAnims.map((anim, i) => (
            <Animated.View key={i} style={[styles.dragon, { top: 100 + i * 150, left: anim }]}><Text style={{fontSize: 40}}>🐲</Text></Animated.View>
          ))}
          {balloons.map(b => (
            <Animated.View key={b.id} style={{ position: 'absolute', left: b.x, top: b.animY }}>
              <TouchableOpacity onPress={() => { setScore(s => s + 1); setBalloons(prev => prev.filter(bl => bl.id !== b.id)); }}>
                <Text style={{ fontSize: 50 }}>🎈</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </>
      ) : (
        <View style={styles.center}>
           <Text style={styles.title}>{gameState === 'START' ? 'بالونات يويا' : 'انتهى التحدي!'}</Text>
           <TouchableOpacity style={styles.btn} onPress={() => gameState === 'START' ? setGameState('PLAYING') : navigation.navigate('GamesList')}>
             <Text>{gameState === 'START' ? 'ابدأ' : 'خروج'}</Text>
           </TouchableOpacity>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 40, alignItems: 'center' },
  headerTxt: { fontSize: 25, fontWeight: 'bold', color: '#FFF' },
  dragon: { position: 'absolute', zIndex: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  title: { fontSize: 30, color: '#FFF', marginBottom: 20 },
  btn: { backgroundColor: '#f1c40f', padding: 15, borderRadius: 15 }
});
