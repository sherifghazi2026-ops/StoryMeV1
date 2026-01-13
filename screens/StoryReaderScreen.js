import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { bundlesData } from '../data/storiesData';

export default function StoryReaderScreen({ route, navigation }) {
  const { bundleId } = route.params || {};
  
  // حل الخطأ: التأكد من القراءة من bundlesData والحماية بـ []
  const bundles = bundlesData || [];
  const bundle = bundles.find(b => b.id === bundleId);
  const story = bundle?.stories[0]; // قراءة أول قصة في الباقة كمثال

  const [index, setIndex] = useState(0);

  if (!story) {
    return (
      <View style={styles.errorContainer}>
        <Text>عذراً، لم يتم العثور على القصة!</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{color: '#FFF'}}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const speak = (text) => {
    Speech.stop();
    Speech.speak(text, { language: 'ar', rate: 0.8 });
  };

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: story.parts[index].image }} 
        style={styles.image} 
        resizeMode="contain" 
      />
      
      <ScrollView style={styles.textCard}>
        <Text style={styles.storyText}>{story.parts[index].text}</Text>
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity onPress={() => { Speech.stop(); navigation.goBack(); }} style={styles.btnNav}>
          <Text>🏠</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => speak(story.parts[index].text)} style={styles.btnAudio}>
          <Text style={{fontSize: 24}}>🔊</Text>
        </TouchableOpacity>

        {index < story.parts.length - 1 ? (
          <TouchableOpacity 
            onPress={() => { setIndex(index + 1); Speech.stop(); }} 
            style={styles.btnNext}
          >
            <Text style={styles.btnText}>التالي</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => navigation.navigate('MainMenu')} 
            style={styles.btnFinish}
          >
            <Text style={styles.btnText}>تمت ✅</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  image: { width: '100%', height: 250 },
  textCard: { flex: 1, padding: 20 },
  storyText: { fontSize: 22, textAlign: 'right', lineHeight: 40, color: '#333' },
  controls: { flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'center', padding: 20 },
  btnNav: { padding: 15, backgroundColor: '#EEE', borderRadius: 50 },
  btnAudio: { padding: 20, backgroundColor: '#FFD700', borderRadius: 50 },
  btnNext: { padding: 15, backgroundColor: '#4CAF50', borderRadius: 10 },
  btnFinish: { padding: 15, backgroundColor: '#4A90E2', borderRadius: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { padding: 15, backgroundColor: '#FF6B6B', borderRadius: 10, marginTop: 10 }
});
