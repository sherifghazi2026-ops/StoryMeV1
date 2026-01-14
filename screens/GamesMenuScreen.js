import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

const GAMES_LIST = [
  { id: 'YoyaGameV1', name: 'صيد الجواهر', icon: '💎', color: '#5F27CD' },
  { id: 'YoyaGameV2', name: 'متاهة يويا', icon: '🧩', color: '#FF6B6B' },
  { id: 'YoyaGameV3', name: 'مغامرة يويا', icon: '🏃‍♂️', color: '#FF9F43' },
  { id: 'YoyaGameV4', name: 'بالونات يويا', icon: '🎈', color: '#F368E0' },
  { id: 'YoyaGameV5', name: 'صيد البحيرة', icon: '🎣', color: '#54A0FF' },
];

for(let i=6; i<=20; i++) {
  GAMES_LIST.push({ id: `YoyaGameV${i}`, name: `مغامرة ${i}`, icon: '🎮', color: '#1DD1A1' });
}

export default function GamesMenuScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('MainMenu')} style={styles.backBtn}>
          <Text style={styles.backTxt}>🏠</Text>
        </TouchableOpacity>
        <Text style={styles.title}>عالم ألعاب يويا 🎮</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollArea}>
        <View style={styles.grid}>
          {GAMES_LIST.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.gameCard, { backgroundColor: game.color }]}
              onPress={() => navigation.navigate(game.id, { gameName: game.name })}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.gameIcon}>{game.icon}</Text>
              </View>
              <Text style={styles.gameName}>{game.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F3F5', paddingTop: 50 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20, alignItems: 'center' },
  backBtn: { width: 50, height: 50, backgroundColor: '#FFF', borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  backTxt: { fontSize: 25 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  scrollArea: { paddingHorizontal: 20, paddingBottom: 50 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  gameCard: { width: COLUMN_WIDTH, height: 160, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 8 },
  iconContainer: { width: 65, height: 65, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  gameIcon: { fontSize: 35 },
  gameName: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }
});
