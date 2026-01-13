import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';

export default function GamesListScreen({ navigation }) {
  const availableGames = [
    { 
      id: 'yoya1', 
      name: 'مغامرة يوبا - Yoya Adventure', 
      image: require('../assets/Game1.jpg'), 
      screen: 'YoyaGame' 
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('MainMenu')}>
          <Text style={styles.backBtn}>🏠</Text>
        </TouchableOpacity>
        <Text style={styles.title}>منطقة الألعاب 🎮</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {availableGames.map((game) => (
          <TouchableOpacity 
            key={game.id} 
            style={styles.gameCard} 
            onPress={() => navigation.navigate(game.screen)}
          >
            {/* تم تعديل resizeMode و padding لتظهر الصورة كاملة */}
            <View style={styles.imgWrapper}>
               <Image source={game.image} style={styles.gameImg} resizeMode="contain" />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.playText}>اضغط للمغامرة 🚀</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF', paddingTop: 50 },
  header: { flexDirection: 'row-reverse', paddingHorizontal: 20, alignItems: 'center', marginBottom: 20, justifyContent: 'space-between' },
  backBtn: { fontSize: 28 },
  title: { fontSize: 24, fontWeight: 'bold' },
  list: { padding: 20, alignItems: 'center' },
  gameCard: { backgroundColor: '#FFF', borderRadius: 25, elevation: 8, width: '100%', marginBottom: 25, overflow: 'hidden' },
  imgWrapper: { backgroundColor: '#EEE', padding: 10 },
  gameImg: { width: '100%', height: 150 }, 
  gameInfo: { padding: 15, alignItems: 'center' },
  gameName: { fontSize: 18, fontWeight: 'bold', color: '#9B59B6' },
  playText: { fontSize: 13, color: '#666', marginTop: 5 }
});
