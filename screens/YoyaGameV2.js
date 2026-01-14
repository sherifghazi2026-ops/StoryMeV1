import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, Animated, ImageBackground, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const BOARD_SIZE = width - 40;
const PLAYER_SIZE = 40;

export default function YoyaGameV2({ navigation }) {
  const [gameState, setGameState] = useState('START');
  const pan = useRef(new Animated.ValueXY({ x: 5, y: 5 })).current;
  
  // أنيميشن التنانين المتحركة داخل المتاهة كعوائق
  const dragonPos = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (gameState === 'PLAYING') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dragonPos, { toValue: BOARD_SIZE - 60, duration: 2000, useNativeDriver: false }),
          Animated.timing(dragonPos, { toValue: 0, duration: 2000, useNativeDriver: false })
        ])
      ).start();
    }
  }, [gameState]);

  const walls = [
    { x: 0, y: 80, w: BOARD_SIZE * 0.7, h: 15 },
    { x: BOARD_SIZE * 0.3, y: 180, w: BOARD_SIZE * 0.7, h: 15 },
    { x: 0, y: 280, w: BOARD_SIZE * 0.7, h: 15 },
  ];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        let newX = gestureState.moveX - 40;
        let newY = gestureState.moveY - 250;

        // حدود المتاهة
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX > BOARD_SIZE - PLAYER_SIZE) newX = BOARD_SIZE - PLAYER_SIZE;
        if (newY > BOARD_SIZE - PLAYER_SIZE) newY = BOARD_SIZE - PLAYER_SIZE;

        // تصادم مع الجدران
        let collision = false;
        walls.forEach(w => {
          if (newX < w.x + w.w && newX + PLAYER_SIZE > w.x && newY < w.y + w.h && newY + PLAYER_SIZE > w.y) {
            collision = true;
          }
        });

        if (!collision) {
          pan.setValue({ x: newX, y: newY });
          // فحص الفوز
          if (newY > BOARD_SIZE - 60 && newX > BOARD_SIZE - 60) {
            finishGame();
          }
        }
      },
      onPanResponderRelease: () => {}
    })
  ).current;

  const finishGame = async () => {
    if (gameState === 'WINNER') return;
    setGameState('WINNER');
    const current = await AsyncStorage.getItem('total_gems');
    await AsyncStorage.setItem('total_gems', (parseInt(current || '0') + 20).toString());
  };

  if (gameState === 'START') return (
    <View style={styles.center}>
      <Text style={styles.title}>متاهة يويا 🧩</Text>
      <TouchableOpacity style={styles.startBtn} onPress={() => setGameState('PLAYING')}>
        <Text style={styles.btnTxt}>ابدأ التحدي 🚀</Text>
      </TouchableOpacity>
    </View>
  );

  if (gameState === 'WINNER') return (
    <View style={[styles.center, {backgroundColor: '#27AE60'}]}>
      <Text style={{fontSize: 80}}>🏆</Text>
      <Text style={styles.title}>بطل المتاهة!</Text>
      <Text style={{color: '#FFF', fontSize: 20}}>+20 جوهرة 💎</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('GamesList')}>
        <Text>العودة للألعاب</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground source={{uri: 'https://img.freepik.com/free-vector/green-grass-background_1048-9333.jpg'}} style={styles.container}>
      <View style={styles.gameBox}>
        <View style={styles.mazeContainer}>
          {walls.map((w, i) => (
            <View key={i} style={[styles.wall, {left: w.x, top: w.y, width: w.w, height: w.h}]} />
          ))}
          
          {/* التنين العائق المتحرك */}
          <Animated.View style={[styles.dragon, { top: 130, left: dragonPos }]}>
             <TouchableOpacity onPress={() => { pan.setValue({x:5, y:5}); Alert.alert("🐲 احذر!", "التنين أعادك للبداية!"); }}>
                <Text style={{fontSize: 30}}>🐲</Text>
             </TouchableOpacity>
          </Animated.View>

          <Text style={styles.target}>🏆</Text>
          <Animated.View {...panResponder.panHandlers} style={[pan.getLayout(), styles.player]}>
            <Text style={{fontSize: 35}}>👦</Text>
          </Animated.View>
        </View>
      </View>
      <Text style={styles.tip}>اسحب يويا بحذر وتجنب التنين! 🐲</Text>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2C3E50' },
  title: { fontSize: 30, color: '#FFF', fontWeight: 'bold', marginBottom: 20 },
  startBtn: { backgroundColor: '#FF9F43', padding: 20, borderRadius: 20 },
  btnTxt: { color: '#FFF', fontWeight: 'bold' },
  gameBox: { padding: 10, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 20 },
  mazeContainer: { width: BOARD_SIZE, height: BOARD_SIZE, backgroundColor: '#FFF', borderRadius: 10 },
  wall: { position: 'absolute', backgroundColor: '#8B4513' },
  player: { position: 'absolute', zIndex: 10 },
  dragon: { position: 'absolute', zIndex: 5 },
  target: { position: 'absolute', bottom: 10, right: 10, fontSize: 40 },
  tip: { marginTop: 20, color: '#FFF', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10 },
  backBtn: { backgroundColor: '#FFF', padding: 15, borderRadius: 20, marginTop: 20 }
});
