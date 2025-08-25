import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useCircleStore } from '../../store';
import { RootStackParamList, CircleResponse } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

type CreateScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function CreateScreen() {
  const navigation = useNavigation<CreateScreenNavigationProp>();
  const { circles, loading, error, getMyCircles } = useCircleStore();
  const [selectedCircle, setSelectedCircle] = useState<CircleResponse | null>(null);

  useEffect(() => {
    loadCircles();
  }, []);

  const loadCircles = () => {
    getMyCircles();
  };

  const handleCircleSelect = (circle: CircleResponse) => {
    setSelectedCircle(circle);
  };

  const handleCreatePoll = () => {
    if (!selectedCircle) {
      Alert.alert('Select Circle', 'Please select a circle to create a poll for.');
      return;
    }

    // Navigate to template selection (or CreatePoll directly)
    navigation.navigate('CreatePoll', { circleId: selectedCircle.id });
  };

  const renderCircleItem = ({ item }: { item: CircleResponse }) => (
    <TouchableOpacity
      style={[
        styles.circleCard,
        selectedCircle?.id === item.id && styles.selectedCircleCard
      ]}
      onPress={() => handleCircleSelect(item)}
    >
      <View style={styles.circleHeader}>
        <View style={styles.circleTitleContainer}>
          <Text style={styles.circleName}>{item.name}</Text>
          <Text style={styles.memberCount}>
            {item.member_count} member{item.member_count !== 1 ? 's' : ''}
          </Text>
        </View>
        {selectedCircle?.id === item.id && (
          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
        )}
      </View>
      
      {item.description && (
        <Text style={styles.circleDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="add-circle-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Circles Available</Text>
      <Text style={styles.emptySubtitle}>
        You need to be part of a circle to create polls. Create or join a circle first!
      </Text>
      <View style={styles.emptyActions}>
        <Button
          title="Create Circle"
          onPress={() => navigation.navigate('CreateCircle')}
          style={styles.emptyButton}
        />
        <Button
          title="Join Circle"
          onPress={() => navigation.navigate('JoinCircle')}
          variant="outline"
          style={styles.emptyButton}
        />
      </View>
    </View>
  );

  if (loading && circles.length === 0) {
    return (
      <View style={styles.container}>
        <LoadingSpinner text="Loading circles..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create New Poll</Text>
        <Text style={styles.headerSubtitle}>Choose a circle to create your poll in</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={loadCircles}
            size="small"
            variant="outline"
          />
        </View>
      )}

      <FlatList
        data={circles}
        renderItem={renderCircleItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={circles.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadCircles}
            tintColor="#007AFF"
          />
        }
      />

      {selectedCircle && (
        <View style={styles.bottomContainer}>
          <Text style={styles.selectedText}>
            Creating poll for: {selectedCircle.name}
          </Text>
          <Button
            title="Continue to Templates"
            onPress={handleCreatePoll}
            style={styles.continueButton}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Space for bottom container
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  circleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCircleCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  circleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  circleTitleContainer: {
    flex: 1,
  },
  circleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  circleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyActions: {
    width: '100%',
  },
  emptyButton: {
    marginBottom: 12,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  continueButton: {
    width: '100%',
  },
});