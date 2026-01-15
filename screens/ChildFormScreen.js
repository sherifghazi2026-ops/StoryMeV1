import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChildFormScreen({ route, navigation }) {
  const { editMode } = route.params || {};
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('boy');

  // الرابط الذي اخترته وتثبيته للجميع
  const FIXED_BLANK_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

  useEffect(() => {
    if (editMode) loadCurrentData();
  }, []);

  const loadCurrentData = async () => {
    try {
      const data = await AsyncStorage.getItem('userProfile');
      if (data) {
        const p = JSON.parse(data);
        setName(p.name);
        setAge(p.age);
        setGender(p.gender || 'boy');
        setImage(p.image);
      }
    } catch (e) { console.log(e); }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name || !age) return Alert.alert('تنبيه', 'يرجى إكمال البيانات');
    try {
      const profile = { name, age, gender, image };
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));

      if (!editMode) {
        if (await AsyncStorage.getItem('total_coins') === null) await AsyncStorage.setItem('total_coins', '100');
        if (await AsyncStorage.getItem('total_gems') === null) await AsyncStorage.setItem('total_gems', '20');
        navigation.replace('MainMenu');
      } else {
        Alert.alert('نجاح', 'تم تحديث الملف الشخصي');
        navigation.goBack();
      }
    } catch (e) { Alert.alert('خطأ', 'فشل حفظ البيانات'); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{editMode ? 'تعديل الملف الشخصي' : 'بيانات بطلنا الصغير'}</Text>
        
        <TouchableOpacity onPress={pickImage} style={styles.photoBox}>
          <Image 
            source={{ uri: image ? image : FIXED_BLANK_AVATAR }} 
            style={styles.img} 
          />
          <View style={styles.cameraTag}><Text style={{fontSize: 10, color: '#FFF'}}>تغيير 📸</Text></View>
        </TouchableOpacity>

        <View style={styles.inputArea}>
          <Text style={styles.label}>اسم الطفل</Text>
          <TextInput
            style={styles.input}
            value={name}
            placeholder="اكتب اسمك هنا"
            placeholderTextColor="#999"
            onChangeText={setName}
            color="#000000"
          />
        </View>

        <View style={styles.inputArea}>
          <Text style={styles.label}>العمر</Text>
          <TextInput
            style={styles.input}
            value={age}
            placeholder="اكتب العمر"
            placeholderTextColor="#999"
            keyboardType="numeric"
            onChangeText={setAge}
            color="#000000"
          />
        </View>

        <View style={styles.row}>
          <TouchableOpacity onPress={() => setGender('boy')} style={[styles.choice, gender === 'boy' && styles.activeBoy]}>
            <Text style={{color: '#000', fontWeight: 'bold'}}>ولد 👦</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGender('girl')} style={[styles.choice, gender === 'girl' && styles.activeGirl]}>
            <Text style={{color: '#000', fontWeight: 'bold'}}>بنت 👧</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.mainBtn} onPress={handleSave}>
          <Text style={styles.mainBtnText}>{editMode ? 'تحديث البيانات' : 'دخول عالم المغامرات 🚀'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, alignItems: 'center', backgroundColor: '#F8F9FF', paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#2C3E50' },
  photoBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#EEE', marginBottom: 20, overflow: 'hidden', borderWidth: 3, borderColor: '#4A90E2', position: 'relative' },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  cameraTag: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', paddingVertical: 2 },
  inputArea: { width: '100%', marginBottom: 15 },
  label: { textAlign: 'right', marginBottom: 5, color: '#34495E', fontWeight: 'bold', marginRight: 5 },
  input: { width: '100%', height: 55, backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 15, textAlign: 'right', fontSize: 18, color: '#000000', borderWidth: 1, borderColor: '#D1D8E0' },
  row: { flexDirection: 'row', marginBottom: 30, marginTop: 10 },
  choice: { padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', marginHorizontal: 10, width: 90, alignItems: 'center', backgroundColor: '#FFF' },
  activeBoy: { backgroundColor: '#D1E3FF', borderColor: '#4A90E2' },
  activeGirl: { backgroundColor: '#FFD1DC', borderColor: '#FF6B6B' },
  mainBtn: { width: '100%', padding: 20, backgroundColor: '#4A90E2', borderRadius: 15, alignItems: 'center', elevation: 3 },
  mainBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
