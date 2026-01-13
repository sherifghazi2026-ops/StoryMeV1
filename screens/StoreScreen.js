import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StoreScreen({ navigation }) {
  const [code, setCode] = useState('');

  const redeemCode = async () => {
    let amount = 0;
    if (code === 'Story100') amount = 100;
    else if (code === 'Story200') amount = 200;
    else if (code === 'StoryVIP') amount = 1500;
    else return Alert.alert('خطأ', 'الكود غير صحيح');

    try {
      const currentCoins = await AsyncStorage.getItem('userCoins');
      const newTotal = parseInt(currentCoins || '0') + amount;
      
      // حفظ الرصيد الجديد
      await AsyncStorage.setItem('userCoins', newTotal.toString());
      
      Alert.alert('تم الشحن! ✅', `تم إضافة ${amount} Coins بنجاح`, [
        { text: 'ذهاب للباقات', onPress: () => navigation.navigate('StoryLibrary') }
      ]);
    } catch (e) {
      Alert.alert('خطأ', 'فشل تحديث الرصيد');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>شحن المحفظة 💰</Text>
      
      <View style={styles.paymentBox}>
        <Text style={styles.phone}>01223369908</Text>
        <Text style={styles.step}>حول المبلغ ثم أرسل صورة المعاملة واتساب للرقم أعلاه</Text>
      </View>

      <TextInput 
        style={styles.input} 
        placeholder="أدخل كود التفعيل" 
        onChangeText={setCode}
        autoCapitalize="characters"
      />
      
      <TouchableOpacity style={styles.btn} onPress={redeemCode}>
        <Text style={styles.btnText}>تفعيل الكود</Text>
      </TouchableOpacity>

      <View style={styles.offers}>
        <Text style={styles.offerItem}>100 EGP = 100 Coins (Story100)</Text>
        <Text style={styles.offerItem}>200 EGP = 200 Coins (Story200)</Text>
        <Text style={styles.offerItem}>VIP Offer = 1500 Coins (StoryVIP)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 30, backgroundColor: '#FFF', flexGrow: 1, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', marginVertical: 20 },
  paymentBox: { width: '100%', backgroundColor: '#F0F4F8', padding: 20, borderRadius: 15, alignItems: 'center' },
  phone: { fontSize: 24, fontWeight: 'bold', color: '#4A90E2', marginBottom: 10 },
  step: { fontSize: 14, color: '#666', textAlign: 'center' },
  input: { width: '100%', borderBottomWidth: 2, borderColor: '#4CAF50', fontSize: 20, textAlign: 'center', marginVertical: 30 },
  btn: { width: '100%', backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  offers: { marginTop: 40, width: '100%' },
  offerItem: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 5 }
});
