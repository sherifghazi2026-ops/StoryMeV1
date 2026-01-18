import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ImageBackground,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const YoyaGameV12 = ({ navigation }) => {
  const [inventory, setInventory] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState('اللاعب');
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');

  // تحميل البيانات المحفوظة
  useEffect(() => {
    loadGameData();
  }, []);

  const loadGameData = async () => {
    try {
      const savedInventory = await AsyncStorage.getItem('yoya_inventory');
      const savedLevel = await AsyncStorage.getItem('yoya_level');
      const savedScore = await AsyncStorage.getItem('yoya_score');
      const savedName = await AsyncStorage.getItem('yoya_playerName');

      if (savedInventory) setInventory(JSON.parse(savedInventory));
      if (savedLevel) setCurrentLevel(parseInt(savedLevel));
      if (savedScore) setScore(parseInt(savedScore));
      if (savedName) setPlayerName(savedName);
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  };

  const saveGameData = async () => {
    try {
      await AsyncStorage.setItem('yoya_inventory', JSON.stringify(inventory));
      await AsyncStorage.setItem('yoya_level', currentLevel.toString());
      await AsyncStorage.setItem('yoya_score', score.toString());
      await AsyncStorage.setItem('yoya_playerName', playerName);
      Alert.alert('تم الحفظ', 'تم حفظ تقدمك بنجاح!');
    } catch (error) {
      console.error('Error saving game data:', error);
    }
  };

  const resetGame = async () => {
    try {
      await AsyncStorage.clear();
      setInventory([]);
      setCurrentLevel(1);
      setScore(0);
      setPlayerName('اللاعب');
      Alert.alert('تم', 'تم إعادة تعيين اللعبة بنجاح!');
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  };

  const addItemToInventory = () => {
    if (inputText.trim()) {
      const newItem = {
        id: Date.now().toString(),
        name: inputText,
        emoji: '🎁',
        description: `اكتشاف جديد: ${inputText}`,
      };
      const newInventory = [...inventory, newItem];
      setInventory(newInventory);
      setScore(score + 10);
      setInputText('');
      setModalVisible(false);
      
      // إذا وصل إلى 5 عناصر، عرض رسالة
      if (newInventory.length === 5) {
        Alert.alert(
          'ممتاز!',
          'لقد جمعت 5 اكتشافات! يمكنك المتابعة أو إعادة التعيين.',
          [
            { text: 'أواصل', style: 'default' },
            { text: 'أعيد التعيين', onPress: resetGame }
          ]
        );
      }
    } else {
      Alert.alert('تنبيه', 'يرجى كتابة اسم الاكتشاف أولاً');
    }
  };

  const removeItemFromInventory = (itemId) => {
    const newInventory = inventory.filter(item => item.id !== itemId);
    setInventory(newInventory);
  };

  const levelUp = () => {
    if (inventory.length >= 2) {
      setCurrentLevel(currentLevel + 1);
      setScore(score + 50);
      Alert.alert('مبروك!', `لقد تقدمت للمستوى ${currentLevel + 1}!`);
    } else {
      Alert.alert('تحذير', 'تحتاج إلى اكتشافين على الأقل للانتقال للمستوى التالي');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('../assets/game-background.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* شريط المعلومات العلوي */}
        <View style={styles.header}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>
              👤 {playerName}
            </Text>
            <Text style={styles.levelText}>المستوى: {currentLevel}</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>🎯 {score} نقطة</Text>
          </View>
        </View>

        {/* المحتوى الرئيسي */}
        <View style={styles.content}>
          <Text style={styles.welcomeText}>
            🎮 لعبة يويو السحرية
          </Text>
          <Text style={styles.instructions}>
            ابدأ رحلتك لاكتشاف العوالم المخفية!
          </Text>
          
          <View style={styles.statsBox}>
            <Text style={styles.statsTitle}>إحصائياتك</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{inventory.length}</Text>
                <Text style={styles.statLabel}>الكشافات</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{score}</Text>
                <Text style={styles.statLabel}>النقاط</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{currentLevel}</Text>
                <Text style={styles.statLabel}>المستوى</Text>
              </View>
            </View>
          </View>

          {/* أزرار التحكم */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.mainButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.mainButtonText}>➕ إضافة كشف جديد</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.mainButton, styles.levelButton]}
              onPress={levelUp}
            >
              <Text style={styles.mainButtonText}>⬆️ رفع المستوى</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.mainButton, styles.saveButton]}
              onPress={saveGameData}
            >
              <Text style={styles.mainButtonText}>💾 حفظ التقدم</Text>
            </TouchableOpacity>
          </View>

          {/* قائمة العناصر المكتشفة */}
          <View style={styles.inventoryContainer}>
            <Text style={styles.inventoryHeader}>اكتشافاتك ({inventory.length})</Text>
            
            <ScrollView style={styles.inventoryScroll}>
              {inventory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📭</Text>
                  <Text style={styles.emptyText}>لا توجد اكتشافات بعد</Text>
                  <Text style={styles.emptyHint}>
                    اضغط على "إضافة كشف جديد" لتبدأ رحلتك!
                  </Text>
                </View>
              ) : (
                inventory.map((item, index) => (
                  <View key={item.id} style={styles.inventoryItem}>
                    <Text style={styles.itemNumber}>{index + 1}</Text>
                    <Text style={styles.itemEmoji}>{item.emoji}</Text>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeItemFromInventory(item.id)}
                    >
                      <Text style={styles.deleteText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* شريط التنقل السفلي */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.footerButtonText}>🏠 الرئيسية</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.footerButton, styles.resetBtn]}
            onPress={resetGame}
          >
            <Text style={styles.footerButtonText}>🔄 إعادة تعيين</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.footerButton, styles.helpBtn]}
            onPress={() => Alert.alert('مساعدة', 'اضف اكتشافات جديدة لكسب النقاط ورفع مستواك!')}
          >
            <Text style={styles.footerButtonText}>❓ مساعدة</Text>
          </TouchableOpacity>
        </View>

        {/* نافذة إضافة عنصر جديد */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>اكتشاف جديد</Text>
              <Text style={styles.modalSubtitle}>ماذا اكتشفت اليوم؟</Text>
              
              <TextInput
                style={styles.input}
                placeholder="اكتب اسم الاكتشاف هنا..."
                placeholderTextColor="#888"
                value={inputText}
                onChangeText={setInputText}
                textAlign="right"
                autoFocus={true}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>إلغاء</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={addItemToInventory}
                >
                  <Text style={styles.modalButtonText}>إضافة الاكتشاف</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderBottomWidth: 2,
    borderBottomColor: '#4a148c',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  levelText: {
    color: '#bb86fc',
    fontSize: 16,
  },
  scoreContainer: {
    backgroundColor: '#ff4081',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 5,
  },
  scoreText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  instructions: {
    color: '#e1bee7',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  statsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#bb86fc',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: '#b0bec5',
    fontSize: 14,
  },
  buttonsContainer: {
    marginBottom: 25,
  },
  mainButton: {
    backgroundColor: '#6200ea',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 5,
  },
  levelButton: {
    backgroundColor: '#0097a7',
  },
  saveButton: {
    backgroundColor: '#388e3c',
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inventoryContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inventoryHeader: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  inventoryScroll: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    color: '#90a4ae',
    fontSize: 18,
    marginBottom: 10,
  },
  emptyHint: {
    color: '#78909c',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#bb86fc',
  },
  itemNumber: {
    color: '#bb86fc',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    width: 25,
  },
  itemEmoji: {
    fontSize: 30,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemDescription: {
    color: '#b0bec5',
    fontSize: 12,
  },
  deleteButton: {
    padding: 5,
  },
  deleteText: {
    fontSize: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 2,
    borderTopColor: '#4a148c',
  },
  footerButton: {
    backgroundColor: '#37474f',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  resetBtn: {
    backgroundColor: '#d32f2f',
  },
  helpBtn: {
    backgroundColor: '#f57c00',
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#263238',
    width: '85%',
    borderRadius: 20,
    padding: 25,
    elevation: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    color: '#bb86fc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#bb86fc',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#757575',
  },
  confirmButton: {
    backgroundColor: '#009688',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default YoyaGameV12;
