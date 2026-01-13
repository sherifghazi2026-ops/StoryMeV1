import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bundlesData } from '../data/storiesData';

const { width } = Dimensions.get('window');

export default function StoryLibraryScreen({ navigation }) {
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [userCoins, setUserCoins] = useState(0);
  const [unlocked, setUnlocked] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const c = await AsyncStorage.getItem('userCoins');
      const u = await AsyncStorage.getItem('unlockedBundles');
      
      setUserCoins(parseInt(c || '0'));
      // الحماية: إذا كانت القيمة null نستخدم مصفوفة فارغة لتجنب خطأ التفسير
      setUnlocked(u ? JSON.parse(u) : []);
    } catch (e) {
      console.log("Error loading data", e);
      setUnlocked([]);
    }
  };

  const openBundle = (bundle) => {
    if (unlocked && unlocked.includes(bundle.id)) {
      setSelectedBundle(bundle);
    } else {
      Alert.alert('فتح الباقة', `سعر الباقة ${bundle.price} Coins`, [
        {text: 'إلغاء'},
        {text: 'فتح وتفعيل', onPress: () => unlock(bundle)}
      ]);
    }
  };

  const unlock = async (bundle) => {
    if (userCoins >= bundle.price) {
      const newBalance = userCoins - bundle.price;
      const newUnlocked = [...unlocked, bundle.id];
      await AsyncStorage.setItem('userCoins', newBalance.toString());
      await AsyncStorage.setItem('unlockedBundles', JSON.stringify(newUnlocked));
      setUserCoins(newBalance); 
      setUnlocked(newUnlocked);
      setSelectedBundle(bundle);
    } else { 
      Alert.alert('رصيدك لا يكفي', 'توجه للمتجر لشحن Coins للقصص'); 
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
         <TouchableOpacity onPress={() => selectedBundle ? setSelectedBundle(null) : navigation.navigate('MainMenu')}>
            <Text style={styles.backTxt}>🏠</Text>
         </TouchableOpacity>
         <Text style={styles.headerTitle}>{selectedBundle ? selectedBundle.name : 'مكتبة القصص'}</Text>
         <Text style={styles.coinCount}>🪙 {userCoins}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea}>
        {!selectedBundle ? (
          (bundlesData || []).map(b => (
            <TouchableOpacity key={b.id} style={[styles.card, unlocked.includes(b.id) && styles.unlockedCard]} onPress={() => openBundle(b)}>
              <Text style={styles.icon}>{unlocked.includes(b.id) ? b.icon : '🔒'}</Text>
              <Text style={styles.bundleName}>{b.name}</Text>
              {!unlocked.includes(b.id) && <Text style={styles.priceTag}>{b.price} Coins</Text>}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.storiesList}>
            {selectedBundle.stories.map(s => (
              <TouchableOpacity key={s.id} style={styles.storyItem} onPress={() => navigation.navigate('StoryReader', {bundleId: selectedBundle.id})}>
                <Text style={styles.storyTitle}>📖 {s.title}</Text>
                <Text style={styles.readBtn}>إقرأ</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', paddingTop: 50 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  backTxt: { fontSize: 24 },
  coinCount: { fontSize: 16, fontWeight: 'bold', color: '#2ECC71' },
  scrollArea: { paddingHorizontal: 15, paddingBottom: 30 },
  card: { width: '100%', backgroundColor: '#E0E0E0', padding: 20, borderRadius: 15, marginBottom: 15, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  unlockedCard: { backgroundColor: '#FFF', elevation: 3 },
  icon: { fontSize: 30 },
  bundleName: { fontSize: 18, fontWeight: 'bold' },
  priceTag: { color: '#E67E22', fontWeight: 'bold' },
  storiesList: { width: '100%' },
  storyItem: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row-reverse', justifyContent: 'space-between' },
  storyTitle: { fontSize: 16 },
  readBtn: { color: '#4A90E2', fontWeight: 'bold' }
});
