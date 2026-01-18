import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, Dimensions,
  Image, Animated, Vibration, PanResponder, Pressable, Modal
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// إعدادات اللعبة
const GRAVITY = 0.48;
const JUMP_POWER = -14.5;
const SCROLL_SPEED = 1.6;
const HERO_WIDTH = 70;
const HERO_HEIGHT = 90;
const ITEM_SIZE = 40;

const YoyaGameV7 = () => {
  const [gameState, setGameState] = useState('home');
  const [platforms, setPlatforms] = useState([]);
  const [gems, setGems] = useState([]);
  const [books, setBooks] = useState([]);
  const [collectedGems, setCollectedGems] = useState(0);
  const [collectedBooks, setCollectedBooks] = useState(0);
  const [isFacingRight, setIsFacingRight] = useState(true);
  
  // حالة الأسئلة
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");

  const pos = useRef({ x: SCREEN_WIDTH / 2 - HERO_WIDTH / 2, y: SCREEN_HEIGHT - 200 });
  const vel = useRef({ x: 0, y: 0 });
  const scrollOffset = useRef(0);
  const gameLoopRef = useRef(null);

  const animPos = useRef(new Animated.ValueXY({ x: pos.current.x, y: pos.current.y })).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const knobX = useRef(new Animated.Value(0)).current;

  const heroImage = require('../assets/Boy.gif');

  const initGame = () => {
    let newPlatforms = [];
    let newGems = [];
    let newBooks = [];
    
    // منصة البداية
    newPlatforms.push({ x: 0, y: SCREEN_HEIGHT - 100, width: SCREEN_WIDTH });
    
    for (let i = 1; i < 200; i++) {
      let py = (SCREEN_HEIGHT - 100) - (i * 155);
      let px = Math.random() * (SCREEN_WIDTH - 110);
      newPlatforms.push({ x: px, y: py, width: 110 });

      // إضافة 20 جوهرة عشوائياً فوق المنصات
      if (newGems.length < 20 && Math.random() > 0.8) {
        newGems.push({ x: px + 35, y: py - 50, id: i, collected: false });
      }

      // إضافة 3 كتب في ارتفاعات محددة (بداية، منتصف، نهاية)
      if (newBooks.length === 0 && i === 20) newBooks.push({ x: px + 35, y: py - 60, id: 'b1', collected: false });
      if (newBooks.length === 1 && i === 50) newBooks.push({ x: px + 35, y: py - 60, id: 'b2', collected: false });
      if (newBooks.length === 2 && i === 80) newBooks.push({ x: px + 35, y: py - 60, id: 'b3', collected: false });
    }

    setPlatforms(newPlatforms);
    setGems(newGems);
    setBooks(newBooks);
    setCollectedGems(0);
    setCollectedBooks(0);
    pos.current = { x: SCREEN_WIDTH / 2 - HERO_WIDTH / 2, y: SCREEN_HEIGHT - 200 };
    vel.current = { x: 0, y: 0 };
    scrollOffset.current = 0;
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'playing' && !showQuestion) {
      gameLoopRef.current = setInterval(update, 16);
    } else {
      clearInterval(gameLoopRef.current);
    }
    return () => clearInterval(gameLoopRef.current);
  }, [gameState, showQuestion]);

  const update = () => {
    scrollOffset.current += SCROLL_SPEED;
    scrollAnim.setValue(scrollOffset.current);

    vel.current.y += GRAVITY;
    pos.current.y += vel.current.y;
    pos.current.x += vel.current.x;

    if (pos.current.x > SCREEN_WIDTH) pos.current.x = -HERO_WIDTH;
    if (pos.current.x < -HERO_WIDTH) pos.current.x = SCREEN_WIDTH;

    // تصادم المنصات والقفز
    if (vel.current.y > 0) {
      for (let p of platforms) {
        if (pos.current.y + HERO_HEIGHT >= p.y && pos.current.y + HERO_HEIGHT <= p.y + 30 &&
            pos.current.x + HERO_WIDTH - 15 >= p.x && pos.current.x + 15 <= p.x + p.width) {
          vel.current.y = JUMP_POWER;
          break;
        }
      }
    }

    // تصادم الجواهر
    gems.forEach(g => {
      if (!g.collected && Math.abs(pos.current.x - g.x) < 40 && Math.abs(pos.current.y - g.y) < 40) {
        g.collected = true;
        setCollectedGems(prev => prev + 1);
        Vibration.vibrate(10);
      }
    });

    // تصادم الكتب
    books.forEach(b => {
      if (!b.collected && Math.abs(pos.current.x - b.x) < 40 && Math.abs(pos.current.y - b.y) < 40) {
        b.collected = true;
        setCollectedBooks(prev => {
          const newCount = prev + 1;
          handleBookTouch(newCount);
          return newCount;
        });
      }
    });

    const deathLimit = SCREEN_HEIGHT - scrollOffset.current;
    if (pos.current.y > deathLimit + 120) setGameState('home');

    animPos.setValue({ x: pos.current.x, y: pos.current.y });
  };

  const handleBookTouch = (count) => {
    setCurrentQuestion(`السؤال الخاص بالكتاب رقم ${count}: ما هو بطل القصة؟`);
    setShowQuestion(true);
  };

  const joystickResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gs) => {
      let moveX = Math.max(-60, Math.min(60, gs.dx));
      knobX.setValue(moveX);
      vel.current.x = (moveX / 60) * 8;
      setIsFacingRight(gs.dx > 0);
    },
    onPanResponderRelease: () => {
      Animated.spring(knobX, { toValue: 0, useNativeDriver: true }).start();
      vel.current.x = 0;
    }
  })).current;

  return (
    <View style={styles.container}>
      {gameState === 'playing' ? (
        <View style={styles.gameArea}>
          <View style={styles.topBar}>
            <Text style={styles.statsText}>💎 {collectedGems}/20</Text>
            <Text style={styles.statsText}>📚 {collectedBooks}/3</Text>
          </View>
          
          <Animated.View style={[styles.world, { transform: [{ translateY: scrollAnim }] }]}>
            {platforms.map((p, i) => (
              Math.abs(p.y + scrollOffset.current) < SCREEN_HEIGHT + 300 && (
                <View key={i} style={[styles.platform, { left: p.x, top: p.y, width: p.width }]} />
              )
            ))}
            
            {gems.map(g => !g.collected && (
              <Text key={g.id} style={[styles.item, { left: g.x, top: g.y }]}>💎</Text>
            ))}

            {books.map(b => !b.collected && (
              <Text key={b.id} style={[styles.item, { left: b.x, top: b.y, fontSize: 35 }]}>📖</Text>
            ))}

            <Animated.View style={[styles.hero, { transform: [{ translateX: animPos.x }, { translateY: animPos.y }, { scaleX: isFacingRight ? 1 : -1 }] }]}>
              <Image source={heroImage} style={styles.heroImg} />
            </Animated.View>
          </Animated.View>

          <View style={styles.joystickContainer}>
            <View style={styles.joystickBase} {...joystickResponder.panHandlers}>
              <Animated.View style={[styles.joystickKnob, { transform: [{ translateX: knobX }] }]} />
            </View>
          </View>

          {/* مودال الأسئلة */}
          <Modal visible={showQuestion} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.questionBox}>
                <Text style={styles.questionTitle}>تحدي الكتاب! 📚</Text>
                <Text style={styles.questionText}>{currentQuestion}</Text>
                <Pressable style={styles.answerBtn} onPress={() => setShowQuestion(false)}>
                  <Text style={styles.answerText}>إجابة صحيحة ✅</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

        </View>
      ) : (
        <Pressable style={styles.menu} onPress={initGame}>
          <Image source={heroImage} style={styles.menuImg} />
          <Text style={styles.title}>Yoya Adventure</Text>
          <Text style={styles.highScore}>اجمع 3 كتب للفوز!</Text>
          <View style={styles.startBadge}><Text style={styles.startText}>إبدأ التحدي 🚀</Text></View>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#87CEEB' },
  gameArea: { flex: 1 },
  topBar: { position: 'absolute', top: 50, width: '100%', flexDirection: 'row', justifyContent: 'space-around', zIndex: 100 },
  statsText: { fontSize: 22, fontWeight: 'bold', color: 'white', textShadowColor: 'black', textShadowRadius: 3 },
  world: { flex: 1 },
  platform: { position: 'absolute', height: 15, backgroundColor: '#8B4513', borderRadius: 5, borderTopWidth: 4, borderTopColor: '#2ECC71' },
  item: { position: 'absolute', fontSize: 25 },
  hero: { position: 'absolute', width: HERO_WIDTH, height: HERO_HEIGHT },
  heroImg: { width: HERO_WIDTH, height: HERO_HEIGHT, resizeMode: 'contain' },
  joystickContainer: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  joystickBase: { width: 120, height: 60, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  joystickKnob: { width: 50, height: 50, backgroundColor: 'white', borderRadius: 25 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  questionBox: { width: '85%', backgroundColor: 'white', padding: 25, borderRadius: 20, alignItems: 'center' },
  questionTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  questionText: { fontSize: 18, textAlign: 'center', marginBottom: 25 },
  answerBtn: { backgroundColor: '#2ECC71', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  answerText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  menu: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2C3E50' },
  menuImg: { width: 100, height: 120, marginBottom: 20 },
  title: { fontSize: 35, color: 'white', fontWeight: 'bold' },
  highScore: { fontSize: 18, color: '#BDC3C7', marginVertical: 20 },
  startBadge: { backgroundColor: '#2ECC71', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  startText: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});

export default YoyaGameV7;
