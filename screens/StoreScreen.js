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

    const currentCoins = await AsyncStorage.getItem('userCoins');
    const newTotal = parseInt(currentCoins || '0') + amount;
    await AsyncStorage.setItem('userCoins', newTotal.toString());
    
    Alert.alert('نجاح', `تم إضافة ${amount} نجمة إلى رصيدك! 🌟`);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>شحن النجوم 💎</Text>
      <Text style={styles.info}>للحصول على كود الشحن، يرجى تحويل المبلغ عبر فودافون كاش أو انستا باي إلى 01xxxxxxxxx ثم إرسال الكود المستلم هنا.</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="أدخل كود الشحن هنا" 
        onChangeText={setCode}
        autoCapitalize="characters"
      />
      
      <TouchableOpacity style={styles.btn} onPress={redeemCode}>
        <Text style={styles.btnText}>تفعيل الكود</Text>
      </TouchableOpacity>

      <View style={styles.priceList}>
        <Text style={styles.priceItem}>💰 100 نجمة = 100 جنيه (Story100)</Text>
        <Text style={styles.priceItem}>💰 200 نجمة = 200 جنيه (Story200)</Text>
        <Text style={styles.priceItem}>🔥 VIP 1500 نجمة = 1000 جنيه (StoryVIP)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: '#FFF', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  info: { textAlign: 'center', color: '#666', marginBottom: 30, lineHeight: 22 },
  input: { borderBottomWidth: 2, borderColor: '#4A90E2', fontSize: 20, textAlign: 'center', marginBottom: 20 },
  btn: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  priceList: { marginTop: 40, backgroundColor: '#F9F9F9', padding: 20, borderRadius: 15 },
  priceItem: { fontSize: 14, marginBottom: 10, color: '#444' }
});
