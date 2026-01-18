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
  const heartSpawned = useRef(false);

  const animPos = useRef(new Animated.ValueXY({ x: pos.current.x, y: pos.current.y })).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const knobX = useRef(new Animated.Value(0)).current;

  const heroImage = require('../assets/Boy.gif');

  const bookQuestionsV2 = [
    {
      id: 1, title: "نظافة المكان", icon: "🚮",
      question: "رأيت ورقة ملقاة على الأرض في الحديقة. ماذا تفعل؟",
      spokenQuestion: "رَأَيْتَ وَرَقَةً مُلْقَاةً عَلَى الْأَرْضِ فِي الْحَدِيقَةِ. مَاذَا تَفْعَلُ؟",
      summary: "الحفاظ على نظافة البيئة والحديقة.",
      options: [
        { id: 0, text: 'أتركها مكانها', spokenText: 'أَتْرُكُهَا مَكَانَهَا. خَطَأ! النَّظَافَةُ مِنَ الْإِيمَانِ.', isCorrect: false },
        { id: 1, text: 'أضعها في السلة', spokenText: 'أَضَعُهَا فِي السَّلَّةِ. رَائِعٌ! أَنْتَ بَطَلٌ نَظِيفٌ.', isCorrect: true }
      ]
    },
    {
      id: 2, title: "احترام الدور", icon: "🚶‍♂️🚶‍♀️",
      question: "هناك طابور طويل عند اللعبة. ماذا تفعل؟",
      spokenQuestion: "هُنَاكَ طَابُورٌ طَوِيلٌ عِنْدَ اللُّعْبَةِ. مَاذَا تَفْعَلُ؟",
      summary: "الصبر واحترام دور الآخرين.",
      options: [
        { id: 0, text: 'أدفع الآخرين لأسبقهم', spokenText: 'أَدْفَعُ الْآخَرِينَ لِأَسْبِقَهُمْ. خَطَأ! يَجِبُ احْتِرَامُ الدَّوْرِ.', isCorrect: false },
        { id: 1, text: 'أنتظر دوري بهدوء', spokenText: 'أَنْتَظِرُ دَوْرِي بِهُدُوءِ. مُمْتَازٌ! الصَّبْرُ صِفَةٌ جَمِيلَةٌ.', isCorrect: true }
      ]
    },
    {
      id: 3, title: "إطفاء الأنوار", icon: "💡",
      question: "خرجت من الغرفة والضوء يعمل. ماذا تفعل؟",
      spokenQuestion: "خَرَجْتَ مِنَ الْغُرْفَةِ وَالضَّوْءُ يَعْمَلُ. مَاذَا تَفْعَلُ؟",
      summary: "توفير الكهرباء وحماية الموارد.",
      options: [
        { id: 0, text: 'أتركه يعمل', spokenText: 'أَتْرُكُهُ يَعْمَلُ. خَطَأ! يَجِبُ تَوْفِيرُ الْكَهْرُبَاءِ.', isCorrect: false },
        { id: 1, text: 'أطفئ الضوء', spokenText: 'أُطْفِئُ الضَّوْءَ. أَحْسَنْتَ! أَنْتَ طِفْلٌ مُوَفِّرٌ.', isCorrect: true }
      ]
    },
    {
      id: 4, title: "الاعتذار", icon: "🙏",
      question: "صدمت زميلك بالخطأ أثناء اللعب. ماذا تقول؟",
      spokenQuestion: "صَدَمْتَ زَمِيلَكَ بِالْخَطَأِ أَثْنَاءَ اللَّعِبِ. مَاذَا تَقُولُ؟",
      summary: "شجاعة الاعتذار عند الخطأ.",
      options: [
        { id: 0, text: 'أهرب بعيداً', spokenText: 'أَهْرُبُ بَعِيدًا. خَطَأ! الهروبُ لَيْسَ حَلًّا.', isCorrect: false },
        { id: 1, text: 'أقول أنا آسف', spokenText: 'أَقُولُ أَنَا آسِفٌ. بَطَلٌ! الِاعْتِذَارُ مِنْ شِيَمِ الْأَقْوِيَاءِ.', isCorrect: true }
      ]
    }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const profile = await AsyncStorage.getItem('userProfile');
      if (profile) setUserName(JSON.parse(profile).name || 'يُويَا');
    };
    fetchUser();
  }, []);

  const speak = (text) => {
    Speech.stop();
    Speech.speak(text, { language: 'ar', rate: 0.8 });
  };

  const addGemToAccount = async () => {
    try {
      const current = await AsyncStorage.getItem('total_gems');
      const newValue = (parseInt(current || '0') + 1).toString();
      await AsyncStorage.setItem('total_gems', newValue);
    } catch (e) { console.log(e); }
  };

  const initGame = () => {
    let nPlats = [], nGems = [], nBooks = [], nHearts = [];
    nPlats.push({ x: 0, y: SCREEN_HEIGHT - 100, width: SCREEN_WIDTH });

    // تقصير مدة اللعبة (من 300 إلى 150 لتقليل المسافة)
    for (let i = 1; i < 150; i++) {
      let py = (SCREEN_HEIGHT - 100) - (i * 170);
      let px = Math.random() * (SCREEN_WIDTH - 110);
      nPlats.push({ x: px, y: py, width: 110 });
      if (Math.random() > 0.7) nGems.push({ x: px + 35, y: py - 50, id: 'g'+i, collected: false });
      if (!heartSpawned.current && i === 60) {
        nHearts.push({ x: px + 40, y: py - 50, id: 'rare-heart', collected: false });
        heartSpawned.current = true;
      }
      // توزيع الكتب الأربعة بمسافات متقاربة
      if (i % 35 === 0 && nBooks.length < 4) {
        nBooks.push({ ...bookQuestionsV2[nBooks.length], x: px + 35, y: py - 70, collected: false, id: 'b'+i });
      }
    }
    setPlatforms(nPlats); setGems(nGems); setBooks(nBooks); setHearts(nHearts);
    setScore(0); setLives(3); setCollectedBooks(0); setGameState('playing'); setShowWinScreen(false);
    heartSpawned.current = false; scrollOffset.current = 0;
    pos.current = { x: SCREEN_WIDTH/2 - HERO_WIDTH/2, y: SCREEN_HEIGHT - 200 };
    vel.current = { x: 0, y: 0 };
    speak("هَيَّا يَا " + userName + " نَبْدَأُ الْمُغَامَرَةَ الثَّانِيَةَ");
  };

  const update = () => {
    scrollOffset.current += CONSTANT_SCROLL_SPEED;
    scrollAnim.setValue(scrollOffset.current);
    const heroScreenY = pos.current.y + scrollOffset.current;
    if (heroScreenY < 80) scrollOffset.current += (80 - heroScreenY);
    vel.current.y += GRAVITY;
    pos.current.y += vel.current.y;
    pos.current.x += vel.current.x;

    if (pos.current.x > SCREEN_WIDTH - HERO_WIDTH) pos.current.x = SCREEN_WIDTH - HERO_WIDTH;
    if (pos.current.x < 0) pos.current.x = 0;

    if (vel.current.y > 0) {
      for (let p of platforms) {
        if (pos.current.y + HERO_HEIGHT >= p.y && pos.current.y + HERO_HEIGHT <= p.y + 25 &&
            pos.current.x + HERO_WIDTH - 15 >= p.x && pos.current.x + 15 <= p.x + p.width) {
          vel.current.y = JUMP_POWER;
          Vibration.vibrate(5);
          break;
        }
      }
    }

    // تحسين التقاط الجواهر (زيادة مدى التصادم)
    gems.forEach(g => {
      if (!g.collected && Math.abs(pos.current.x + HERO_WIDTH/2 - (g.x + 15)) < 45 && Math.abs(pos.current.y + HERO_HEIGHT/2 - (g.y + 15)) < 60) {
        g.collected = true; setScore(s => s + 1); addGemToAccount(); Vibration.vibrate(10);
      }
    });

    hearts.forEach(h => {
      if (!h.collected && Math.abs(pos.current.x - h.x) < 45 && Math.abs(pos.current.y - h.y) < 45) {
        h.collected = true; setLives(l => l + 1); Vibration.vibrate(20);
      }
    });

    books.forEach(b => {
      if (!b.collected && Math.abs(pos.current.x - b.x) < 55 && Math.abs(pos.current.y - b.y) < 55) {
        b.collected = true; setCurrentQuestionData(b); setShowQuestion(true);
        Vibration.vibrate(50);
        speak("أَحْسَنْتَ يَا " + userName + ". وَجَدْتَ كِتَابًا جَدِيدًا. " + b.spokenQuestion + ". الْخِيَارَاتُ هِيَ: " + b.options.map(o => o.text).join("، أَوْ "));
      }
    });

    if (pos.current.y > (SCREEN_HEIGHT - scrollOffset.current) + 150) setGameState('home');
    animPos.setValue({ x: pos.current.x, y: pos.current.y });
  };

  useEffect(() => {
    if (gameState === 'playing' && !showQuestion && !showWinScreen) {
      gameLoopRef.current = setInterval(update, 16);
    } else clearInterval(gameLoopRef.current);
    return () => clearInterval(gameLoopRef.current);
  }, [gameState, showQuestion, showWinScreen]);

  const handleAnswer = (opt) => {
    speak(opt.spokenText);
    if (opt.isCorrect) {
      setCollectedBooks(c => {
        if (c + 1 >= 4) {
          setTimeout(() => {
              setShowWinScreen(true);
              const skillsText = "لَقَدْ تَعَلَّمْتَ الْيَوْمَ: " + bookQuestionsV2.map(q => q.summary).join("، وَ");
              speak("رَائِعٌ يَا " + userName + "! لَقَدْ أَنْهَيْتَ الْمُغَامَرَةَ. " + skillsText);
          }, 1500);
          return 4;
        }
        return c + 1;
      });
      setShowQuestion(false);
    } else {
      setLives(l => {
        if (l <= 1) { setGameState('home'); setShowQuestion(false); return 0; }
        return l - 1;
      });
    }
  };

  const shareGame = () => {
    const info = bookQuestionsV2.map(q => q.summary).join("\n- ");
    Share.share({
      message: "أنا البطل " + userName + "، أنهيت المستوى الثاني في يويَا! \nما تعلمته:\n- " + info,
    });
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
            <ScrollView contentContainerStyle={styles.winContent}>
              <Text style={styles.winEmoji}>🏆</Text>
              <Text style={styles.winTitle}>أَحْسَنْتَ يَا {userName}!</Text>
              <View style={styles.scoreCard}>
                <Text style={styles.finalScore}>💎 {score}</Text>
                <Text style={styles.statBoxText}>جَوْهَرَة</Text>
              </View>
              <View style={styles.skillsSection}>
                <Text style={styles.sectionTitle}>مَا تَعَلَّمْتَهُ فِي هَذِهِ الْمُغَامَرَةِ:</Text>
                {bookQuestionsV2.map(q => (
                    <TouchableOpacity key={q.id} style={styles.skillRow} onPress={() => speak(q.summary)}>
                        <Ionicons name="volume-medium" size={20} color="#F1C40F" />
                        <Text style={styles.skillItem}>{q.summary}</Text>
                    </TouchableOpacity>
                ))}
              </View>
              <View style={styles.winActionArea}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2ECC71'}]} onPress={initGame}>
                    <Ionicons name="refresh" size={24} color="white" />
                    <Text style={styles.actionBtnText}>إعادة</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#3498DB'}]} onPress={shareGame}>
                    <Ionicons name="share-social" size={24} color="white" />
                    <Text style={styles.actionBtnText}>مشاركة</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#E74C3C'}]} onPress={() => navigation.goBack()}>
                    <Ionicons name="exit" size={24} color="white" />
                    <Text style={styles.actionBtnText}>خروج</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
              {hearts.map(h => !h.collected && <Text key={h.id} style={[styles.item, { left: h.x, top: h.y }]}>❤️</Text>)}
              {books.map(b => !b.collected && <Text key={b.id} style={[styles.item, { left: b.x, top: b.y, fontSize: 45 }]}>📖</Text>)}
              <Animated.View style={[styles.hero, { transform: [{ translateX: animPos.x }, { translateY: animPos.y }, { scaleX: isFacingRight ? 1 : -1 }] }]}>
                <Image source={heroImage} style={styles.heroImg} />
              </Animated.View>
            </Animated.View>
            <View style={styles.controls}><View style={styles.joyBase} {...joystickResponder.panHandlers}><Animated.View style={[styles.joyKnob, { transform: [{ translateX: knobX }] }]} /></View></View>
            <Modal visible={showQuestion} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <Text style={styles.qText}>{currentQuestionData?.question}</Text>
                  {currentQuestionData?.options.map((o, idx) => (
                    <TouchableOpacity key={idx} style={styles.optBtn} onPress={() => handleAnswer(o)}><Text style={styles.optTxt}>{o.text}</Text></TouchableOpacity>
                  ))}
                </View>
              </View>
            </Modal>
          </View>
        )
      ) : (
        <View style={styles.menu}>
          <Image source={heroImage} style={styles.menuImg} />
          <Text style={styles.menuTitle}>المستوى 2</Text>
          <Text style={styles.welcomeName}>أَهْلًا {userName}</Text>
          <TouchableOpacity style={styles.mainBtn} onPress={initGame}><Text style={styles.mainBtnTxt}>اِبْدَأِ الْمُغَامَرَةَ 🚀</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.mainBtn, {backgroundColor: '#7F8C8D', marginTop: 15}]} onPress={() => navigation.goBack()}><Text style={styles.mainBtnTxt}>خُرُوجٌ</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D1E8E2' },
  gameArea: { flex: 1 },
  hud: { position: 'absolute', top: 50, width: '90%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', zIndex: 10, backgroundColor: 'white', padding: 12, borderRadius: 20, elevation: 5 },
  hudText: { fontSize: 20, fontWeight: 'bold' },
  platform: { position: 'absolute', height: 18, backgroundColor: '#2C3E50', borderRadius: 8, borderTopWidth: 5, borderTopColor: '#F1C40F' },
  item: { position: 'absolute', fontSize: 32 },
  hero: { position: 'absolute', width: HERO_WIDTH, height: HERO_HEIGHT },
  heroImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  controls: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  joyBase: { width: 120, height: 60, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 30, justifyContent: 'center', padding: 5 },
  joyKnob: { width: 50, height: 50, backgroundColor: '#34495E', borderRadius: 25 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: 'white', borderRadius: 30, padding: 25 },
  qText: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  optBtn: { backgroundColor: '#F1F2F6', padding: 15, borderRadius: 15, marginVertical: 8 },
  optTxt: { fontSize: 18, textAlign: 'center', fontWeight: 'bold' },
  menu: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16A085' },
  menuImg: { width: 150, height: 180, marginBottom: 15 },
  menuTitle: { fontSize: 35, color: 'white', fontWeight: 'bold' },
  welcomeName: { fontSize: 22, color: '#F1C40F', marginBottom: 25, fontWeight: 'bold' },
  mainBtn: { backgroundColor: '#E67E22', paddingVertical: 18, paddingHorizontal: 50, borderRadius: 35, elevation: 5 },
  mainBtnTxt: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  winContainer: { flex: 1, backgroundColor: '#2C3E50' },
  winContent: { alignItems: 'center', padding: 20 },
  winEmoji: { fontSize: 100, marginTop: 20 },
  winTitle: { fontSize: 30, color: 'white', fontWeight: 'bold', marginVertical: 15 },
  scoreCard: { backgroundColor: 'white', padding: 20, borderRadius: 25, width: '80%', alignItems: 'center', marginBottom: 20 },
  finalScore: { fontSize: 50, fontWeight: 'bold', color: '#2C3E50' },
  statBoxText: { fontSize: 18, color: '#7F8C8D', fontWeight: 'bold' },
  skillsSection: { width: '90%', marginBottom: 30 },
  sectionTitle: { color: '#F1C40F', fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  skillRow: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 15, marginVertical: 5 },
  skillItem: { color: 'white', fontSize: 17, marginRight: 10, textAlign: 'right', flex: 1 },
  winActionArea: { width: '100%', flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 10 },
  actionBtn: { paddingVertical: 15, paddingHorizontal: 15, borderRadius: 20, alignItems: 'center', minWidth: 100, elevation: 5 },
  actionBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginTop: 5 }
});

export default YoyaGameV2;
