import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

export default function YoyaGameV2({ navigation }) {
  const [gems, setGems] = useState(0);
  const [health, setHealth] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [activeDragons, setActiveDragons] = useState([]);

  // دالة تشغيل الأصوات
  async function playSound(type) {
    let uri = type === 'hit' 
      ? 'https://www.soundjay.com/buttons/sounds/button-10.mp3' 
      : 'https://www.soundjay.com/buttons/sounds/button-37.mp3';
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } catch (e) {}
  }

  // توليد التنانين التي تحاول سرقة العظمة
  useEffect(() => {
    if (health <= 0) {
      setIsGameOver(true);
      return;
    }

    const interval = setInterval(() => {
      const newDragon = {
        id: Math.random().toString(),
        x: Math.random() * (width - 70),
        y: new Animated.Value(-50),
      };
      
      setActiveDragons(prev => [...prev, newDragon]);

      // حركة التنين باتجاه العظمة في الأسفل
      Animated.timing(newDragon.y, {
        toValue: height - 160,
        duration: 3500, // سرعة السقوط
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          // إذا وصل التنين للعظمة تنقص الصحة
          setHealth(h => h - 1);
          setActiveDragons(prev => prev.filter(d => d.id !== newDragon.id));
        }
      });
    }, 1800); // تنين جديد كل 1.8 ثانية

    return () => clearInterval(interval);
  }, [health]);

  const tapDragon = (id) => {
    playSound('hit');
    setGems(prev => prev + 5); // الجائزة 5 جواهر لكل تنين مطرود
    setActiveDragons(prev => prev.filter(d => d.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* واجهة المعلومات */}
      <View style={styles.ui}>
        <View style={styles.statBox}><Text style={styles.uiText}>❤️ {health}</Text></View>
        <View style={styles.statBox}><Text style={styles.uiText}>💎 {gems}</Text></View>
      </View>

      {!isGameOver ? (
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>احمِ عظمة ليو! 🦴</Text>
          
          {/* عظمة ليو الذهبية */}
          <View style={styles.boneContainer}>
            <Text style={styles.bone}>🦴</Text>
          </View>

          {/* التنانين الهاجمة */}
          {activeDragons.map(dragon => (
            <Animated.View 
              key={dragon.id} 
              style={[styles.dragonContainer, { left: dragon.x, top: dragon.y }]}
            >
              <TouchableOpacity onPress={() => tapDragon(dragon.id)}>
                <Text style={{ fontSize: 60 }}>🐲</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
          
          {/* يويا الحارس */}
          <Text style={styles.yoya}>👦</Text>
        </View>
      ) : (
        <View style={styles.gameOver}>
          <Text style={styles.gameOverTxt}>لقد سرقوا العظمة! 🦴</Text>
          <Text style={styles.resultTxt}>جمعت {gems} جوهرة لحماية ليو</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>العودة للمغامرات</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C3E50' }, // جو ليلي لحماية العظمة
  ui: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50 },
  statBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 15 },
  uiText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  title: { textAlign: 'center', fontSize: 20, color: '#F1C40F', marginTop: 10, fontWeight: 'bold' },
  boneContainer: { position: 'absolute', bottom: 40, alignSelf: 'center' },
  bone: { fontSize: 100, textShadowColor: '#F1C40F', textShadowRadius: 10 },
  yoya: { position: 'absolute', bottom: 40, left: 30, fontSize: 60 },
  dragonContainer: { position: 'absolute', zIndex: 10 },
  gameOver: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  gameOverTxt: { fontSize: 32, color: '#E74C3C', fontWeight: 'bold', textAlign: 'center' },
  resultTxt: { fontSize: 22, color: '#FFF', marginVertical: 30 },
  btn: { backgroundColor: '#F1C40F', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  btnText: { color: '#000', fontSize: 20, fontWeight: 'bold' }
});
