import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  Dimensions, Alert, Animated
} from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const YoyaGameV2 = ({ navigation }) => {
  const [gameState, setGameState] = useState('home');
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [heroName, setHeroName] = useState('بَطَلُنَا');
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gamePaused, setGamePaused] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      Speech.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const sProfile = await AsyncStorage.getItem('userProfile');
        if (sProfile) {
          const profileData = JSON.parse(sProfile);
          if (profileData.name) setHeroName(profileData.name);
        }
      } catch (e) { console.error("Error loading profile:", e); }
    };
    loadUserData();
  }, []);

  const levels = [
    {
      id: 0,
      title: "أَمَانَةُ الْبَطَلِ",
      problem: "وَجَدْتَ مِحْفَظَةً مَلِيئَةً بِالنُّقُودِ فِي سَاحَةِ الْمَدْرَسَةِ، مَاذَا تَفْعَلُ؟",
      image: '👝',
      options: [
        { id: 0, text: "آخُذُهَا لِنَفْسِي لِأَشْتَرِيَ لُعْبَةً", isCorrect: false, message: "لَا يَا بَطَلُ، هَذِهِ لَيْسَتْ أَمَانَةً." },
        { id: 1, text: "أُعْطِيهَا لِلْمُعَلِّمِ لِيَبْحَثَ عَنْ صَاحِبِهَا", isCorrect: true, message: "رَائِعٌ! الأَمَانَةُ مِنْ صِفَاتِ الْأَبْطَالِ." }
      ]
    },
    {
      id: 1,
      title: "الرِّفْقُ بِالْحَيَوَانِ",
      problem: "رَأَيْتَ قِطَّةً جَائِعَةً تَبْحَثُ عَنْ طَعَامٍ، مَاذَا تَفْعَلُ؟",
      image: '🐈',
      options: [
        { id: 0, text: "أُقَدِّمُ لَهَا بَعْضَ الطَّعَامِ وَالْمَاءِ", isCorrect: true, message: "رَائِعٌ! الرِّفْقُ بِالْحَيَوَانِ يَدُلُّ عَلَى قَلْبِكَ الطَّيِّبِ." },
        { id: 1, text: "أُخِيفُهَا لِتَهْرُبَ بَعِيداً", isCorrect: false, message: "لَا يَا بَطَلُ، الْأَبْطَالُ لَا يُؤْذُونَ الضُّعَفَاءَ." }
      ]
    },
    {
      id: 2,
      title: "التَّعَاوُنُ",
      problem: "أُمُّكَ تَقُومُ بِتَنْظِيفِ الْمَنْزِلِ، كَيْفَ تُسَاعِدُهَا؟",
      image: '🏠',
      options: [
        { id: 0, text: "أُرَتِّبُ غُرْفَتِي وَأَلْعَابِي", isCorrect: true, message: "بَطَلٌ مُطِيعٌ! الْمُسَاعَدَةُ تَنْشُرُ السَّعَادَةَ." },
        { id: 1, text: "أَسْتَمِرُّ فِي لَعِبِ الْفِيدْيُو", isCorrect: false, message: "الْبَطَلُ يُسَاعِدُ عَائِلَتَهُ دَائِماً." }
      ]
    }
  ];

  const speak = (text) => {
    Speech.stop();
    Speech.speak(text, { language: 'ar', rate: 0.85 });
  };

  useEffect(() => {
    if (gameState === 'playing') {
      const level = levels[currentLevel];
      speak(`${level.problem}. الخيار الأول: ${level.options[0].text}. الخيار الثاني: ${level.options[1].text}`);
    }
  }, [currentLevel, gameState]);

  useEffect(() => {
    if (gameState === 'playing' && !gamePaused && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timerRef.current);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleTimeUp();
    }
  }, [gameState, gamePaused, timeLeft]);

  const handleAnswer = (option) => {
    if (gamePaused) return;
    setGamePaused(true);
    speak(option.message);
    if (option.isCorrect) {
      setScore(s => s + 10);
      Alert.alert("أَحْسَنْتَ! 🏆", option.message, [{ text: "التَّالِي", onPress: goToNextLevel }]);
    } else {
      setLives(l => l - 1);
      if (lives <= 1) finishGame();
      else Alert.alert("فَكِّرْ جَيِّداً", option.message, [{ text: "مُحَاوَلَة", onPress: () => setGamePaused(false) }]);
    }
  };

  const goToNextLevel = () => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel(prev => prev + 1);
      setTimeLeft(30);
      setGamePaused(false);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    setGameState('score');
    if (lives > 0) {
      try {
        const gameID = 'EthicChallenge_Completed';
        const alreadyWon = await AsyncStorage.getItem(gameID);
        if (!alreadyWon) {
          const currentGems = await AsyncStorage.getItem('total_gems');
          const total = parseInt(currentGems || '0') + 20;
          await AsyncStorage.setItem('total_gems', total.toString());
          await AsyncStorage.setItem(gameID, 'true');
          Alert.alert("هَدِيَّةٌ! 💎", "لَقَدْ حَصَلْتَ عَلَى 20 جَوْهَرَةً لِأَوَّلِ مَرَّةٍ!");
        }
      } catch (e) { console.error("Update Balance Error", e); }
    }
  };

  const handleTimeUp = () => {
    setGamePaused(true);
    Alert.alert("انْتَهَى الْوَقْتُ", "حَاوِلْ مَرَّةً أُخْرَى", [{ text: "إِعَادَة", onPress: () => { setTimeLeft(30); setGamePaused(false); } }]);
  };

  const exitToGames = () => {
    Speech.stop();
    navigation.navigate('GamesList');
  };

  return (
    <View style={styles.mainContainer}>
      <TouchableOpacity style={styles.closeBtn} onPress={exitToGames}>
        <Ionicons name="close-circle" size={40} color="#E74C3C" />
      </TouchableOpacity>

      {gameState === 'home' ? (
        <View style={styles.container}>
          <Text style={styles.title}>🏆 تَحَدِّي الْأَخْلَاقِ</Text>
          <Text style={styles.nameTxt}>أَهْلًا {heroName} ✨</Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => setGameState('playing')}>
            <Text style={styles.startBtnTxt}>إِبْدَأِ الْمُغَامَرَةَ 🚀</Text>
          </TouchableOpacity>
        </View>
      ) : gameState === 'playing' ? (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.stat}>❤️ {lives}</Text>
            <Text style={styles.stat}>💎 {score}</Text>
            <Text style={styles.stat}>⏰ {timeLeft}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.emoji}>{levels[currentLevel].image}</Text>
            <Text style={styles.question}>{levels[currentLevel].problem}</Text>
          </View>
          {levels[currentLevel].options.map((opt, i) => (
            <TouchableOpacity key={i} style={styles.opt} onPress={() => handleAnswer(opt)}>
              <Text style={styles.optTxt}>{opt.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.container}>
          <Ionicons name="trophy" size={100} color="#F1C40F" />
          <Text style={styles.title}>نِهَايَةُ التَّحَدِّي</Text>
          <Text style={styles.scoreTxt}>{score} نُقْطَةً</Text>
          <TouchableOpacity style={[styles.startBtn, {backgroundColor: '#3498DB'}]} onPress={exitToGames}>
            <Text style={styles.startBtnTxt}>عَالَمُ الْأَلْعَابِ 🎮</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8F9FF' },
  closeBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2C3E50', marginBottom: 10, textAlign: 'center' },
  nameTxt: { fontSize: 22, color: '#4A90E2', marginBottom: 30, fontWeight: 'bold' },
  header: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20, backgroundColor: '#FFF', padding: 15, borderRadius: 20, elevation: 3 },
  stat: { fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: '#FFF', padding: 25, borderRadius: 25, alignItems: 'center', marginBottom: 20, elevation: 3, width: '100%' },
  emoji: { fontSize: 60, marginBottom: 10 },
  question: { fontSize: 20, textAlign: 'center', fontWeight: 'bold', lineHeight: 30 },
  opt: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, marginVertical: 8, width: '100%', elevation: 2, borderWidth: 1, borderColor: '#EEE' },
  optTxt: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#34495E' },
  startBtn: { backgroundColor: '#2ECC71', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, elevation: 5 },
  startBtnTxt: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  scoreTxt: { fontSize: 40, fontWeight: 'bold', color: '#F1C40F', marginBottom: 30 }
});

export default YoyaGameV2;
