import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bundlesData } from '../data/storiesData';

export default function StoryReaderScreen({ route, navigation }) {
  const { bundleId, storyId } = route.params || {};
  const [isRead, setIsRead] = useState(false);
  const storyKey = `read_${bundleId}_${storyId}`;

  // البحث عن معلومات الباقة والقصة والدرس المستفاد
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
    try {
      // 1. تحديث الجواهر للألعاب (إذا لم تكن مقروءة سابقاً)
      let currentGems = await AsyncStorage.getItem('total_gems');
      let gemsCount = parseInt(currentGems || '0');
      
      if (!isRead) {
        gemsCount += 5;
        await AsyncStorage.setItem('total_gems', gemsCount.toString());
        await AsyncStorage.setItem(storyKey, 'true');
        setIsRead(true);
      }

      // 2. إظهار الدرس المستفاد والاحتفال بالجواهر
      Alert.alert(
        "أحسنت يا بطل! 🎉",
        `💎 حصلت على 5 جواهر للألعاب.\n\n🌟 الدرس المستفاد:\n${storyInfo?.lesson || "كن دائماً بطلاً بأخلاقك!"}\n\nرصيدك الآن: ${gemsCount} جوهرة`,
        [{ text: "فهمت، شكراً!", onPress: () => navigation.goBack() }]
      );

    } catch (e) {
      console.error("Error saving gems", e);
      navigation.goBack();
    }
  };

  // محتوى تجريبي لعرض القصة (يمكنك لاحقاً جعل كل قصة عدة صفحات)
  const pages = [
    { text: storyInfo?.content || "جاري تحميل القصة...", image: 'https://picsum.photos/400/300' }
  ];

  const [index, setIndex] = useState(0);

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.navigate('MainMenu')}>
          <Text style={styles.navBtn}>🏠</Text>
        </TouchableOpacity>
        <Text style={styles.storyTitle}>{storyInfo?.title} {isRead ? '✅' : ''}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.navBtn}>🔙</Text>
        </TouchableOpacity>
      </View>

      <Image source={{ uri: pages[index].image }} style={styles.image} />

      <ScrollView style={styles.textCard}>
        <Text style={styles.text}>{pages[index].text}</Text>
      </ScrollView>

      <View style={styles.footer}>
        {index < pages.length - 1 ? (
          <TouchableOpacity onPress={() => setIndex(index + 1)} style={styles.nextBtn}>
            <Text style={styles.btnText}>التالي</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={finishStory} style={styles.finishBtn}>
            <Text style={styles.btnText}>{isRead ? 'إغلاق والعودة' : 'استلام الجواهر 💎'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingTop: 40 },
  navBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  navBtn: { fontSize: 24 },
  storyTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  image: { width: '100%', height: 250 },
  textCard: { flex: 1, padding: 20 },
  text: { fontSize: 20, textAlign: 'right', lineHeight: 32, color: '#34495E' },
  footer: { padding: 20 },
  nextBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center' },
  finishBtn: { backgroundColor: '#FFD700', padding: 15, borderRadius: 10, alignItems: 'center', elevation: 3 },
  btnText: { fontWeight: 'bold', fontSize: 18, color: '#2C3E50' }
});
