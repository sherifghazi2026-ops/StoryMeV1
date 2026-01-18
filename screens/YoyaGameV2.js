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
const JUMP_POWER = -15.5; 
const CONSTANT_SCROLL_SPEED = 2.0;
const HERO_WIDTH = 70;
const HERO_HEIGHT = 90;

const YoyaGameV2 = ({ navigation }) => {
  const [gameState, setGameState] = useState('home');
  const [platforms, setPlatforms] = useState([]);
  const [gems, setGems] = useState([]);
  const [books, setBooks] = useState([]);
  const [hearts, setHearts] = useState([]);
  const [score, setScore] = useState(0);
  const [collectedBooks, setCollectedBooks] = useState(0);
  const [lives, setLives] = useState(3);
  const [isFacingRight, setIsFacingRight] = useState(true);
  const [userName, setUserName] = useState('يُويَا');
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

  const bookQuestionsV2 = [
    { id: 1, title: "نظافة المكان", icon: "🚮", question: "رأيت ورقة ملقاة على الأرض في الحديقة. ماذا تفعل؟", spokenQuestion: "رَأَيْتَ وَرَقَةً مُلْقَاةً عَلَى الْأَرْضِ فِي الْحَدِيقَةِ. مَاذَا تَفْعَلُ؟", summary: "تعلمت الحفاظ على نظافة البيئة والحديقة.", options: [{ id: 0, text: 'أتركها مكانها', spokenText: 'أَتْرُكُهَا مَكَانَهَا. خَطَأ! النَّظَافَةُ مِنَ الْإِيمَانِ.', isCorrect: false }, { id: 1, text: 'أضعها في السلة', spokenText: 'أَضَعُهَا فِي السَّلَّةِ. رَائِعٌ! أَنْتَ بَطَلٌ نَظِيفٌ.', isCorrect: true }] },
    { id: 2, title: "احترام الدور", icon: "🚶‍♂️🚶‍♀️", question: "هناك طابور طويل عند اللعبة. ماذا تفعل؟", spokenQuestion: "هُنَاكَ طَابُورٌ طَوِيلٌ عِنْدَ اللُّعْبَةِ. مَاذَا تَفْعَلُ؟", summary: "تعلمت الصبر واحترام دور الآخرين.", options: [{ id: 0, text: 'أدفع الآخرين لأسبقهم', spokenText: 'أَدْفَعُ الْآخَرِينَ لِأَسْبِقَهُمْ. خَطَأ! يَجِبُ احْتِرَامُ الدَّوْرِ.', isCorrect: false }, { id: 1, text: 'أنتظر دوري بهدوء', spokenText: 'أَنْتَظِرُ دَوْرِي بِهُدُوءِ. مُمْتَازٌ! الصَّبْرُ صِفَةٌ جَمِيلَةٌ.', isCorrect: true }] },
    { id: 3, title: "إطفاء الأنوار", icon: "💡", question: "خرجت من الغرفة والضوء يعمل. ماذا تفعل؟", spokenQuestion: "خَرَجْتَ مِنَ الْغُرْفَةِ وَالضَّوْءُ يَعْمَلُ. مَاذَا تَفْعَلُ؟", summary: "تعلمت توفير الكهرباء وحماية الموارد.", options: [{ id: 0, text: 'أتركه يعمل', spokenText: 'أَتْرُكُهُ يَعْمَلُ. خَطَأ! يَجِبُ تَوْفِيرُ الْكَهْرُبَاءِ.', isCorrect: false }, { id: 1, text: 'أطفئ الضوء', spokenText: 'أُطْفِئُ الضَّوْءَ. أَحْسَنْتَ! أَنْتَ طِفْلٌ مُوَفِّرٌ.', isCorrect: true }] },
    { id: 4, title: "الاعتذار", icon: "🙏", question: "صدمت زميلك بالخطأ أثناء اللعب. ماذا تقول؟", spokenQuestion: "صَدَمْتَ زَمِيلَكَ بِالْخَطَأِ أَثْنَاءَ اللَّعِبِ. مَاذَا تَقُولُ؟", summary: "تعلمت شجاعة الاعتذار عند الخطأ.", options: [{ id: 0, text: 'أهرب بعيداً', spokenText: 'أَهْرُبُ بَعِيدًا. خَطَأ! الهروبُ لَيْسَ حَلًّا.', isCorrect: false }, { id: 1, text: 'أقول أنا آسف', spokenText: 'أَقُولُ أَنَا آسِفٌ. بَطَلٌ! الِاعْتِذَارُ مِنْ شِيَمِ الْأَقْوِيَاءِ.', isCorrect: true }] }
  ];

  const speak = (text) => {
    Speech.stop();
    Speech.speak(text, { language: 'ar', rate: 0.85 });
  };

  const initGame = () => {
    let nPlats = [], nGems = [], nBooks = [], nHearts = [];
    nPlats.push({ x: 0, y: SCREEN_HEIGHT - 100, width: SCREEN_WIDTH, moving: false });

    // تقليل طول اللعبة للنصف (حوالي 80 حاجز كافية بدلاً من 300) لسرعة الوصول للكتاب 4
    for (let i = 1; i < 80; i++) {
      let py = (SCREEN_HEIGHT - 100) - (i * 170);
      let px = Math.random() * (SCREEN_WIDTH - 110);
      let isMoving = i > 10 && Math.random() > 0.7; // تحريك بعض المنصات
      nPlats.push({ x: px, y: py, width: 110, moving: isMoving, dir: Math.random() > 0.5 ? 1 : -1 });
      
      if (Math.random() > 0.7) nGems.push({ x: px + 35, y: py - 50, id: 'g'+i, collected: false });
      if (i === 35) nHearts.push({ x: px + 40, y: py - 50, id: 'h1', collected: false });
      
      // توزيع الكتب الأربعة على مسافة الـ 80 حاجز
      if (i % 18 === 0 && nBooks.length < 4) {
        nBooks.push({ ...bookQuestionsV2[nBooks.length], x: px + 35, y: py - 70, collected: false, id: 'b'+i });
      }
    }
    setPlatforms(nPlats); setGems(nGems); setBooks(nBooks); setHearts(nHearts);
    setScore(0); setLives(3); setCollectedBooks(0); setGameState('playing'); setShowWinScreen(false);
    scrollOffset.current = 0;
    pos.current = { x: SCREEN_WIDTH/2 - HERO_WIDTH/2, y: SCREEN_HEIGHT - 200 };
    vel.current = { x: 0, y: 0 };
    speak("مرحباً بك يا " + userName + " في المغامرة الثانية");
  };

  const update = () => {
    scrollOffset.current += CONSTANT_SCROLL_SPEED;
    scrollAnim.setValue(scrollOffset.current);

    // حركة المنصات يميناً ويساراً
    setPlatforms(prev => prev.map(p => {
      if (!p.moving) return p;
      let nextX = p.x + (p.dir * 1.5);
      if (nextX > SCREEN_WIDTH - p.width || nextX < 0) p.dir *= -1;
      return { ...p, x: nextX };
    }));

    vel.current.y += GRAVITY;
    pos.current.y += vel.current.y;
    pos.current.x += vel.current.x;

    // حماية: عدم تجاوز حدود الشاشة يميناً ويساراً
    if (pos.current.x > SCREEN_WIDTH - HERO_WIDTH) pos.current.x = SCREEN_WIDTH - HERO_WIDTH;
    if (pos.current.x < 0) pos.current.x = 0;

    // التصادم مع المنصات
    if (vel.current.y > 0) {
      for (let p of platforms) {
        if (pos.current.y + HERO_HEIGHT >= p.y && pos.current.y + HERO_HEIGHT <= p.y + 25 &&
            pos.current.x + HERO_WIDTH - 15 >= p.x && pos.current.x + 15 <= p.x + p.width) {
          vel.current.y = JUMP_POWER; Vibration.vibrate(5); break;
        }
      }
    }

    // التقاط الجواهر والكتب
    gems.forEach(g => {
        if (!g.collected && Math.abs(pos.current.x - g.x) < 40 && Math.abs(pos.current.y - g.y) < 40) {
          g.collected = true; setScore(s => s + 1);
        }
    });

    books.forEach(b => {
      if (!b.collected && Math.abs(pos.current.x - b.x) < 55 && Math.abs(pos.current.y - b.y) < 55) {
        b.collected = true; setCurrentQuestionData(b); setShowQuestion(true);
        // نطق السؤال والاختيارات
        speak(b.spokenQuestion + " . الخيار الأول: " + b.options[0].text + " . الخيار الثاني: " + b.options[1].text);
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
  }, [gameState, showQuestion, showWinScreen, platforms]);

  const handleAnswer = (opt) => {
    speak(opt.spokenText);
    if (opt.isCorrect) {
      setCollectedBooks(c => {
        if (c + 1 >= 4) {
          setTimeout(() => {
            setShowWinScreen(true);
            const summaryText = bookQuestionsV2.map(q => q.summary).join("، و ");
            speak("أحسنت يا " + userName + "! " + summaryText);
          }, 1000);
          return 4;
        }
        return c + 1;
      });
      setShowQuestion(false);
    } else {
      setLives(l => l > 1 ? l - 1 : (setGameState('home'), 0));
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
          <View style={styles.winContainer}>
            <Text style={styles.winEmoji}>🏆</Text>
            <Text style={styles.winTitle}>بطل متميز يا {userName}!</Text>
            <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>لقد تعلمت اليوم:</Text>
                {bookQuestionsV2.map(q => <Text key={q.id} style={styles.skillText}>⭐ {q.summary}</Text>)}
            </View>
            <TouchableOpacity style={styles.winBtn} onPress={() => Share.share({message: "لقد فزت في لعبة يويَا وتعلمت مهارات جديدة!"})}>
              <Ionicons name="share-social" size={24} color="white" />
              <Text style={styles.winBtnText}>مشاركة الإنجاز</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.winBtn, {backgroundColor: '#E74C3C'}]} onPress={() => navigation.goBack()}>
              <Ionicons name="exit" size={24} color="white" />
              <Text style={styles.winBtnText}>خروج</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gameArea}>
            <View style={styles.hud}>
              <Text style={styles.hudText}>💎 {score}</Text>
              <Text style={styles.hudText}>📚 {collectedBooks}/4</Text>
              <Text style={[styles.hudText, {color: '#FF4757'}]}>❤️ {lives}</Text>
            </View>
            <Animated.View style={{ flex: 1, transform: [{ translateY: scrollAnim }] }}>
              {platforms.map((p, i) => (
                <View key={i} style={[styles.platform, { left: p.x, top: p.y, width: p.width }]}>
                    <View style={styles.grassTop} />
                </View>
              ))}
              {books.map(b => !b.collected && <Text key={b.id} style={[styles.item, { left: b.x, top: b.y }]}>📖</Text>)}
              {gems.map(g => !g.collected && <Text key={g.id} style={[styles.item, { left: g.x, top: g.y, fontSize: 24 }]}>💎</Text>)}
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
        <View style={styles.menu}>
          <Image source={heroImage} style={styles.menuImg} />
          <Text style={styles.menuTitle}>مغامرة {userName}</Text>
          <TouchableOpacity style={styles.startBtn} onPress={initGame}><Text style={styles.btnTxt}>ابدأ 🚀</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#87CEEB' },
  hud: { position: 'absolute', top: 50, width: '65%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', zIndex: 10, backgroundColor: 'rgba(255,255,255,0.25)', padding: 10, borderRadius: 25 },
  hudText: { fontSize: 18, fontWeight: 'bold' },
  platform: { position: 'absolute', height: 18, backgroundColor: '#8B4513', borderRadius: 5, overflow: 'hidden' },
  grassTop: { height: 6, backgroundColor: '#2ECC71', width: '100%' },
  item: { position: 'absolute', fontSize: 35 },
  hero: { position: 'absolute', width: HERO_WIDTH, height: HERO_HEIGHT },
  heroImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  controls: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  joyBase: { width: 120, height: 60, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 30, justifyContent: 'center' },
  joyKnob: { width: 50, height: 50, backgroundColor: 'white', borderRadius: 25, alignSelf: 'center' },
  winContainer: { flex: 1, backgroundColor: '#2C3E50', alignItems: 'center', padding: 20 },
  winEmoji: { fontSize: 80, marginTop: 40 },
  winTitle: { fontSize: 24, color: 'white', fontWeight: 'bold', marginVertical: 10, textAlign: 'center' },
  summaryBox: { backgroundColor: 'white', padding: 15, borderRadius: 20, width: '100%', marginVertical: 15 },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 10, textAlign: 'center' },
  skillText: { fontSize: 15, color: '#34495E', marginVertical: 3, textAlign: 'right' },
  winBtn: { backgroundColor: '#3498DB', width: '90%', padding: 15, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 8 },
  winBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: 'white', borderRadius: 25, padding: 20 },
  qText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  optBtn: { backgroundColor: '#F0F0F0', padding: 15, borderRadius: 15, marginVertical: 8 },
  optTxt: { fontSize: 18, textAlign: 'center', fontWeight: 'bold' },
  menu: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16A085' },
  menuImg: { width: 120, height: 150, marginBottom: 20 },
  menuTitle: { fontSize: 28, color: 'white', fontWeight: 'bold', marginBottom: 30 },
  startBtn: { backgroundColor: '#E67E22', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  btnTxt: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});

export default YoyaGameV2;
