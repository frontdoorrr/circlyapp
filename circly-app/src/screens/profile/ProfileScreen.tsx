import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore, useCircleStore } from '../../store';
import { RootStackParamList, CircleResponse } from '../../types';
import Button from '../../components/common/Button';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout, loading } = useAuthStore();
  const { circles, loading: circlesLoading, error: circlesError, getMyCircles } = useCircleStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    getMyCircles();
  };

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

  const handleCirclePress = (circle: CircleResponse) => {
    navigation.navigate('CircleDetail', { circleId: circle.id });
  };

  // Mock statistics - in a real app, these would come from an API
  const mockStats = {
    totalVotes: 24,
    heartsReceived: 128,
    pollsCreated: 7,
    circlesJoined: circles.length,
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={circlesLoading}
          onRefresh={loadData}
          tintColor="#007AFF"
        />
      }
    >
      {/* Profile Header */}
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

      {/* Statistics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{mockStats.heartsReceived}</Text>
            <Text style={styles.statLabel}>Hearts ❤️</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{mockStats.totalVotes}</Text>
            <Text style={styles.statLabel}>Votes Cast</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{mockStats.pollsCreated}</Text>
            <Text style={styles.statLabel}>Polls Created</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{mockStats.circlesJoined}</Text>
            <Text style={styles.statLabel}>Circles</Text>
          </View>
        </View>
      </View>

      {/* My Circles Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>👥 My Circles</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateCircle')}
            style={styles.addButton}
          >
            <Ionicons name="add" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {circles.length > 0 ? (
          circles.map((circle) => (
            <TouchableOpacity
              key={circle.id}
              style={styles.circleCard}
              onPress={() => handleCirclePress(circle)}
            >
              <View style={styles.circleInfo}>
                <Text style={styles.circleName}>{circle.name}</Text>
                <Text style={styles.circleMemberCount}>
                  {circle.member_count} members
                </Text>
                {circle.description && (
                  <Text style={styles.circleDescription} numberOfLines={1}>
                    {circle.description}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCircles}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyCirclesText}>No circles yet</Text>
            <Text style={styles.emptyCirclesSubtext}>
              Create or join a circle to start voting!
            </Text>
          </View>
        )}
      </View>

      {/* Actions Section */}
      <View style={styles.section}>
        <Button
          title="Edit Profile"
          onPress={() => {
            Alert.alert('Coming Soon', 'Profile editing will be available soon!');
          }}
          variant="outline"
          style={styles.actionButton}
        />
        
        <Button
          title="Notification Settings"
          onPress={() => {
            Alert.alert('Coming Soon', 'Notification settings will be available soon!');
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

      {/* About Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>About Device Login</Text>
        <Text style={styles.infoText}>
          Your account is tied to this device. Make sure to backup your device ID 
          if you want to access your account from another device.
        </Text>
      </View>
    </ScrollView>
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
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    minWidth: '22%',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  circleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  circleMemberCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  circleDescription: {
    fontSize: 13,
    color: '#888',
  },
  emptyCircles: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyCirclesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyCirclesSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  actionButton: {
    marginBottom: 12,
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
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