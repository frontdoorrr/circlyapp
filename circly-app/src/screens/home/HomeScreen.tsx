import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useCircleStore } from '../../store';
import { RootStackParamList, CircleResponse } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { circles, loading, error, getMyCircles } = useCircleStore();

  useEffect(() => {
    loadCircles();
  }, []);

  const loadCircles = () => {
    getMyCircles();
  };

  const handleCreateCircle = () => {
    navigation.navigate('CreateCircle');
  };

  const handleJoinCircle = () => {
    navigation.navigate('JoinCircle');
  };

  const handleCirclePress = (circle: CircleResponse) => {
    navigation.navigate('CircleDetail', { circleId: circle.id });
  };

  const renderCircleItem = ({ item }: { item: CircleResponse }) => (
    <TouchableOpacity
      style={styles.circleCard}
      onPress={() => handleCirclePress(item)}
    >
      <View style={styles.circleHeader}>
        <Text style={styles.circleName}>{item.name}</Text>
        <Text style={styles.memberCount}>
          {item.member_count} member{item.member_count !== 1 ? 's' : ''}
        </Text>
      </View>
      
      {item.description && (
        <Text style={styles.circleDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      <View style={styles.circleFooter}>
        <Text style={styles.createdDate}>
          Created {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Circles Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first circle or join an existing one to get started!
      </Text>
      <View style={styles.emptyActions}>
        <Button
          title="Create Circle"
          onPress={handleCreateCircle}
          style={styles.emptyButton}
        />
        <Button
          title="Join Circle"
          onPress={handleJoinCircle}
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
        <Button
          title="Create Circle"
          onPress={handleCreateCircle}
          size="small"
          style={styles.headerButton}
        />
        <Button
          title="Join Circle"
          onPress={handleJoinCircle}
          variant="outline"
          size="small"
          style={styles.headerButton}
        />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    flex: 1,
    marginHorizontal: 4,
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
  },
  circleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  circleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  circleDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  circleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createdDate: {
    fontSize: 12,
    color: '#999',
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
});