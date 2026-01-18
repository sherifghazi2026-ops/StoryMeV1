import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GamesListScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('يُويَا');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const fetchUser = async () => {
      const profile = await AsyncStorage.getItem('userProfile');
      if (profile) setUserName(JSON.parse(profile).name || 'يُويَا');
      const soundPref = await AsyncStorage.getItem('soundEnabled');
      if (soundPref !== null) setSoundEnabled(JSON.parse(soundPref));
    };
    fetchUser();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const speak = (text) => {
    if (!soundEnabled) return;
    Speech.speak(text, { language: 'ar', rate: 0.8 });
  };

  // مصفوفة الألعاب المميزة (تظهر أولاً)
  const premiumGames = [
    {
      title: 'مغامرات يويَا',
      screen: 'WorldExplorerGame',
      color: '#9B59B6',
      icon: '🗺️',
      subtitle: 'استكشاف العالم',
      description: 'اكتشف عوالم يويَا السحرية واجمع الكنوز والجواهر'
    },
    {
      title: 'بطل القفز',
      screen: 'PlatformerGame',
      color: '#FF9800',
      icon: '🤺',
      subtitle: 'تحدي المنصات',
      description: 'ساعد البطل في الوصول للأعلى وتخطي العقبات'
    },
    {
      title: 'رحلة البحث',
      screen: 'ExplorationGame2D',
      color: '#27ae60',
      icon: '🌲',
      subtitle: 'استكشاف 2D',
      description: 'مغامرة شيقة في الغابات والمناطق المجهولة'
    }
  ];

  // مصفوفة مستويات يويَا (من 1 إلى 20)
  const yoyaLevels = Array.from({ length: 20 }, (_, i) => ({
    title: `المستوى ${i + 1}`,
    screen: `YoyaGameV${i + 1}`,
    color: i % 2 === 0 ? '#4ECDC4' : '#FF6B6B',
    icon: `🎮`,
    subtitle: `تحدي يويَا ${i + 1}`,
    description: `مغامرة تعليمية ممتعة في المستوى ${i + 1}`
  }));

  const allGames = [...premiumGames, ...yoyaLevels];

  const GameCard = ({ game }) => (
    <TouchableOpacity
      style={[styles.gameCard, { backgroundColor: game.color }]}
      onPress={() => {
        speak(`دَخَلْتَ ${game.title}`);
        navigation.navigate(game.screen);
      }}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{game.icon}</Text>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{game.title}</Text>
            <Text style={styles.cardSubtitle}>{game.subtitle}</Text>
          </View>
        </View>
        <Text style={styles.cardDescription}>{game.description}</Text>
        <View style={styles.playButton}>
          <Ionicons name="play-circle" size={22} color="white" />
          <Text style={styles.playText}>ابدأ اللعب</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ألعاب يويَا</Text>
        <TouchableOpacity 
           style={styles.soundButton} 
           onPress={() => setSoundEnabled(!soundEnabled)}
        >
          <Ionicons name={soundEnabled ? "volume-high" : "volume-mute"} size={28} color="white" />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.welcomeSection, { opacity: fadeAnim }]}>
        <Text style={styles.welcomeText}>أهلاً {userName}!</Text>
        <Text style={styles.subWelcomeText}>استمتع بأفضل الألعاب التعليمية والمغامرات</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gamesGrid}>
        {allGames.map((game, index) => (
          <GameCard key={index} game={game} />
        ))}
      </ScrollView>

      <View style={styles.specialNotice}>
        <Ionicons name="sparkles" size={20} color="#F1C40F" />
        <Text style={styles.noticeText}>تم إضافة ألعاب جديدة مميزة!</Text>
        <Ionicons name="sparkles" size={20} color="#F1C40F" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16A085' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
    backgroundColor: '#1ABC9C', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5
  },
  headerTitle: { fontSize: 26, color: 'white', fontWeight: 'bold' },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  soundButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  welcomeSection: { alignItems: 'center', paddingVertical: 15 },
  welcomeText: { fontSize: 28, color: 'white', fontWeight: 'bold' },
  subWelcomeText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  gamesGrid: { paddingHorizontal: 10, paddingBottom: 100, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  gameCard: { width: SCREEN_WIDTH * 0.45, borderRadius: 20, marginVertical: 10, elevation: 5, overflow: 'hidden' },
  cardContent: { padding: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardIcon: { fontSize: 28, marginRight: 5 },
  cardTitleContainer: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  cardSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.9)' },
  cardDescription: { fontSize: 12, color: 'white', marginBottom: 10, textAlign: 'right', height: 40 },
  playButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.3)', paddingVertical: 6, borderRadius: 15 },
  playText: { color: 'white', fontSize: 13, fontWeight: 'bold', marginLeft: 5 },
  specialNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#9B59B6', paddingVertical: 10, position: 'absolute', bottom: 0, left: 0, right: 0 },
  noticeText: { color: 'white', fontWeight: 'bold', marginHorizontal: 10 }
});

export default GamesListScreen;
