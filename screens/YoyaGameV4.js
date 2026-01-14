import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

export default function YoyaGameV4({ navigation }) {
  const [pearls, setPearls] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // موقع يويا الرأسي (العمق)
  const yoyaPos = useRef(new Animated.Value(height / 2)).current;
  const [currentY, setCurrentY] = useState(height / 2);

  // تحديث القيمة اللحظية للموقع لمتابعة التصادم
  useEffect(() => {
    const id = yoyaPos.addListener((v) => setCurrentY(v.value));
    return () => yoyaPos.removeListener(id);
  }, []);

  // تشغيل أصوات الماء
  async function playSound(type) {
    const uri = type === 'pearl' 
      ? 'https://www.soundjay.com/button/sounds/button-09.mp3' 
      : 'https://www.soundjay.com/button/sounds/button-10.mp3';
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } catch (e) {}
  }

  // التحكم: النقر يجعل يويا يسبح للأعلى
  const swimUp = () => {
    if (isGameOver) return;
    Animated.timing(yoyaPos, {
      toValue: Math.max(50, currentY - 80),
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // الجاذبية: يويا يغوص للأسفل ببطء تلقائياً
  useEffect(() => {
    if (isGameOver) return;
    const gravity = setInterval(() => {
      if (currentY < height - 100) {
        yoyaPos.setValue(currentY + 5);
      }
    }, 50);
    return () => clearInterval(gravity);
  }, [currentY, isGameOver]);

  // توليد اللؤلؤ والعقبات
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (isGameOver) return;
    const interval = setInterval(() => {
      const newItem = {
        id: Math.random().toString(),
        type: Math.random() > 0.4 ? '⚪' : '🐡', // لؤلؤة أو سمكة ينفوخ
        x: new Animated.Value(width),
        y: Math.random() * (height - 200) + 100,
      };
      setItems(prev => [...prev, newItem]);

      Animated.timing(newItem.x, {
        toValue: -50,
        duration: 4000,
        useNativeDriver: false,
      }).start();
    }, 1500);
    return () => clearInterval(interval);
  }, [isGameOver]);

  return (
    <TouchableOpacity 
      activeOpacity={1} 
      style={styles.container} 
      onPress={swimUp}
    >
      <View style={styles.header}>
        <Text style={styles.scoreText}>⚪ اللؤلؤ: {pearls}</Text>
      </View>

      {!isGameOver ? (
        <View style={{ flex: 1 }}>
          <Text style={styles.seaFloor}>⏳ حافظ على السباحة!</Text>
          
          {items.map(item => (
            <Animated.View 
              key={item.id} 
              style={[styles.item, { left: item.x, top: item.y }]}
            >
              <Text style={{ fontSize: 40 }}>{item.type}</Text>
            </Animated.View>
          ))}

          <Animated.View style={[styles.yoya, { top: yoyaPos }]}>
            <Text style={{ fontSize: 60 }}>🤿</Text>
          </Animated.View>
        </View>
      ) : (
        <View style={styles.gameOver}>
          <Text style={styles.gameOverTxt}>انتهى الأكسجين! 🫧</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>العودة للألعاب</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* تأثير فقاعات خلفية */}
      <View style={styles.bubbles} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E90FF' }, // أزرق مائي
  header: { paddingTop: 50, paddingLeft: 20 },
  scoreText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  yoya: { position: 'absolute', left: 50 },
  item: { position: 'absolute' },
  seaFloor: { position: 'absolute', bottom: 20, alignSelf: 'center', color: '#B0E0E6', opacity: 0.5 },
  gameOver: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gameOverTxt: { fontSize: 35, color: '#FFF', fontWeight: 'bold', marginBottom: 20 },
  btn: { backgroundColor: '#F1C40F', padding: 15, borderRadius: 20 },
  btnText: { fontWeight: 'bold', fontSize: 18 }
});
