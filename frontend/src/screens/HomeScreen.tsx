import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../styles/colors';

export default function HomeScreen({ onCTAPress }: { onCTAPress: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/app-icon.png')} style={styles.logo} />
      </View>
      <Text style={styles.title}>Welcome to SmartShopper</Text>
      <Text style={styles.subtitle}>Discover the best deals, effortlessly.</Text>
      <TouchableOpacity style={styles.ctaButton} onPress={onCTAPress}>
        <Text style={styles.ctaText}>Start Saving</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    marginBottom: 32,
    backgroundColor: colors.secondary,
    borderRadius: 100,
    padding: 24,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.secondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: colors.secondary,
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 48,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  ctaText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
