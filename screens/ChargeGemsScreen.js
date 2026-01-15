import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform, Keyboard, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChargeGemsScreen({ navigation }) {
  const [currentGems, setCurrentGems] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const SUPPORT_PHONE = "01223369908"; // الرقم الذي طلبته

  useEffect(() => { loadBalances(); }, []);

  const loadBalances = async () => {
    try {
      const savedGems = await AsyncStorage.getItem('total_gems');
      if (savedGems !== null) setCurrentGems(parseInt(savedGems));
    } catch (e) { console.error(e); }
  };

  const handleApplyCode = async () => {
    const code = promoCode.trim().toUpperCase();
    let gemsToAdd = 0;
    if (code === 'GEMS100') gemsToAdd = 100;
    else if (code === 'GEMS200') gemsToAdd = 200;

    if (gemsToAdd > 0) {
      const newTotal = currentGems + gemsToAdd;
      await AsyncStorage.setItem('total_gems', newTotal.toString());
      setCurrentGems(newTotal);
      Alert.alert('تم الشحن! 💎', `تم إضافة ${gemsToAdd} جوهرة بنجاح.`);
      setPromoCode('');
      Keyboard.dismiss();
    } else {
      Alert.alert('خطأ ❌', 'كود الجواهر غير صحيح');
    }
  };

  const openWhatsApp = () => {
    const msg = "مرحباً، أريد شحن جواهر للألعاب.";
    const url = `whatsapp://send?phone=2${SUPPORT_PHONE}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => Alert.alert("خطأ", "تطبيق واتساب غير مثبت على جهازك"));
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: '#F8F9FF' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backTxt}>🔙</Text></TouchableOpacity>
          <Text style={styles.title}>مركز شحن الجواهر 💎</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>رصيد الجواهر الحالي</Text>
          <Text style={styles.balanceValue}>{currentGems} 💎</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.promoLabel}>أدخل كود التفعيل المستلم 👇</Text>
          <View style={styles.actionRow}>
            <TextInput 
              style={styles.compactInput} 
              placeholder="GEMS..." 
              placeholderTextColor="#999"
              value={promoCode} 
              onChangeText={setPromoCode} 
              autoCapitalize="none"
              color="#000000" // نص أسود واضح
            />
            <TouchableOpacity style={styles.compactBtn} onPress={handleApplyCode}><Text style={styles.applyBtnText}>تفعيل</Text></TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp}>
          <Text style={styles.btnTextWhite}>تواصل لشحن الجواهر (واتساب) 💬</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.phoneNum}>{SUPPORT_PHONE}</Text>
          <Text style={styles.infoText}>للشحن: حول فودافون كاش لهذا الرقم ثم أرسل صورة التحويل واتساب لتستلم الكود.</Text>
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
  balanceCard: { backgroundColor: '#2C3E50', margin: 20, padding: 25, borderRadius: 25, alignItems: 'center', elevation: 5 },
  balanceLabel: { color: '#BDC3C7', fontSize: 14 },
  balanceValue: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  inputContainer: { backgroundColor: '#FFF', margin: 20, padding: 20, borderRadius: 25, elevation: 5 },
  promoLabel: { textAlign: 'center', marginBottom: 12, fontWeight: 'bold', color: '#27AE60' },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  compactInput: { flex: 1, backgroundColor: '#F0F3F7', padding: 15, borderRadius: 15, fontSize: 18, marginRight: 10, textAlign: 'center' },
  compactBtn: { backgroundColor: '#27AE60', padding: 15, borderRadius: 15 },
  applyBtnText: { color: '#FFF', fontWeight: 'bold' },
  whatsappBtn: { backgroundColor: '#25D366', padding: 18, borderRadius: 20, alignItems: 'center', marginHorizontal: 20, elevation: 3 },
  btnTextWhite: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  infoBox: { backgroundColor: '#E8F4FD', margin: 20, padding: 20, borderRadius: 20, alignItems: 'center', borderLeftWidth: 5, borderLeftColor: '#2980B9' },
  phoneNum: { fontSize: 24, color: '#2980B9', fontWeight: 'bold' },
  infoText: { textAlign: 'center', color: '#34495E', fontSize: 13, marginTop: 10, lineHeight: 20 }
});
