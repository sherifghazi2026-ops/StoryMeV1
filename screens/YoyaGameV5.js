import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ImageBackground,
  Dimensions, Animated, Modal, ScrollView, Alert, Easing, ActivityIndicator,
  Vibration
} from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const YoyaGameLottie = ({ navigation }) => {
  // الحالات الرئيسية
  const [gameState, setGameState] = useState('home');
  const [loading, setLoading] = useState(true);
  const [heroName, setHeroName] = useState('البطل الصغير');
  const [score, setScore] = useState(0);
  const [currentRoom, setCurrentRoom] = useState(0);
  const [playerPosition, setPlayerPosition] = useState({ x: width * 0.5, y: height * 0.7 });
  const [playerDirection, setPlayerDirection] = useState('down');
  const [showQuestion, setShowQuestion] = useState(false);
  const [roomsCompleted, setRoomsCompleted] = useState([]);
  const [lives, setLives] = useState(3);
  const [isWalking, setIsWalking] = useState(false);
  
  // التأثيرات
  const walkAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const playerScale = useRef(new Animated.Value(1)).current;
  
  // مؤقتات
  const walkTimeoutRef = useRef(null);
  const animationRef = useRef(null);

  // ألوان الخلفيات (بدون صور)
  const roomColors = {
    kitchen: '#FFCCBC', // برتقالي فاتح
    living: '#C8E6C9',  // أخضر فاتح
    garden: '#DCEDC8',  // أخضر ناعم
    bedroom: '#F8BBD0', // وردي فاتح
    background: '#2196F3', // أزرق
    victory: '#4CAF50' // أخضر
  };

  // الغرف البسيطة
  const rooms = [
    {
      id: 0,
      name: 'المطبخ',
      color: roomColors.kitchen,
      description: 'مطبخ المنزل - انتبه للخطر!',
      objects: [
        { id: 1, type: 'طاولة', x: width * 0.3, y: height * 0.5, icon: '🪑' },
        { id: 2, type: 'ثلاجة', x: width * 0.7, y: height * 0.4, icon: '🧊' },
      ],
      problem: {
        position: { x: width * 0.6, y: height * 0.5 },
        icon: '🥛💔',
        title: 'كوب مكسور',
        question: 'وجدت كوباً مكسوراً على الأرض. ماذا أفعل؟',
        options: [
          {
            id: 0,
            text: 'أحاول جمعه بيدي',
            icon: '✋',
            isCorrect: false,
            message: 'خطأ! الزجاج المكسور قد يؤذيك.'
          },
          {
            id: 1,
            text: 'أطلب مساعدة ماما',
            icon: '👩',
            isCorrect: true,
            message: 'أحسنت! يجب أن تستعين بكبار.'
          },
          {
            id: 2,
            text: 'أستخدم المكنسة',
            icon: '🧹',
            isCorrect: true,
            message: 'جيد! ولكن بحذر واستعانة بكبار.'
          },
          {
            id: 3,
            text: 'أتركه وأهرب',
            icon: '🏃‍♂️',
            isCorrect: false,
            message: 'قد يؤذي الآخرين! كن مسؤولاً.'
          }
        ],
        solution: 'استعن بماما أو بابا لتنظيف الزجاج المكسور.'
      }
    },
    {
      id: 1,
      name: 'غرفة المعيشة',
      color: roomColors.living,
      description: 'مكان للراحة والعائلة',
      objects: [
        { id: 1, type: 'كنبة', x: width * 0.7, y: height * 0.3, icon: '🛋️' },
        { id: 2, type: 'تلفاز', x: width * 0.2, y: height * 0.3, icon: '📺' },
      ],
      problem: {
        position: { x: width * 0.4, y: height * 0.45 },
        icon: '👵',
        title: 'مساعدة الجدة',
        question: 'الجدة تحمل أشياء ثقيلة. كيف أساعدها؟',
        options: [
          {
            id: 0,
            text: 'أحملها بقوة',
            icon: '💪',
            isCorrect: false,
            message: 'قد تؤذي نفسك! استخدم عقلك.'
          },
          {
            id: 1,
            text: 'أساعدها بحمل جزء خفيف',
            icon: '🤝',
            isCorrect: true,
            message: 'ممتاز! ساعدها بما تستطيع.'
          },
        ],
        solution: 'ساعد الجدة بحمل جزء خفيف واطلب من الآخرين المساعدة.'
      }
    },
    {
      id: 2,
      name: 'الحديقة',
      color: roomColors.garden,
      description: 'مكان اللعب والطبيعة',
      objects: [
        { id: 1, type: 'شجرة', x: width * 0.2, y: height * 0.3, icon: '🌳' },
        { id: 2, type: 'زهور', x: width * 0.8, y: height * 0.4, icon: '🌸' },
      ],
      problem: {
        position: { x: width * 0.5, y: height * 0.35 },
        icon: '🐦❤️‍🩹',
        title: 'طائر مصاب',
        question: 'وجدت طائراً صغيراً مصاباً. ماذا أفعل؟',
        options: [
          {
            id: 0,
            text: 'أحمله إلى البيت',
            icon: '🏠',
            isCorrect: false,
            message: 'قد تؤذيه أكثر! اتركه لمختص.'
          },
          {
            id: 1,
            text: 'أخبر والدي',
            icon: '👨',
            isCorrect: true,
            message: 'أحسنت! الكبار يعرفون ماذا يفعلون.'
          },
        ],
        solution: 'أخبر شخصاً كبيراً أو اتصل بجمعية رعاية الحيوانات.'
      }
    },
    {
      id: 3,
      name: 'غرفة النوم',
      color: roomColors.bedroom,
      description: 'مكان النوم والراحة',
      objects: [
        { id: 1, type: 'سرير', x: width * 0.3, y: height * 0.4, icon: '🛏️' },
        { id: 2, type: 'خزانة', x: width * 0.8, y: height * 0.3, icon: '🚪' },
      ],
      problem: {
        position: { x: width * 0.65, y: height * 0.5 },
        icon: '🧸💔',
        title: 'دمية مكسورة',
        question: 'دميتك المفضلة انكسرت. كيف تتصرف؟',
        options: [
          {
            id: 0,
            text: 'أرميها',
            icon: '🗑️',
            isCorrect: false,
            message: 'إصلاح الأشياء أفضل من رميها.'
          },
          {
            id: 1,
            text: 'أصلحها مع والدي',
            icon: '🔧',
            isCorrect: true,
            message: 'ممتاز! التعلم مع الكبار جميل.'
          },
        ],
        solution: 'حاول إصلاح الدمية مع والديك باستخدام أدوات مناسبة.'
      }
    }
  ];

  // التهيئة
  useEffect(() => {
    const init = async () => {
      try {
        const profile = await AsyncStorage.getItem('userProfile');
        if (profile) {
          const data = JSON.parse(profile);
          setHeroName(data.name || 'البطل الصغير');
        }
        
        // أنيميشنات
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
        
      } catch (error) {
        console.log('خطأ في التهيئة:', error);
      } finally {
        setTimeout(() => setLoading(false), 1000);
      }
    };
    init();
  }, []);

  // حركة اللاعب
  const movePlayer = (direction) => {
    // إلغاء المؤقت السابق
    if (walkTimeoutRef.current) {
      clearTimeout(walkTimeoutRef.current);
    }
    
    Vibration.vibrate(10);
    setPlayerDirection(direction);
    setIsWalking(true);
    
    let newX = playerPosition.x;
    let newY = playerPosition.y;
    const step = 40;
    
    switch (direction) {
      case 'up':
        newY = Math.max(100, playerPosition.y - step);
        break;
      case 'down':
        newY = Math.min(height - 150, playerPosition.y + step);
        break;
      case 'left':
        newX = Math.max(60, playerPosition.x - step);
        break;
      case 'right':
        newX = Math.min(width - 60, playerPosition.x + step);
        break;
    }
    
    setPlayerPosition({ x: newX, y: newY });
    checkCollision(newX, newY);
    
    // أنيميشن المشي
    Animated.parallel([
      Animated.sequence([
        Animated.timing(walkAnim, {
          toValue: -10,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(walkAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]),
      Animated.sequence([
        Animated.timing(playerScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(playerScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ])
    ]).start();
    
    // إيقاف المشي بعد فترة
    walkTimeoutRef.current = setTimeout(() => {
      setIsWalking(false);
    }, 400);
  };

  // التحقق من الاصطدام
  const checkCollision = (x, y) => {
    const room = rooms[currentRoom];
    const target = room.problem.position;
    const distance = Math.sqrt(Math.pow(x - target.x, 2) + Math.pow(y - target.y, 2));
    
    if (distance < 100 && !roomsCompleted.includes(currentRoom) && !showQuestion) {
      setShowQuestion(true);
      
      // تأثير اهتزاز
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // التعامل مع الإجابة
  const handleAnswer = async (option) => {
    if (option.isCorrect) {
      setScore(prev => prev + 50);
      setRoomsCompleted([...roomsCompleted, currentRoom]);
      
      Alert.alert(
        '🎉 أحسنت!',
        `${option.message}\n\nلقد ربحت 50 نقطة!`,
        [
          {
            text: 'متابعة',
            onPress: () => {
              setShowQuestion(false);
              if (currentRoom < rooms.length - 1) {
                setTimeout(() => {
                  setCurrentRoom(prev => prev + 1);
                  setPlayerPosition({ x: width * 0.5, y: height * 0.7 });
                }, 500);
              } else {
                finishGame();
              }
            }
          }
        ]
      );
    } else {
      setLives(prev => prev - 1);
      Alert.alert(
        '😔 حاول مرة أخرى',
        `${option.message}\n\nتبقى لديك ${lives - 1} حياة`,
        [
          {
            text: 'حاول مجدداً',
            onPress: () => {
              if (lives <= 1) {
                gameOver();
              } else {
                setShowQuestion(false);
              }
            }
          }
        ]
      );
    }
  };

  // انتهاء اللعبة
  const finishGame = async () => {
    try {
      const currentGems = await AsyncStorage.getItem('total_gems');
      const earnedGems = Math.floor(score / 25);
      const newTotal = (parseInt(currentGems || '0') + earnedGems).toString();
      await AsyncStorage.setItem('total_gems', newTotal);
    } catch (error) {
      console.log('خطأ في حفظ النقاط:', error);
    }
    
    setGameState('score');
  };

  // خسارة اللعبة
  const gameOver = () => {
    Alert.alert(
      '💔 انتهت اللعبة',
      'لقد نفذت جميع القلوب! حاول مرة أخرى.',
      [
        {
          text: 'إعادة المحاولة',
          onPress: () => {
            setLives(3);
            setScore(0);
            setRoomsCompleted([]);
            setCurrentRoom(0);
            setPlayerPosition({ x: width * 0.5, y: height * 0.7 });
          }
        },
        {
          text: 'الخروج',
          onPress: () => navigation.navigate('GamesList')
        }
      ]
    );
  };

  // بدء اللعبة
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setCurrentRoom(0);
    setRoomsCompleted([]);
    setPlayerPosition({ x: width * 0.5, y: height * 0.7 });
  };

  // شاشة التحميل
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../assets/lottie/loading.json')}
          autoPlay
          loop
          style={styles.lottieLoading}
        />
        <Text style={styles.loadingText}>جاري تحميل المغامرة...</Text>
      </View>
    );
  }

  // شاشة البداية
  if (gameState === 'home') {
    return (
      <View style={[styles.container, { backgroundColor: roomColors.background }]}>
        <LottieView
          source={require('../assets/lottie/home.json')}
          autoPlay
          loop
          style={styles.lottieBackground}
        />
        
        <View style={styles.overlay}>
          <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
            <LottieView
              source={require('../assets/lottie/hero.json')}
              autoPlay
              loop
              style={styles.heroLottie}
            />
            
            <Text style={styles.title}>مغامرات البطل الحقيقي</Text>
            <Text style={styles.subtitle}>تعلم حل المشاكل بطريقة آمنة</Text>
            
            <View style={styles.characterPreview}>
              <Text style={styles.characterIcon}>👑</Text>
              <Text style={styles.characterName}>{heroName}</Text>
            </View>
            
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <LottieView
                source={require('../assets/lottie/start.json')}
                autoPlay
                loop
                style={styles.startLottie}
              />
              <Text style={styles.buttonText}> ابدأ المغامرة</Text>
            </TouchableOpacity>
            
            <View style={styles.features}>
              <View style={styles.featureItem}>
                <Ionicons name="walk" size={24} color="#2ECC71" />
                <Text style={styles.featureText}>تحكم في الشخصية</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="home" size={24} color="#3498DB" />
                <Text style={styles.featureText}>غرف مختلفة</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="bulb" size={24} color="#F1C40F" />
                <Text style={styles.featureText}>حلول واقعية</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    );
  }

  // شاشة اللعب
  if (gameState === 'playing') {
    const room = rooms[currentRoom];
    
    return (
      <View style={[styles.container, { backgroundColor: room.color }]}>
        {/* شريط المعلومات */}
        <View style={styles.gameHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('GamesList')}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.roomInfo}>
            <Text style={styles.roomName}>{room.name}</Text>
            <Text style={styles.roomDescription}>{room.description}</Text>
          </View>
          
          <View style={styles.gameStats}>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={20} color="#E74C3C" />
              <Text style={styles.statText}> {lives}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color="#F1C40F" />
              <Text style={styles.statText}> {score}</Text>
            </View>
          </View>
        </View>
        
        {/* الأشياء في الغرفة */}
        {room.objects.map((obj) => (
          <View
            key={obj.id}
            style={[
              styles.roomObject,
              { left: obj.x - 25, top: obj.y - 25 }
            ]}
          >
            <Text style={styles.objectIcon}>{obj.icon}</Text>
          </View>
        ))}
        
        {/* المشكلة */}
        {!roomsCompleted.includes(currentRoom) && (
          <Animated.View
            style={[
              styles.problemSpot,
              { 
                left: room.problem.position.x - 40,
                top: room.problem.position.y - 40,
                transform: [{ translateX: shakeAnim }]
              }
            ]}
          >
            <LottieView
              source={require('../assets/lottie/problem.json')}
              autoPlay
              loop
              style={styles.problemLottie}
            />
            <Text style={styles.problemIcon}>{room.problem.icon}</Text>
          </Animated.View>
        )}
        
        {/* اللاعب */}
        <Animated.View
          style={[
            styles.playerContainer,
            {
              left: playerPosition.x - 50,
              top: playerPosition.y - 80,
              transform: [
                { translateY: walkAnim },
                { scale: playerScale }
              ]
            }
          ]}
        >
          <LottieView
            ref={animationRef}
            source={require('../assets/lottie/walking.json')}
            autoPlay={isWalking}
            loop={isWalking}
            style={[
              styles.playerLottie,
              playerDirection === 'left' && { transform: [{ scaleX: -1 }] }
            ]}
            speed={1.5}
          />
          <Text style={styles.playerName}>{heroName}</Text>
        </Animated.View>
        
        {/* أزرار التحكم */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlRow}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => movePlayer('up')}
              onPressIn={() => setIsWalking(true)}
              onPressOut={() => setIsWalking(false)}
            >
              <Ionicons name="arrow-up" size={30} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.controlRow}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => movePlayer('left')}
              onPressIn={() => setIsWalking(true)}
              onPressOut={() => setIsWalking(false)}
            >
              <Ionicons name="arrow-back" size={30} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => movePlayer('down')}
              onPressIn={() => setIsWalking(true)}
              onPressOut={() => setIsWalking(false)}
            >
              <Ionicons name="arrow-down" size={30} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => movePlayer('right')}
              onPressIn={() => setIsWalking(true)}
              onPressOut={() => setIsWalking(false)}
            >
              <Ionicons name="arrow-forward" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* تلميح */}
        <View style={styles.hintBox}>
          <LottieView
            source={require('../assets/lottie/hint.json')}
            autoPlay
            loop
            style={styles.hintLottie}
          />
          <Text style={styles.hintText}> تحرك نحو العلامة للحل المشكلة</Text>
        </View>
        
        {/* نافذة السؤال */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showQuestion}
          onRequestClose={() => setShowQuestion(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View 
              style={[
                styles.questionModal,
                { transform: [{ scale: bounceAnim }] }
              ]}
            >
              <LottieView
                source={require('../assets/lottie/question.json')}
                autoPlay
                loop
                style={styles.questionLottie}
              />
              
              <View style={styles.questionHeader}>
                <Text style={styles.questionTitle}>{room.problem.title}</Text>
                <Text style={styles.questionIcon}>{room.problem.icon}</Text>
              </View>
              
              <Text style={styles.questionText}>{room.problem.question}</Text>
              
              <ScrollView style={styles.optionsContainer}>
                {room.problem.options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionButton,
                      option.isCorrect ? styles.correctOption : styles.wrongOption
                    ]}
                    onPress={() => handleAnswer(option)}
                  >
                    <LottieView
                      source={option.isCorrect ? 
                        require('../assets/lottie/correct.json') : 
                        require('../assets/lottie/wrong.json')}
                      autoPlay
                      loop={false}
                      style={styles.optionLottie}
                    />
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <Text style={styles.optionText}>{option.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <View style={styles.solutionBox}>
                <Ionicons name="bulb" size={20} color="#F1C40F" />
                <Text style={styles.solutionText}> الحل: {room.problem.solution}</Text>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </View>
    );
  }

  // شاشة النتائج
  return (
    <View style={[styles.container, { backgroundColor: roomColors.victory }]}>
      <LottieView
        source={require('../assets/lottie/victory.json')}
        autoPlay
        loop
        style={styles.victoryLottie}
      />
      
      <ScrollView style={styles.scoreContainer}>
        <View style={styles.scoreHeader}>
          <LottieView
            source={require('../assets/lottie/trophy.json')}
            autoPlay
            loop
            style={styles.trophyLottie}
          />
          <Text style={styles.scoreTitle}>مبروك يا {heroName}!</Text>
          <Text style={styles.scoreSubtitle}>لقد أكملت جميع المهام</Text>
        </View>
        
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>النقاط النهائية</Text>
          <Text style={styles.finalScore}>{score}</Text>
          
          <LottieView
            source={require('../assets/lottie/stars.json')}
            autoPlay
            loop
            style={styles.starsLottie}
          />
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="checkmark-circle" size={30} color="#2ECC71" />
              <Text style={styles.statBoxText}>المهام المكتملة</Text>
              <Text style={styles.statBoxValue}>{roomsCompleted.length}/{rooms.length}</Text>
            </View>
            
            <View style={styles.statBox}>
              <Ionicons name="heart" size={30} color="#E74C3C" />
              <Text style={styles.statBoxText}>القلوب المتبقية</Text>
              <Text style={styles.statBoxValue}>{lives}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={startGame}
          >
            <LottieView
              source={require('../assets/lottie/restart.json')}
              autoPlay
              loop
              style={styles.restartLottie}
            />
            <Text style={styles.actionButtonText}>العب مرة أخرى</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.shareButton]}
            onPress={() => {
              Alert.alert(
                'شارك إنجازك',
                `حصلت على ${score} نقطة في لعبة البطل الحقيقي!`
              );
            }}
          >
            <Ionicons name="share-social" size={24} color="white" />
            <Text style={styles.actionButtonText}> شارك النتيجة</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.backToMenuButton}
          onPress={() => navigation.navigate('GamesList')}
        >
          <Text style={styles.backToMenuText}>العودة للقائمة الرئيسية</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // الأنماط العامة
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  lottieLoading: {
    width: 200,
    height: 200,
  },
  loadingText: {
    fontSize: 20,
    color: '#2C3E50',
    marginTop: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lottieBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  // شاشة البداية
  heroLottie: {
    width: 150,
    height: 150,
    alignSelf: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#DDD',
    textAlign: 'center',
    marginBottom: 30,
  },
  characterPreview: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
    width: '80%',
  },
  characterIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  characterName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#2ECC71',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 25,
    elevation: 5,
    alignItems: 'center',
  },
  startLottie: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginBottom: 25,
  },
  featureItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 15,
    borderRadius: 15,
    minWidth: 100,
  },
  featureText: {
    fontSize: 12,
    color: '#2C3E50',
    marginTop: 5,
    textAlign: 'center',
  },
  
  // شاشة اللعب
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 40,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomInfo: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 15,
  },
  roomName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  roomDescription: {
    color: '#DDD',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  gameStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  statText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  roomObject: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  objectIcon: {
    fontSize: 35,
  },
  problemSpot: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  problemLottie: {
    width: 80,
    height: 80,
    position: 'absolute',
  },
  problemIcon: {
    fontSize: 40,
    zIndex: 1,
  },
  playerContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  playerLottie: {
    width: 100,
    height: 100,
  },
  playerName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 25,
    padding: 15,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.8)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    elevation: 5,
  },
  hintBox: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  hintLottie: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  hintText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  
  // نافذة السؤال
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  questionModal: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 25,
    width: '90%',
    maxHeight: '80%',
  },
  questionLottie: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginTop: -60,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -20,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  questionIcon: {
    fontSize: 40,
  },
  questionText: {
    fontSize: 18,
    color: '#34495E',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 28,
  },
  optionsContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  optionLottie: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
  },
  correctOption: {
    borderColor: '#2ECC71',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  wrongOption: {
    borderColor: '#E74C3C',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  solutionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 196, 15, 0.1)',
    padding: 15,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#F1C40F',
  },
  solutionText: {
    fontSize: 14,
    color: '#7D6608',
    flex: 1,
    marginLeft: 10,
  },
  
  // شاشة النتائج
  victoryLottie: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  scoreContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scoreHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  trophyLottie: {
    width: 150,
    height: 150,
  },
  scoreTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    textAlign: 'center',
  },
  scoreSubtitle: {
    fontSize: 18,
    color: '#DDD',
    textAlign: 'center',
    marginTop: 10,
  },
  scoreCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    padding: 30,
    marginHorizontal: 20,
    marginBottom: 25,
    alignItems: 'center',
    elevation: 8,
  },
  scoreLabel: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 10,
  },
  finalScore: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  starsLottie: {
    width: 200,
    height: 60,
    marginBottom: 25,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statBoxText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 5,
    textAlign: 'center',
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 16,
    paddingHorizontal: 25,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartLottie: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  shareButton: {
    backgroundColor: '#2ECC71',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToMenuButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 15,
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 30,
  },
  backToMenuText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default YoyaGameLottie;
