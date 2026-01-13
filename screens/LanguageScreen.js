import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function LanguageScreen({ navigation }) {
  const logoUrl = 'https://raw.githubusercontent.com/sherifghazi2026-ops/StoryMeApp/refs/heads/main/square-1-1-1767863955346.png';

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>اختر اللغة / Choose Language</Text>
      
      {/* تكبير اللوجو قليلاً */}
      <Image source={{ uri: logoUrl }} style={styles.logo} />

      {/* تصغير الأزرار وتوحيد مقاساتها */}
      <TouchableOpacity style={styles.langBtn} onPress={() => navigation.navigate('ChildForm')}>
        <Text style={styles.mainBtnText}>🇪🇬 العربية</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.langBtn, {backgroundColor: '#FF6B6B'}]}>
        <Text style={styles.mainBtnText}>🇺🇸 English</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F8FF', alignItems: 'center', justifyContent: 'center' },
  headerText: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#555' },
  logo: { width: 250, height: 250, marginBottom: 50, borderRadius: 25 },
  langBtn: { width: width * 0.7, paddingVertical: 15, backgroundColor: '#4A90E2', borderRadius: 15, alignItems: 'center', marginBottom: 15, elevation: 3 },
  mainBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' }
});
