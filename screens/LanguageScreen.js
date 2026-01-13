import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function LanguageScreen({ navigation }) {
  const logoUrl = 'https://raw.githubusercontent.com/sherifghazi2026-ops/StoryMeApp/refs/heads/main/square-1-1-1767863955346.png';

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>اختر اللغة / Choose Language</Text>
      
      <Image source={{ uri: logoUrl }} style={styles.logo} />

      <TouchableOpacity style={styles.arBtn} onPress={() => navigation.navigate('ChildForm')}>
        <Text style={styles.flagIcon}>🇸🇦</Text>
        <Text style={styles.mainBtnText}>العربية</Text>
        <Text style={styles.subBtnText}>قصص الأطفال</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.enBtn}>
        <Text style={styles.flagIcon}>🇺🇸</Text>
        <Text style={styles.mainBtnText}>English</Text>
        <Text style={styles.subBtnText}>Coming Soon</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F8FF', alignItems: 'center', justifyContent: 'center' },
  headerText: { fontSize: 20, fontWeight: 'bold', marginBottom: 30 },
  logo: { width: 200, height: 200, marginBottom: 40, borderRadius: 20 },
  arBtn: { width: width * 0.85, padding: 25, backgroundColor: '#4A90E2', borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  enBtn: { width: width * 0.85, padding: 25, backgroundColor: '#FF6B6B', borderRadius: 20, alignItems: 'center' },
  flagIcon: { fontSize: 30, marginBottom: 5 },
  mainBtnText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  subBtnText: { color: '#FFF', fontSize: 14 }
});
