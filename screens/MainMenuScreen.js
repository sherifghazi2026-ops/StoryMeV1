import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MainMenuScreen({ navigation }) {
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);
  const [profile, setProfile] = useState({ name: 'بطلنا', image: null });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        let sCoins = await AsyncStorage.getItem('total_coins');
        let sGems = await AsyncStorage.getItem('total_gems');
        const sProfile = await AsyncStorage.getItem('userProfile');

        // نظام الرصيد الترحيبي لأول مرة
        if (sCoins === null) {
          await AsyncStorage.setItem('total_coins', '100');
          sCoins = '100';
        }
        if (sGems === null) {
          await AsyncStorage.setItem('total_gems', '20');
          sGems = '20';
        }

        setCoins(parseInt(sCoins));
        setGems(parseInt(sGems));
        if (sProfile) setProfile(JSON.parse(sProfile));
      } catch (e) {
        console.error("Error loading balances:", e);
      }
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.stat}><Text style={styles.statTxt}>🪙 {coins}</Text></View>
        <View style={styles.stat}><Text style={styles.statTxt}>💎 {gems}</Text></View>
        <TouchableOpacity onPress={() => navigation.navigate('ChildForm', { editMode: true })}>
          <Image
            source={profile.image ? { uri: profile.image } : { uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.welcome}>مرحباً يا {profile.name}! 👋</Text>

      <TouchableOpacity style={styles.mainBtn} onPress={() => navigation.navigate('StoryLibrary')}>
        <Text style={styles.btnText}>📚 مكتبة القصص</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#9B59B6' }]} onPress={() => navigation.navigate('GamesList')}>
        <Text style={styles.btnText}>🎮 عالم الألعاب</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity style={styles.subBtn} onPress={() => navigation.navigate('ChargeCoins')}>
          <Text style={styles.subBtnText}>شحن Coins 🪙</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.subBtn, { backgroundColor: '#FF6B6B' }]} onPress={() => navigation.navigate('ChargeGems')}>
          <Text style={styles.subBtnText}>شحن جواهر 💎</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F8F9FF', alignItems: 'center', paddingTop: 50 },
  topBar: { flexDirection: 'row', width: '90%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  stat: { backgroundColor: '#FFF', padding: 10, borderRadius: 15, elevation: 2, minWidth: 80, alignItems: 'center' },
  statTxt: { fontWeight: 'bold', fontSize: 16 },
  avatar: { width: 65, height: 65, borderRadius: 32.5, borderWidth: 2, borderColor: '#4A90E2' },
  welcome: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  mainBtn: { width: '85%', padding: 25, borderRadius: 20, backgroundColor: '#4A90E2', marginBottom: 20, elevation: 4 },
  btnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  row: { flexDirection: 'row', width: '85%', justifyContent: 'space-between', marginTop: 10 },
  subBtn: { width: '48%', padding: 15, backgroundColor: '#2ECC71', borderRadius: 15, alignItems: 'center', elevation: 2 },
  subBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});
