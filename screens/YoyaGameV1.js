import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';

const { width } = Dimensions.get('window');
const GRID_SIZE = 4;
const CELL_SIZE = (width - 60) / GRID_SIZE;

export default function YoyaGameV1({ navigation }) {
  // الحالة الافتراضية للشبكة (0: فارغ، 1: طريق مستقيم، 2: منعطف)
  const [grid, setGrid] = useState(Array(GRID_SIZE * GRID_SIZE).fill(0));
  const [won, setWon] = useState(false);

  const handleCellPress = (index) => {
    if (won) return;
    let newGrid = [...grid];
    newGrid[index] = (newGrid[index] + 1) % 3; // التبديل بين الأشكال
    setGrid(newGrid);
    checkWin(newGrid);
  };

  const checkWin = (currentGrid) => {
    // منطق فوز مبسط: إذا امتلأت المربعات الأساسية بين البداية والنهاية
    const pathFilled = [8, 9, 5, 6, 2, 3].every(idx => currentGrid[idx] !== 0);
    if (pathFilled) setWon(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ابنِ الطريق لليو! 🐕</Text>
      
      <View style={styles.gameBoard}>
        {/* البيت في البداية */}
        <Text style={[styles.icon, { position: 'absolute', left: -40, bottom: CELL_SIZE }]}>🏠</Text>
        {/* ليو في النهاية */}
        <Text style={[styles.icon, { position: 'absolute', right: -10, top: -10 }]}>🐕</Text>

        <View style={styles.gridContainer}>
          {grid.map((cell, index) => (
            <TouchableOpacity key={index} style={styles.cell} onPress={() => handleCellPress(index)}>
              {cell === 1 && <View style={styles.roadStraight} />}
              {cell === 2 && <View style={styles.roadTurn} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {won && (
        <View style={styles.winOverlay}>
          <Text style={styles.winText}>أحسنت! وصل يويا لليو 🎉</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>رجوع</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9FF', alignItems: 'center', paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2D3436', marginBottom: 20 },
  gameBoard: { width: width - 40, height: width - 40, backgroundColor: '#FFF', borderRadius: 15, elevation: 5, padding: 10 },
  gridContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 0.5, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center' },
  roadStraight: { width: '100%', height: 15, backgroundColor: '#636E72' },
  roadTurn: { width: 30, height: 30, borderLeftWidth: 15, borderBottomWidth: 15, borderColor: '#636E72', borderBottomLeftRadius: 20 },
  icon: { fontSize: 40, zIndex: 10 },
  winOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  winText: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  btn: { backgroundColor: '#00B894', padding: 15, borderRadius: 20 },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});
