import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { bundlesData } from '../data/storiesData';

const RECORDERS = [
  { id: 'papa', name: 'بابا', icon: '👨‍💼' },
  { id: 'mama', name: 'ماما', icon: '👩‍🍳' },
  { id: 'grandpa', name: 'جدي', icon: '👴' },
  { id: 'grandma', name: 'جدتي', icon: '👵' },
  { id: 'bro', name: 'أخي', icon: '👦' },
  { id: 'sis', name: 'أختي', icon: '👧' },
  { id: 'me', name: 'بصوتي', icon: '🦸‍♂️' },
];

export default function StoryReaderScreen({ route, navigation }) {
  const { bundleId, storyId } = route.params || {};
  const [currentPage, setCurrentPage] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isFamilyPlaying, setIsFamilyPlaying] = useState(false);
  const [selectedRecorder, setSelectedRecorder] = useState(RECORDERS[1]);
  const [showRecorderModal, setShowRecorderModal] = useState(false);

  const recordingRef = useRef(null);
  const soundRef = useRef(null);

  const bundle = bundlesData.find(b => b.id === bundleId);
  const storyInfo = bundle?.stories.find(s => s.id === storyId);
  const storyPages = storyInfo?.pages || [];

  useEffect(() => {
    return () => { stopAllAudio(); };
  }, []);

  const stopAllAudio = async () => {
    Speech.stop();
    setIsAiSpeaking(false);
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
    }
    setIsFamilyPlaying(false);
  };

  const finishStory = async () => {
    await stopAllAudio();
    try {
      // 1. جلب سجل القصص المكتملة لمنع التكرار
      const completedKey = 'completed_stories';
      const completedData = await AsyncStorage.getItem(completedKey);
      let completedStories = completedData ? JSON.parse(completedData) : [];

      if (!completedStories.includes(storyId)) {
        // 2. إذا كانت أول مرة، نضيف 5 جواهر
        const currentGems = await AsyncStorage.getItem('total_gems');
        let gemsCount = parseInt(currentGems || '0');
        const newGemsCount = gemsCount + 5;
        
        await AsyncStorage.setItem('total_gems', newGemsCount.toString());

        // 3. تحديث السجل
        completedStories.push(storyId);
        await AsyncStorage.setItem(completedKey, JSON.stringify(completedStories));

        Alert.alert("رائع! 🎉", `لقد حصلت على 5 جواهر لإنهاء القصة لأول مرة!\nرصيدك: ${newGemsCount} 💎`);
      } else {
        // إذا تمت قراءتها سابقاً
        Alert.alert("أحسنت! ❤️", "لقد قرأت هذه القصة من قبل، استكشف قصصاً جديدة لجمع المزيد من الجواهر.");
      }
      navigation.goBack();
    } catch (e) {
      navigation.goBack();
    }
  };

  const handlePageChange = async (nextIndex) => {
    const wasAiSpeaking = isAiSpeaking;
    const wasFamilyPlaying = isFamilyPlaying;
    await stopAllAudio();
    setCurrentPage(nextIndex);

    if (wasAiSpeaking) {
      setTimeout(() => startAiSpeech(nextIndex), 300);
    } else if (wasFamilyPlaying) {
      setTimeout(() => playFamilyVoice(nextIndex), 300);
    }
  };

  const startAiSpeech = (pageIdx) => {
    setIsAiSpeaking(true);
    Speech.speak(storyPages[pageIdx].text, {
      language: 'ar',
      onDone: () => setIsAiSpeaking(false),
      rate: 0.85
    });
  };

  const toggleAiSpeech = () => {
    if (isAiSpeaking) { stopAllAudio(); }
    else { stopAllAudio(); startAiSpeech(currentPage); }
  };

  const handleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const saveKey = `rec_${storyId}_${currentPage}_${selectedRecorder.id}`;
      await AsyncStorage.setItem(saveKey, uri);
      recordingRef.current = null;
      Alert.alert("تم الحفظ ✅", `صوت (${selectedRecorder.name}) جاهز!`);
    } else {
      await stopAllAudio();
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
    }
  };

  const playFamilyVoice = async (pageIdx) => {
    const saveKey = `rec_${storyId}_${pageIdx}_${selectedRecorder.id}`;
    const uri = await AsyncStorage.getItem(saveKey);
    if (uri) {
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setIsFamilyPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) setIsFamilyPlaying(false);
      });
    } else if (pageIdx === currentPage) {
      Alert.alert("غير موجود", `لا يوجد تسجيل بصوت (${selectedRecorder.name}) هنا.`);
    }
  };

  const toggleFamilyVoice = () => {
    if (isFamilyPlaying) stopAllAudio();
    else { stopAllAudio(); playFamilyVoice(currentPage); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowRecorderModal(true)} style={styles.recorderSelector}>
          <Text style={styles.recorderIcon}>{selectedRecorder.icon}</Text>
          <Text style={styles.recorderName}>{selectedRecorder.name}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{storyInfo?.title}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.navBtn}>🔙</Text></TouchableOpacity>
      </View>

      <Image source={{ uri: storyPages[currentPage]?.image }} style={styles.image} />

      <View style={styles.controlsRow}>
        <TouchableOpacity style={[styles.controlBtn, isAiSpeaking && styles.activeBtn]} onPress={toggleAiSpeech}>
          <Text style={styles.btnIcon}>{isAiSpeaking ? '⏸️' : '📢'}</Text>
          <Text style={styles.btnLabel}>آلي</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, isRecording && styles.recActive]} onPress={handleRecording}>
          <Text style={styles.btnIcon}>{isRecording ? '🛑' : '🎙️'}</Text>
          <Text style={styles.btnLabel}>{isRecording ? 'إيقاف' : 'تسجيل'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, isFamilyPlaying && styles.activeBtn]} onPress={toggleFamilyVoice}>
          <Text style={styles.btnIcon}>{isFamilyPlaying ? '⏸️' : '👪'}</Text>
          <Text style={styles.btnLabel}>عائلتي</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.textContainer}>
        <Text style={styles.storyText}>{storyPages[currentPage]?.text}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity disabled={currentPage === 0} onPress={() => handlePageChange(currentPage - 1)} style={[styles.pageBtn, currentPage === 0 && { opacity: 0.3 }]}>
          <Text style={styles.pageBtnText}>السابق</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => currentPage < storyPages.length - 1 ? handlePageChange(currentPage + 1) : finishStory()} 
          style={[styles.pageBtn, { backgroundColor: '#2ECC71' }]}
        >
          <Text style={styles.pageBtnText}>{currentPage < storyPages.length - 1 ? 'التالي' : 'إنهاء وجوائز 💎'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showRecorderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>من سيسجل؟</Text>
            <FlatList data={RECORDERS} numColumns={3} renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => { setSelectedRecorder(item); setShowRecorderModal(false); }}>
                <Text style={styles.modalIcon}>{item.icon}</Text>
                <Text style={styles.modalName}>{item.name}</Text>
              </TouchableOpacity>
            )} />
            <TouchableOpacity onPress={() => setShowRecorderModal(false)}><Text style={styles.closeText}>إلغاء</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 40 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 15, alignItems: 'center', backgroundColor: '#FFF' },
  recorderSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEE', padding: 8, borderRadius: 15 },
  recorderIcon: { fontSize: 20 }, recorderName: { fontSize: 12, marginRight: 5 },
  title: { fontSize: 16, fontWeight: 'bold' }, navBtn: { fontSize: 24 },
  image: { width: '100%', height: 220 },
  controlsRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', padding: 15, backgroundColor: '#FFF' },
  controlBtn: { alignItems: 'center', padding: 10, borderRadius: 15, width: 80, backgroundColor: '#F8F9FA' },
  activeBtn: { backgroundColor: '#D1F2EB' }, recActive: { backgroundColor: '#FADBD8' },
  btnIcon: { fontSize: 24 }, btnLabel: { fontSize: 10 },
  textContainer: { flex: 1, padding: 20 },
  storyText: { fontSize: 20, textAlign: 'right', lineHeight: 35 },
  footer: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 20 },
  pageBtn: { padding: 12, borderRadius: 20, backgroundColor: '#BDC3C7' },
  pageBtnText: { color: '#FFF', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalTitle: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
  modalItem: { flex: 1, alignItems: 'center', margin: 10 },
  modalIcon: { fontSize: 30 }, modalName: { fontSize: 12 },
  closeText: { textAlign: 'center', color: 'red', marginTop: 10 }
});
