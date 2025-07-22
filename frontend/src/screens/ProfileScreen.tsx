// frontend/src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { User } from 'firebase/auth'; // Import User type

interface ProfileScreenProps {
firebaseUser: User; // We expect a logged-in user here
API_BASE_URL: string;
}

interface UserProfile {
email: string;
username: string;
displayName: string;
profilePictureUrl?: string | null;
bio?: string | null;
location?: string | null;
createdAt: any; // Firestore Timestamp
updatedAt: any; // Firestore Timestamp
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ firebaseUser, API_BASE_URL }) => {
const [profile, setProfile] = useState<UserProfile | null>(null);
const [loading, setLoading] = useState(true);
const [isEditing, setIsEditing] = useState(false);
const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
const [saving, setSaving] = useState(false);

useEffect(() => {
  fetchProfile();
}, [firebaseUser]); // Re-fetch if firebaseUser changes (e.g., displayName updated directly in Firebase Auth)

const fetchProfile = async () => {
  setLoading(true);
  try {
    const idToken = await firebaseUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/users/${firebaseUser.uid}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch profile');
    }

    const data: UserProfile = await response.json();
    setProfile(data);
    setEditedProfile(data); // Initialize editedProfile with current data
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    Alert.alert('Error', `Failed to load profile: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

const handleSaveProfile = async () => {
  setSaving(true);
  try {
    const idToken = await firebaseUser.getIdToken();
    const updates = { ...editedProfile };

    // Remove fields that shouldn't be updated or are handled by backend
    delete updates.email; // Email changes via Firebase Auth
    delete updates.createdAt;
    delete updates.updatedAt;

    const response = await fetch(`${API_BASE_URL}/users/${firebaseUser.uid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    const updatedData: UserProfile = await response.json();
    setProfile(updatedData);
    setEditedProfile(updatedData); // Update editedProfile with the latest data
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  } catch (error: any) {
    console.error('Error saving profile:', error);
    Alert.alert('Error', `Failed to save profile: ${error.message}`);
  } finally {
    setSaving(false);
  }
};

if (loading) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text>Loading profile...</Text>
    </View>
  );
}

if (!profile) {
  return (
    <View style={styles.centered}>
      <Text>Could not load user profile.</Text>
      <Button title="Retry" onPress={fetchProfile} />
    </View>
  );
}

return (
  <ScrollView style={styles.container}>
    <Text style={styles.header}>My Profile</Text>

    <View style={styles.profileSection}>
      <Text style={styles.label}>Email:</Text>
      <TextInput
        style={styles.input}
        value={profile.email}
        editable={false} // Email cannot be changed here
      />
    </View>

    <View style={styles.profileSection}>
      <Text style={styles.label}>Username:</Text>
      <TextInput
        style={styles.input}
        value={isEditing ? editedProfile.username : profile.username}
        onChangeText={(text) => setEditedProfile({ ...editedProfile, username: text })}
        editable={isEditing}
      />
    </View>

    <View style={styles.profileSection}>
      <Text style={styles.label}>Display Name:</Text>
      <TextInput
        style={styles.input}
        value={isEditing ? editedProfile.displayName : profile.displayName}
        onChangeText={(text) => setEditedProfile({ ...editedProfile, displayName: text })}
        editable={isEditing}
      />
    </View>

    <View style={styles.profileSection}>
      <Text style={styles.label}>Bio:</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={isEditing ? editedProfile.bio : profile.bio}
        onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
        editable={isEditing}
        multiline
        numberOfLines={4}
      />
    </View>

    <View style={styles.profileSection}>
      <Text style={styles.label}>Location:</Text>
      <TextInput
        style={styles.input}
        value={isEditing ? editedProfile.location : profile.location}
        onChangeText={(text) => setEditedProfile({ ...editedProfile, location: text })}
        editable={isEditing}
      />
    </View>

    {isEditing ? (
      <View style={styles.buttonContainer}>
        <Button title={saving ? "Saving..." : "Save Changes"} onPress={handleSaveProfile} disabled={saving} />
        <Button title="Cancel" onPress={() => { setIsEditing(false); setEditedProfile(profile); }} color="red" />
      </View>
    ) : (
      <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
    )}
  </ScrollView>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  padding: 20,
  backgroundColor: '#f8f8f8',
},
centered: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
header: {
  fontSize: 24,
  fontWeight: 'bold',
  marginBottom: 20,
  textAlign: 'center',
  color: '#333',
},
profileSection: {
  marginBottom: 15,
},
label: {
  fontSize: 16,
  fontWeight: '600',
  marginBottom: 5,
  color: '#555',
},
input: {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  padding: 10,
  fontSize: 16,
},
multilineInput: {
  height: 100,
  textAlignVertical: 'top',
},
buttonContainer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginTop: 20,
},
});

export default ProfileScreen;