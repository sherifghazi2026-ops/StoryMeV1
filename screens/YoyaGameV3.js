import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function YoyaGameV3({ navigation }) {
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('START');
  const jumpAnim = useRef(new Animated.Value(0)).current;
  const [elements, setElements] = useState([]);
  const scoreRef = useRef(0);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      const interval = setInterval(() => {
        generateElement();
      }, 1500);

      const collisionInterval = setInterval(() => {
        checkCollisions();
      }, 50);

      return () => {
        clearInterval(interval);
        clearInterval(collisionInterval);
      };
    }
  }, [gameState]);

  const generateElement = () => {
    const types = ['💎', '🪨', '🐲'];
    const type = types[Math.floor(Math.random() * types.length)];
    const newEl = {
      id: Math.random().toString(),
      type: type,
      x: new Animated.Value(width),
      collected: false,
    };
    
    setElements(prev => [...prev, newEl]);

    Animated.timing(newEl.x, {
      toValue: -100,
      duration: 3000,
      useNativeDriver: false
    }).start();
  };

  const checkCollisions = () => {
    elements.forEach(el => {
      // الحصول على القيمة الحالية لموقع العنصر وموقع يويا
      const elX = el.x._value;
      const yoyaY = jumpAnim._value; // القيمة 0 تعني على الأرض، والقيم السالبة تعني قفز

      // منطق الاصطدام (يويا في المسافة بين 50 و 100 من اليسار)
      if (elX > 40 && elX < 90) {
        if (el.type === '💎' && !el.collected) {
            // التحقق من أن يويا قريب من الجوهرة عمودياً (أثناء القفز أو السقوط)
            if (yoyaY < -50) { 
               el.collected = true;
               el.x.setValue(-200); // إخفاء الجوهرة
               setScore(prev => {
                 scoreRef.current = prev + 1;
                 return prev + 1;
               });
            }
        } else if ((el.type === '🪨' || el.type === '🐲') && yoyaY > -50) {
            // إذا كان العائق صخرة أو تنين ويويا على الأرض (لم يقفز عالياً بما يكفي)
            gameOver();
        }
      }
    });
  };

  const jump = () => {
    if (jumpAnim._value === 0) {
      Animated.sequence([
        Animated.timing(jumpAnim, { toValue: -180, duration: 400, useNativeDriver: false }),
        Animated.timing(jumpAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
      ]).start();
    }
  };

  const gameOver = () => {
    setGameState('GAMEOVER');
  };

  const finishGame = async () => {
    const currentGems = await AsyncStorage.getItem('total_gems');
    const newTotal = parseInt(currentGems || '0') + score;
    await AsyncStorage.setItem('total_gems', newTotal.toString());
    setGameState('WINNER');
  };

  if (gameState === 'START') return (
    <View style={styles.center}>
      <Image source={{ uri: 'https://i.gifer.com/2Ct5.gif' }} style={StyleSheet.absoluteFill} />
      <View style={styles.overlay}>
        <Text style={styles.title}>مغامرة يويا 🏃‍♂️</Text>
        <Text style={styles.hint}>اقفز فوق التنانين 🐲 واجمع الجواهر 💎</Text>
        <TouchableOpacity style={styles.startBtn} onPress={() => setGameState('PLAYING')}>
          <Text style={styles.startBtnTxt}>ابدأ الآن</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (gameState === 'GAMEOVER') return (
    <View style={[styles.center, {backgroundColor: '#C0392B'}]}>
      <Text style={styles.winEmoji}>💥</Text>
      <Text style={styles.winTitle}>خسرت المغامرة!</Text>
      <Text style={styles.winScore}>اصطدمت بالعائق ولم تجمع جواهر</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => {setScore(0); setElements([]); setGameState('PLAYING')}}>
        <Text style={styles.backBtnTxt}>حاول مرة أخرى 🔄</Text>
      </TouchableOpacity>
    </View>
  );

  if (gameState === 'WINNER') return (
    <View style={[styles.center, {backgroundColor: '#27AE60'}]}>
      <Text style={styles.winEmoji}>🏆</Text>
      <Text style={styles.winTitle}>أحسنت يا بطل!</Text>
      <Text style={styles.winScore}>تم إضافة {score} جوهرة لرصيدك 💎</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('GamesList')}>
        <Text style={styles.backBtnTxt}>العودة للألعاب</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableOpacity activeOpacity={1} onPress={jump} style={styles.container}>
      <Image source={{ uri: 'https://i.gifer.com/2Ct5.gif' }} style={StyleSheet.absoluteFill} />
      
      <View style={styles.hud}>
        <Text style={styles.hudTxt}>💎 {score}/20</Text>
        {score >= 20 && (
          <TouchableOpacity onPress={finishGame} style={styles.winBtn}>
            <Text style={{fontWeight: 'bold', color: '#000'}}>استلام الجواهر 🎉</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.View style={[styles.player, { transform: [{ translateY: jumpAnim }] }]}>
        <Text style={{fontSize: 60}}>👦</Text>
      </Animated.View>

      {elements.map((el) => (
        <Animated.View key={el.id} style={[styles.element, { left: el.x }]}>
             <Text style={{fontSize: el.type === '💎' ? 35 : 50}}>{el.type}</Text>
        </Animated.View>
      ))}
      
      <View style={styles.groundLine} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 25, borderRadius: 20, alignItems: 'center' },
  title: { fontSize: 32, color: '#FFF', fontWeight: 'bold' },
  hint: { color: '#FFD700', marginVertical: 10, textAlign: 'center' },
  startBtn: { backgroundColor: '#FF9F43', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, marginTop: 10 },
  startBtnTxt: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  player: { position: 'absolute', bottom: 90, left: 60, zIndex: 10 },
  element: { position: 'absolute', bottom: 95 },
  hud: { paddingTop: 50, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 20 },
  hudTxt: { fontSize: 22, color: '#FFF', fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 10 },
  winBtn: { backgroundColor: '#FFD700', padding: 12, borderRadius: 12, elevation: 5 },
  groundLine: { position: 'absolute', bottom: 85, width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  winTitle: { fontSize: 30, fontWeight: 'bold', color: '#FFF' },
  winEmoji: { fontSize: 80, marginBottom: 10 },
  winScore: { fontSize: 18, color: '#FFF', marginVertical: 15, textAlign: 'center' },
  backBtn: { backgroundColor: '#FFF', padding: 15, borderRadius: 20, width: 200, alignItems: 'center' },
  backBtnTxt: { color: '#2C3E50', fontWeight: 'bold' }
});
