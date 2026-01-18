import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, Dimensions, Image, Animated,
  PanResponder, Modal, TouchableOpacity, Share, Easing, BackHandler
} from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRAVITY = 0.50;
const JUMP_POWER = -15.5;
const HERO_WIDTH = 70;
const HERO_HEIGHT = 90;

const YoyaGameV6 = ({ navigation }) => {
  const [gameState, setGameState] = useState('home');
  const [platforms, setPlatforms] = useState([]);
  const [books, setBooks] = useState([]);
  const [fruits, setFruits] = useState([]);
  const [rockets, setRockets] = useState([]);
  const [score, setScore] = useState(0);
  const [collectedBooks, setCollectedBooks] = useState(0);
  const [lives, setLives] = useState(3);
  const [isFacingRight, setIsFacingRight] = useState(true);
  const [userName, setUserName] = useState('يُويَا');
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const [showWinScreen, setShowWinScreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [gamePaused, setGamePaused] = useState(false);
  const [rocketActive, setRocketActive] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2.0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const pos = useRef({ x: SCREEN_WIDTH / 2 - HERO_WIDTH / 2, y: SCREEN_HEIGHT - 200 });
  const vel = useRef({ x: 0, y: 0 });
  const gameLoopRef = useRef(null);
  const confettiRef = useRef(null);
  const movingPlatforms = useRef([]);
  const platformDirections = useRef({});

  const animPos = useRef(new Animated.ValueXY({ x: pos.current.x, y: pos.current.y })).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const knobX = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(1)).current;
  const heroOpacity = useRef(new Animated.Value(1)).current;
  
  const heroImage = require('../assets/Boy.gif');
  const heroJumpImage = heroImage;

  // مواقف عن المشاعر والعواطف
  const bookEmotions = [
    {
      id: 1,
      title: "الفرح والسعادة",
      icon: "😊",
      question: "عندما تكون سعيداً، كيف تعبر عن فرحك؟",
      spokenQuestion: "عِنْدَمَا تَكُونُ سَعِيدًا، كَيْفَ تُعَبِّرُ عَنْ فَرَحِكَ؟",
      summary: "التعبير الإيجابي عن مشاعر الفرح",
      options: [
        { id: 0, text: 'أبتسم وأشارك فرحي مع الآخرين', spokenText: 'مُمَتَاز! مُشارَكَةُ الْفَرَحِ تُضَاعِفُهُ.', isCorrect: true },
        { id: 1, text: 'أخفي سعادتي', spokenText: 'الْفَرَحُ جَمِيلٌ وَيَنْبَغِي مُشارَكَتُهُ.', isCorrect: false }
      ]
    },
    {
      id: 2,
      title: "الحزن والتفهم",
      icon: "😢",
      question: "إذا شعرت بالحزن، ماذا تفعل؟",
      spokenQuestion: "إِذَا شَعَرْتَ بِالْحُزْنِ، مَاذَا تَفْعَلُ؟",
      summary: "التعامل الصحي مع مشاعر الحزن",
      options: [
        { id: 0, text: 'أطلب المساعدة من شخص أثق به', spokenText: 'صَحِيح! طَلَبُ الْمُسَاعَدَةِ شَجَاعَةٌ.', isCorrect: true },
        { id: 1, text: 'أبقى وحيداً دائماً', spokenText: 'مُشارَكَةُ الْمَشَاعِرِ تُسَاعِدُنَا عَلَى التَّحَسُّنِ.', isCorrect: false }
      ]
    },
    {
      id: 3,
      title: "الغضب والهدوء",
      icon: "😠",
      question: "عندما تشعر بالغضب، كيف تهدئ نفسك؟",
      spokenQuestion: "عِنْدَمَا تَشْعُرُ بِالْغَضَبِ، كَيْفَ تُهَدِّئُ نَفْسَكَ؟",
      summary: "تعلم تقنيات لتهدئة النفس عند الغضب",
      options: [
        { id: 0, text: 'آخذ نفساً عميقاً وأعد إلى عشرة', spokenText: 'رَائِع! أَخْذُ النَّفَسِ يُسَاعِدُ عَلَى الْهَدُوءِ.', isCorrect: true },
        { id: 1, text: 'أصرخ وأكسر الأشياء', spokenText: 'الْهَدُوءُ أَفْضَلُ طَرِيقَةٍ لِلْتَعَامُلِ مَعَ الْغَضَبِ.', isCorrect: false }
      ]
    },
    {
      id: 4,
      title: "التعاطف مع الآخرين",
      icon: "🤗",
      question: "إذا رأيت صديقك حزيناً، ماذا تفعل؟",
      spokenQuestion: "إِذَا رَأَيْتَ صَدِيقَكَ حَزِينًا، مَاذَا تَفْعَلُ؟",
      summary: "تنمية التعاطف والاهتمام بمشاعر الآخرين",
      options: [
        { id: 0, text: 'أسأله عن حاله وأعطيه حضناً', spokenText: 'جَمِيل! التَّعَاطُفُ يُقَوِّي الصَّدَاقَةَ.', isCorrect: true },
        { id: 1, text: 'أتجاهله', spokenText: 'الْاهْتِمَامُ بِالْآخَرِينَ يُشْعِرُهُمْ بِالتَّقْدِيرِ.', isCorrect: false }
      ]
    }
  ];

  // فواكه وخضار جديدة
  const fruitItems = [
    { id: 'strawberry', emoji: '🍓', name: 'فراولة', points: 5 },
    { id: 'grape', emoji: '🍇', name: 'عنب', points: 5 },
    { id: 'orange', emoji: '🍊', name: 'برتقال', points: 5 }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const profile = await AsyncStorage.getItem('userProfile');
      if (profile) setUserName(JSON.parse(profile).name || 'يُويَا');
      
      const soundPref = await AsyncStorage.getItem('soundEnabled');
      const hapticsPref = await AsyncStorage.getItem('hapticsEnabled');
      if (soundPref !== null) setSoundEnabled(JSON.parse(soundPref));
      if (hapticsPref !== null) setHapticsEnabled(JSON.parse(hapticsPref));
    };
    fetchUser();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (gameState === 'playing' && !showQuestion) {
        setGamePaused(true);
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [gameState, showQuestion]);

  useEffect(() => {
    if (rocketActive) {
      setScrollSpeed(8.0);
      const timer = setTimeout(() => {
        setRocketActive(false);
        setScrollSpeed(2.0);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [rocketActive]);

  const speak = (text) => {
    if (!soundEnabled) return;
    Speech.stop();
    Speech.speak(text, { language: 'ar', rate: 0.8, pitch: 1.1 });
  };

  const hapticFeedback = (type) => {
    if (!hapticsEnabled) return;
    if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const initGame = () => {
    const nPlats = [];
    const nBooks = [];
    const nFruits = [];
    const nRockets = [];
    
    // منصة أساسية
    nPlats.push({ x: 0, y: SCREEN_HEIGHT - 100, width: SCREEN_WIDTH, isMoving: false });
    
    // إنشاء 80 منصة مع تباعد جيد
    for (let i = 1; i < 80; i++) {
      const py = SCREEN_HEIGHT - 100 - (i * 220);
      const px = Math.random() * (SCREEN_WIDTH - 120);
      const isMoving = i === 15 || i === 40 || i === 65;
      
      nPlats.push({ 
        x: px, 
        y: py, 
        width: 120,
        isMoving,
        direction: isMoving ? (Math.random() > 0.5 ? 1 : -1) : 0
      });
      
      // توزيع الكتب الأربعة
      if (i % 20 === 0 && nBooks.length < 4) {
        nBooks.push({ 
          ...bookEmotions[nBooks.length], 
          x: px + 40, 
          y: py - 80, 
          collected: false, 
          id: 'b'+i
        });
      }
      
      // توزيع الفواكه الثلاثة
      if (i % 25 === 12 && nFruits.length < 3) {
        nFruits.push({ 
          ...fruitItems[nFruits.length], 
          x: px + 40, 
          y: py - 60, 
          collected: false, 
          id: 'f'+i
        });
      }
      
      // صاروخ واحد في المنتصف
      if (i === 45) {
        nRockets.push({ 
          x: px + 40, 
          y: py - 60, 
          id: 'rocket', 
          collected: false
        });
      }
    }
    
    setPlatforms(nPlats);
    setBooks(nBooks);
    setFruits(nFruits);
    setRockets(nRockets);
    setScore(0);
    setLives(3);
    setCollectedBooks(0);
    setGameState('playing');
    setShowWinScreen(false);
    setGamePaused(false);
    setScrollOffset(0);
    
    movingPlatforms.current = nPlats.filter(p => p.isMoving);
    platformDirections.current = {};
    movingPlatforms.current.forEach((p, idx) => {
      platformDirections.current[idx] = p.direction;
    });
    
    pos.current = { x: SCREEN_WIDTH/2 - HERO_WIDTH/2, y: SCREEN_HEIGHT - 200 };
    vel.current = { x: 0, y: 0 };
    
    speak("مَرْحَبًا يَا " + userName + "! هَذَا هُوَ الْمُسْتَوَى السَّادِسُ. تَعَلَّمْ كَيْفَ تَفْهَمُ مَشَاعِرَكَ وَمَشَاعِرَ الْآخَرِينَ!");
  };

  const movePlatforms = () => {
    setPlatforms(prev => prev.map((p, index) => {
      if (p.isMoving) {
        let newX = p.x + (platformDirections.current[index] || 1) * 3;
        if (newX <= 0 || newX >= SCREEN_WIDTH - p.width) {
          platformDirections.current[index] *= -1;
          newX = p.x;
        }
        return { ...p, x: newX };
      }
      return p;
    }));
  };

  const update = () => {
    if (gamePaused) return;
    
    // تحريك المنصات
    movePlatforms();
    
    // زيادة التمرير
    setScrollOffset(prev => prev + scrollSpeed);
    scrollAnim.setValue(scrollOffset);
    
    // الجاذبية والحركة
    vel.current.y += GRAVITY;
    pos.current.y += vel.current.y;
    pos.current.x += vel.current.x;
    
    // حدود الشاشة
    if (pos.current.x > SCREEN_WIDTH - HERO_WIDTH) pos.current.x = SCREEN_WIDTH - HERO_WIDTH;
    if (pos.current.x < 0) pos.current.x = 0;
    
    // التحقق من الاصطدام بالمنصات
    if (vel.current.y > 0) {
      platforms.forEach(p => {
        if (pos.current.y + HERO_HEIGHT >= p.y && pos.current.y + HERO_HEIGHT <= p.y + 25 &&
            pos.current.x + HERO_WIDTH - 15 >= p.x && pos.current.x + 15 <= p.x + p.width) {
          vel.current.y = JUMP_POWER;
          hapticFeedback('light');
        }
      });
    }
    
    // جمع الصاروخ
    rockets.forEach(r => {
      if (!r.collected && Math.abs(pos.current.x + HERO_WIDTH/2 - (r.x + 15)) < 45 && 
          Math.abs(pos.current.y + HERO_HEIGHT/2 - (r.y + 15)) < 60) {
        r.collected = true;
        setRocketActive(true);
        hapticFeedback('success');
      }
    });
    
    // جمع الفواكه
    fruits.forEach(f => {
      if (!f.collected && Math.abs(pos.current.x + HERO_WIDTH/2 - (f.x + 15)) < 45 && 
          Math.abs(pos.current.y + HERO_HEIGHT/2 - (f.y + 15)) < 60) {
        f.collected = true;
        setScore(s => s + f.points);
        hapticFeedback('success');
        speak("وَجَدْتَ " + f.name + " " + f.emoji);
      }
    });
    
    // جمع الكتب
    books.forEach(b => {
      if (!b.collected && Math.abs(pos.current.x - b.x) < 55 && Math.abs(pos.current.y - b.y) < 55) {
        b.collected = true;
        setCurrentQuestionData(b);
        setShowQuestion(true);
        setScore(s => s + 10);
        hapticFeedback('medium');
        speak(b.spokenQuestion);
      }
    });
    
    // السقوط
    if (pos.current.y > (SCREEN_HEIGHT - scrollOffset) + 150) {
      setLives(l => {
        if (l <= 1) {
          setGameState('home');
          speak("حَاوِلْ مَرَّةً أُخْرَى يَا " + userName + "!");
          return 0;
        }
        hapticFeedback('error');
        Animated.sequence([
          Animated.timing(heroOpacity, { toValue: 0.3, duration: 100, useNativeDriver: true }),
          Animated.timing(heroOpacity, { toValue: 1, duration: 100, useNativeDriver: true })
        ]).start();
        return l - 1;
      });
    }
    
    animPos.setValue({ x: pos.current.x, y: pos.current.y });
  };

  useEffect(() => {
    if (gameState === 'playing' && !showQuestion && !showWinScreen && !gamePaused) {
      gameLoopRef.current = setInterval(update, 16);
    } else {
      clearInterval(gameLoopRef.current);
    }
    return () => clearInterval(gameLoopRef.current);
  }, [gameState, showQuestion, showWinScreen, gamePaused, scrollSpeed, scrollOffset]);

  const handleAnswer = (opt) => {
    speak(opt.spokenText);
    
    if (opt.isCorrect) {
      hapticFeedback('success');
      setCollectedBooks(c => {
        const newCount = c + 1;
        if (newCount >= 4) {
          setTimeout(() => {
            setShowWinScreen(true);
            if (confettiRef.current) confettiRef.current.start();
            speak("رَائِعٌ يَا " + userName + "! أَصْبَحْتَ خَبِيرًا فِي فَهْمِ الْمَشَاعِرِ!");
          }, 1000);
        }
        return newCount;
      });
    } else {
      hapticFeedback('error');
      setLives(l => {
        if (l <= 1) {
          setGameState('home');
          speak("تَعَلَّمْ مِنْ خَطَئِكَ وَحَاوِلْ مَرَّةً أُخْرَى");
          return 0;
        }
        return l - 1;
      });
    }
    setShowQuestion(false);
  };

  const shareGame = () => {
    const message = `🎮 أنا ${userName}، أكملت المستوى السادس في يويَا!\n\nتعلمت كيفية:\n${bookEmotions.map(b => `• ${b.summary}`).join('\n')}\n\nالنقاط: ${score}`;
    Share.share({ message, title: 'مغامرة يويَا التعليمية' });
  };

  const joystickResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      const moveX = Math.max(-50, Math.min(50, gs.dx));
      knobX.setValue(moveX);
      vel.current.x = (moveX / 50) * 7.5;
      setIsFacingRight(gs.dx > 0);
    },
    onPanResponderRelease: () => {
      Animated.spring(knobX, { toValue: 0, useNativeDriver: true }).start();
      vel.current.x = 0;
    }
  })).current;

  const renderWinScreen = () => (
    <View style={styles.winContainer}>
      <ConfettiCannon ref={confettiRef} count={200} origin={{ x: SCREEN_WIDTH / 2, y: 0 }} />
      
      <View style={styles.winContent}>
        <Text style={styles.winEmoji}>🏆</Text>
        <Text style={styles.winTitle}>مُبَارَك يَا {userName}!</Text>
        <Text style={styles.winSubtitle}>أَتَمَمْتَ الْمُسْتَوَى السَّادِسَ</Text>
        
        <View style={styles.statsBox}>
          <Text style={styles.scoreText}>النقاط: {score}</Text>
          <Text style={styles.booksText}>الكتب: 4/4</Text>
          <Text style={styles.livesText}>الحياة: ❤️ {lives}</Text>
        </View>
        
        <View style={styles.skillsBox}>
          <Text style={styles.skillsTitle}>مَا تَعَلَّمْتَ:</Text>
          {bookEmotions.map((b, i) => (
            <View key={i} style={styles.skillItem}>
              <Text style={styles.skillIcon}>{b.icon}</Text>
              <Text style={styles.skillText}>{b.summary}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.winButtons}>
          <TouchableOpacity style={styles.winButton} onPress={initGame}>
            <Text style={styles.winButtonText}>إعادة اللعب</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.winButton, {backgroundColor: '#3498db'}]} onPress={shareGame}>
            <Text style={styles.winButtonText}>مشاركة النتيجة</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.winButton, {backgroundColor: '#e74c3c'}]} 
            onPress={() => navigation.navigate('Home')}>
            <Text style={styles.winButtonText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {gameState === 'playing' ? (
        showWinScreen ? renderWinScreen() : (
          <>
            {/* شريط التحكم العلوي */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => setGamePaused(!gamePaused)}>
                <Ionicons name={gamePaused ? "play" : "pause"} size={28} color="#2c3e50" />
              </TouchableOpacity>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>📚 {collectedBooks}/4</Text>
                <Text style={styles.scoreText}>❤️ {lives}</Text>
                <Text style={styles.scoreText}>⭐ {score}</Text>
                {rocketActive && <Text style={styles.rocketText}>🚀</Text>}
              </View>
              <TouchableOpacity onPress={() => setSoundEnabled(!soundEnabled)}>
                <Ionicons name={soundEnabled ? "volume-high" : "volume-mute"} size={28} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            {/* منطقة اللعبة */}
            <Animated.View style={[styles.gameWorld, { transform: [{ translateY: scrollAnim }] }]}>
              {/* المنصات */}
              {platforms.map((p, i) => (
                <View key={i} style={[
                  styles.platform,
                  p.isMoving && styles.movingPlatform,
                  { left: p.x, top: p.y, width: p.width }
                ]} />
              ))}
              
              {/* العناصر */}
              {rockets.map(r => !r.collected && (
                <Text key={r.id} style={[styles.item, { left: r.x, top: r.y }]}>🚀</Text>
              ))}
              
              {fruits.map(f => !f.collected && (
                <Text key={f.id} style={[styles.item, { left: f.x, top: f.y, fontSize: 36 }]}>{f.emoji}</Text>
              ))}
              
              {books.map(b => !b.collected && (
                <Text key={b.id} style={[styles.item, { left: b.x, top: b.y, fontSize: 40 }]}>📖</Text>
              ))}
              
              {/* البطل */}
              <Animated.View style={[
                styles.hero,
                {
                  transform: [
                    { translateX: animPos.x },
                    { translateY: animPos.y },
                    { scaleX: isFacingRight ? 1 : -1 }
                  ],
                  opacity: heroOpacity
                }
              ]}>
                <Image source={vel.current.y < -5 ? heroJumpImage : heroImage} style={styles.heroImg} />
              </Animated.View>
            </Animated.View>

            {/* عصا التحكم */}
            <View style={styles.controls}>
              <View style={styles.joystickContainer} {...joystickResponder.panHandlers}>
                <Animated.View style={[styles.joystickKnob, { transform: [{ translateX: knobX }] }]} />
              </View>
            </View>

            {/* نافذة السؤال */}
            <Modal visible={showQuestion} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.questionIcon}>{currentQuestionData?.icon}</Text>
                  <Text style={styles.questionText}>{currentQuestionData?.question}</Text>
                  {currentQuestionData?.options.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      style={styles.optionButton}
                      onPress={() => handleAnswer(opt)}>
                      <Text style={styles.optionText}>{opt.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Modal>

            {/* نافذة الإيقاف المؤقت */}
            <Modal visible={gamePaused} transparent animationType="fade">
              <View style={styles.pauseOverlay}>
                <View style={styles.pauseContent}>
                  <Text style={styles.pauseTitle}>اللعبة متوقفة</Text>
                  <TouchableOpacity style={styles.resumeButton} onPress={() => setGamePaused(false)}>
                    <Text style={styles.resumeButtonText}>استئناف اللعب</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuButton} onPress={() => setGameState('home')}>
                    <Text style={styles.menuButtonText}>الخروج للقائمة</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </>
        )
      ) : (
        // شاشة البداية
        <View style={styles.homeScreen}>
          <Image source={heroImage} style={styles.homeHero} />
          <Text style={styles.homeTitle}>المستوى السادس</Text>
          <Text style={styles.homeGreeting}>أهلاً {userName}!</Text>
          <Text style={styles.homeSubtitle}>تعلم فهم المشاعر والعواطف</Text>
          
          <View style={styles.booksPreview}>
            {bookEmotions.map((book, i) => (
              <View key={i} style={styles.bookPreview}>
                <Text style={styles.bookIcon}>{book.icon}</Text>
                <Text style={styles.bookTitle}>{book.title}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.startButton} onPress={initGame}>
            <Text style={styles.startButtonText}>ابدأ المغامرة</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>رجوع</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#87CEEB' },
  
  // شريط التحكم
  topBar: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 10,
    borderRadius: 20,
    elevation: 5
  },
  scoreContainer: { flexDirection: 'row', gap: 20 },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  rocketText: { fontSize: 20 },
  
  // منطقة اللعبة
  gameWorld: { flex: 1 },
  platform: {
    position: 'absolute',
    height: 20,
    backgroundColor: '#27ae60',
    borderRadius: 10,
    borderTopWidth: 3,
    borderTopColor: '#2ecc71'
  },
  movingPlatform: {
    backgroundColor: '#e67e22',
    borderTopColor: '#f39c12'
  },
  item: {
    position: 'absolute',
    fontSize: 32,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3
  },
  hero: {
    position: 'absolute',
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    zIndex: 20
  },
  heroImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  
  // عصا التحكم
  controls: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center'
  },
  joystickContainer: {
    width: 120,
    height: 60,
    backgroundColor: 'rgba(52, 73, 94, 0.2)',
    borderRadius: 30,
    justifyContent: 'center',
    padding: 5,
    borderWidth: 2,
    borderColor: '#34495e'
  },
  joystickKnob: {
    width: 50,
    height: 50,
    backgroundColor: '#2c3e50',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#f1c40f'
  },
  
  // النوافذ المنبثقة
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center'
  },
  questionIcon: { fontSize: 40, marginBottom: 15 },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#2c3e50'
  },
  optionButton: {
    width: '100%',
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 15,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#bdc3c7'
  },
  optionText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#2c3e50'
  },
  
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  pauseContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center'
  },
  pauseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#2c3e50'
  },
  resumeButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15
  },
  menuButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center'
  },
  resumeButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  menuButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  
  // شاشة الفوز
  winContainer: {
    flex: 1,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center'
  },
  winContent: {
    alignItems: 'center',
    padding: 20,
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20
  },
  winEmoji: { fontSize: 60, marginBottom: 10 },
  winTitle: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5
  },
  winSubtitle: {
    fontSize: 18,
    color: '#f1c40f',
    marginBottom: 20
  },
  statsBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center'
  },
  skillsBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    width: '100%'
  },
  skillsTitle: {
    color: '#f1c40f',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    paddingHorizontal: 10
  },
  skillIcon: { fontSize: 20, marginRight: 10 },
  skillText: { color: 'white', fontSize: 14, flex: 1 },
  winButtons: { width: '100%', marginTop: 10 },
  winButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 8
  },
  winButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  // شاشة البداية
  homeScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9B59B6',
    padding: 20
  },
  homeHero: {
    width: 120,
    height: 150,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 5,
    borderColor: 'white'
  },
  homeTitle: {
    fontSize: 36,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10
  },
  homeGreeting: {
    fontSize: 24,
    color: '#f1c40f',
    marginBottom: 5
  },
  homeSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 30,
    textAlign: 'center'
  },
  booksPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30
  },
  bookPreview: {
    alignItems: 'center',
    margin: 10,
    width: 100
  },
  bookIcon: { fontSize: 30, marginBottom: 5 },
  bookTitle: { color: 'white', fontSize: 12, textAlign: 'center' },
  startButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginBottom: 15
  },
  startButtonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  backButton: {
    backgroundColor: '#7f8c8d',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 20
  },
  backButtonText: { color: 'white', fontSize: 16 }
});

export default YoyaGameV6;
