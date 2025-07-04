import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import DealFinderScreen from './screens/DealFinderScreen';

export default function App() {
return (
  <SafeAreaView style={styles.container}>
    <DealFinderScreen />
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: '#fff',
  // paddingTop: Platform.OS === 'android' ? 25 : 0, // For Android status bar
},
});