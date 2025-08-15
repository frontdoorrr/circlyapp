import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store';
import Button from '../../components/common/Button';

export default function ProfileScreen() {
  const { user, logout, loading } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.profile_emoji || '😊'}
          </Text>
        </View>
        
        <Text style={styles.displayName}>
          {user?.display_name || 'Anonymous User'}
        </Text>
        
        {user?.username && (
          <Text style={styles.username}>@{user.username}</Text>
        )}
        
        <Text style={styles.deviceId}>
          Device ID: {user?.device_id || 'Unknown'}
        </Text>
      </View>

      <View style={styles.actionsSection}>
        <Button
          title="Edit Profile"
          onPress={() => {
            // TODO: Navigate to edit profile screen
            Alert.alert('Coming Soon', 'Profile editing will be available soon!');
          }}
          variant="outline"
          style={styles.actionButton}
        />
        
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="secondary"
          loading={loading}
          style={styles.actionButton}
        />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>About Device Login</Text>
        <Text style={styles.infoText}>
          Your account is tied to this device. Make sure to backup your device ID 
          if you want to access your account from another device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  profileSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  deviceId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  actionsSection: {
    padding: 20,
  },
  actionButton: {
    marginBottom: 12,
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});