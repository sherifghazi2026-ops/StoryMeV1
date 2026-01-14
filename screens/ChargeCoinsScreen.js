import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChargeCoinsScreen({ navigation }) {
  const [currentCoins, setCurrentCoins] = useState(0);
  const [promoCode, setPromoCode] = useState('');

  // عند فتح الشاشة، نقوم بتحميل الرصيد المحفوظ سابقاً
  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      const savedCoins = await AsyncStorage.getItem('total_coins');
      if (savedCoins !== null) {
        setCurrentCoins(parseInt(savedCoins));
      }
    } catch (e) {
      console.error("خطأ في تحميل العملات", e);
    }
  };

  const handleApplyCode = async () => {
    const code = promoCode.trim().toUpperCase();
    let coinsToAdd = 0;

    if (code === 'STORY200') coinsToAdd = 200;
    else if (code === 'STORYVIP') coinsToAdd = 1500;

    if (coinsToAdd > 0) {
      const newTotal = currentCoins + coinsToAdd;
      // الحفظ في AsyncStorage لضمان بقاء الرصيد بعد قفل التطبيق
      await AsyncStorage.setItem('total_coins', newTotal.toString());
      setCurrentCoins(newTotal);
      Alert.alert('تم الشحن! 🪙', `تم إضافة ${coinsToAdd} عملة للقصص بنجاح.`);
      setPromoCode('');
      Keyboard.dismiss();
    } else {
      Alert.alert('خطأ ❌', 'كود التفعيل غير صحيح');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: '#FFFDF8' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backTxt}>🔙</Text></TouchableOpacity>
          <Text style={styles.title}>مركز شحن العملات 🪙</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>رصيدك الدائم</Text>
          <Text style={styles.balanceValue}>{currentCoins} 🪙</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.promoLabel}>أدخل كود العملات واضغط تفعيل 👇</Text>
          <View style={styles.actionRow}>
            <TextInput style={styles.compactInput} placeholder="مثال: STORY200" value={promoCode} onChangeText={setPromoCode} autoCapitalize="none" />
            <TouchableOpacity style={styles.compactBtn} onPress={handleApplyCode}><Text style={styles.applyBtnText}>تفعيل ✅</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.phoneNum}>01223369908</Text>
          <Text style={styles.infoText}>للشحن: حول فودافون كاش لهذا الرقم ثم أرسل صورة التحويل واتساب لتستلم كود التفعيل.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  backBtn: { padding: 12, backgroundColor: '#FFF', borderRadius: 15, elevation: 3 },
  backTxt: { fontSize: 20 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#333' },
  balanceCard: { backgroundColor: '#8E44AD', margin: 20, padding: 25, borderRadius: 25, alignItems: 'center', elevation: 5 },
  balanceLabel: { color: '#D5DBDB', fontSize: 14 },
  balanceValue: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  inputContainer: { backgroundColor: '#FFF', margin: 20, padding: 20, borderRadius: 25, elevation: 5 },
  promoLabel: { textAlign: 'center', marginBottom: 12, fontWeight: 'bold', color: '#8E44AD' },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  compactInput: { flex: 1, backgroundColor: '#FBFAFF', padding: 15, borderRadius: 15, fontSize: 18, marginRight: 10, textAlign: 'center' },
  compactBtn: { backgroundColor: '#8E44AD', padding: 15, borderRadius: 15 },
  applyBtnText: { color: '#FFF', fontWeight: 'bold' },
  infoBox: { backgroundColor: '#FDF2FA', margin: 20, padding: 20, borderRadius: 20, alignItems: 'center', borderLeftWidth: 5, borderLeftColor: '#8E44AD' },
  phoneNum: { fontSize: 24, color: '#8E44AD', fontWeight: 'bold' },
  infoText: { textAlign: 'center', color: '#34495E', fontSize: 13, marginTop: 10, lineHeight: 20 }
});
