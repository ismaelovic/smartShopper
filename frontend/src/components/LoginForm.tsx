// components/LoginForm.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { colors } from '../styles/colors';


type LoginFormProps = {
  onLogin: (params: { email: string; password: string; }) => Promise<{ success: boolean; error?: string }>;
  onSwitchToRegister: () => void;
};

export default function LoginForm({ onLogin, onSwitchToRegister }: LoginFormProps) {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

const handleSubmit = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Email and password are required.');
    return;
  }

  const result = await onLogin({ email, password });

  if (!result.success) {
    Alert.alert('Login Failed', result.error || 'Invalid credentials.');
  }
  // No need to alert success as the UI will change
};

return (
  <View style={styles.container}>
    <Text style={styles.title}>Login</Text>
    <TextInput
      style={styles.input}
      placeholder="Email"
      value={email}
      onChangeText={setEmail}
      keyboardType="email-address"
      autoCapitalize="none"
    />
    <TextInput
      style={styles.input}
      placeholder="Password"
      value={password}
      onChangeText={setPassword}
      secureTextEntry
    />
    <TouchableOpacity 
      style={styles.loginButton} 
      onPress={handleSubmit}
    >
      <Text style={styles.loginButtonText}>Login</Text>
    </TouchableOpacity>
    <View style={styles.switchContainer}>
      <Text style={styles.switchText}>Don't have an account? </Text>
      <Text style={styles.switchLink} onPress={onSwitchToRegister}>Register</Text>
    </View>
  </View>
);
}

const styles = StyleSheet.create({
container: {
  width: '80%',
  padding: 24,
  backgroundColor: colors.surface,
  borderRadius: 10,
  alignItems: 'center',
  alignSelf: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  borderWidth: 1,
  borderColor: colors.border,
},
title: {
  fontSize: 28,
  marginBottom: 24,
  fontWeight: 'bold',
  color: colors.primary,
},
input: {
  width: '100%',
  padding: 12,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  backgroundColor: colors.background,
  fontSize: 16,
},
loginButton: {
  backgroundColor: colors.primary,
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 8,
  width: '100%',
  alignItems: 'center',
  marginTop: 10,
},
loginButtonText: {
  color: colors.text.inverse,
  fontSize: 18,
  fontWeight: 'bold',
},
switchContainer: {
  flexDirection: 'row',
  marginTop: 20,
  alignItems: 'center',
},
switchText: {
  fontSize: 16,
  color: colors.text.secondary,
},
switchLink: {
  fontSize: 16,
  color: colors.accent,
  fontWeight: 'bold',
},
});