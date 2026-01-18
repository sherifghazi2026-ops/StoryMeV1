import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ImageBackground,
  StatusBar,
  Animated,
  Easing,
  Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

const AdventureGame = ({ navigation }) => {
  const [player, setPlayer] = useState({
    level: 1,
    xp: 0,
    health: 100,
    maxHealth: 100,
    coins: 0,
    gems: 0,
    attack: 10,
    defense: 5,
    speed: 1,
  });
  
  const [currentMission, setCurrentMission] = useState({
    id: 1,
    title: 'جمع 3 عملات ذهبية',
    target: 3,
    current: 0,
    reward: { coins: 50, xp: 100 },
    type: 'collect_coins',
  });
  
  const [inventory, setInventory] = useState({
    weapons: ['سيف خشبي'],
    potions: 3,
    keys: 1,
    maps: 0,
  });
  
  const [gameState, setGameState] = useState({
    isInBattle: false,
    enemy: null,
    isExploring: false,
    currentLocation: 'القرية',
    day: 1,
    timeLeft: 300, // 5 دقائق
  });
  
  const [achievements, setAchievements] = useState([
    { id: 1, name: 'المبتدئ', description: 'اكمل مهمتك الأولى', achieved: false },
    { id: 2, name: 'الصياد', description: 'هزم 5 أعداء', achieved: false },
    { id: 3, name: 'الجامع', description: 'اجمع 100 عملة', achieved: false },
    { id: 4, name: 'البطل', description: 'صل للمستوى 10', achieved: false },
  ]);
  
  const [events, setEvents] = useState([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // تحميل البيانات
  useEffect(() => {
    loadGameData();
    startGameTimer();
    
    // مؤثرات صوتية
    playBackgroundMusic();
    
    return () => {
      stopBackgroundMusic();
    };
  }, []);

  // مؤقت اللعبة
  const startGameTimer = () => {
    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft > 0) {
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        } else {
          Alert.alert('انتهى الوقت!', 'لقد انتهت جولتك لهذا اليوم!');
          clearInterval(timer);
          return prev;
        }
      });
    }, 1000);
    
    return () => clearInterval(timer);
  };

  const loadGameData = async () => {
    try {
      const savedPlayer = await AsyncStorage.getItem('adventure_player');
      const savedMission = await AsyncStorage.getItem('adventure_mission');
      const savedInventory = await AsyncStorage.getItem('adventure_inventory');
      
      if (savedPlayer) setPlayer(JSON.parse(savedPlayer));
      if (savedMission) setCurrentMission(JSON.parse(savedMission));
      if (savedInventory) setInventory(JSON.parse(savedInventory));
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  };

  const saveGameData = async () => {
    try {
      await AsyncStorage.setItem('adventure_player', JSON.stringify(player));
      await AsyncStorage.setItem('adventure_mission', JSON.stringify(currentMission));
      await AsyncStorage.setItem('adventure_inventory', JSON.stringify(inventory));
      addEvent('تم حفظ اللعبة! 💾');
    } catch (error) {
      console.error('Error saving game data:', error);
    }
  };

  // المؤثرات الصوتية
  const playSound = async (type) => {
    try {
      const soundObject = new Audio.Sound();
      
      if (type === 'collect') {
        await soundObject.loadAsync(require('../assets/sounds/collect.mp3'));
      } else if (type === 'battle') {
        await soundObject.loadAsync(require('../assets/sounds/battle.mp3'));
      }
      
      await soundObject.playAsync();
      
      setTimeout(() => {
        soundObject.unloadAsync();
      }, 1000);
    } catch (error) {
      console.log('Sound error:', error);
    }
  };

  const playBackgroundMusic = async () => {
    // يمكنك إضافة موسيقى خلفية هنا
  };

  const stopBackgroundMusic = async () => {
    // إيقاف الموسيقى
  };

  // إضافة حدث جديد
  const addEvent = (text) => {
    const newEvent = {
      id: Date.now(),
      text,
      timestamp: new Date().toLocaleTimeString('ar-SA'),
    };
    
    setEvents(prev => [newEvent, ...prev.slice(0, 4)]); // حفظ آخر 5 أحداث فقط
  };

  // تأثير الرجفة
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        easing: Easing.linear,
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
  };

  // تأثير النبض
  const pulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // جمع العملات
  const collectCoins = () => {
    const coinsCollected = Math.floor(Math.random() * 5) + 1;
    const newCoins = player.coins + coinsCollected;
    const newXp = player.xp + 10;
    
    // تحديث المهمة
    const missionProgress = currentMission.current + 1;
    
    setPlayer(prev => ({
      ...prev,
      coins: newCoins,
      xp: newXp,
    }));
    
    setCurrentMission(prev => ({
      ...prev,
      current: missionProgress,
    }));
    
    // مؤثرات
    pulse();
    Vibration.vibrate(50);
    playSound('collect');
    addEvent(`📀 جمعت ${coinsCollected} عملة!`);
    
    // فحص إنجاز المهمة
    if (missionProgress >= currentMission.target) {
      completeMission();
    }
    
    // فحص الإنجازات
    checkAchievements();
    
    // زيادة المستوى
    if (newXp >= player.level * 100) {
      levelUp();
    }
  };

  // هزيمة الأعداء
  const battleEnemy = () => {
    const enemyTypes = [
      { name: 'غول الغابة', health: 30, attack: 5, reward: 20 },
      { name: 'تنين صغير', health: 50, attack: 8, reward: 40 },
      { name: 'ساحر شرير', health: 70, attack: 12, reward: 60 },
    ];
    
    const enemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    Alert.alert(
      '👾 معركة!',
      `واجهت ${enemy.name}!\nصحة العدو: ${enemy.health}\nهجومك: ${player.attack}`,
      [
        { text: 'الهرب', style: 'cancel' },
        { 
          text: 'الهجوم! ⚔️', 
          onPress: () => {
            // معركة
            const playerDamage = player.attack;
            const enemyDamage = enemy.attack - player.defense;
            
            const newHealth = Math.max(0, player.health - enemyDamage);
            const enemyHealth = Math.max(0, enemy.health - playerDamage);
            
            if (enemyHealth <= 0) {
              // فوز
              const reward = enemy.reward;
              setPlayer(prev => ({
                ...prev,
                coins: prev.coins + reward,
                xp: prev.xp + 50,
              }));
              
              setGameState(prev => ({ ...prev, isInBattle: false }));
              
              shake();
              playSound('battle');
              addEvent(`🎉 هزمت ${enemy.name}!
   ${reward}💰 | +50 XP`);
              
              // تحديث مهمة الأعداء
              updateEnemyMission();
              
            } else if (newHealth <= 0) {
              // خسارة
              Alert.alert('💀 هُزمت!', 'تمت هزيمتك في المعركة. استخدم جرعة صحية.');
              setPlayer(prev => ({ ...prev, health: 50 }));
              setGameState(prev => ({ ...prev, isInBattle: false }));
            } else {
              // استمرار المعركة
              setPlayer(prev => ({ ...prev, health: newHealth }));
              battleEnemy(); // جولة أخرى
            }
          }
        }
      ]
    );
    
    setGameState(prev => ({ ...prev, isInBattle: true, enemy }));
  };

  // استخدام جرعة صحية
  const usePotion = () => {
    if (inventory.potions > 0) {
      const newHealth = Math.min(player.maxHealth, player.health + 30);
      setPlayer(prev => ({ ...prev, health: newHealth }));
      setInventory(prev => ({ ...prev, potions: prev.potions - 1 }));
      pulse();
      addEvent('🧪 استخدمت جرعة صحية! +30 ❤️');
    } else {
      Alert.alert('⚠️ لا يوجد جرعات', 'اذهب إلى المتجر لشراء المزيد');
    }
  };

  // إكمال المهمة
  const completeMission = () => {
    const reward = currentMission.reward;
    
    Alert.alert(
      '🎊 مهمة مكتملة!',
      `أكملت: "${currentMission.title}"\nالمكافأة:\n💰 ${reward.coins} عملة\n⭐ ${reward.xp} خبرة`,
      [
        {
          text: 'مهمة جديدة',
          onPress: () => generateNewMission()
        }
      ]
    );
    
    // منح المكافأة
    setPlayer(prev => ({
      ...prev,
      coins: prev.coins + reward.coins,
      xp: prev.xp + reward.xp,
    }));
    
    // تحديث الإنجاز
    if (!achievements[0].achieved) {
      setAchievements(prev => 
        prev.map((ach, i) => 
          i === 0 ? { ...ach, achieved: true } : ach
        )
      );
      addEvent('🏆 فزت بإنجاز "المبتدئ"!');
    }
  };

  // توليد مهمة جديدة
  const generateNewMission = () => {
    const missionTypes = [
      {
        type: 'collect_coins',
        title: 'جمع 5 عملات ذهبية',
        target: 5,
        reward: { coins: 50, xp: 100 },
      },
      {
        type: 'defeat_enemies',
        title: 'هزم 3 أعداء',
        target: 3,
        reward: { coins: 80, xp: 150 },
      },
      {
        type: 'use_potions',
        title: 'استخدم 2 جرعة صحية',
        target: 2,
        reward: { coins: 40, xp: 80 },
      },
    ];
    
    const randomMission = missionTypes[Math.floor(Math.random() * missionTypes.length)];
    setCurrentMission({
      id: Date.now(),
      ...randomMission,
      current: 0,
    });
    
    addEvent(`📋 مهمة جديدة: ${randomMission.title}`);
  };

  // تحديث مهمة الأعداء
  const updateEnemyMission = () => {
    if (currentMission.type === 'defeat_enemies') {
      setCurrentMission(prev => ({
        ...prev,
        current: prev.current + 1,
      }));
      
      if (currentMission.current + 1 >= currentMission.target) {
        completeMission();
      }
    }
  };

  // زيادة المستوى
  const levelUp = () => {
    const newLevel = player.level + 1;
    Alert.alert(
      '🌟 تقدم مستوى!',
      `تهانينا! أنت الآن مستوى ${newLevel}!\n+20 هجوم\n+10 دفاع\n+50 صحة قصوى`
    );
    
    setPlayer(prev => ({
      ...prev,
      level: newLevel,
      xp: 0,
      maxHealth: prev.maxHealth + 50,
      health: prev.maxHealth + 50,
      attack: prev.attack + 20,
      defense: prev.defense + 10,
    }));
    
    addEvent(`🚀 تقدمت للمستوى ${newLevel}!`);
    
    // فحص إنجاز البطل
    if (newLevel >= 10 && !achievements[3].achieved) {
      setAchievements(prev => 
        prev.map((ach, i) => 
          i === 3 ? { ...ach, achieved: true } : ach
        )
      );
      addEvent('👑 فزت بإنجاز "البطل"!');
    }
  };

  // فحص الإنجازات
  const checkAchievements = () => {
    // إنجاز الجامع
    if (player.coins >= 100 && !achievements[2].achieved) {
      setAchievements(prev => 
        prev.map((ach, i) => 
          i === 2 ? { ...ach, achieved: true } : ach
        )
      );
      addEvent('💰 فزت بإنجاز "الجامع"!');
    }
  };

  // الذهاب للاستكشاف
  const goExploring = () => {
    const locations = ['الغابة العميقة', 'الجبل العالي', 'الكهف المظلم', 'الصحراء الحارة'];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    
    setGameState(prev => ({
      ...prev,
      isExploring: true,
      currentLocation: randomLocation,
    }));
    
    addEvent(`🗺️ ذهبت للاستكشاف في ${randomLocation}`);
    
    // عرض خيارات الاستكشاف
    setTimeout(() => {
      const actions = ['جمع العملات', 'مواجهة العدو', 'العودة'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      if (action === 'جمع العملات') {
        Alert.alert('اكتشاف!', `عثرت على كنز في ${randomLocation}!`);
        collectCoins();
      } else if (action === 'مواجهة العدو') {
        battleEnemy();
      }
      
      setGameState(prev => ({ ...prev, isExploring: false }));
    }, 1500);
  };

  // المتجر
  const openShop = () => {
    Alert.alert(
      '🏪 متجر المغامر',
      'ماذا تريد أن تشتري؟',
      [
        { text: 'جرعة صحية 🧪 (30💰)', onPress: () => buyItem('potion', 30) },
        { text: 'سيف حديدي ⚔️ (100💰)', onPress: () => buyItem('weapon', 100) },
        { text: 'درع حديدي 🛡️ (80💰)', onPress: () => buyItem('armor', 80) },
        { text: 'إغلاق', style: 'cancel' },
      ]
    );
  };

  const buyItem = (item, cost) => {
    if (player.coins >= cost) {
      setPlayer(prev => ({ ...prev, coins: prev.coins - cost }));
      
      switch(item) {
        case 'potion':
          setInventory(prev => ({ ...prev, potions: prev.potions + 1 }));
          addEvent('🛒 اشتريت جرعة صحية');
          break;
        case 'weapon':
          setInventory(prev => ({ 
            ...prev, 
            weapons: [...prev.weapons, 'سيف حديدي'] 
          }));
          setPlayer(prev => ({ ...prev, attack: prev.attack + 10 }));
          addEvent('⚔️ اشتريت سيف حديدي! +10 هجوم');
          break;
        case 'armor':
          setPlayer(prev => ({ ...prev, defense: prev.defense + 8 }));
          addEvent('🛡️ اشتريت درع حديدي! +8 دفاع');
          break;
      }
      
      pulse();
    } else {
      Alert.alert('رصيد غير كافٍ', `تحتاج ${cost} عملة`);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('../assets/adventure-bg.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* شريط المعلومات العلوي */}
        <View style={styles.header}>
          <View style={styles.playerStats}>
            <Text style={styles.playerName}>المغامر البطل</Text>
            <View style={styles.statsRow}>
              <Text style={styles.levelText}>⭐ المستوى: {player.level}</Text>
              <Text style={styles.xpText}>XP: {player.xp}/{player.level * 100}</Text>
            </View>
          </View>
          
          <View style={styles.resources}>
            <Text style={styles.coinsText}>💰 {player.coins}</Text>
            <Text style={styles.gemsText}>💎 {player.gems}</Text>
          </View>
        </View>

        {/* شريط الصحة والوقت */}
        <View style={styles.topBar}>
          <Animated.View style={[styles.healthBar, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.healthFill, { width: `${(player.health / player.maxHealth) * 100}%` }]} />
            <Text style={styles.healthText}>❤️ {player.health}/{player.maxHealth}</Text>
          </Animated.View>
          
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>⏳ {formatTime(gameState.timeLeft)}</Text>
            <Text style={styles.locationText}>📍 {gameState.currentLocation}</Text>
          </View>
        </View>

        {/* المهمة الحالية */}
        <Animated.View 
          style={[
            styles.missionCard, 
            { transform: [{ translateX: shakeAnim }] }
          ]}
        >
          <Text style={styles.missionTitle}>🎯 المهمة الحالية</Text>
          <Text style={styles.missionText}>{currentMission.title}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(currentMission.current / currentMission.target) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentMission.current}/{currentMission.target}
          </Text>
        </Animated.View>

        {/* أزرار الإجراءات الرئيسية */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={collectCoins}>
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionText}>جمع العملات</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.battleButton]} onPress={battleEnemy}>
            <Text style={styles.actionIcon}>⚔️</Text>
            <Text style={styles.actionText}>مواجهة العدو</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.exploreButton]} onPress={goExploring}>
            <Text style={styles.actionIcon}>🗺️</Text>
            <Text style={styles.actionText}>الاستكشاف</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.shopButton]} onPress={openShop}>
            <Text style={styles.actionIcon}>🏪</Text>
            <Text style={styles.actionText}>المتجر</Text>
          </TouchableOpacity>
        </View>

        {/* المخزون */}
        <View style={styles.inventorySection}>
          <Text style={styles.sectionTitle}>🎒 المخزون</Text>
          <View style={styles.inventoryItems}>
            <View style={styles.inventoryItem}>
              <Text style={styles.itemIcon}>⚔️</Text>
              <Text style={styles.itemText}>{inventory.weapons.length} سلاح</Text>
            </View>
            <View style={styles.inventoryItem}>
              <Text style={styles.itemIcon}>🧪</Text>
              <Text style={styles.itemText}>{inventory.potions} جرعة</Text>
            </View>
            <TouchableOpacity style={styles.inventoryItem} onPress={usePotion}>
              <Text style={styles.itemIcon}>❤️</Text>
              <Text style={styles.itemText}>استخدم جرعة</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* الإنجازات */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>🏆 الإنجازات</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((ach) => (
              <View key={ach.id} style={[
                styles.achievementItem,
                ach.achieved && styles.achievedItem
              ]}>
                <Text style={styles.achievementIcon}>
                  {ach.achieved ? '✅' : '⭕'}
                </Text>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{ach.name}</Text>
                  <Text style={styles.achievementDesc}>{ach.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* الأحداث الأخيرة */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>📜 الأحداث الأخيرة</Text>
          {events.map((event) => (
            <View key={event.id} style={styles.eventItem}>
              <Text style={styles.eventTime}>{event.timestamp}</Text>
              <Text style={styles.eventText}>{event.text}</Text>
            </View>
          ))}
        </View>

        {/* شريط التنقل السفلي */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton} onPress={saveGameData}>
            <Text style={styles.footerButtonText}>💾 حفظ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.footerButton, styles.resetButton]}
            onPress={() => {
              Alert.alert(
                'إعادة تعيين',
                'هل تريد إعادة تعيين اللعبة؟',
                [
                  { text: 'إلغاء', style: 'cancel' },
                  { 
                    text: 'نعم', 
                    onPress: () => {
                      setPlayer({
                        level: 1,
                        xp: 0,
                        health: 100,
                        maxHealth: 100,
                        coins: 0,
                        gems: 0,
                        attack: 10,
                        defense: 5,
                        speed: 1,
                      });
                      generateNewMission();
                      addEvent('🔄 أعيد تعيين اللعبة!');
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.footerButtonText}>🔄 إعادة</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.footerButton, styles.backButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.footerButtonText}>🏠 قائمة</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(10, 25, 47, 0.9)',
    borderBottomWidth: 2,
    borderBottomColor: '#00d4aa',
  },
  playerStats: {
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  levelText: {
    color: '#ffd700',
    fontSize: 14,
    marginRight: 15,
  },
  xpText: {
    color: '#4ecdc4',
    fontSize: 14,
  },
  resources: {
    flexDirection: 'row',
  },
  coinsText: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  gemsText: {
    color: '#00d4aa',
    fontSize: 18,
    fontWeight: 'bold',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  healthBar: {
    flex: 1,
    height: 30,
    backgroundColor: '#333',
    borderRadius: 15,
    overflow: 'hidden',
    marginRight: 10,
  },
  healthFill: {
    height: '100%',
    backgroundColor: '#ff4757',
  },
  healthText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 30,
  },
  timeContainer: {
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationText: {
    color: '#00d4aa',
    fontSize: 12,
  },
  missionCard: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    margin: 15,
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00d4aa',
  },
  missionTitle: {
    color: '#00d4aa',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  missionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffd700',
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 10,
  },
  actionButton: {
    width: width * 0.4,
    height: 100,
    backgroundColor: 'rgba(255, 71, 87, 0.8)',
    margin: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  battleButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
  },
  exploreButton: {
    backgroundColor: 'rgba(78, 205, 196, 0.8)',
  },
  shopButton: {
    backgroundColor: 'rgba(155, 89, 182, 0.8)',
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 5,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inventorySection: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    margin: 10,
    padding: 15,
    borderRadius: 15,
  },
  sectionTitle: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  inventoryItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  inventoryItem: {
    alignItems: 'center',
    padding: 10,
  },
  itemIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  itemText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  achievementsSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    margin: 10,
    padding: 15,
    borderRadius: 15,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievedItem: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    borderColor: '#00d4aa',
    borderWidth: 1,
  },
  achievementIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  achievementDesc: {
    color: '#aaa',
    fontSize: 10,
  },
  eventsSection: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    margin: 10,
    padding: 15,
    borderRadius: 15,
    maxHeight: 120,
  },
  eventItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  eventTime: {
    color: '#00d4aa',
    fontSize: 10,
    width: 50,
  },
  eventText: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 2,
    borderTopColor: '#00d4aa',
  },
  footerButton: {
    backgroundColor: '#1a5fb4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#c64600',
  },
  backButton: {
    backgroundColor: '#5e5c64',
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AdventureGame;
