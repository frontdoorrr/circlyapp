import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Share,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useCircleStore } from '../../store';
import Button from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { CircleMember } from '../../types';

interface RouteParams {
  circleId: number;
}

export default function CircleDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { circleId } = (route.params as RouteParams) || {};
  
  const {
    currentCircle,
    members,
    loading,
    error,
    getCircle,
    getCircleMembers,
    clearError,
  } = useCircleStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadCircleData = React.useCallback(async () => {
    try {
      await getCircle(circleId);
      setLoadingMembers(true);
      await getCircleMembers(circleId);
    } catch (error) {
      console.error('Failed to load circle data:', error);
    } finally {
      setLoadingMembers(false);
    }
  }, [circleId, getCircle, getCircleMembers]);

  // Load circle data when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      if (circleId) {
        loadCircleData();
      }
      return () => {
        clearError();
      };
    }, [circleId, loadCircleData, clearError])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCircleData();
    setRefreshing(false);
  };

  const shareInviteCode = async () => {
    if (!currentCircle) return;
    
    const shareMessage = `Join my circle "${currentCircle.name}" on Circly!\n\nInvite Code: ${currentCircle.invite_code}\n\nDownload the app and use this code to join our circle.`;
    
    try {
      await Share.share({
        message: shareMessage,
        title: `Join ${currentCircle.name}`,
      });
    } catch (error) {
      console.warn('Failed to share invite code:', error);
    }
  };

  const copyInviteCode = async () => {
    if (!currentCircle) return;
    
    try {
      await Clipboard.setStringAsync(currentCircle.invite_code);
      Alert.alert(
        'Copied!',
        `Invite code "${currentCircle.invite_code}" has been copied to your clipboard.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.warn('Failed to copy invite code:', error);
      Alert.alert('Copy Failed', 'Unable to copy invite code to clipboard.', [{ text: 'OK' }]);
    }
  };

  const navigateToCreatePoll = () => {
    if (currentCircle) {
      (navigation as any).navigate('CreatePoll', { circleId: currentCircle.id });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isCreator = () => {
    // TODO: Compare with current user ID when user management is implemented
    return true; // For now, assume user can manage circle
  };

  const renderMemberItem = (member: CircleMember) => (
    <View key={member.id} style={styles.memberItem}>
      <View style={styles.memberInfo}>
        <View style={styles.memberAvatar}>
          <Ionicons name="person" size={20} color="#666" />
        </View>
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>
            {member.user?.username || `User ${member.user_id}`}
          </Text>
          <Text style={styles.memberRole}>
            {member.role === 'admin' ? 'Administrator' : 'Member'} • Joined {formatDate(member.joined_at)}
          </Text>
        </View>
      </View>
      {member.role === 'admin' && (
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#007AFF" />
        </View>
      )}
    </View>
  );

  if (loading && !currentCircle) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading circle details...</Text>
      </View>
    );
  }

  if (!currentCircle) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#dc3545" />
        <Text style={styles.errorTitle}>Circle Not Found</Text>
        <Text style={styles.errorMessage}>
          {error || 'This circle could not be found or you may not have access to it.'}
        </Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="outline"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Circle Header */}
      <View style={styles.header}>
        <View style={styles.circleIcon}>
          <Ionicons name="people-circle" size={80} color="#007AFF" />
        </View>
        <Text style={styles.circleName}>{currentCircle.name}</Text>
        {currentCircle.description && (
          <Text style={styles.circleDescription}>{currentCircle.description}</Text>
        )}
        <View style={styles.circleStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{currentCircle.member_count}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatDate(currentCircle.created_at)}</Text>
            <Text style={styles.statLabel}>Created</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={navigateToCreatePoll}>
            <View style={styles.actionIcon}>
              <Ionicons name="add-circle" size={24} color="#007AFF" />
            </View>
            <Text style={styles.actionText}>Create Poll</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={shareInviteCode}>
            <View style={styles.actionIcon}>
              <Ionicons name="share" size={24} color="#28a745" />
            </View>
            <Text style={styles.actionText}>Share Circle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={copyInviteCode}>
            <View style={styles.actionIcon}>
              <Ionicons name="copy" size={24} color="#6f42c1" />
            </View>
            <Text style={styles.actionText}>Copy Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Invite Code Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite Code</Text>
        <View style={styles.inviteCard}>
          <View style={styles.inviteCodeContainer}>
            <Text style={styles.inviteCodeLabel}>Share this code with friends:</Text>
            <View style={styles.inviteCodeBox}>
              <Text style={styles.inviteCode}>{currentCircle.invite_code}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={copyInviteCode}
                accessibilityLabel="Copy invite code"
              >
                <Ionicons name="copy-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
          <Button
            title="Share Invite Link"
            onPress={shareInviteCode}
            variant="outline"
            style={styles.shareButton}
          />
        </View>
      </View>

      {/* Members Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          {loadingMembers && (
            <ActivityIndicator size="small" color="#007AFF" />
          )}
        </View>
        
        {members.length > 0 ? (
          <View style={styles.membersList}>
            {members.map(renderMemberItem)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#999" />
            <Text style={styles.emptyStateText}>No members found</Text>
            <Text style={styles.emptyStateSubtext}>
              Members will appear here once they join the circle
            </Text>
          </View>
        )}
      </View>

      {/* Circle Management (for creators/admins) */}
      {isCreator() && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Circle Management</Text>
          <View style={styles.managementActions}>
            <Button
              title="Edit Circle Info"
              onPress={() => {
                Alert.alert('Coming Soon', 'Circle editing will be available in a future update.');
              }}
              variant="outline"
              style={styles.managementButton}
            />
            <Button
              title="Manage Members"
              onPress={() => {
                Alert.alert('Coming Soon', 'Member management will be available in a future update.');
              }}
              variant="outline"
              style={styles.managementButton}
            />
          </View>
        </View>
      )}

      {/* Recent Activity Placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color="#999" />
          <Text style={styles.emptyStateText}>No recent activity</Text>
          <Text style={styles.emptyStateSubtext}>
            Polls and member activities will appear here
          </Text>
        </View>
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  circleIcon: {
    marginBottom: 16,
  },
  circleName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  circleDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  circleStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionItem: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  inviteCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  inviteCodeContainer: {
    marginBottom: 16,
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inviteCode: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 4,
  },
  shareButton: {
    marginTop: 8,
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  memberRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  adminBadge: {
    marginLeft: 8,
  },
  managementActions: {
    gap: 12,
  },
  managementButton: {
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});