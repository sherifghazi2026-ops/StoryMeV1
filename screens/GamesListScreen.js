import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

const gamesData = [
  { id: '1', name: 'صيد الجواهر', icon: '💎', price: 0, screen: 'YoyaGameV1' },
  { id: '2', name: 'تحدي الأخلاق', icon: '🏆', price: 100, screen: 'YoyaGameV2' },
  { id: '3', name: 'مغامرة ممتعة', icon: '🏃‍♂️', price: 200, screen: 'YoyaGameV3' },
  { id: '4', name: 'بالونات الألوان', icon: '🎈', price: 300, screen: 'YoyaGameV4' },
  { id: '5', name: 'صيد البحيرة', icon: '🎣', price: 400, screen: 'YoyaGameV5' },
];

// تكملة القائمة تلقائياً حتى 20 مع أسماء عامة
for(let i=6; i<=20; i++) {
  gamesData.push({
    id: i.toString(),
    name: `تحدي ${i}`,
    icon: '🎮',
    price: i * 100,
    screen: `YoyaGameV${i}`
  });
}

export default function GamesListScreen({ navigation }) {
  const [userGems, setUserGems] = useState(0);
  const [unlockedGames, setUnlockedGames] = useState(["1"]); // اللعبة الأولى مفتوحة دائماً
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused]);

  const loadData = async () => {
    try {
      const savedGems = await AsyncStorage.getItem('total_gems');
      const savedUnlocked = await AsyncStorage.getItem('unlockedGames');
      setUserGems(savedGems ? parseInt(savedGems) : 0);
      if (savedUnlocked) setUnlockedGames(JSON.parse(savedUnlocked));
    } catch (e) {
      console.log("Error loading data");
    }
  };

  const handleGamePress = (game) => {
    if (unlockedGames.includes(game.id)) {
      navigation.navigate(game.screen, { gameName: game.name });
    } else {
      if (userGems >= game.price) {
        Alert.alert('فتح اللعبة', `هل تريد صرف ${game.price} جوهرة لفتح ${game.name}؟`, [
          { text: 'إلغاء' },
          { text: 'فتح الآن', onPress: () => unlockGame(game) }
        ]);
      } else {
        Alert.alert('رصيدك غير كافٍ', `تحتاج إلى ${game.price} جوهرة.`);
      }
    }
  };

  const unlockGame = async (game) => {
    const newBalance = userGems - game.price;
    const newUnlocked = [...unlockedGames, game.id];
    await AsyncStorage.setItem('total_gems', newBalance.toString());
    await AsyncStorage.setItem('unlockedGames', JSON.stringify(newUnlocked));
    setUserGems(newBalance);
    setUnlockedGames(newUnlocked);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('MainMenu')}>
          <Text style={styles.back}>🏠</Text>
        </TouchableOpacity>
        <View style={styles.gemBadge}>
          <Text style={styles.gemsTxt}>💎 {userGems}</Text>
        </View>
      </View>

      <Text style={styles.mainTitle}>عالم الألعاب 🎮</Text>

      <FlatList
        data={gamesData}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isUnlocked = unlockedGames.includes(item.id);
          return (
            <TouchableOpacity
              style={[styles.card, !isUnlocked && styles.lockedCard]}
              onPress={() => handleGamePress(item)}
            >
              <Text style={styles.icon}>{isUnlocked ? item.icon : '🔒'}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.status}>
                {isUnlocked ? 'العب الآن ▶️' : `${item.price} 💎`}
              </Text>
            </TouchableOpacity>
          );
        }}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 50 },
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center' },
  back: { fontSize: 30 },
  gemBadge: { backgroundColor: '#2980B9', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 20 },
  gemsTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 15, color: '#2C3E50' },
  listContent: { paddingHorizontal: 10, paddingBottom: 40 },
  card: {
    width: COLUMN_WIDTH,
    margin: 10,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 5,
    borderBottomWidth: 4,
    borderBottomColor: '#BDC3C7'
  },
  lockedCard: { backgroundColor: '#F2F2F2', opacity: 0.7 },
  icon: { fontSize: 50, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center' },
  status: { fontSize: 12, fontWeight: 'bold', marginTop: 8, color: '#E67E22' }
});
