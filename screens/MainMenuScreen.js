import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MainMenuScreen({ navigation }) {
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    const loadCoins = async () => {
      let savedCoins = await AsyncStorage.getItem('userCoins');
      if (savedCoins === null) {
        await AsyncStorage.setItem('userCoins', '10'); // هدايا البداية
        setCoins(10);
      } else {
        setCoins(parseInt(savedCoins));
      }
    };
    const unsubscribe = navigation.addListener('focus', loadCoins);
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.coinBadge}>
        <Text style={styles.coinText}>رصيدك: {coins} ⭐️</Text>
      </View>
      
      <Text style={styles.welcome}>مرحباً بك في عالم القصص! 🌟</Text>
      
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('StoryLibrary')}>
        <Text style={styles.cardText}>📚 مكتبة القصص</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.card, {backgroundColor: '#FFD700'}]} onPress={() => navigation.navigate('Store')}>
        <Text style={styles.cardText}>💎 اشحن نجوم</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8' },
  coinBadge: { position: 'absolute', top: 50, right: 20, backgroundColor: '#FFF', padding: 10, borderRadius: 20, elevation: 3 },
  coinText: { fontWeight: 'bold', color: '#FFA500' },
  welcome: { fontSize: 24, fontWeight: 'bold', marginBottom: 40 },
  card: { width: '85%', padding: 30, backgroundColor: '#FFF', borderRadius: 20, marginBottom: 20, elevation: 5 },
  cardText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' }
});
