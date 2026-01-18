import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  ImageBackground, StatusBar, Animated, PanResponder, ScrollView, Alert
} from 'react-native';

const { width, height } = Dimensions.get('window');

const WorldExplorerGame = ({ navigation }) => {
  const [player, setPlayer] = useState({ x: width / 2, y: height / 2, direction: 'right' });
  const [inventory, setInventory] = useState([]);
  const [showInventory, setShowInventory] = useState(false);
  
  const moveX = useRef(0);
  const moveY = useRef(0);
  const stickAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const gameLoopRef = useRef(null);

  const joystickSize = 100;
  const joystickRadius = joystickSize / 2;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gs) => {
        let dx = gs.dx;
        let dy = gs.dy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > joystickRadius) {
          dx = (dx / dist) * joystickRadius;
          dy = (dy / dist) * joystickRadius;
        }
        stickAnim.setValue({ x: dx, y: dy });
        moveX.current = dx / joystickRadius;
        moveY.current = dy / joystickRadius;
      },
      onPanResponderRelease: () => {
        Animated.spring(stickAnim, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        moveX.current = 0;
        moveY.current = 0;
      },
    })
  ).current;

  useEffect(() => {
    const loop = () => {
      setPlayer(prev => ({
        ...prev,
        x: Math.max(0, Math.min(width - 50, prev.x + moveX.current * 5)),
        y: Math.max(0, Math.min(height - 100, prev.y + moveY.current * 5)),
        direction: moveX.current > 0 ? 'right' : moveX.current < 0 ? 'left' : prev.direction
      }));
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <ImageBackground source={require('../assets/world-bg.jpg')} style={styles.background}>
        
        {/* اللاعب */}
        <View style={[styles.player, { left: player.x, top: player.y, transform: [{ scaleX: player.direction === 'right' ? 1 : -1 }] }]}>
          <Text style={{ fontSize: 40 }}>🤠</Text>
        </View>

        {/* الواجهة العلوية */}
        <View style={styles.topUI}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowInventory(!showInventory)}>
            <Text style={styles.iconText}>🎒 {inventory.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.exitText}>خروج</Text>
          </TouchableOpacity>
        </View>

        {/* حقيبة الأدوات (Inventory) */}
        {showInventory && (
          <View style={styles.inventoryModal}>
            <ScrollView style={styles.inventoryScroll}>
              <Text style={styles.inventoryTitle}>اكتشافاتك ({inventory.length})</Text>
              {inventory.length === 0 ? (
                <Text style={styles.emptyText}>لم تكتشف شيئاً بعد..</Text>
              ) : (
                inventory.map((item, index) => (
                  <View key={index} style={styles.inventoryItem}>
                    <Text style={styles.inventoryEmoji}>{item.emoji}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowInventory(false)}>
              <Text style={styles.closeBtnText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* التحكم (Joystick) */}
        <View style={styles.joystickContainer} {...panResponder.panHandlers}>
          <View style={styles.joystickBase}>
            <Animated.View style={[styles.joystickStick, { transform: stickAnim.getTranslateTransform() }]} />
          </View>
        </View>

      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, backgroundColor: '#7cfc00' },
  player: { position: 'absolute', width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  topUI: { position: 'absolute', top: 40, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  iconBtn: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20 },
  iconText: { color: '#fff', fontWeight: 'bold' },
  exitBtn: { backgroundColor: '#e74c3c', padding: 10, borderRadius: 10 },
  exitText: { color: '#fff', fontWeight: 'bold' },
  joystickContainer: { position: 'absolute', bottom: 50, left: 50, width: 100, height: 100 },
  joystickBase: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  joystickStick: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff' },
  inventoryModal: { position: 'absolute', top: '20%', left: '10%', width: '80%', height: '50%', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 20, elevation: 10 },
  inventoryTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  inventoryItem: { padding: 10, backgroundColor: '#eee', borderRadius: 10, margin: 5, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20 },
  closeBtn: { backgroundColor: '#3498db', padding: 12, borderRadius: 10, marginTop: 10 },
  closeBtnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});

export default WorldExplorerGame;
