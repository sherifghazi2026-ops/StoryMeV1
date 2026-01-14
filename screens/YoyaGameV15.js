import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function YoyaGameV15({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎮</Text>
      <Text style={styles.title}>مغامرة يويا ${i}</Text>
      <Text style={styles.soon}>قريباً في التحديث القادم...</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
        <Text style={styles.btnText}>رجوع للقائمة</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F8FF' },
  emoji: { fontSize: 80 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  soon: { fontSize: 18, color: '#FF7F50', marginVertical: 20 },
  btn: { padding: 15, backgroundColor: '#3498DB', borderRadius: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});
