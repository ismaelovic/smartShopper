// frontend/src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../styles/colors';
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
    // Alert.alert('Success', 'Profile updated successfully!');
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
      <ActivityIndicator size="large" color={colors.primary} />
      <Text>Loading profile...</Text>
    </View>
  );
}

if (!profile) {
  return (
    <View style={styles.centered}>
      <Text>Could not load user profile.</Text>
      <TouchableOpacity style={styles.editButton} onPress={fetchProfile}>
        <Text style={styles.editButtonText}>Retry</Text>
      </TouchableOpacity>
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
        value={isEditing ? editedProfile.bio || '' : profile.bio || ''}
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
        value={isEditing ? editedProfile.location || '' : profile.location || ''}
        onChangeText={(text) => setEditedProfile({ ...editedProfile, location: text })}
        editable={isEditing}
      />
    </View>

    {isEditing ? (
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.disabledButton]} 
          onPress={handleSaveProfile} 
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Changes"}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => { setIsEditing(false); setEditedProfile(profile); }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity 
        style={styles.editButton} 
        onPress={() => setIsEditing(true)}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    )}
  </ScrollView>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  padding: 20,
  backgroundColor: colors.background,
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
  color: colors.text.primary,
},
profileSection: {
  marginBottom: 15,
},
label: {
  fontSize: 16,
  fontWeight: '600',
  marginBottom: 5,
  color: colors.text.secondary,
},
input: {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
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
saveButton: {
  backgroundColor: colors.primary,
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 8,
  flex: 1,
  marginRight: 10,
  alignItems: 'center',
},
disabledButton: {
  backgroundColor: colors.text.muted,
  opacity: 0.7,
},
saveButtonText: {
  color: colors.text.inverse,
  fontSize: 16,
  fontWeight: '600',
},
cancelButton: {
  backgroundColor: colors.surface,
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.border,
  flex: 1,
  marginLeft: 10,
  alignItems: 'center',
},
cancelButtonText: {
  color: colors.text.primary,
  fontSize: 16,
  fontWeight: '600',
},
editButton: {
  backgroundColor: colors.accent,
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 8,
  marginTop: 20,
  alignItems: 'center',
},
editButtonText: {
  color: colors.text.inverse,
  fontSize: 16,
  fontWeight: '600',
},
});

export default ProfileScreen;