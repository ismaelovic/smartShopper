// components/RegistrationForm.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

type RegistrationFormProps = {
  onRegister: (params: { email: string; password: string; username?: string; displayName?: string }) => Promise<{ success: boolean; error?: string }>;
};

export default function RegistrationForm({ onRegister }: RegistrationFormProps) {
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

  if (result.success) {
    Alert.alert('Success', 'Registration successful! You are now logged in. You can edit your profile bio under profile settings.');
    setEmail('');
    setPassword('');
    setUsername('');
    setDisplayName('');
  } else {
    Alert.alert('Registration Failed', result.error || 'Something went wrong.');
  }
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
    <Button title="Register" onPress={handleSubmit} />
  </View>
);
}

const styles = StyleSheet.create({
container: {
  width: '80%',
  padding: 20,
  backgroundColor: '#f0f0f0',
  borderRadius: 10,
  marginBottom: 20,
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