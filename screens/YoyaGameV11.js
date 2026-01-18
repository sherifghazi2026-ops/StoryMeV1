import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, Dimensions, Image, Animated,
  PanResponder, Modal, TouchableOpacity, Share, Easing, ImageBackground
} from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRAVITY = 0.55;
const JUMP_POWER = -16;
const HERO_SIZE = 80;

const YoyaGameV11 = ({ navigation }) => {
  const [gameState, setGameState] = useState('home');
  const [platforms, setPlatforms] = useState([]);
  const [gems, setGems] = useState([]); // تم تغييرها من فواكه إلى جواهر
  const [enemies, setEnemies] = useState([]); // تنانين وطيور
  const [books, setBooks] = useState([]);
  const [score, setScore] = useState(0);
  const [collectedBooks, setCollectedBooks] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQ, setCurrentQ] = useState(null);
  const [showWinScreen, setShowWinScreen] = useState(false);
  
  // مراجع الحركة والتتبع
  const pos = useRef({ x: SCREEN_WIDTH / 2 - 40, y: SCREEN_HEIGHT - 150 });
  const vel = useRef({ x: 0, y: 0 });
  const scrollY = useRef(new Animated.Value(0)).current;
  const currentScroll = useRef(0);
  const animPos = useRef(new Animated.ValueXY({ x: pos.current.x, y: pos.current.y })).current;
  const knobX = useRef(new Animated.Value(0)).current;
  const gameLoop = useRef(null);

  // الصور (تأكد من وجودها في ملف assets)
  const heroImg = require('../assets/Boy.gif'); 
  const bgImg = require('../assets/forest_lake_bg.jpg'); // خلفية أشجار وبحيرات

  const questions = [
    { id: 1, q: "وجد يويَا جوهرة براقة، هل يشاركها مع أصدقائه؟", options: ["نعم، المشاركة جميلة", "لا، يحتفظ بها وحده"], correct: 0 },
    { id: 2, q: "رأى يويَا تنيناً حزيناً، ماذا يفعل؟", options: ["يواسيه ويلعب معه", "يهرب منه"], correct: 0 },
    { id: 3, q: "كيف يحافظ يويَا على نظافة البحيرة؟", options: ["لا يرمي النفايات فيها", "يرمي الأوراق"], correct: 0 },
    { id: 4, q: "وصل يويَا لنهاية الطريق، هل يشكر الله؟", options: ["نعم، دائماً", "لا داعي"], correct: 0 },
  ];

  const initGame = () => {
    let plats = [{ x: 0, y: SCREEN_HEIGHT - 50, w: SCREEN_WIDTH }];
    let newGems = [];
    let newEnemies = [];
    let newBooks = [];

    // إنشاء العالم (30 ثانية تقريباً تتطلب حوالي 50 منصة)
    for (let i = 1; i < 55; i++) {
      let py = (SCREEN_HEIGHT - 50) - (i * 180);
      let px = Math.random() * (SCREEN_WIDTH - 120);
      plats.push({ x: px, y: py, w: 120 });

      // إضافة 20 جوهرة
      if (newGems.length < 20 && i % 2 === 0) {
        newGems.push({ id: i, x: px + 40, y: py - 50, collected: false });
      }
      // إضافة 5 تنانين و 3 طيور
      if (newEnemies.length < 8 && i % 6 === 0) {
        const isDragon = newEnemies.length < 5;
        newEnemies.push({ id: i, x: px + 20, y: py - 90, type: isDragon ? '🐲' : '🐦' });
      }
      // إضافة الكتب (الأسئلة)
      if (newBooks.length < 4 && i % 12 === 0) {
        newBooks.push({ ...questions[newBooks.length], x: px + 30, y: py - 60, collected: false });
      }
    }

    setPlatforms(plats);
    setGems(newGems);
    setEnemies(newEnemies);
    setBooks(newBooks);
    setScore(0);
    setCollectedBooks(0);
    setGameState('playing');
    currentScroll.current = 0;
    scrollY.setValue(0);
    pos.current = { x: SCREEN_WIDTH / 2 - 40, y: SCREEN_HEIGHT - 150 };
    vel.current = { x: 0, y: 0 };
  };

  const update = () => {
    // الفيزياء
    vel.current.y += GRAVITY;
    pos.current.y += vel.current.y;
    pos.current.x += vel.current.x;

    // تتبع الكاميرا (Smooth Scrolling)
    // الكاميرا تتبع البطل عندما يصعد للأعلى
    let targetScroll = -pos.current.y + SCREEN_HEIGHT * 0.6;
    if (targetScroll > currentScroll.current) {
      currentScroll.current = targetScroll;
      scrollY.setValue(currentScroll.current);
    }

    // حدود الشاشة
    if (pos.current.x < 0) pos.current.x = 0;
    if (pos.current.x > SCREEN_WIDTH - HERO_SIZE) pos.current.x = SCREEN_WIDTH - HERO_SIZE;

    // التصادم مع المنصات
    if (vel.current.y > 0) {
      platforms.forEach(p => {
        if (pos.current.y + HERO_SIZE >= p.y && pos.current.y + HERO_SIZE <= p.y + 30 &&
            pos.current.x + HERO_SIZE - 20 >= p.x && pos.current.x + 20 <= p.x + p.w) {
          vel.current.y = JUMP_POWER;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      });
    }

    // جمع الجواهر
    gems.forEach(g => {
      if (!g.collected && Math.abs(pos.current.x - g.x) < 50 && Math.abs(pos.current.y - g.y) < 50) {
        g.collected = true;
        setScore(s => s + 1);
      }
    });

    // لمس الكتب (الأسئلة)
    books.forEach(b => {
      if (!b.collected && Math.abs(pos.current.x - b.x) < 50 && Math.abs(pos.current.y - b.y) < 50) {
        b.collected = true;
        clearInterval(gameLoop.current);
        setCurrentQ(b);
        setShowQuestion(true);
        Speech.speak(b.q, { language: 'ar' });
      }
    });

    // شرط الفوز (الوصول لأعلى منصة)
    if (pos.current.y < platforms[platforms.length - 1].y) {
        clearInterval(gameLoop.current);
        setShowWinScreen(true);
    }

    // منع السقوط خارج الشاشة (العودة لآخر منصة مرئية)
    if (pos.current.y > (-currentScroll.current + SCREEN_HEIGHT)) {
        pos.current.y = -currentScroll.current + 100;
        vel.current.y = 0;
    }

    animPos.setValue({ x: pos.current.x, y: pos.current.y });
  };

  useEffect(() => {
    if (gameState === 'playing' && !showQuestion && !showWinScreen) {
      gameLoop.current = setInterval(update, 16);
    }
    return () => clearInterval(gameLoop.current);
  }, [gameState, showQuestion, showWinScreen]);

  const joystick = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      let mx = Math.max(-50, Math.min(50, gs.dx));
      knobX.setValue(mx);
      vel.current.x = mx / 6;
    },
    onPanResponderRelease: () => {
      Animated.spring(knobX, { toValue: 0, useNativeDriver: true }).start();
      vel.current.x = 0;
    }
  });

  return (
    <View style={styles.container}>
      {gameState === 'playing' ? (
        <ImageBackground source={bgImg} style={styles.flex}>
          <Animated.View style={[styles.flex, { transform: [{ translateY: scrollY }] }]}>
            {platforms.map((p, i) => (
              <View key={i} style={[styles.plat, { left: p.x, top: p.y, width: p.w }]} />
            ))}
            {gems.map(g => !g.collected && (
              <Text key={g.id} style={[styles.abs, { left: g.x, top: g.y, fontSize: 30 }]}>💎</Text>
            ))}
            {enemies.map(e => (
              <Text key={e.id} style={[styles.abs, { left: e.x, top: e.y, fontSize: 40 }]}>{e.type}</Text>
            ))}
            {books.map(b => !b.collected && (
              <Text key={b.id} style={[styles.abs, { left: b.x, top: b.y, fontSize: 35 }]}>📖</Text>
            ))}
            <Animated.View style={[styles.hero, { transform: animPos.getTranslateTransform() }]}>
              <Image source={heroImg} style={styles.heroImg} />
            </Animated.View>
          </Animated.View>

          {/* UI */}
          <View style={styles.hud}>
            <Text style={styles.hudText}>💎 {score}/20</Text>
            <Text style={styles.hudText}>📚 {collectedBooks}/4</Text>
          </View>

          {/* Joystick */}
          <View style={styles.joyArea}>
             <View style={styles.joyBase} {...joystick.panHandlers}>
                <Animated.View style={[styles.joyKnob, { transform: [{ translateX: knobX }] }]} />
             </View>
          </View>

          {/* Question Modal */}
          <Modal visible={showQuestion} transparent animationType="fade">
            <View style={styles.modal}>
              <View style={styles.card}>
                <Text style={styles.qText}>{currentQ?.q}</Text>
                {currentQ?.options.map((opt, i) => (
                  <TouchableOpacity key={i} style={styles.opt} onPress={() => {
                    if(i === currentQ.correct) setCollectedBooks(c => c + 1);
                    setShowQuestion(false);
                  }}>
                    <Text style={styles.optT}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Modal>

          {/* Win Screen (Checkpoint) */}
          <Modal visible={showWinScreen} transparent>
             <View style={styles.winFull}>
                <ConfettiCannon count={150} origin={{x: SCREEN_WIDTH/2, y: 0}} />
                <Text style={styles.winTitle}>WINNER! 🏆</Text>
                <Text style={styles.winSub}>لقد وصلت شخصية Yoya إلى النهاية!</Text>
                <View style={styles.winStats}>
                    <Text style={styles.winStatsT}>💎 الجواهر المجمعة: {score}</Text>
                    <Text style={styles.winStatsT}>📚 الدروس المستفادة: {collectedBooks}</Text>
                </View>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnT}>العودة للقائمة الرئيسية</Text>
                </TouchableOpacity>
             </View>
          </Modal>
        </ImageBackground>
      ) : (
        <View style={styles.home}>
          <Text style={styles.title}>مغامرة Yoya</Text>
          <TouchableOpacity style={styles.startBtn} onPress={initGame}>
            <Text style={styles.startBtnT}>ابدأ اللعب 🎮</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#81ECEC' },
  flex: { flex: 1 },
  abs: { position: 'absolute' },
  plat: { position: 'absolute', height: 15, backgroundColor: '#2D3436', borderRadius: 10, borderBottomWidth: 4, borderBottomColor: '#000' },
  hero: { position: 'absolute', width: HERO_SIZE, height: HERO_SIZE },
  heroImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  hud: { position: 'absolute', top: 50, width: '100%', flexDirection: 'row', justifyContent: 'space-around' },
  hudText: { fontSize: 20, fontWeight: 'bold', color: '#FFF', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 15 },
  joyArea: { position: 'absolute', bottom: 60, width: '100%', alignItems: 'center' },
  joyBase: { width: 120, height: 60, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 30, justifyContent: 'center', padding: 5, borderWidth: 2, borderColor: '#FFF' },
  joyKnob: { width: 50, height: 50, backgroundColor: '#FFF', borderRadius: 25 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  card: { width: '85%', backgroundColor: '#FFF', padding: 25, borderRadius: 20, alignItems: 'center' },
  qText: { fontSize: 20, textAlign: 'center', marginBottom: 20, fontWeight: 'bold' },
  opt: { backgroundColor: '#F1C40F', width: '100%', padding: 15, borderRadius: 10, marginVertical: 8 },
  optT: { textAlign: 'center', fontWeight: 'bold' },
  winFull: { flex: 1, backgroundColor: '#6C5CE7', justifyContent: 'center', alignItems: 'center', padding: 20 },
  winTitle: { fontSize: 50, color: '#F1C40F', fontWeight: 'bold' },
  winSub: { fontSize: 20, color: '#FFF', textAlign: 'center', marginVertical: 10 },
  winStats: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 20, borderRadius: 20, width: '100%', marginVertical: 20 },
  winStatsT: { fontSize: 22, color: '#FFF', textAlign: 'center', marginVertical: 5 },
  backBtn: { backgroundColor: '#2ECC71', padding: 20, borderRadius: 15 },
  backBtnT: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  home: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 40, fontWeight: 'bold', color: '#2D3436', marginBottom: 50 },
  startBtn: { backgroundColor: '#E17055', padding: 20, borderRadius: 20 },
  startBtnT: { color: '#FFF', fontSize: 22, fontWeight: 'bold' }
});

export default YoyaGameV11;

