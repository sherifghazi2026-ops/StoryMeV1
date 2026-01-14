import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, TouchableOpacity, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function Game3({ navigation }) {
  // موقع يويو - يبدأ من أعلى اليسار
  const pan = useRef(new Animated.ValueXY({ x: 20, y: 20 })).current;
  const [won, setWon] = useState(false);

  // منطق سحب الشخصية (Touch Screen)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        // فحص هل وصل يويو لمنطقة البيت (أسفل يمين الشاشة)
        if (gesture.moveY > height - 250 && gesture.moveX > width - 150) {
          handleWin();
        }
      },
    })
  ).current;

  const handleWin = async () => {
    if (won) return;
    setWon(true);
    const saved = await AsyncStorage.getItem('total_gems');
    await AsyncStorage.setItem('total_gems', (parseInt(saved || '0') + 20).toString());
  };

  if (won) {
    return (
      <View style={styles.winOverlay}>
        <Text style={{fontSize: 80}}>🏆</Text>
        <Text style={styles.winTitle}>عبقري المتاهات! 🎉</Text>
        <Text style={styles.winSub}>لقد أوصلت يويو لبيته بأمان</Text>
        <Text style={styles.gemGift}>+20 جوهرة 💎</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('MainMenu')}>
          <Text style={styles.btnText}>العودة للمنيو</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={{ uri: 'https://img.freepik.com/free-vector/nature-forest-landscape-with-lake-river_1308-68444.jpg' }} 
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>متاهة الغابة المسحورة 🌲</Text>
        <Text style={styles.headerSub}>اسحب يويو بإصبعك وتجنب العوائق!</Text>
      </View>

      <View style={styles.mazeField}>
        {/* العوائق (زينة وتحدي بصري) */}
        <Text style={[styles.decor, { top: '20%', right: '20%' }]}>🐲</Text>
        <Text style={[styles.decor, { top: '50%', left: '30%' }]}>🐦</Text>
        <Text style={[styles.decor, { bottom: '30%', right: '40%' }]}>🐲</Text>

        {/* البيت (الهدف) */}
        <View style={styles.houseTarget}>
          <Text style={{fontSize: 60}}>🏠</Text>
          <Text style={styles.targetLabel}>البيت</Text>
        </View>

        {/* يويو (البطل القابل للسحب) */}
        <Animated.View
          style={[styles.yoyaBall, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
          {...panResponder.panHandlers}
        >
          <Text style={{fontSize: 45}}>👦</Text>
          <View style={styles.yoyaTag}><Text style={styles.yoyaTagTxt}>يويو</Text></View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.hint}>نقطة الانطلاق 🏁</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingBottom: 15 },
  headerTitle: { color: '#FFD700', fontSize: 24, fontWeight: 'bold' },
  headerSub: { color: '#FFF', fontSize: 14 },
  mazeField: { flex: 1, position: 'relative' },
  decor: { fontSize: 40, position: 'absolute', opacity: 0.8 },
  houseTarget: { position: 'absolute', bottom: 60, right: 30, alignItems: 'center' },
  targetLabel: { color: '#FFF', backgroundColor: '#E67E22', paddingHorizontal: 10, borderRadius: 5, fontWeight: 'bold', marginTop: 5 },
  yoyaBall: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center', position: 'absolute' },
  yoyaTag: { backgroundColor: '#2980B9', paddingHorizontal: 8, borderRadius: 5, marginTop: 2 },
  yoyaTagTxt: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  footer: { padding: 20, alignItems: 'flex-start' },
  hint: { color: '#FFF', backgroundColor: 'rgba(0,0,0,0.4)', padding: 5, borderRadius: 5 },
  winOverlay: { flex: 1, backgroundColor: '#1A252F', justifyContent: 'center', alignItems: 'center', padding: 20 },
  winTitle: { fontSize: 32, color: '#F1C40F', fontWeight: 'bold', marginTop: 20 },
  winSub: { color: '#FFF', fontSize: 18, marginVertical: 10 },
  gemGift: { fontSize: 28, color: '#FFD700', fontWeight: 'bold' },
  backBtn: { backgroundColor: '#27AE60', padding: 15, borderRadius: 15, marginTop: 30 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});
