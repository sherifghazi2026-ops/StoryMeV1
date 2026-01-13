import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChildFormScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('boy');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // التحديث الجديد بدلاً من MediaTypeOptions
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name || !age) return Alert.alert('تنبيه', 'يرجى إدخال الاسم والعمر');
    const profile = { name, age, gender, image };
    await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
    await AsyncStorage.setItem('userCoins', '100');
    navigation.replace('MainMenu');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>بيانات بطلنا الصغير 🌟</Text>
      
      <TouchableOpacity onPress={pickImage} style={styles.photoBox}>
        {image ? <Image source={{ uri: image }} style={styles.img} /> : <Text>إضافة صورة 📸</Text>}
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="اسم الطفل" onChangeText={setName} />
      <TextInput style={styles.input} placeholder="العمر" keyboardType="numeric" onChangeText={setAge} />

      <View style={styles.row}>
        <TouchableOpacity onPress={() => setGender('boy')} style={[styles.choice, gender === 'boy' && styles.activeBoy]}>
          <Text>ولد 👦</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setGender('girl')} style={[styles.choice, gender === 'girl' && styles.activeGirl]}>
          <Text>بنت 👧</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.mainBtn} onPress={handleSave}>
        <Text style={styles.mainBtnText}>دخول عالم القصص 🚀</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, alignItems: 'center', backgroundColor: '#FFF' },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 30 },
  photoBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  input: { width: '100%', height: 50, backgroundColor: '#F0F0F0', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, textAlign: 'right' },
  row: { flexDirection: 'row', marginBottom: 30 },
  choice: { padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', marginHorizontal: 10 },
  activeBoy: { backgroundColor: '#D1E3FF' },
  activeGirl: { backgroundColor: '#FFD1DC' },
  mainBtn: { width: '100%', padding: 20, backgroundColor: '#4A90E2', borderRadius: 15, alignItems: 'center' },
  mainBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
