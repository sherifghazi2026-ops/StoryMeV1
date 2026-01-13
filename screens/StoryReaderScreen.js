import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bundlesData } from '../data/storiesData';

export default function StoryReaderScreen({ route, navigation }) {
  const { bundleId, storyId } = route.params || {};
  const [isRead, setIsRead] = useState(false);
  const storyKey = `read_${bundleId}_${storyId}`; // مفتاح فريد لكل قصة

  const bundle = bundlesData.find(b => b.id === bundleId);
  const storyInfo = bundle?.stories.find(s => s.id === storyId);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await AsyncStorage.getItem(storyKey);
      if (status === 'true') setIsRead(true);
    };
    checkStatus();
  }, []);

  const finishStory = async () => {
    if (!isRead) {
      // إضافة الجواهر لأول مرة فقط
      const currentGems = await AsyncStorage.getItem('userGems');
      const newGemsTotal = parseInt(currentGems || '0') + 5;
      await AsyncStorage.setItem('userGems', newGemsTotal.toString());
      
      // حفظ أن هذه القصة تمت قراءتها
      await AsyncStorage.setItem(storyKey, 'true');
      Alert.alert('رائع! 💎', 'لقد حصلت على 5 جواهر مكافأة!');
    } else {
      Alert.alert('تمت القراءة', 'لقد حصلت على جواهر هذه القصة سابقاً ✨');
    }
    navigation.goBack();
  };

  const defaultContent = [
    { text: `قصة: ${storyInfo?.title}`, image: 'https://picsum.photos/400/300' },
    { text: "بدأ بطلنا رحلته في عالم الخيال...", image: 'https://picsum.photos/400/301' },
    { text: "وهكذا تعلمنا درساً جديداً اليوم!", image: 'https://picsum.photos/400/302' }
  ];
  const [index, setIndex] = useState(0);

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.navigate('MainMenu')}><Text style={styles.navBtn}>🏠</Text></TouchableOpacity>
        <Text style={styles.storyTitle}>{storyInfo?.title} {isRead ? '💎' : ''}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.navBtn}>🔙</Text></TouchableOpacity>
      </View>
      <Image source={{ uri: defaultContent[index].image }} style={styles.image} />
      <ScrollView style={styles.textCard}><Text style={styles.text}>{defaultContent[index].text}</Text></ScrollView>
      <View style={styles.footer}>
        {index < defaultContent.length - 1 ? (
          <TouchableOpacity onPress={() => setIndex(index + 1)} style={styles.nextBtn}><Text style={styles.btnText}>التالي</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={finishStory} style={styles.finishBtn}>
            <Text style={styles.btnText}>{isRead ? 'تمت القراءة ✅' : 'استلام الجواهر 💎'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingTop: 40 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  navBtn: { fontSize: 24 },
  storyTitle: { fontSize: 18, fontWeight: 'bold' },
  image: { width: '100%', height: 250 },
  textCard: { flex: 1, padding: 20 },
  text: { fontSize: 22, textAlign: 'right', lineHeight: 35 },
  footer: { padding: 20 },
  nextBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center' },
  finishBtn: { backgroundColor: '#FFD700', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 18 }
});
