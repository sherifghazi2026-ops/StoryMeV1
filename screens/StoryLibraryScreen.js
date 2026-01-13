import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { bundlesData } from '../data/storiesData';

const { width } = Dimensions.get('window');

export default function StoryLibraryScreen({ navigation }) {
  // الحماية من الخطأ: التأكد من وجود البيانات
  const bundles = bundlesData || [];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>مجلدات القصص 📚</Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        {bundles.map((bundle) => (
          <TouchableOpacity 
            key={bundle.id} 
            style={styles.bundleCard}
            onPress={() => navigation.navigate('StoryReader', { bundleId: bundle.id })}
          >
            <Text style={styles.icon}>{bundle.icon}</Text>
            <Text style={styles.bundleName}>{bundle.name}</Text>
            <Text style={styles.bundlePrice}>{bundle.price} نجمة</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 50 },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  scroll: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  bundleCard: { width: width * 0.4, backgroundColor: '#FFF', padding: 15, margin: 10, borderRadius: 15, alignItems: 'center', elevation: 3 },
  icon: { fontSize: 40, marginBottom: 10 },
  bundleName: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  bundlePrice: { fontSize: 14, color: '#FFA500', marginTop: 5 }
});
