// components/RegistrationForm.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { colors } from '../styles/colors';

type RegistrationFormProps = {
  onRegister: (params: { email: string; password: string; username?: string; displayName?: string }) => Promise<{ success: boolean; error?: string }>;
  onSwitchToLogin: () => void;
};

export default function RegistrationForm({ onRegister, onSwitchToLogin }: RegistrationFormProps) {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [username, setUsername] = useState(''); // Optional, if you want a separate username field
const [displayName, setDisplayName] = useState(''); // Optional, for Firebase displayName

const handleSubmit = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Email and password are required.');
    return;
  }

  const result = await onRegister({ email, password, username, displayName });

  if (!result.success) {
    Alert.alert('Registration Failed', result.error || 'Something went wrong.');
  }
  // No need to alert success or clear fields as the UI will change to authenticated view
};

return (
  <View style={styles.container}>
    <Text style={styles.title}>Register</Text>
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
    <TextInput
      style={styles.input}
      placeholder="Username (optional)"
      value={username}
      onChangeText={setUsername}
      autoCapitalize="none"
    />
    <TextInput
      style={styles.input}
      placeholder="Display Name (optional)"
      value={displayName}
      onChangeText={setDisplayName}
    />
    <TouchableOpacity 
      style={styles.registerButton} 
      onPress={handleSubmit}
    >
      <Text style={styles.registerButtonText}>Register</Text>
    </TouchableOpacity>
    <View style={styles.switchContainer}>
      <Text style={styles.switchText}>Already have an account? </Text>
      <Text style={styles.switchLink} onPress={onSwitchToLogin}>Login</Text>
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
  marginBottom: 20,
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
  color: colors.secondary,
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
registerButton: {
  backgroundColor: colors.secondary,
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 8,
  width: '100%',
  alignItems: 'center',
  marginTop: 10,
},
registerButtonText: {
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