import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions,
  ImageBackground, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SimpleExplorationGame = ({ navigation }) => {
  const [score, setScore] = useState(0);

  const handleDiscover = (loc) => {
    setScore(s => s + 20);
    Alert.alert('اكتشاف!', `لقد وصلت إلى ${loc}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>خريطة الاستكشاف</Text>
      <Text style={styles.score}>النقاط: {score}</Text>
      <TouchableOpacity style={styles.node} onPress={() => handleDiscover('الغابة')}>
        <Text>🌲 الغابة الخضراء</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.node} onPress={() => handleDiscover('الجبل')}>
        <Text>⛰️ جبل الثلج</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={{color: 'white'}}>خروج</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 100, backgroundColor: '#ecf0f1' },
  title: { fontSize: 30, fontWeight: 'bold' },
  score: { fontSize: 20, marginVertical: 20 },
  node: { backgroundColor: 'white', padding: 20, margin: 10, width: '80%', borderRadius: 10, alignItems: 'center' },
  back: { backgroundColor: '#e74c3c', padding: 15, marginTop: 50, borderRadius: 10 }
});

export default SimpleExplorationGame;
