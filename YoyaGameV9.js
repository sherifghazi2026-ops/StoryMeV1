import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, Dimensions, Image, Animated, 
  Vibration, PanResponder, Modal, ScrollView,
  TouchableOpacity, Share
} from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GRAVITY = 0.50;
const JUMP_POWER = -15.0;
const CONSTANT_SCROLL_SPEED = 2.0; 
const HERO_WIDTH = 70;
const HERO_HEIGHT = 90;

const YoyaGameV1 = ({ navigation }) => {
  const [gameState, setGameState] = useState('home');
  const [platforms, setPlatforms] = useState([]);
  const [gems, setGems] = useState([]);
  const [books, setBooks] = useState([]);
  const [hearts, setHearts] = useState([]);
  const [score, setScore] = useState(0);
  const [collectedBooks, setCollectedBooks] = useState(0);
  const [lives, setLives] = useState(3);
  const [isFacingRight, setIsFacingRight] = useState(true);
  const [heroName, setHeroName] = useState('يُويا');
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const [showWinScreen, setShowWinScreen] = useState(false);

  const pos = useRef({ x: SCREEN_WIDTH / 2 - HERO_WIDTH / 2, y: SCREEN_HEIGHT - 200 });
  const vel = useRef({ x: 0, y: 0 });
  const scrollOffset = useRef(0);
  const gameLoopRef = useRef(null);

  const animPos = useRef(new Animated.ValueXY({ x: pos.current.x, y: pos.current.y })).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const knobX = useRef(new Animated.Value(0)).current;

  const heroImage = require('../assets/Boy.gif');

  const bookQuestions = [
    { id: 1, title: "كوب مكسور", icon: "🥛💔", question: "وجدت كوباً مكسوراً على الأرض. ماذا أفعل؟", spokenQuestion: "وَجَدْتُ كُوبًا مَكْسُورًا عَلَى الْأَرْضِ. مَاذَا أَفْعَلُ؟", options: [{ id: 0, text: 'أحاول جمعه بيدي', spokenText: 'أُحَاوِلُ جَمْعَهُ بِيَدِي', isCorrect: false, spokenMessage: 'خَطَأ! الزُّجَاجُ الْمَكْسُورُ قَدْ يُؤْذِيكَ.' }, { id: 1, text: 'أطلب مساعدة أمي', spokenText: 'أَطْلُبُ مُسَاعَدَةَ أُمِّي', isCorrect: true, spokenMessage: 'أَحْسَنْتَ! يَجِبُ أَنْ تَسْتَعِينَ بِالْكِبَارِ.' }] },
    { id: 2, title: "مساعدة الجدة", icon: "👵", question: "الجدة تحمل أشياء ثقيلة. كيف أساعدها؟", spokenQuestion: "الْجَدَّةُ تَحْمِلُ أَشْيَاءَ ثَقِيلَةً. كَيْفَ أُسَاعِدُهَا؟", options: [{ id: 0, text: 'أصرخ لتنتبه', spokenText: 'أَصْرُخُ لِتَنْتَبِهَ', isCorrect: false, spokenMessage: 'التَّحَدُّثُ بِهُدُوءٍ أَفْضَلُ.' }, { id: 1, text: 'أساعدها بحمل جزء خفيف', spokenText: 'أُسَاعِدُهَا بِحَمْلِ جُزْءٍ خَفِيفٍ', isCorrect: true, spokenMessage: 'مُمْتَازٌ! سَاعِدْهَا بِمَا تَسْتَطِيعُ.' }] },
    { id: 3, title: "طائر مصاب", icon: "🐦❤️‍🩹", question: "وجدت طائراً صغيراً مصاباً. ماذا أفعل؟", spokenQuestion: "وَجَدْتُ طَائِرًا صَغِيرًا مُصَابًا. مَاذَا أَفْعَلُ؟", options: [{ id: 0, text: 'ألعبه معه', spokenText: 'أَلْعَبُ مَعَهُ', isCorrect: false, spokenMessage: 'الْحَيَوَانُ الْمُصَابُ يَحْتَاجُ رَاحَةً.' }, { id: 1, text: 'أخبر والدي', spokenText: 'أُخْبِرُ وَالِدِي', isCorrect: true, spokenMessage: 'أَحْسَنْتَ! الْكِبَارُ يَعْرِفُونَ مَاذَا يَفْعَلُونَ.' }] },
    { id: 4, title: "دمية مكسورة", icon: "🧸💔", question: "دميتك المفضلة انكسرت. كيف تتصرف؟", spokenQuestion: "دُمْيَتُكَ الْمُفَضَّلَةُ انْكَسَرَتْ. كَيْفَ تَتَصَرَّفُ؟", options: [{ id: 0, text: 'أرميها', spokenText: 'أَرْمِيهَا', isCorrect: false, spokenMessage: 'إِصْلَاحُ الْأَشْيَاءِ أَفْضَلُ مِنْ رَمْيِهَا.' }, { id: 1, text: 'أصلحها مع والدي', spokenText: 'أُصْلِحُهَا مَعَ وَالِدِي', isCorrect: true, spokenMessage: 'مُمْتَازٌ! التَّعَلُّمُ مَعَ الْكِبَارِ جَمِيلٌ.' }] }
  ];

  useEffect(() => {
    const loadHeroName = async () => {
      const profile = await AsyncStorage.getItem('userProfile');
      if (profile) setHeroName(JSON.parse(profile).name || 'يُويا');
    };
    loadHeroName();
  }, []);

  const speak = (text) => {
    Speech.stop();
    Speech.speak(text, { language: 'ar', rate: 0.8 });
  };

  const initGame = () => {
    let nPlats = [], nGems = [], nBooks = [], nHearts = [];
    nPlats.push({ x: 0, y: SCREEN_HEIGHT - 100, width: SCREEN_WIDTH });
    
    for (let i = 1; i < 100; i++) {
      let py = (SCREEN_HEIGHT - 100) - (i * 170);
      let px = Math.random() * (SCREEN_WIDTH - 110);
      nPlats.push({ x: px, y: py, width: 110 });
      if (Math.random() > 0.7) nGems.push({ x: px + 35, y: py - 50, id: `g${i}`, collected: false });
      if (i === 50) nHearts.push({ x: px + 40, y: py - 50, id: 'h1', collected: false });
      if (i % 24 === 0 && nBooks.length < 4) {
        nBooks.push({ ...bookQuestions[nBooks.length], x: px + 35, y: py - 70, collected: false, id: `b${i}` });
      }
    }

    setPlatforms(nPlats); setGems(nGems); setBooks(nBooks); setHearts(nHearts);
    setScore(0); setLives(3); setCollectedBooks(0); setShowWinScreen(false);
    pos.current = { x: SCREEN_WIDTH/2 - HERO_WIDTH/2, y: SCREEN_HEIGHT - 200 };
    vel.current = { x: 0, y: 0 }; scrollOffset.current = 0;
    setGameState('playing');
    speak("هَيَّا بِنَا نَبْدَأُ");
  };

  const update = () => {
    scrollOffset.current += CONSTANT_SCROLL_SPEED;
    scrollAnim.setValue(scrollOffset.current);
    vel.current.y += GRAVITY;
    pos.current.y += vel.current.y;
    pos.current.x += vel.current.x;

    if (pos.current.x > SCREEN_WIDTH - 20) pos.current.x = -HERO_WIDTH + 20;
    if (pos.current.x < -HERO_WIDTH + 20) pos.current.x = SCREEN_WIDTH - 20;

    if (vel.current.y > 0) {
      for (let p of platforms) {
        if (pos.current.y + HERO_HEIGHT >= p.y && pos.current.y + HERO_HEIGHT <= p.y + 25 &&
            pos.current.x + HERO_WIDTH - 15 >= p.x && pos.current.x + 15 <= p.x + p.width) {
          vel.current.y = JUMP_POWER; Vibration.vibrate(5); break;
        }
      }
    }

    gems.forEach(async (g) => {
      if (!g.collected && Math.abs(pos.current.x - g.x) < 40 && Math.abs(pos.current.y - g.y) < 40) {
        g.collected = true; 
        setScore(s => s + 1);
        const cur = await AsyncStorage.getItem('total_gems');
        await AsyncStorage.setItem('total_gems', (parseInt(cur || '0') + 1).toString());
      }
    });

    books.forEach(b => {
      if (!b.collected && Math.abs(pos.current.x - b.x) < 55 && Math.abs(pos.current.y - b.y) < 55) {
        b.collected = true; setCurrentQuestionData(b); setShowQuestion(true);
        speak(`أَنْتَ بَطَلٌ يَا ${heroName}. مَاذَا نَفْعَلُ هُنَا؟`);
      }
    });

    if (pos.current.y > (SCREEN_HEIGHT - scrollOffset.current) + 200) setGameState('home');
    animPos.setValue({ x: pos.current.x, y: pos.current.y });
  };

  useEffect(() => {
    if (gameState === 'playing' && !showQuestion && !showWinScreen) {
      gameLoopRef.current = setInterval(update, 16);
    } else clearInterval(gameLoopRef.current);
    return () => clearInterval(gameLoopRef.current);
  }, [gameState, showQuestion, showWinScreen]);

  const handleAnswer = (option) => {
    speak(option.spokenMessage);
    if (option.isCorrect) {
      const newCollected = collectedBooks + 1;
      setCollectedBooks(newCollected);
      if (newCollected === 4) {
        setTimeout(() => {
          setShowWinScreen(true);
          speak(`أَحْسَنْتَ يَا بَطَلُ! لَقَدْ تَعَلَّمْتَ الْيَوْمَ: التَّعَاوُنُ، الرَّحْمَةُ بِالْحَيَوانِ، وَطَلَبُ الْمُسَاعَدَةِ.`);
        }, 1000);
      }
      setShowQuestion(false);
    } else {
      setLives(l => {
        if (l <= 1) { setShowQuestion(false); setGameState('home'); return 0; }
        return l - 1;
      });
    }
  };

  const joystickResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      let moveX = Math.max(-50, Math.min(50, gs.dx));
      knobX.setValue(moveX);
      vel.current.x = (moveX / 50) * 7.5;
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
        showWinScreen ? (
          <View style={styles.winOverlay}>
            <Text style={styles.winEmoji}>🏆</Text>
            <Text style={styles.winTitle}>أَحْسَنْتَ يَا {heroName}!</Text>
            <View style={styles.skillsCard}>
                <Text style={styles.skillText}>🤝 التَّعَاوُنُ مَعَ الْكِبَارِ</Text>
                <Text style={styles.skillText}>❤️ الرَّحْمَةُ بِالْحَيَوانِ</Text>
                <Text style={styles.skillText}>🛡️ طَلَبُ الْمُسَاعَدَةِ</Text>
            </View>
            <TouchableOpacity style={styles.btnAction} onPress={initGame}><Text style={styles.btnText}>إعادة اللعب</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnAction, {backgroundColor: '#3498DB', marginTop: 10}]} onPress={() => Share.share({message: `أنا البطل ${heroName} أنهيت المهمة بنجاح!`})}><Text style={styles.btnText}>مشاركة النتيجة</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnAction, {backgroundColor: '#E74C3C', marginTop: 10}]} onPress={() => navigation.goBack()}><Text style={styles.btnText}>خروج</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gameArea}>
            <View style={styles.hud}>
              <Text style={styles.hudText}>💎 {score}</Text>
              <Text style={styles.hudText}>📚 {collectedBooks}/4</Text>
              <Text style={[styles.hudText, {color: '#FF4757'}]}>❤️ {lives}</Text>
            </View>
            <Animated.View style={{ flex: 1, transform: [{ translateY: scrollAnim }] }}>
              {platforms.map((p, i) => <View key={i} style={[styles.platform, { left: p.x, top: p.y, width: p.width }]} />)}
              {gems.map(g => !g.collected && <Text key={g.id} style={[styles.item, { left: g.x, top: g.y }]}>💎</Text>)}
              {books.map(b => !b.collected && <Text key={b.id} style={[styles.item, { left: b.x, top: b.y, fontSize: 40 }]}>📖</Text>)}
              <Animated.View style={[styles.hero, { transform: [{ translateX: animPos.x }, { translateY: animPos.y }, { scaleX: isFacingRight ? 1 : -1 }] }]}>
                <Image source={heroImage} style={styles.heroImg} />
              </Animated.View>
            </Animated.View>
            <View style={styles.controls}><View style={styles.joyBase} {...joystickResponder.panHandlers}><Animated.View style={[styles.joyKnob, { transform: [{ translateX: knobX }] }]} /></View></View>
            <Modal visible={showQuestion} transparent animationType="fade">
              <View style={styles.modalOverlay}><View style={styles.modalCard}>
                <Text style={styles.qText}>{currentQuestionData?.question}</Text>
                {currentQuestionData?.options.map((o, idx) => (
                  <TouchableOpacity key={idx} style={styles.optBtn} onPress={() => handleAnswer(o)}><Text style={styles.optTxt}>{o.text}</Text></TouchableOpacity>
                ))}
              </View></View>
            </Modal>
          </View>
        )
      ) : (
        <TouchableOpacity style={styles.menu} onPress={initGame}>
          <Image source={heroImage} style={styles.menuImg} />
          <Text style={styles.menuTitle}>مغامرة {heroName}</Text>
          <View style={styles.startBadge}><Text style={styles.startBadgeTxt}>ابدأ 🚀</Text></View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#87CEEB' },
  gameArea: { flex: 1 },
  hud: { position: 'absolute', top: 50, width: '90%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)', padding: 12, borderRadius: 20 },
  hudText: { fontSize: 20, fontWeight: 'bold' },
  platform: { position: 'absolute', height: 16, backgroundColor: '#8B4513', borderRadius: 8, borderTopWidth: 4, borderTopColor: '#2ECC71' },
  item: { position: 'absolute', fontSize: 32 },
  hero: { position: 'absolute', width: HERO_WIDTH, height: HERO_HEIGHT },
  heroImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  controls: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  joyBase: { width: 120, height: 60, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 30, justifyContent: 'center', padding: 5, borderWidth: 1, borderColor: 'white' },
  joyKnob: { width: 50, height: 50, backgroundColor: 'white', borderRadius: 25 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: 'white', borderRadius: 30, padding: 20, alignItems: 'center' },
  qText: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  optBtn: { width: '100%', backgroundColor: '#F8F9FA', padding: 16, borderRadius: 15, marginVertical: 6 },
  optTxt: { fontSize: 18, textAlign: 'center' },
  menu: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2C3E50' },
  menuImg: { width: 150, height: 180, marginBottom: 20 },
  menuTitle: { fontSize: 35, color: 'white', fontWeight: 'bold' },
  startBadge: { backgroundColor: '#2ECC71', padding: 20, borderRadius: 30 },
  startBadgeTxt: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  winOverlay: { flex: 1, backgroundColor: '#2C3E50', justifyContent: 'center', alignItems: 'center', padding: 20 },
  winEmoji: { fontSize: 80 },
  winTitle: { fontSize: 28, color: 'white', fontWeight: 'bold', marginVertical: 10 },
  skillsCard: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 20, marginVertical: 15, width: '100%' },
  skillText: { color: 'white', fontSize: 18, marginVertical: 5 },
  winSubtitle: { fontSize: 22, color: '#F1C40F', marginBottom: 20 },
  btnAction: { backgroundColor: '#2ECC71', padding: 15, borderRadius: 15, width: '80%', alignItems: 'center' },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

export default YoyaGameV9;

