import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  StatusBar,
  Animated,
  PanResponder,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const PlatformerGame = ({ navigation }) => {
  // حالة اللاعب
  const [player, setPlayer] = useState({
    x: width / 2 - 25,
    y: height - 150,
    width: 50,
    height: 50,
    velocityX: 0,
    velocityY: 0,
    isJumping: false,
    direction: 'right',
  });
  
  // حالة الجويستيك
  const [joystick, setJoystick] = useState({
    active: false,
    x: 0,
    y: 0,
    position: { x: 80, y: height - 180 },
    baseRadius: 60,
    stickRadius: 30,
  });
  
  // حالة العالم
  const [world, setWorld] = useState({
    platforms: [],
    coins: [],
    enemies: [],
    score: 0,
    level: 1,
  });
  
  // المراجع للرسوم المتحركة
  const gameLoopRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  
  // تهيئة اللعبة
  useEffect(() => {
    generateWorld();
    
    // بدء حلقة اللعبة
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);
  
  // توليد العالم
  const generateWorld = () => {
    const platforms = [];
    const coins = [];
    
    // منصة الأرضية
    platforms.push({
      id: 'ground',
      x: 0,
      y: height - 100,
      width: width,
      height: 100,
      color: '#8B4513',
    });
    
    // منصات عشوائية
    for (let i = 0; i < 8; i++) {
      platforms.push({
        id: `platform-${i}`,
        x: Math.random() * (width - 100),
        y: height - 200 - (i * 80),
        width: 80 + Math.random() * 70,
        height: 20,
        color: i % 2 === 0 ? '#2E8B57' : '#4682B4',
      });
      
      // عملات على المنصات
      if (i > 0) {
        coins.push({
          id: `coin-${i}`,
          x: platforms[i].x + platforms[i].width / 2 - 15,
          y: platforms[i].y - 40,
          collected: false,
        });
      }
    }
    
    // منصة البداية
    platforms.push({
      id: 'start',
      x: width / 2 - 50,
      y: height - 120,
      width: 100,
      height: 20,
      color: '#FFD700',
    });
    
    // العلم النهائي
    platforms.push({
      id: 'flag',
      x: width - 100,
      y: height - 400,
      width: 20,
      height: 80,
      color: '#FF0000',
    });
    
    setWorld(prev => ({
      ...prev,
      platforms,
      coins,
    }));
  };
  
  // حلقة اللعبة الرئيسية
  const gameLoop = () => {
    const now = Date.now();
    const deltaTime = (now - lastUpdateRef.current) / 1000;
    lastUpdateRef.current = now;
    
    updatePlayer(deltaTime);
    checkCollisions();
    checkCoinCollection();
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };
  
  // تحديث حركة اللاعب
  const updatePlayer = (deltaTime) => {
    setPlayer(prev => {
      let newX = prev.x;
      let newY = prev.y;
      let newVelocityX = prev.velocityX;
      let newVelocityY = prev.velocityY;
      
      // تطبيق سرعة الجويستيك
      if (joystick.active) {
        newVelocityX = joystick.x * 300;
        
        // تغيير اتجاه اللاعب
        if (joystick.x > 0) {
          prev.direction = 'right';
        } else if (joystick.x < 0) {
          prev.direction = 'left';
        }
      } else {
        // احتكاك
        newVelocityX *= 0.8;
        if (Math.abs(newVelocityX) < 1) newVelocityX = 0;
      }
      
      // الجاذبية
      newVelocityY += 800 * deltaTime;
      
      // تطبيق السرعة
      newX += newVelocityX * deltaTime;
      newY += newVelocityY * deltaTime;
      
      // حدود الشاشة
      if (newX < 0) newX = 0;
      if (newX > width - prev.width) newX = width - prev.width;
      if (newY > height - prev.height) {
        newY = height - prev.height;
        newVelocityY = 0;
        prev.isJumping = false;
      }
      
      return {
        ...prev,
        x: newX,
        y: newY,
        velocityX: newVelocityX,
        velocityY: newVelocityY,
      };
    });
  };
  
  // اكتشاف التصادمات
  const checkCollisions = () => {
    setPlayer(prev => {
      let newY = prev.y;
      let newVelocityY = prev.velocityY;
      let isOnGround = false;
      
      world.platforms.forEach(platform => {
        if (platform.id === 'ground') return;
        
        // اكتشاف التصادم
        if (
          prev.x < platform.x + platform.width &&
          prev.x + prev.width > platform.x &&
          prev.y < platform.y + platform.height &&
          prev.y + prev.height > platform.y
        ) {
          // التصادم من الأعلى
          if (prev.velocityY > 0 && prev.y + prev.height - prev.velocityY <= platform.y) {
            newY = platform.y - prev.height;
            newVelocityY = 0;
            isOnGround = true;
          }
          // التصادم من الأسفل
          else if (prev.velocityY < 0) {
            newY = platform.y + platform.height;
            newVelocityY = 0;
          }
        }
      });
      
      return {
        ...prev,
        y: newY,
        velocityY: newVelocityY,
        isJumping: !isOnGround,
      };
    });
  };
  
  // جمع العملات
  const checkCoinCollection = () => {
    setWorld(prev => {
      const newCoins = [...prev.coins];
      let newScore = prev.score;
      let coinsCollected = false;
      
      newCoins.forEach((coin, index) => {
        if (!coin.collected) {
          const distance = Math.sqrt(
            Math.pow(player.x + player.width/2 - coin.x, 2) +
            Math.pow(player.y + player.height/2 - coin.y, 2)
          );
          
          if (distance < 30) {
            newCoins[index].collected = true;
            newScore += 10;
            coinsCollected = true;
          }
        }
      });
      
      // إذا جمعت كل العملات
      if (coinsCollected) {
        const allCollected = newCoins.every(coin => coin.collected);
        if (allCollected && newCoins.length > 0) {
          setTimeout(() => {
            Alert.alert('🎉 مبروك!', 'لقد جمعت كل العملات! انتقل للمستوى التالي.');
            nextLevel();
          }, 500);
        }
      }
      
      return {
        ...prev,
        coins: newCoins,
        score: newScore,
      };
    });
  };
  
  // الجويستيك - PanResponder
  const joystickPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt, gestureState) => {
      setJoystick(prev => ({ ...prev, active: true }));
    },
    onPanResponderMove: (evt, gestureState) => {
      const { dx, dy } = gestureState;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = joystick.baseRadius - joystick.stickRadius;
      
      let x = dx / maxDistance;
      let y = dy / maxDistance;
      
      if (distance > maxDistance) {
        x = (dx / distance);
        y = (dy / distance);
      }
      
      setJoystick(prev => ({ ...prev, x, y }));
    },
    onPanResponderRelease: () => {
      setJoystick(prev => ({ ...prev, active: false, x: 0, y: 0 }));
    },
  });
  
  // القفز
  const jump = () => {
    if (!player.isJumping) {
      setPlayer(prev => ({
        ...prev,
        velocityY: -400,
        isJumping: true,
      }));
    }
  };
  
  // المستوى التالي
  const nextLevel = () => {
    setWorld(prev => {
      const newLevel = prev.level + 1;
      const newScore = prev.score + 100;
      
      // إعادة تعيين اللاعب
      setPlayer({
        x: width / 2 - 25,
        y: height - 150,
        width: 50,
        height: 50,
        velocityX: 0,
        velocityY: 0,
        isJumping: false,
        direction: 'right',
      });
      
      // توليد عالم جديد
      setTimeout(() => {
        generateWorld();
      }, 100);
      
      return {
        ...prev,
        level: newLevel,
        score: newScore,
      };
    });
  };
  
  // إعادة تعيين اللعبة
  const resetGame = () => {
    setPlayer({
      x: width / 2 - 25,
      y: height - 150,
      width: 50,
      height: 50,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      direction: 'right',
    });
    
    setWorld(prev => ({
      ...prev,
      score: 0,
      level: 1,
    }));
    
    generateWorld();
  };
  
  // حساب موضع عصا الجويستيك
  const joystickStickX = joystick.position.x + joystick.x * (joystick.baseRadius - joystick.stickRadius);
  const joystickStickY = joystick.position.y + joystick.y * (joystick.baseRadius - joystick.stickRadius);
  
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* خلفية العالم */}
      <ImageBackground
        source={require('../assets/platform-bg.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* المنصات */}
        {world.platforms.map(platform => (
          <View
            key={platform.id}
            style={[
              styles.platform,
              {
                left: platform.x,
                top: platform.y,
                width: platform.width,
                height: platform.height,
                backgroundColor: platform.color,
              },
              platform.id === 'flag' && styles.flag,
              platform.id === 'start' && styles.startPlatform,
            ]}
          >
            {platform.id === 'flag' && <Text style={styles.flagText}>🏁</Text>}
            {platform.id === 'start' && <Text style={styles.startText}>بداية</Text>}
          </View>
        ))}
        
        {/* العملات */}
        {world.coins.map(coin => (
          !coin.collected && (
            <View
              key={coin.id}
              style={[
                styles.coin,
                {
                  left: coin.x,
                  top: coin.y,
                },
              ]}
            >
              <Text style={styles.coinText}>🪙</Text>
            </View>
          )
        ))}
        
        {/* اللاعب */}
        <View
          style={[
            styles.player,
            {
              left: player.x,
              top: player.y,
              transform: [{ scaleX: player.direction === 'right' ? 1 : -1 }],
            },
          ]}
        >
          <Text style={styles.playerEmoji}>🤺</Text>
          {player.isJumping && (
            <View style={styles.jumpEffect}>
              <Text style={styles.jumpEffectText}>⬆️</Text>
            </View>
          )}
        </View>
      </ImageBackground>
      
      {/* معلومات اللعبة */}
      <View style={styles.gameInfo}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>المستوى: {world.level}</Text>
          <Text style={styles.infoText}>النقاط: {world.score}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>العملات: {world.coins.filter(c => c.collected).length}/{world.coins.length}</Text>
          <Text style={styles.infoText}>
            السرعه: {Math.abs(Math.round(player.velocityX))}
          </Text>
        </View>
      </View>
      
      {/* الجويستيك */}
      <View
        style={[
          styles.joystickContainer,
          {
            left: joystick.position.x - joystick.baseRadius,
            top: joystick.position.y - joystick.baseRadius,
          },
        ]}
        {...joystickPanResponder.panHandlers}
      >
        {/* قاعدة الجويستيك */}
        <View
          style={[
            styles.joystickBase,
            {
              width: joystick.baseRadius * 2,
              height: joystick.baseRadius * 2,
              borderRadius: joystick.baseRadius,
            },
          ]}
        />
        
        {/* عصا الجويستيك */}
        <View
          style={[
            styles.joystickStick,
            {
              left: joystickStickX - joystick.stickRadius,
              top: joystickStickY - joystick.stickRadius,
              width: joystick.stickRadius * 2,
              height: joystick.stickRadius * 2,
              borderRadius: joystick.stickRadius,
            },
          ]}
        />
      </View>
      
      {/* أزرار التحكم */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.jumpButton} onPress={jump}>
          <Text style={styles.jumpButtonText}>⬆️ قفز</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            // تفاعل مع البيئة
            Alert.alert('تفاعل', 'تحقق من المنصة!');
          }}
        >
          <Text style={styles.actionButtonText}>🔄 تفاعل</Text>
        </TouchableOpacity>
      </View>
      
      {/* شريط التنقل */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.navButtonText}>🏠 قائمة</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, styles.resetButton]}
          onPress={resetGame}
        >
          <Text style={styles.navButtonText}>🔄 إعادة</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={nextLevel}
        >
          <Text style={styles.navButtonText}>⏩ التالي</Text>
        </TouchableOpacity>
      </View>
      
      {/* تعليمات */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          حرك الجويستيك للتحكم - اضغط قفز للصعود
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB', // لون سماوي للسماء
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  player: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF5252',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  playerEmoji: {
    fontSize: 30,
  },
  jumpEffect: {
    position: 'absolute',
    top: -30,
  },
  jumpEffectText: {
    fontSize: 20,
  },
  platform: {
    position: 'absolute',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  flag: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagText: {
    fontSize: 30,
    position: 'absolute',
    top: -35,
  },
  startPlatform: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  startText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  coin: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFA500',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  coinText: {
    fontSize: 20,
  },
  gameInfo: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  infoBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
    minWidth: 120,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  joystickContainer: {
    position: 'absolute',
  },
  joystickBase: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  joystickStick: {
    position: 'absolute',
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  controls: {
    position: 'absolute',
    right: 20,
    bottom: 150,
    alignItems: 'center',
  },
  jumpButton: {
    backgroundColor: 'rgba(155, 89, 182, 0.9)',
    padding: 20,
    borderRadius: 40,
    marginBottom: 20,
    width: 100,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  jumpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: 'rgba(46, 204, 113, 0.9)',
    padding: 15,
    borderRadius: 30,
    width: 100,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navigation: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
  },
  nextButton: {
    backgroundColor: 'rgba(241, 196, 15, 0.9)',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
  },
});

export default PlatformerGame;
