import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bundlesData } from '../data/storiesData';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 50) / 2;
const cardColors = ['#FF9F43', '#00D2D3', '#54A0FF', '#5F27CD', '#FF6B6B', '#1DD1A1'];

export default function StoryLibraryScreen({ navigation }) {
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [totalCoins, setTotalCoins] = useState(0);
  const [unlocked, setUnlocked] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { loadData(); });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const c = await AsyncStorage.getItem('total_coins');
    const u = await AsyncStorage.getItem('unlockedBundles');
    let unlockedList = u ? JSON.parse(u) : [];
    if (!unlockedList.includes('1')) {
      unlockedList.push('1');
      await AsyncStorage.setItem('unlockedBundles', JSON.stringify(unlockedList));
    }
    setTotalCoins(parseInt(c || '0'));
    setUnlocked(unlockedList);
  };

  const openBundle = (bundle) => {
    if (unlocked.includes(bundle.id)) { setSelectedBundle(bundle); }
    else {
      Alert.alert('فتح الباقة 🔓', `سعر هذه الباقة ${bundle.price} Coins`, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'فتح الآن ✅', onPress: () => unlock(bundle) }
      ]);
    }
  };

  const unlock = async (bundle) => {
    if (totalCoins >= bundle.price) {
      const newBalance = totalCoins - bundle.price;
      const newUnlocked = [...unlocked, bundle.id];
      await AsyncStorage.setItem('total_coins', newBalance.toString());
      await AsyncStorage.setItem('unlockedBundles', JSON.stringify(newUnlocked));
      setTotalCoins(newBalance);
      setUnlocked(newUnlocked);
      setSelectedBundle(bundle);
    } else {
      Alert.alert('عذراً!', 'رصيدك لا يكفي لشراء هذه الباقة.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => selectedBundle ? setSelectedBundle(null) : navigation.navigate('MainMenu')} style={styles.iconCircle}>
          <Text style={styles.backTxt}>{selectedBundle ? "🔙" : "🏠"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedBundle ? selectedBundle.name : 'مكتبة القصص'}</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinCount}>🪙 {totalCoins}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea}>
        {!selectedBundle ? (
          (bundlesData || []).map(b => (
            <TouchableOpacity key={b.id} style={[styles.bundleCard, unlocked.includes(b.id) && styles.unlockedCard]} onPress={() => openBundle(b)}>
              <View style={styles.bundleInfo}>
                <Text style={styles.bundleNameText}>{b.name}</Text>
                {!unlocked.includes(b.id) && <Text style={styles.bundlePriceText}>{b.price} Coins</Text>}
              </View>
              <Text style={styles.bundleIconText}>{unlocked.includes(b.id) ? b.icon : '🔒'}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.storiesGrid}>
            {selectedBundle.stories.map((s, index) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.storyCard, { borderTopColor: cardColors[index % cardColors.length], borderTopWidth: 5 }]}
                onPress={() => navigation.navigate('StoryReader', { bundleId: selectedBundle.id, storyId: s.id })}
              >
                <View style={[styles.emojiContainer, { backgroundColor: cardColors[index % cardColors.length] + '20' }]}>
                  <Text style={styles.storyEmojiText}>{s.emoji || '📖'}</Text>
                </View>
                {/* الحل هنا: زيادة الارتفاع والسماح بالتفاف النص */}
                <View style={styles.titleWrapper}>
                   <Text style={styles.storyTitleText} numberOfLines={3} adjustsFontSizeToFit>{s.title}</Text>
                </View>
                <View style={[styles.readButtonSmall, { backgroundColor: cardColors[index % cardColors.length] }]}>
                  <Text style={styles.readButtonText}>إبدأ الآن</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBFF', paddingTop: 50 },
  headerBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  iconCircle: { width: 45, height: 45, backgroundColor: '#FFF', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  backTxt: { fontSize: 22 },
  coinBadge: { backgroundColor: '#27AE60', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, elevation: 3 },
  coinCount: { fontSize: 15, fontWeight: 'bold', color: '#FFF' },
  scrollArea: { paddingHorizontal: 15, paddingBottom: 50 },
  bundleCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 25, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 3 },
  unlockedCard: { borderColor: '#27AE60', borderWidth: 2 },
  bundleInfo: { flex: 1, alignItems: 'flex-end', marginRight: 15 },
  bundleNameText: { fontSize: 18, fontWeight: 'bold' },
  bundlePriceText: { color: '#E67E22', fontWeight: 'bold', fontSize: 13 },
  bundleIconText: { fontSize: 35 },
  storiesGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  storyCard: { width: CARD_WIDTH, backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 15, alignItems: 'center', elevation: 4, minHeight: 180 },
  emojiContainer: { width: 65, height: 65, borderRadius: 32.5, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  storyEmojiText: { fontSize: 30 },
  titleWrapper: { height: 50, justifyContent: 'center', width: '100%' }, // مساحة ثابتة للعنوان
  storyTitleText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  readButtonSmall: { paddingVertical: 5, paddingHorizontal: 15, borderRadius: 10, marginTop: 5 },
  readButtonText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' }
});
