import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LanguageScreen({ navigation }) {
  const logoUrl = 'https://raw.githubusercontent.com/sherifghazi2026-ops/StoryMeApp/refs/heads/main/square-1-1-1767863955346.png';

  return (
    <View style={styles.container}>
      {/* نص العنوان */}
      <Text style={styles.headerText}>اختر اللغة / Choose Language</Text>

      {/* اللوجو شفاف وبدون حدود */}
      <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />

      {/* أزرار اللغة */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.langBtn} onPress={() => navigation.navigate('ChildForm')}>
          <Text style={styles.mainBtnText}>🇪🇬 العربية</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.langBtn, styles.enBtn]} onPress={() => {}}>
          <Text style={styles.mainBtnText}>🇺🇸 English</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#E3F2FD', // لون أزرق سماوي مريح جداً للعين
    alignItems: 'center', 
    paddingTop: height * 0.08 
  },
  headerText: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 30, 
    color: '#37474F' // لون رمادي غامق مريح
  },
  logo: { 
    width: width * 0.85, 
    height: width * 0.85, 
    marginBottom: 40,
    // تم حذف الـ elevation والظلال لجعل اللوجو شفافاً تماماً كما هو في الصورة الأصلية
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  langBtn: { 
    width: width * 0.75, 
    paddingVertical: 18, 
    backgroundColor: '#64B5F6', // أزرق مبهج
    borderRadius: 30, 
    alignItems: 'center', 
    marginBottom: 20, 
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  enBtn: {
    backgroundColor: '#FF8A80' // أحمر مرجاني هادئ ومبهج
  },
  mainBtnText: { 
    color: '#FFF', 
    fontSize: 22, 
    fontWeight: 'bold' 
  }
});
