import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// إعداد بيانات 20 لعبة مع تسعير تصاعدي يبدأ من 100 وصولاً إلى 2000
const gamesData = Array.from({ length: 20 }, (_, i) => ({
  id: (i + 1).toString(),
  name: `مغامرة يويا ${i + 1}`,
  screen: `GameScreen`, 
  price: (i + 1) * 100, // اللعبة الأولى 100، الثانية 200، إلخ.
}));

export default function GamesListScreen({ navigation }) {
  const [userGems, setUserGems] = useState(0);
  const [unlockedGames, setUnlockedGames] = useState([]); // لا توجد ألعاب مفتوحة تلقائياً
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) { loadData(); }
  }, [isFocused]);

  const loadData = async () => {
    try {
      const savedGems = await AsyncStorage.getItem('total_gems');
      const savedUnlocked = await AsyncStorage.getItem('unlockedGames');
      
      setUserGems(savedGems ? parseInt(savedGems) : 0);
      
      if (savedUnlocked) {
        setUnlockedGames(JSON.parse(savedUnlocked));
      } else {
        // في البداية لا يوجد ألعاب مفتوحة
        setUnlockedGames([]);
      }
    } catch (e) {
      console.error("Error loading games data", e);
    }
  };

  const handleGamePress = async (game) => {
    if (unlockedGames.includes(game.id)) {
      // إذا كانت مفتوحة، ننتقل للعبة ونمرر رقم المستوى
      navigation.navigate('GameScreen', { level: parseInt(game.id) });
    } else {
      // إذا كانت مغلقة، نتحقق من الرصيد للشراء
      if (userGems >= game.price) {
        Alert.alert('فتح مغامرة جديدة 💎', `هل تريد صرف ${game.price} جوهرة لفتح "${game.name}"؟`, [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'شراء وفتح ✅', onPress: () => unlockGame(game) }
        ]);
      } else {
        Alert.alert('رصيدك لا يكفي ❌', `سعر اللعبة ${game.price} جوهرة. اجمع المزيد من الجواهر عبر قراءة القصص!`);
      }
    }
  };

  const unlockGame = async (game) => {
    try {
      const newBalance = userGems - game.price;
      const newUnlocked = [...unlockedGames, game.id];
      
      await AsyncStorage.setItem('total_gems', newBalance.toString());
      await AsyncStorage.setItem('unlockedGames', JSON.stringify(newUnlocked));
      
      setUserGems(newBalance);
      setUnlockedGames(newUnlocked);
      
      Alert.alert('نجاح ✅', `تم فتح "${game.name}" بنجاح!`);
    } catch (err) {
      Alert.alert('خطأ', 'حدثت مشكلة أثناء الشراء.');
    }
  };

  const renderGameItem = ({ item }) => {
    const isLocked = !unlockedGames.includes(item.id);
    return (
      <TouchableOpacity 
        style={[styles.card, isLocked && styles.cardLocked]} 
        onPress={() => handleGamePress(item)}
      >
        <Image source={require('../assets/Game1.jpg')} style={styles.gameIcon} />
        <Text style={styles.gameName}>{item.name}</Text>
        <View style={isLocked ? styles.priceTag : styles.openTag}>
          <Text style={styles.tagText}>{isLocked ? `🔒 ${item.price} 💎` : 'العب الآن'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>🏠</Text>
        </TouchableOpacity>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceValue}>{userGems} 💎</Text>
        </View>
      </View>
      
      <Text style={styles.pageTitle}>متجر ألعاب يويا</Text>
      
      <FlatList
        data={gamesData}
        renderItem={renderGameItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listPadding}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F5FF', paddingTop: 50 },
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center' },
  backBtn: { padding: 10, backgroundColor: '#FFF', borderRadius: 15, elevation: 3 },
  backTxt: { fontSize: 20 },
  balanceContainer: { backgroundColor: '#FFD700', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, elevation: 4 },
  balanceValue: { fontWeight: 'bold', color: '#000', fontSize: 16 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#2C3E50' },
  listPadding: { paddingHorizontal: 10, paddingBottom: 30 },
  card: { flex: 1, margin: 10, backgroundColor: '#FFF', borderRadius: 25, padding: 15, alignItems: 'center', elevation: 5 },
  cardLocked: { opacity: 0.85, backgroundColor: '#E0E7FF' },
  gameIcon: { width: width * 0.28, height: width * 0.28, borderRadius: 20, marginBottom: 10 },
  gameName: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center', marginBottom: 10, height: 35 },
  priceTag: { backgroundColor: '#FF4757', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  openTag: { backgroundColor: '#2ED573', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tagText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 }
});
