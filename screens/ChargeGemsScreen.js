import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Dimensions, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function ChargeGemsScreen({ navigation }) {
  const [currentGems, setCurrentGems] = useState(0);
  const [currentCoins, setCurrentCoins] = useState(0);
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    const savedGems = await AsyncStorage.getItem('total_gems');
    const savedCoins = await AsyncStorage.getItem('total_coins');
    if (savedGems) setCurrentGems(parseInt(savedGems));
    if (savedCoins) setCurrentCoins(parseInt(savedCoins));
  };

  const handleApplyCode = async () => {
    const code = promoCode.trim().toUpperCase();
    let gemsToAdd = 0;
    let coinsToAdd = 0;

    if (code === 'GEMS100') gemsToAdd = 100;
    else if (code === 'GEMS200') gemsToAdd = 200;
    else if (code === 'STORY200') coinsToAdd = 200;
    else if (code === 'STORYVIP') coinsToAdd = 1500;

    if (gemsToAdd > 0 || coinsToAdd > 0) {
      if (gemsToAdd > 0) {
        const newTotal = currentGems + gemsToAdd;
        await AsyncStorage.setItem('total_gems', newTotal.toString());
        setCurrentGems(newTotal);
        Alert.alert('تم الشحن! 💎', `تم إضافة ${gemsToAdd} جوهرة للألعاب.`);
      } else {
        const newTotal = currentCoins + coinsToAdd;
        await AsyncStorage.setItem('total_coins', newTotal.toString());
        setCurrentCoins(newTotal);
        Alert.alert('تم الشحن! 🪙', `تم إضافة ${coinsToAdd} عملة للقصص.`);
      }
      setPromoCode('');
      Keyboard.dismiss(); // إغلاق الكيبورد تلقائياً عند النجاح
    } else {
      Alert.alert('خطأ ❌', 'الكود غير صحيح');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1, backgroundColor: '#F8F9FF' }}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backTxt}>🔙</Text>
          </TouchableOpacity>
          <Text style={styles.title}>مركز الشحن السريع 💰</Text>
        </View>

        {/* القسم المحدث: خانة الكود والزر في بلوك واحد بارز */}
        <View style={styles.inputContainer}>
          <Text style={styles.promoLabel}>أدخل الكود واضغط تفعيل 👇</Text>
          <View style={styles.actionRow}>
            <TextInput
              style={styles.compactInput}
              placeholder="الكود هنا..."
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleApplyCode} // يفعل الكود عند الضغط على "Done" في الكيبورد
            />
            <TouchableOpacity style={styles.compactBtn} onPress={handleApplyCode}>
              <Text style={styles.applyBtnText}>تفعيل ✅</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceRow}>
          <View style={[styles.balanceCard, { backgroundColor: '#2C3E50' }]}>
            <Text style={styles.balanceLabel}>الجواهر 💎</Text>
            <Text style={styles.balanceValue}>{currentGems}</Text>
          </View>
          <View style={[styles.balanceCard, { backgroundColor: '#8E44AD' }]}>
            <Text style={styles.balanceLabel}>العملات 🪙</Text>
            <Text style={styles.balanceValue}>{currentCoins}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.phoneNum}>01223369908</Text>
          <Text style={styles.infoText}>للشحن: حول فودافون كاش وأرسل الصورة واتساب</Text>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>GEMS100 / STORY200</Text>
          <Text style={styles.footerSmall}>* لا يهم إذا كانت الحروف كبيرة أو صغيرة</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  header: { paddingTop: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  backBtn: { padding: 12, backgroundColor: '#FFF', borderRadius: 15, elevation: 3 },
  backTxt: { fontSize: 20 },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  // التصميم المدمج الجديد
  inputContainer: { backgroundColor: '#FFF', margin: 20, padding: 15, borderRadius: 25, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  promoLabel: { textAlign: 'center', marginBottom: 12, fontWeight: 'bold', color: '#27AE60' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compactInput: { flex: 1, backgroundColor: '#F0F3F7', padding: 15, borderRadius: 15, fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginRight: 10, textAlign: 'center' },
  compactBtn: { backgroundColor: '#27AE60', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 15, elevation: 2 },
  applyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 },
  balanceCard: { width: '47%', padding: 20, borderRadius: 20, alignItems: 'center' },
  balanceLabel: { color: '#ECF0F1', fontSize: 14, marginBottom: 5 },
  balanceValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  
  infoBox: { backgroundColor: '#FFF', margin: 20, padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB' },
  phoneNum: { fontSize: 24, color: '#2980B9', fontWeight: 'bold' },
  infoText: { textAlign: 'center', color: '#7F8C8D', fontSize: 12, marginTop: 5 },
  footerInfo: { alignItems: 'center', marginTop: 10 },
  footerText: { color: '#BDC3C7', fontWeight: 'bold' },
  footerSmall: { color: '#BDC3C7', fontSize: 10 }
});
