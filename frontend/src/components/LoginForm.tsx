// components/LoginForm.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';


type LoginFormProps = {
  onLogin: (params: { email: string; password: string; }) => Promise<{ success: boolean; error?: string }>;
};

export default function LoginForm({ onLogin }: LoginFormProps) {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

const handleSubmit = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Email and password are required.');
    return;
  }

  const result = await onLogin({ email, password });

  if (result.success) {
    Alert.alert('Success', 'Logged in successfully!');
    setEmail('');
    setPassword('');
  } else {
    Alert.alert('Login Failed', result.error || 'Invalid credentials.');
  }
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
    <Button title="Login" onPress={handleSubmit} />
  </View>
);
}

const styles = StyleSheet.create({
container: {
  width: '80%',
  padding: 20,
  backgroundColor: '#f0f0f0',
  borderRadius: 10,
  alignItems: 'center',
  alignSelf: 'center',
},
title: {
  fontSize: 24,
  marginBottom: 20,
  fontWeight: 'bold',
},
input: {
  width: '100%',
  padding: 10,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 5,
},
});