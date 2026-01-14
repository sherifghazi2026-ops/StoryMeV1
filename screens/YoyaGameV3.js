import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, PanResponder } from 'react-native';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

export default function YoyaGameV3({ navigation }) {
  const [score, setScore] = useState(0);
  const [gemsCount, setGemsCount] = useState(0);
  const [energy, setEnergy] = useState(12);
  const [isGameOver, setIsGameOver] = useState(false);
  const playerX = useRef(new Animated.Value(width / 2 - 40)).current;
  const currentX = useRef(width / 2 - 40);

  useEffect(() => {
    const listener = playerX.addListener((v) => { currentX.current = v.value; });
    return () => playerX.removeListener(listener);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gs) => {
        let newX = evt.nativeEvent.pageX - 40;
        if (newX < 0) newX = 0;
        if (newX > width - 80) newX = width - 80;
        playerX.setValue(newX);
      },
    })
  ).current;

  async function playSound(type) {
    try {
      const uri = type === 'hit' 
        ? 'https://www.soundjay.com/buttons/sounds/button-37.mp3' 
        : 'https://www.soundjay.com/buttons/sounds/button-10.mp3';
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate((s) => { if (s.didJustFinish) sound.unloadAsync(); });
    } catch (e) {}
  }

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isGameOver) return;
    const interval = setInterval(() => {
      const rand = Math.random();
      let type = rand > 0.7 ? 'gem' : (rand > 0.4 ? 'fruit' : 'fire');
      
      const newItem = {
        id: Math.random().toString(),
        type: type,
        x: Math.random() * (width - 60),
        y: new Animated.Value(-50),
      };

      setItems(prev => [...prev, newItem]);

      Animated.timing(newItem.y, {
        toValue: height - 140,
        duration: 2800, // سرعة أبطأ قليلاً للدقة
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          // فحص دقيق للتصادم
          if (newItem.x > currentX.current - 30 && newItem.x < currentX.current + 70) {
            if (newItem.type === 'gem') {
              setGemsCount(g => Math.min(g + 1, 12));
              setScore(s => s + 10);
              playSound('hit');
            } else if (newItem.type === 'fruit') {
              setEnergy(e => Math.min(e + 1, 12));
              playSound('hit');
            } else if (newItem.type === 'fire') {
              setEnergy(e => {
                if (e <= 1) setIsGameOver(true);
                return e - 1;
              });
              playSound('fire');
            }
          }
          setItems(prev => prev.filter(i => i.id !== newItem.id));
        }
      });
    }, 1500); // تقليل عدد العناصر المتساقطة
    return () => clearInterval(interval);
  }, [isGameOver]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.header}>
        <Text style={styles.headerText}>💎 الجواهر: {gemsCount}/12</Text>
        <View style={styles.batteryRow}>
          {Array.from({ length: energy }).map((_, i) => (
            <Text key={i} style={{ fontSize: 14 }}>🔋</Text>
          ))}
        </View>
      </View>

      {!isGameOver ? (
        <View style={styles.gameArea}>
          {items.map(item => (
            <Animated.View key={item.id} style={[styles.fallingItem, { left: item.x, top: item.y }]}>
              <Text style={{ fontSize: 40 }}>{item.type === 'gem' ? '💎' : item.type === 'fruit' ? '🍎' : '🔥'}</Text>
            </Animated.View>
          ))}
          <Animated.View style={[styles.player, { left: playerX }]}>
            <Text style={{ fontSize: 70 }}>🧑‍🚀</Text>
          </Animated.View>
        </View>
      ) : (
        <View style={styles.gameOver}>
          <Text style={styles.goTitle}>انتهت المحاولة!</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>رجوع</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  header: { paddingTop: 60, paddingHorizontal: 20 },
  headerText: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },
  batteryRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  gameArea: { flex: 1 },
  fallingItem: { position: 'absolute' },
  player: { position: 'absolute', bottom: 80 },
  gameOver: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  goTitle: { fontSize: 30, color: '#FFF', marginBottom: 20 },
  btn: { backgroundColor: '#FFD700', padding: 15, borderRadius: 20 },
  btnText: { fontWeight: 'bold' }
});
