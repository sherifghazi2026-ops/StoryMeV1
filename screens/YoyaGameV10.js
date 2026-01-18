import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, Dimensions, Image, Animated,
  TouchableOpacity, Modal, PanResponder, Share, Easing
} from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GRAVITY = 0.5;
const JUMP_POWER = -16;
const HERO_SIZE = 70;

const YoyaGameV10 = ({ navigation }) => {
  const [gameState, setGameState] = useState('home');
  const [platforms, setPlatforms] = useState([]);
  const [items, setItems] = useState([]);
  const [collectedBooks, setCollectedBooks] = useState(0);
  const [score, setScore] = useState(0);
  const [userName, setUserName] = useState('يويَا');
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQ, setCurrentQ] = useState(null);
  const [showWinScreen, setShowWinScreen] = useState(false);
  const [isRocketActive, setIsRocketActive] = useState(false);

  // مراجع المحرك
  const pos = useRef({ x: SCREEN_WIDTH / 2 - 35, y: SCREEN_HEIGHT - 150 });
  const vel = useRef({ x: 0, y: 0 });
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroPosAnim = useRef(new Animated.ValueXY({ x: pos.current.x, y: pos.current.y })).current;
  const knobX = useRef(new Animated.Value(0)).current;
  const moveAnim = useRef(new Animated.Value(0)).current;
  const gameLoop = useRef(null);
  const scrollOffset = useRef(0);

  const heroImg = require('../assets/Boy.gif');
  const rocketImg = require('../assets/Rocket.gif');

  // المحتوى التربوي (سؤال وجواب)
  const educationalContent = [
    { id: 'b1', type: 'book', title: "الأمانة", q: "وجدت مالاً في ساحة المدرسة، ماذا تفعل؟", options: ["أعطيه للمعلم", "أحتفظ به"], correct: 0, emoji: "📚" },
    { id: 'b2', type: 'book', title: "التعاون", q: "زميلك لا يستطيع حمل كتبه، كيف تتصرف؟", options: ["أساعده فوراً", "أكمل طريقي"], correct: 0, emoji: "📚" },
    { id: 'b3', type: 'book', title: "النظافة", q: "أين نضع علبة العصير الفارغة؟", options: ["في سلة المهملات", "على الأرض"], correct: 0, emoji: "📚" },
    { id: 'b4', type: 'book', title: "الاحترام", q: "عندما يتحدث شخص أكبر منك، ماذا تفعل؟", options: ["أستمع إليه بهدوء", "أقاطعه"], correct: 0, emoji: "📚" },
  ];

  const fruitList = [
    { name: 'تفاح', emoji: '🍎' }, { name: 'موز', emoji: '🍌' }, { name: 'جزر', emoji: '🥕' }
  ];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moveAnim, { toValue: 1, duration: 2500, useNativeDriver: false, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(moveAnim, { toValue: 0, duration: 2500, useNativeDriver: false, easing: Easing.inOut(Easing.quad) }),
      ])
    ).start();
    return () => clearInterval(gameLoop.current);
  }, []);

  const initGame = () => {
    let plats = [{ x: 0, y: SCREEN_HEIGHT - 50, w: SCREEN_WIDTH, moving: false }];
    let gameItems = [];
    
    // إنشاء عالم اللعبة (60 منصة متباعدة)
    for (let i = 1; i < 60; i++) {
      let py = (SCREEN_HEIGHT - 50) - (i * 180);
      let px = Math.random() * (SCREEN_WIDTH - 120);
      let isMoving = (i === 10 || i === 25 || i === 45); // 3 منصات متحركة
      
      plats.push({ x: px, y: py, w: 120, moving: isMoving });

      // توزيع الكتب (متباعدة جداً)
      if (i % 14 === 0 && gameItems.filter(x => x.type === 'book').length < 4) {
        let bIdx = gameItems.filter(x => x.type === 'book').length;
        gameItems.push({ ...educationalContent[bIdx], x: px + 30, y: py - 60, collected: false });
      }
      // توزيع الفواكه
      else if (i % 8 === 0 && gameItems.filter(x => x.type === 'fruit').length < 3) {
        let fIdx = gameItems.filter(x => x.type === 'fruit').length;
        gameItems.push({ ...fruitList[fIdx], type: 'fruit', x: px + 40, y: py - 60, collected: false });
      }
      // صاروخ واحد
      else if (i === 30) {
        gameItems.push({ id: 'rock', type: 'rocket', emoji: '🚀', x: px + 40, y: py - 60, collected: false });
      }
    }

    setPlatforms(plats);
    setItems(gameItems);
    setCollectedBooks(0);
    setScore(0);
    setGameState('playing');
    scrollOffset.current = 0;
    pos.current = { x: SCREEN_WIDTH/2 - 35, y: SCREEN_HEIGHT - 150 };
    vel.current = { x: 0, y: 0 };
    speak("هيا يا بطل، ابحث عن الكتب!");
  };

  const update = () => {
    // محرك الفيزياء
    vel.current.y += GRAVITY;
    pos.current.y += vel.current.y;
    pos.current.x += vel.current.x;

    // حدود الشاشة يميناً ويساراً
    if (pos.current.x < 0) pos.current.x = 0;
    if (pos.current.x > SCREEN_WIDTH - HERO_SIZE) pos.current.x = SCREEN_WIDTH - HERO_SIZE;

    // جعل الكاميرا تتبع البطل (Smooth Scrolling)
    // إذا صعد البطل فوق منتصف الشاشة، نحرك الكاميرا معه
    let targetScroll = -pos.current.y + SCREEN_HEIGHT * 0.6;
    if (targetScroll > scrollOffset.current) {
        scrollOffset.current = targetScroll;
        scrollY.setValue(scrollOffset.current);
    }

    // التصادم مع المنصات
    if (vel.current.y > 0) {
      platforms.forEach(p => {
        let pX = p.moving ? p.x + (moveAnim._value * (SCREEN_WIDTH - p.w)) : p.x;
        if (pos.current.y + HERO_SIZE >= p.y && pos.current.y + HERO_SIZE <= p.y + 25 &&
            pos.current.x + HERO_SIZE - 10 >= pX && pos.current.x + 10 <= pX + p.w) {
          vel.current.y = JUMP_POWER;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      });
    }

    // جمع العناصر
    items.forEach(item => {
      if (!item.collected && Math.abs(pos.current.x - item.x) < 50 && Math.abs(pos.current.y - item.y) < 60) {
        item.collected = true;
        if (item.type === 'book') {
          handleQuestion(item);
        } else if (item.type === 'fruit') {
          setScore(s => s + 10);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (item.type === 'rocket') {
          activateRocket();
        }
      }
    });

    // السقوط (إعادة الحياة)
    if (pos.current.y > (-scrollOffset.current + SCREEN_HEIGHT)) {
       pos.current.y = -scrollOffset.current + 100;
       vel.current.y = 0;
    }

    heroPosAnim.setValue({ x: pos.current.x, y: pos.current.y });
  };

  const handleQuestion = (q) => {
    clearInterval(gameLoop.current);
    setCurrentQ(q);
    setShowQuestion(true);
    speak(q.q);
  };

  const activateRocket = () => {
    setIsRocketActive(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // الصاروخ يعطي قفزة مستمرة وقوية لمدة 5 ثواني
    let rocketTimer = setInterval(() => {
        vel.current.y = -12;
    }, 100);

    setTimeout(() => {
      clearInterval(rocketTimer);
      setIsRocketActive(false);
    }, 5000);
  };

  const answer = (idx) => {
    if (idx === currentQ.correct) {
      setCollectedBooks(b => {
        if (b + 1 === 4) setShowWinScreen(true);
        return b + 1;
      });
      speak("إجابة رائعة يا بطل!");
    } else {
      speak("حاول مرة أخرى في المرة القادمة");
    }
    setShowQuestion(false);
    gameLoop.current = setInterval(update, 16);
  };

  useEffect(() => {
    if (gameState === 'playing' && !showQuestion && !showWinScreen) {
      gameLoop.current = setInterval(update, 16);
    }
    return () => clearInterval(gameLoop.current);
  }, [gameState, showQuestion, showWinScreen]);

  const joystickHandler = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      let mx = Math.max(-40, Math.min(40, gs.dx));
      knobX.setValue(mx);
      vel.current.x = mx / 5;
    },
    onPanResponderRelease: () => {
      Animated.spring(knobX, { toValue: 0, useNativeDriver: true }).start();
      vel.current.x = 0;
    }
  });

  const speak = (t) => Speech.speak(t, { language: 'ar' });

  return (
    <View style={styles.container}>
      {gameState === 'playing' ? (
        <View style={{ flex: 1 }}>
          <Animated.View style={[styles.world, { transform: [{ translateY: scrollY }] }]}>
            {platforms.map((p, i) => (
              <Animated.View key={i} style={[styles.plat, { 
                top: p.y, width: p.w, 
                left: p.moving ? moveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_WIDTH - p.w] }) : p.x,
                backgroundColor: p.moving ? '#FF7675' : '#2D3436'
              }]} />
            ))}
            {items.map((item, i) => !item.collected && (
              <Text key={i} style={[styles.gameItem, { left: item.x, top: item.y }]}>{item.emoji}</Text>
            ))}
            <Animated.View style={[styles.hero, { transform: heroPosAnim.getTranslateTransform() }]}>
              <Image source={isRocketActive ? rocketImg : heroImg} style={styles.heroImg} />
            </Animated.View>
          </Animated.View>

          <View style={styles.ui}>
            <Text style={styles.uiText}>📚 {collectedBooks}/4</Text>
            <Text style={styles.uiText}>🍎 {score}</Text>
          </View>

          <View style={styles.joyContainer}>
            <View style={styles.joyBase} {...joystickHandler.panHandlers}>
              <Animated.View style={[styles.joyKnob, { transform: [{ translateX: knobX }] }]} />
            </View>
          </View>

          <Modal visible={showQuestion} transparent>
            <View style={styles.modal}>
              <View style={styles.qCard}>
                <Text style={styles.qTitle}>{currentQ?.title}</Text>
                <Text style={styles.qText}>{currentQ?.q}</Text>
                {currentQ?.options.map((opt, i) => (
                  <TouchableOpacity key={i} style={styles.optBtn} onPress={() => answer(i)}>
                    <Text style={styles.optText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Modal>

          <Modal visible={showWinScreen} transparent>
            <View style={styles.winBox}>
              <ConfettiCannon count={100} origin={{x: SCREEN_WIDTH/2, y: 0}} />
              <Text style={styles.winT}>🏆 مبروك يا {userName}!</Text>
              <Text style={styles.winS}>لقد أنهيت المرحلة الخامسة بنجاح</Text>
              <TouchableOpacity style={styles.winBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.winBtnT}>الخروج</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </View>
      ) : (
        <View style={styles.home}>
          <Text style={styles.title}>Yoya Adventure V10</Text>
          <TouchableOpacity style={styles.start} onPress={initGame}>
            <Text style={styles.startT}>ابدأ الآن 🎮</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#81ECEC' },
  world: { flex: 1 },
  plat: { position: 'absolute', height: 12, borderRadius: 6 },
  hero: { position: 'absolute', width: HERO_SIZE, height: HERO_SIZE },
  heroImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  gameItem: { position: 'absolute', fontSize: 35 },
  ui: { position: 'absolute', top: 40, width: '100%', flexDirection: 'row', justifyContent: 'space-around' },
  uiText: { fontSize: 22, fontWeight: 'bold', backgroundColor: 'white', padding: 8, borderRadius: 12 },
  joyContainer: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  joyBase: { width: 100, height: 50, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 25, justifyContent: 'center', padding: 5 },
  joyKnob: { width: 40, height: 40, backgroundColor: '#2D3436', borderRadius: 20 },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  qCard: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center' },
  qTitle: { fontSize: 24, fontWeight: 'bold', color: '#0984E3', marginBottom: 10 },
  qText: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
  optBtn: { backgroundColor: '#F1C40F', width: '100%', padding: 15, borderRadius: 10, marginVertical: 5 },
  optText: { textAlign: 'center', fontWeight: 'bold' },
  winBox: { flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  winT: { fontSize: 30, fontWeight: 'bold' },
  winS: { fontSize: 18, marginVertical: 10 },
  winBtn: { backgroundColor: '#2ECC71', padding: 15, borderRadius: 10, marginTop: 20 },
  winBtnT: { color: 'white', fontWeight: 'bold' },
  home: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 50 },
  start: { backgroundColor: '#E17055', padding: 20, borderRadius: 20 },
  startT: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});

export default YoyaGameV10;
