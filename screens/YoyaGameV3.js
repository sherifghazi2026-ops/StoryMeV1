import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, Dimensions, Image, Animated,
  Vibration, PanResponder, Modal, ScrollView, TouchableOpacity, Share,
  Alert, Easing, BackHandler
} from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRAVITY = 0.50;
const JUMP_POWER = -15.5;
const CONSTANT_SCROLL_SPEED = 2.0;
const HERO_WIDTH = 70;
const HERO_HEIGHT = 90;

const YoyaGameV3 = ({ navigation, route }) => {
  const [gameState, setGameState] = useState('home');
  const [platforms, setPlatforms] = useState([]);
  const [gems, setGems] = useState([]);
  const [books, setBooks] = useState([]);
  const [hearts, setHearts] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [coins, setCoins] = useState([]);
  const [score, setScore] = useState(0);
  const [collectedBooks, setCollectedBooks] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [comboTimer, setComboTimer] = useState(0);
  const [isFacingRight, setIsFacingRight] = useState(true);
  const [userName, setUserName] = useState('يُويَا');
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const [showWinScreen, setShowWinScreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [gamePaused, setGamePaused] = useState(false);
  const [levelProgress, setLevelProgress] = useState(0);
  const [achievements, setAchievements] = useState([]);

  const pos = useRef({ x: SCREEN_WIDTH / 2 - HERO_WIDTH / 2, y: SCREEN_HEIGHT - 200 });
  const vel = useRef({ x: 0, y: 0 });
  const scrollOffset = useRef(0);
  const gameLoopRef = useRef(null);
  const heartSpawned = useRef(false);
  const obstacleSpawned = useRef(false);
  const lastGemTime = useRef(Date.now());
  const confettiRef = useRef(null);

  const animPos = useRef(new Animated.ValueXY({ x: pos.current.x, y: pos.current.y })).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const knobX = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(1)).current;
  const heroOpacity = useRef(new Animated.Value(1)).current;
  
  // التعديل هنا: استخدام نفس الصورة لكليهما
  const heroImage = require('../assets/Boy.gif');
  const heroJumpImage = heroImage; // استخدام نفس الصورة

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

  const bookQuestionsV3 = [
    ...bookQuestionsV2,
    {
      id: 5,
      title: "المساعدة والتعاون",
      icon: "🤝",
      question: "رأيت طفلاً يبكي لأنه فقد لعبة. ماذا تفعل؟",
      spokenQuestion: "رَأَيْتَ طِفْلًا يَبْكِي لِأَنَّهُ فَقَدَ لُعْبَةً. مَاذَا تَفْعَلُ؟",
      summary: "مساعدة الآخرين وتقديم الدعم.",
      options: [
        { 
          id: 0, 
          text: 'أتجاهله وأستمر في اللعب', 
          spokenText: 'أَتَجَاهَلُهُ وَأَسْتَمِرُّ فِي اللَّعِبِ. خَطَأ! الْمُسَاعَدَةُ مِنْ أَجْمَلِ الْأَفْعَالِ.', 
          isCorrect: false 
        },
        { 
          id: 1, 
          text: 'أساعده في البحث عن لعبه', 
          spokenText: 'أُسَاعِدُهُ فِي الْبَحْثِ عَنْ لُعْبَتِهِ. رَائِعٌ! أَنْتَ صَدِيقٌ مُسَاعِدٌ.', 
          isCorrect: true 
        }
      ]
    },
    {
      id: 6,
      title: "الإنصات للآخرين",
      icon: "👂",
      question: "عندما يتحدث إليك صديقك بشيء مهم، ماذا تفعل؟",
      spokenQuestion: "عِنْدَمَا يَتَحَدَّثُ إِلَيْكَ صَدِيقُكَ بِشَيْءٍ مُهِمٍّ، مَاذَا تَفْعَلُ؟",
      summary: "احترام المتحدث والإنصات الجيد.",
      options: [
        { 
          id: 0, 
          text: 'أشغل نفسي بالهاتف', 
          spokenText: 'أُشْغِلُ نَفْسِي بِالْهَاتِفِ. خَطَأ! الْإِنْصَاتُ وَاجِبٌ عَلَى كُلِّ مُسْلِمٍ.', 
          isCorrect: false 
        },
        { 
          id: 1, 
          text: 'أنصت له باهتمام', 
          spokenText: 'أَنْصِتُ لَهُ بِاهْتِمَامٍ. أَحْسَنْتَ! أَنْتَ مُسْتَمِعٌ جَيِّدٌ.', 
          isCorrect: true 
        }
      ]
    }
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

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (combo > 0) {
      const timer = setTimeout(() => {
        if (comboTimer > 0) {
          setComboTimer(comboTimer - 1);
        } else {
          setCombo(0);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [combo, comboTimer]);

  const handleBackPress = () => {
    if (gameState === 'playing' && !showQuestion) {
      setGamePaused(true);
      return true;
    }
    return false;
  };

  const speak = (text) => {
    if (!soundEnabled) return;
    Speech.stop();
    Speech.speak(text, { language: 'ar', rate: 0.8, pitch: 1.1 });
  };

  const hapticFeedback = (type) => {
    if (!hapticsEnabled) return;
    
    switch(type) {
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  };

  const addGemToAccount = async (count = 1) => {
    try {
      const current = await AsyncStorage.getItem('total_gems');
      const newValue = (parseInt(current || '0') + count).toString();
      await AsyncStorage.setItem('total_gems', newValue);
      
      const gemCount = parseInt(newValue);
      const achievementsData = await AsyncStorage.getItem('achievements') || '[]';
      const achievementsArray = JSON.parse(achievementsData);
      
      if (gemCount >= 50 && !achievementsArray.includes('gem_collector')) {
        achievementsArray.push('gem_collector');
        await AsyncStorage.setItem('achievements', JSON.stringify(achievementsArray));
        showAchievement('جامع الجواهر', '🎖️', 'جمعت 50 جوهرة!');
      }
      
      return newValue;
    } catch (e) { console.log(e); }
  };

  const showAchievement = (title, icon, description) => {
    Alert.alert(
      `🎉 إنجاز جديد! ${icon}`,
      `${title}\n${description}`,
      [{ text: 'رائع!' }]
    );
    speak(`مَبْرُوك! لَقَدْ حَصَلْتَ عَلَى إِنْجَازٍ جَدِيدٍ: ${title}`);
  };

  const initGame = () => {
    let nPlats = [], nGems = [], nBooks = [], nHearts = [], nObstacles = [], nCoins = [];
    
    nPlats.push({ x: 0, y: SCREEN_HEIGHT - 100, width: SCREEN_WIDTH });

    for (let i = 1; i < 180; i++) {
      let py = (SCREEN_HEIGHT - 100) - (i * 170);
      let px = Math.random() * (SCREEN_WIDTH - 110);
      
      nPlats.push({ 
        x: px, 
        y: py, 
        width: 110,
        type: Math.random() > 0.8 ? 'bouncy' : 'normal'
      });
      
      if (Math.random() > 0.7) {
        nGems.push({ 
          x: px + 35, 
          y: py - 50, 
          id: 'g'+i, 
          collected: false,
          type: Math.random() > 0.9 ? 'rare' : 'normal'
        });
      }
      
      if (Math.random() > 0.8) {
        nCoins.push({
          x: px + 20,
          y: py - 50,
          id: 'c'+i,
          collected: false,
          value: 5
        });
      }
      
      if (!heartSpawned.current && i === 60) {
        nHearts.push({ 
          x: px + 40, 
          y: py - 50, 
          id: 'rare-heart', 
          collected: false 
        });
        heartSpawned.current = true;
      }
      
      if (!obstacleSpawned.current && i > 20 && Math.random() > 0.9) {
        nObstacles.push({
          x: px + 20,
          y: py - 30,
          id: 'obs'+i,
          type: 'spike',
          width: 40,
          height: 40
        });
      }
      
      if (i % 35 === 0 && nBooks.length < bookQuestionsV3.length) {
        nBooks.push({ 
          ...bookQuestionsV3[nBooks.length % bookQuestionsV3.length], 
          x: px + 35, 
          y: py - 70, 
          collected: false, 
          id: 'b'+i 
        });
      }
    }
    
    setPlatforms(nPlats);
    setGems(nGems);
    setBooks(nBooks);
    setHearts(nHearts);
    setObstacles(nObstacles);
    setCoins(nCoins);
    setScore(0);
    setLives(3);
    setCollectedBooks(0);
    setCombo(0);
    setComboTimer(0);
    setGameState('playing');
    setShowWinScreen(false);
    setGamePaused(false);
    setLevelProgress(0);
    
    heartSpawned.current = false;
    obstacleSpawned.current = false;
    scrollOffset.current = 0;
    pos.current = { x: SCREEN_WIDTH/2 - HERO_WIDTH/2, y: SCREEN_HEIGHT - 200 };
    vel.current = { x: 0, y: 0 };
    
    speak("مَرْحَبًا يَا " + userName + "! هَذَا هُوَ الْمُسْتَوَى الثَّالِثُ. لِنَبْدَأْ مُغَامَرَتَنَا الْجَدِيدَةَ!");
    
    Animated.sequence([
      Animated.timing(heroOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  };

  const update = () => {
    if (gamePaused) return;
    
    scrollOffset.current += CONSTANT_SCROLL_SPEED;
    scrollAnim.setValue(scrollOffset.current);
    
    const progress = Math.min((scrollOffset.current / 30000) * 100, 100);
    setLevelProgress(progress);
    
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
          
          if (p.type === 'bouncy') {
            vel.current.y = JUMP_POWER * 1.3;
            hapticFeedback('medium');
            animateHeroScale(1.3);
          } else {
            vel.current.y = JUMP_POWER;
            hapticFeedback('light');
          }
          break;
        }
      }
    }
    
    gems.forEach(g => {
      if (!g.collected && Math.abs(pos.current.x + HERO_WIDTH/2 - (g.x + 15)) < 45 && 
          Math.abs(pos.current.y + HERO_HEIGHT/2 - (g.y + 15)) < 60) {
        
        g.collected = true;
        const gemValue = g.type === 'rare' ? 3 : 1;
        setScore(s => s + gemValue);
        addGemToAccount(gemValue);
        
        const now = Date.now();
        if (now - lastGemTime.current < 2000) {
          setCombo(c => c + 1);
          setComboTimer(5);
        } else {
          setCombo(1);
          setComboTimer(5);
        }
        lastGemTime.current = now;
        
        hapticFeedback('light');
        animateHeroScale(1.1);
      }
    });
    
    hearts.forEach(h => {
      if (!h.collected && Math.abs(pos.current.x - h.x) < 45 && Math.abs(pos.current.y - h.y) < 45) {
        h.collected = true;
        setLives(l => l + 1);
        hapticFeedback('success');
        animateHeroScale(1.2);
      }
    });
    
    coins.forEach(c => {
      if (!c.collected && Math.abs(pos.current.x - c.x) < 40 && Math.abs(pos.current.y - c.y) < 40) {
        c.collected = true;
        setScore(s => s + c.value);
        hapticFeedback('light');
      }
    });
    
    obstacles.forEach(o => {
      if (Math.abs(pos.current.x - o.x) < 35 && Math.abs(pos.current.y - o.y) < 35) {
        setLives(l => {
          if (l <= 1) {
            setGameState('home');
            speak("عَفْوًا يَا " + userName + "! لَقَدْ خَسِرْتَ. حَاوِلْ مَرَّةً أُخْرَى.");
            return 0;
          }
          hapticFeedback('error');
          animateHeroOpacity();
          return l - 1;
        });
      }
    });
    
    books.forEach(b => {
      if (!b.collected && Math.abs(pos.current.x - b.x) < 55 && Math.abs(pos.current.y - b.y) < 55) {
        b.collected = true;
        setCurrentQuestionData(b);
        setShowQuestion(true);
        hapticFeedback('medium');
        speak("أَحْسَنْتَ يَا " + userName + ". وَجَدْتَ كِتَابًا جَدِيدًا. " + b.spokenQuestion);
      }
    });
    
    if (pos.current.y > (SCREEN_HEIGHT - scrollOffset.current) + 150) {
      setGameState('home');
      speak("عَفْوًا يَا " + userName + "! سَقَطْتَ. حَاوِلْ مَرَّةً أُخْرَى.");
    }
    
    animPos.setValue({ x: pos.current.x, y: pos.current.y });
  };
  
  const animateHeroScale = (scale) => {
    Animated.sequence([
      Animated.timing(heroScale, {
        toValue: scale,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.ease
      }),
      Animated.timing(heroScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.ease
      })
    ]).start();
  };
  
  const animateHeroOpacity = () => {
    Animated.sequence([
      Animated.timing(heroOpacity, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  useEffect(() => {
    if (gameState === 'playing' && !showQuestion && !showWinScreen && !gamePaused) {
      gameLoopRef.current = setInterval(update, 16);
    } else {
      clearInterval(gameLoopRef.current);
    }
    return () => clearInterval(gameLoopRef.current);
  }, [gameState, showQuestion, showWinScreen, gamePaused]);

  const handleAnswer = (opt) => {
    speak(opt.spokenText);
    
    if (opt.isCorrect) {
      hapticFeedback('success');
      setCollectedBooks(c => {
        const newCount = c + 1;
        if (newCount >= bookQuestionsV3.length) {
          setTimeout(() => {
            setShowWinScreen(true);
            confettiRef.current && confettiRef.current.start();
            const skillsText = bookQuestionsV3.map(q => q.summary).join("، وَ");
            speak("رَائِعٌ يَا " + userName + "! لَقَدْ أَنْهَيْتَ الْمُسْتَوَى الثَّالِثَ. " + skillsText);
          }, 1500);
        }
        return newCount;
      });
      setShowQuestion(false);
    } else {
      hapticFeedback('error');
      setLives(l => {
        if (l <= 1) {
          setGameState('home');
          setShowQuestion(false);
          speak("عَفْوًا! خَطَأٌ. حَاوِلْ مَرَّةً أُخْرَى.");
          return 0;
        }
        return l - 1;
      });
    }
  };

  const shareGame = () => {
    const info = bookQuestionsV3.map(q => q.summary).join("\n- ");
    Share.share({
      message: `أنا البطل ${userName}، أنهيت المستوى الثالث في يويَا! 🎮\n\nما تعلمته:\n- ${info}\n\nجمعت ${score} نقطة!`,
      title: 'مشاركة إنجاز يويَا'
    });
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    AsyncStorage.setItem('soundEnabled', JSON.stringify(newValue));
    if (newValue) speak("تَمَّ تَشْغِيلُ الصَّوْتِ");
  };

  const toggleHaptics = () => {
    const newValue = !hapticsEnabled;
    setHapticsEnabled(newValue);
    AsyncStorage.setItem('hapticsEnabled', JSON.stringify(newValue));
    if (soundEnabled) speak(newValue ? "تَمَّ تَشْغِيلُ التَّأْثِيرَاتِ" : "تَمَّ إِيقَافُ التَّأْثِيرَاتِ");
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

  const renderWinScreen = () => (
    <View style={styles.winContainer}>
      <ConfettiCannon
        ref={confettiRef}
        count={200}
        origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
        autoStart={false}
      />
      <ScrollView contentContainerStyle={styles.winContent}>
        <Text style={styles.winEmoji}>🏆</Text>
        <Text style={styles.winTitle}>أَحْسَنْتَ يَا {userName}!</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>💎 {score}</Text>
            <Text style={styles.statLabel}>النقاط</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>📚 {collectedBooks}</Text>
            <Text style={styles.statLabel}>الكتب</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>⚡ {combo}</Text>
            <Text style={styles.statLabel}>الكومبو</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>تقدم المستوى</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(levelProgress)}%</Text>
        </View>
        
        <View style={styles.skillsSection}>
          <Text style={styles.sectionTitle}>مَا تَعَلَّمْتَهُ فِي هَذِهِ الْمُغَامَرَةِ:</Text>
          {bookQuestionsV3.map(q => (
            <TouchableOpacity 
              key={q.id} 
              style={styles.skillRow} 
              onPress={() => speak(q.summary)}
              activeOpacity={0.7}
            >
              <Text style={styles.skillIcon}>{q.icon}</Text>
              <View style={styles.skillTextContainer}>
                <Text style={styles.skillTitle}>{q.title}</Text>
                <Text style={styles.skillItem}>{q.summary}</Text>
              </View>
              <Ionicons name="volume-medium" size={20} color="#F1C40F" />
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.winActionArea}>
          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#2ECC71'}]} 
            onPress={initGame}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.actionBtnText}>إعادة</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#3498DB'}]} 
            onPress={shareGame}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social" size={24} color="white" />
            <Text style={styles.actionBtnText}>مشاركة</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#E74C3C'}]} 
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={24} color="white" />
            <Text style={styles.actionBtnText}>الرئيسية</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {gameState === 'playing' ? (
        showWinScreen ? renderWinScreen() : (
          <View style={styles.gameArea}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => setGamePaused(!gamePaused)} style={styles.pauseBtn}>
                <Ionicons name={gamePaused ? "play" : "pause"} size={24} color="#2C3E50" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleSound} style={styles.settingsBtn}>
                <Ionicons name={soundEnabled ? "volume-high" : "volume-mute"} size={22} color="#2C3E50" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleHaptics} style={styles.settingsBtn}>
                <Ionicons name={hapticsEnabled ? "phone-portrait" : "phone-portrait-outline"} size={22} color="#2C3E50" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.hud}>
              <View style={styles.hudItem}>
                <Text style={styles.hudText}>💎 {score}</Text>
                {combo > 1 && (
                  <Text style={styles.comboText}>⚡ x{combo}</Text>
                )}
              </View>
              <View style={styles.hudItem}>
                <Text style={styles.hudText}>📚 {collectedBooks}/{bookQuestionsV3.length}</Text>
              </View>
              <View style={styles.hudItem}>
                <Text style={[styles.hudText, {color: '#FF4757'}]}>❤️ {lives}</Text>
              </View>
            </View>
            
            <View style={styles.gameProgress}>
              <View style={[styles.gameProgressFill, { width: `${levelProgress}%` }]} />
            </View>
            
            <Animated.View style={{ flex: 1, transform: [{ translateY: scrollAnim }] }}>
              {platforms.map((p, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.platform, 
                    p.type === 'bouncy' && styles.bouncyPlatform,
                    { left: p.x, top: p.y, width: p.width }
                  ]} 
                />
              ))}
              
              {gems.map(g => !g.collected && (
                <Animated.Text 
                  key={g.id} 
                  style={[
                    styles.item, 
                    g.type === 'rare' && styles.rareGem,
                    { left: g.x, top: g.y }
                  ]}
                >
                  {g.type === 'rare' ? '💎✨' : '💎'}
                </Animated.Text>
              ))}
              
              {hearts.map(h => !h.collected && (
                <Text key={h.id} style={[styles.item, { left: h.x, top: h.y }]}>❤️</Text>
              ))}
              
              {coins.map(c => !c.collected && (
                <Text key={c.id} style={[styles.item, { left: c.x, top: c.y }]}>🪙</Text>
              ))}
              
              {obstacles.map(o => (
                <View 
                  key={o.id} 
                  style={[styles.obstacle, { left: o.x, top: o.y }]} 
                />
              ))}
              
              {books.map(b => !b.collected && (
                <Text 
                  key={b.id} 
                  style={[styles.item, { left: b.x, top: b.y, fontSize: 45 }]}
                >
                  📖
                </Text>
              ))}
              
              <Animated.View 
                style={[
                  styles.hero, 
                  { 
                    transform: [
                      { translateX: animPos.x }, 
                      { translateY: animPos.y }, 
                      { scaleX: isFacingRight ? 1 : -1 },
                      { scale: heroScale }
                    ],
                    opacity: heroOpacity
                  }
                ]}
              >
                <Image 
                  source={vel.current.y < -5 ? heroJumpImage : heroImage} 
                  style={styles.heroImg} 
                />
              </Animated.View>
            </Animated.View>
            
            <View style={styles.controls}>
              <View style={styles.joyBase} {...joystickResponder.panHandlers}>
                <Animated.View style={[styles.joyKnob, { transform: [{ translateX: knobX }] }]} />
              </View>
            </View>
            
            <Modal visible={showQuestion} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionIcon}>{currentQuestionData?.icon}</Text>
                    <Text style={styles.questionTitle}>{currentQuestionData?.title}</Text>
                  </View>
                  <Text style={styles.qText}>{currentQuestionData?.question}</Text>
                  {currentQuestionData?.options.map((o, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={[
                        styles.optBtn,
                        o.isCorrect && styles.correctOption
                      ]}
                      onPress={() => handleAnswer(o)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.optTxt}>{o.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Modal>
            
            <Modal visible={gamePaused} transparent animationType="fade">
              <View style={styles.pauseOverlay}>
                <View style={styles.pauseCard}>
                  <Text style={styles.pauseTitle}>اللعبة متوقفة</Text>
                  <TouchableOpacity 
                    style={styles.resumeBtn}
                    onPress={() => setGamePaused(false)}
                  >
                    <Text style={styles.resumeBtnText}>استئناف اللعب</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.menuBtn}
                    onPress={() => {
                      setGamePaused(false);
                      setGameState('home');
                    }}
                  >
                    <Text style={styles.menuBtnText}>الخروج للقائمة</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        )
      ) : (
        <View style={styles.menu}>
          <Image source={heroImage} style={styles.menuImg} />
          <Text style={styles.menuTitle}>المستوى 3</Text>
          <Text style={styles.welcomeName}>أَهْلًا {userName} 👋</Text>
          <Text style={styles.menuSubtitle}>مغامرة تعليمية جديدة!</Text>
          
          <TouchableOpacity 
            style={styles.mainBtn} 
            onPress={initGame}
            activeOpacity={0.8}
          >
            <Text style={styles.mainBtnTxt}>اِبْدَأِ الْمُغَامَرَةَ 🚀</Text>
          </TouchableOpacity>
          
          <View style={styles.menuOptions}>
            <TouchableOpacity 
              style={styles.menuOptionBtn}
              onPress={toggleSound}
            >
              <Ionicons 
                name={soundEnabled ? "volume-high" : "volume-mute"} 
                size={24} 
                color="white" 
              />
              <Text style={styles.menuOptionText}>
                {soundEnabled ? 'الصوت مفعل' : 'الصوت معطل'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuOptionBtn}
              onPress={toggleHaptics}
            >
              <Ionicons 
                name={hapticsEnabled ? "phone-portrait" : "phone-portrait-outline"} 
                size={24} 
                color="white" 
              />
              <Text style={styles.menuOptionText}>
                {hapticsEnabled ? 'التأثيرات مفعلة' : 'التأثيرات معطلة'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.mainBtn, {backgroundColor: '#7F8C8D', marginTop: 15}]} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.mainBtnTxt}>↩ رجوع</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D1E8E2' },
  gameArea: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  pauseBtn: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 20,
    elevation: 5,
  },
  settingsBtn: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 20,
    elevation: 5,
  },
  hud: {
    position: 'absolute',
    top: 100,
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 15,
    borderRadius: 25,
    elevation: 5,
  },
  hudItem: {
    alignItems: 'center',
  },
  hudText: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50' },
  comboText: {
    fontSize: 14,
    color: '#FF9F43',
    fontWeight: 'bold',
    marginTop: 2,
  },
  gameProgress: {
    position: 'absolute',
    top: 170,
    width: '90%',
    alignSelf: 'center',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 4,
    zIndex: 10,
    overflow: 'hidden',
  },
  gameProgressFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 4,
  },
  platform: {
    position: 'absolute',
    height: 18,
    backgroundColor: '#2C3E50',
    borderRadius: 8,
    borderTopWidth: 5,
    borderTopColor: '#F1C40F',
  },
  bouncyPlatform: {
    backgroundColor: '#27AE60',
    borderTopColor: '#2ECC71',
  },
  item: { position: 'absolute', fontSize: 32 },
  rareGem: {
    fontSize: 36,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  obstacle: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
  },
  hero: { position: 'absolute', width: HERO_WIDTH, height: HERO_HEIGHT },
  heroImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  controls: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  joyBase: {
    width: 120,
    height: 60,
    backgroundColor: 'rgba(52, 73, 94, 0.2)',
    borderRadius: 30,
    justifyContent: 'center',
    padding: 5,
    borderWidth: 2,
    borderColor: '#34495E',
  },
  joyKnob: {
    width: 50,
    height: 50,
    backgroundColor: '#2C3E50',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#F1C40F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 25,
    elevation: 10,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  questionIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  qText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 32,
    color: '#34495E',
  },
  optBtn: {
    backgroundColor: '#F1F2F6',
    padding: 18,
    borderRadius: 15,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  correctOption: {
    borderColor: '#2ECC71',
  },
  optTxt: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    color: '#2C3E50',
  },
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseCard: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
  },
  pauseTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 30,
  },
  resumeBtn: {
    backgroundColor: '#2ECC71',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  resumeBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuBtn: {
    backgroundColor: '#E74C3C',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  menuBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menu: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16A085',
  },
  menuImg: {
    width: 150,
    height: 180,
    marginBottom: 15,
    borderRadius: 20,
    borderWidth: 5,
    borderColor: 'white',
  },
  menuTitle: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginBottom: 5,
  },
  welcomeName: {
    fontSize: 28,
    color: '#F1C40F',
    marginBottom: 10,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  menuSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 30,
  },
  mainBtn: {
    backgroundColor: '#E67E22',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 35,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  mainBtnTxt: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  menuOptions: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 30,
  },
  menuOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  menuOptionText: {
    color: 'white',
    fontSize: 14,
    marginRight: 8,
  },
  winContainer: {
    flex: 1,
    backgroundColor: '#2C3E50',
  },
  winContent: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  winEmoji: {
    fontSize: 100,
    marginTop: 20,
    marginBottom: 10,
  },
  winTitle: {
    fontSize: 34,
    color: 'white',
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 25,
  },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 100,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 16,
    color: '#BDC3C7',
    fontWeight: '600',
  },
  progressContainer: {
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
  },
  progressLabel: {
    color: '#F1C40F',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 5,
  },
  progressText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  skillsSection: {
    width: '90%',
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#F1C40F',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 15,
    marginVertical: 8,
  },
  skillIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  skillTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  skillTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  skillItem: {
    color: '#BDC3C7',
    fontSize: 14,
    textAlign: 'right',
  },
  winActionArea: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 20,
  },
  actionBtn: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
});

export default YoyaGameV3;
