/**
 * Home Empty State Component
 *
 * Circle이 없을 때 표시되는 빈 상태 화면
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState } from '../states/EmptyState';
import { tokens } from '../../theme';

interface HomeEmptyStateProps {
  onJoinCircle: () => void;
}

export function HomeEmptyState({ onJoinCircle }: HomeEmptyStateProps) {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="😊"
        title="아직 참여한 Circle이 없어요"
        description="친구에게 초대 코드를 받아 참여하거나,&#10;새로운 Circle을 만들어보세요!"
        actionLabel="초대 코드 입력"
        onAction={onJoinCircle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
});
