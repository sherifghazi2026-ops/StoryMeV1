import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, Image, PanResponder, Animated, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function Game1({ navigation }) {
  // موقع الشخصية (يويو)
  const pan = useRef(new Animated.ValueXY({ x: 20, y: 20 })).current;
  const [won, setWon] = useState(false);

  // تعريف منطقة "البيت" (الهدف) - مثلاً في أسفل يمين الشاشة
  const targetPos = { x: width - 120, y: height - 250 };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => !won,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        // فحص هل وصل يويو للبيت؟
        if (gesture.moveX > targetPos.x && gesture.moveY > targetPos.y) {
          handleWin();
        }
      },
    })
  ).current;

  const handleWin = async () => {
    if (won) return;
    setWon(true);
    const current = await AsyncStorage.getItem('total_gems');
    await AsyncStorage.setItem('total_gems', (parseInt(current || '0') + 20).toString());
    
    Alert.alert("رائع! 🎉", "لقد خرجت من المتاهة ووصلت للبيت بسلام!", [
      { text: "استلام 20 جوهرة 💎", onPress: () => navigation.navigate('MainMenu') }
    ]);
  };

  return (
    <ImageBackground 
      source={require('../assets/game_bg.jpg')} 
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>اسحب يويو للوصول إلى البيت! 🏠</Text>
      </View>

      {/* المتاهة (خلفية الممرات) */}
      <View style={styles.mazeContainer}>
        {/* يمكنك هنا وضع صورة متاهة كخلفية للممرات */}
        
        {/* البيت (الهدف) */}
        <Image 
          source={require('../assets/house.png')} 
          style={[styles.house, { left: targetPos.x, top: targetPos.y }]} 
        />

        {/* شخصية يويو القابلة للسحب */}
        <Animated.View
          style={[styles.yoyaContainer, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
          {...panResponder.panHandlers}
        >
          <Image source={require('../assets/yoya_player.png')} style={styles.yoyaImg} />
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.decor}>🐲</Text>
        <Text style={styles.decor}>🐦</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingBottom: 10 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  mazeContainer: { flex: 1, position: 'relative' },
  house: { width: 100, height: 100, position: 'absolute', resizeMode: 'contain' },
  yoyaContainer: { width: 80, height: 80, position: 'absolute', cursor: 'pointer' },
  yoyaImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  footer: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 30 },
  decor: { fontSize: 40 }
});
