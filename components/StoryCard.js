import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function StoryCard({ story, onStart }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.startBtn} onPress={onStart}>
        <Text style={styles.startBtnText}>ابدأ</Text>
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>
        <Text style={styles.lesson} numberOfLines={1}>
          {story.lesson}
        </Text>
      </View>
      
      <Text style={styles.emoji}>{story.emoji || '📖'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  textContainer: {
    flex: 1, // هذا السطر هو الحل، يجبر النص على البقاء في مساحته
    marginHorizontal: 10,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'right',
    flexWrap: 'wrap', // يضمن التفاف النص
  },
  lesson: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'right',
  },
  emoji: {
    fontSize: 35,
  },
  startBtn: {
    backgroundColor: '#2ECC71',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  startBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  }
});
