# Circly Frontend Components

> Component library for Circly - Anonymous compliment voting platform

## Architecture Overview

```
src/components/
├── primitives/      # Basic reusable components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── Text.tsx
├── patterns/        # Composed pattern components
│   ├── VoteCard.tsx
│   ├── ResultBar.tsx
│   └── ProgressBar.tsx
└── states/          # Loading and empty states
    ├── EmptyState.tsx
    ├── LoadingSpinner.tsx
    └── Skeleton.tsx
```

## Design System

All components follow the design system defined in:
- `src/theme/tokens.ts` - Design tokens (colors, typography, spacing)
- `src/theme/animations.ts` - Animation configurations
- Reference: `prd/design/02-ui-design-system.md`

### Design Principles

1. **8pt Grid System** - All spacing uses multiples of 8 (8, 16, 24, 32, 40, 48, 64)
2. **Minimum Touch Target** - 44x44pt for all interactive elements
3. **Consistent Animation** - Using React Native Reanimated for smooth 60fps animations
4. **Haptic Feedback** - Context-appropriate haptic patterns for user actions

---

## Primitives

### Button

Primary interactive component with multiple variants.

**Import:**
```tsx
import { Button } from '@/components/primitives/Button';
```

**Props:**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}
```

**Usage Examples:**

```tsx
// Primary button
<Button variant="primary" onPress={handleSubmit}>
  Submit Vote
</Button>

// Secondary button with loading state
<Button variant="secondary" loading={isLoading}>
  Join Circle
</Button>

// Ghost button with icon
<Button variant="ghost" icon={<Icon name="plus" />}>
  Create Poll
</Button>

// Small size button
<Button size="sm" variant="primary">
  Skip
</Button>

// Full width button
<Button variant="primary" fullWidth>
  Continue
</Button>
```

**Features:**
- ✅ Press animation (scale + opacity)
- ✅ Haptic feedback on press
- ✅ Loading spinner state
- ✅ Disabled state styling
- ✅ Icon support (left-aligned)
- ✅ Accessibility labels

---

### Card

Container component with elevation and styling.

**Import:**
```tsx
import { Card } from '@/components/primitives/Card';
```

**Props:**
```tsx
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof spacing;
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
```

**Usage Examples:**

```tsx
// Default card
<Card>
  <Text>Card content</Text>
</Card>

// Elevated card with custom padding
<Card variant="elevated" padding={24}>
  <Text>Important content</Text>
</Card>

// Pressable card
<Card onPress={handlePress}>
  <Text>Tap me</Text>
</Card>

// Outlined card
<Card variant="outlined">
  <Text>Outlined content</Text>
</Card>
```

**Features:**
- ✅ Shadow elevation variants
- ✅ Press animation (when onPress provided)
- ✅ Customizable padding
- ✅ Border radius from design tokens

---

### Input

Text input field with validation states.

**Import:**
```tsx
import { Input } from '@/components/primitives/Input';
```

**Props:**
```tsx
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  disabled?: boolean;
  maxLength?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**Usage Examples:**

```tsx
// Basic input with label
<Input
  label="Username"
  placeholder="Enter your username"
  value={username}
  onChangeText={setUsername}
/>

// Password input
<Input
  label="Password"
  secureTextEntry
  value={password}
  onChangeText={setPassword}
/>

// Input with error
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  error="Invalid email format"
/>

// Input with helper text
<Input
  label="Circle Name"
  value={circleName}
  onChangeText={setCircleName}
  helperText="Choose a unique name for your circle"
  maxLength={30}
/>

// Input with icons
<Input
  placeholder="Search circles"
  value={search}
  onChangeText={setSearch}
  leftIcon={<Icon name="search" />}
  rightIcon={<Icon name="close" onPress={clearSearch} />}
/>
```

**Features:**
- ✅ Focus/blur states with animation
- ✅ Error state with red border
- ✅ Helper text support
- ✅ Icon support (left/right)
- ✅ Character count display
- ✅ Keyboard type options
- ✅ Auto-capitalize control

---

### Text

Typography component with design system variants.

**Import:**
```tsx
import { Text } from '@/components/primitives/Text';
```

**Props:**
```tsx
interface TextProps {
  variant?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: keyof typeof colors;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}
```

**Usage Examples:**

```tsx
// Heading
<Text variant="3xl" weight="bold">
  Welcome to Circly
</Text>

// Body text
<Text variant="base" color="textSecondary">
  Join a circle to start voting
</Text>

// Small text with truncation
<Text variant="sm" numberOfLines={1}>
  This is a very long text that will be truncated...
</Text>

// Centered text
<Text variant="lg" align="center" weight="semibold">
  Select Your Answer
</Text>
```

**Typography Scale:**
- `xs`: 12px (labels, captions)
- `sm`: 14px (secondary text)
- `base`: 16px (body text)
- `lg`: 18px (emphasized text)
- `xl`: 20px (small headings)
- `2xl`: 24px (section headings)
- `3xl`: 30px (page headings)
- `4xl`: 36px (hero text)

---

## Patterns

### VoteCard

Vote selection card with 2x2 grid layout.

**Import:**
```tsx
import { VoteCard } from '@/components/patterns/VoteCard';
```

**Props:**
```tsx
interface VoteCardProps {
  question: string;
  options: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}
```

**Usage Example:**

```tsx
<VoteCard
  question="가장 유머러스한 친구는?"
  options={[
    { id: '1', name: 'Alice', avatar: 'https://...' },
    { id: '2', name: 'Bob', avatar: 'https://...' },
    { id: '3', name: 'Charlie', avatar: 'https://...' },
    { id: '4', name: 'David', avatar: 'https://...' },
  ]}
  selectedId={selectedId}
  onSelect={setSelectedId}
/>
```

**Features:**
- ✅ 2x2 grid layout (4 options)
- ✅ Selection animation (scale, border, checkmark)
- ✅ Staggered entrance animation
- ✅ Haptic feedback on selection
- ✅ Avatar display with fallback
- ✅ Disabled state (poll ended)

**Animation Details:**
- Entrance: Staggered fade + slide from bottom (100ms interval)
- Selection: Scale to 0.95, border highlight, checkmark badge
- Press: Scale to 0.98 with spring physics

---

### ResultBar

Animated progress bar for poll results.

**Import:**
```tsx
import { ResultBar } from '@/components/patterns/ResultBar';
```

**Props:**
```tsx
interface ResultBarProps {
  rank: number;
  name: string;
  voteCount: number;
  percentage: number;
  avatar?: string;
  isWinner?: boolean;
  animationDelay?: number;
}
```

**Usage Example:**

```tsx
<ResultBar
  rank={1}
  name="Alice"
  voteCount={12}
  percentage={48}
  isWinner
  avatar="https://..."
  animationDelay={0}
/>

<ResultBar
  rank={2}
  name="Bob"
  voteCount={8}
  percentage={32}
  avatar="https://..."
  animationDelay={100}
/>
```

**Features:**
- ✅ Animated progress bar (spring physics)
- ✅ Gradient background for winner
- ✅ Rank badge display
- ✅ Vote count and percentage
- ✅ Avatar with fallback
- ✅ Staggered animation support

**Animation Details:**
- Progress bar: Spring animation with 300ms delay + animationDelay
- Configuration: { damping: 15, stiffness: 100 }

---

### ProgressBar

Question progress indicator.

**Import:**
```tsx
import { ProgressBar, CompactProgressBar, DotProgress } from '@/components/patterns/ProgressBar';
```

**Props:**

```tsx
// ProgressBar
interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
}

// CompactProgressBar
interface CompactProgressBarProps {
  current: number;
  total: number;
}

// DotProgress
interface DotProgressProps {
  current: number;
  total: number;
  maxDots?: number;
}
```

**Usage Examples:**

```tsx
// Full progress bar with label
<ProgressBar current={3} total={10} showLabel />

// Compact version
<CompactProgressBar current={3} total={10} />

// Dot indicator (max 8 dots)
<DotProgress current={3} total={10} maxDots={8} />
```

**Features:**
- ✅ Animated progress fill
- ✅ Current/total label display
- ✅ Compact variant for minimal space
- ✅ Dot variant for visual preference
- ✅ Auto-scaling for many questions

---

## States

### EmptyState

Empty state placeholder with icon and message.

**Import:**
```tsx
import { EmptyState, CompactEmptyState } from '@/components/states/EmptyState';
```

**Props:**

```tsx
interface EmptyStateProps {
  variant:
    | 'no-circles'
    | 'no-polls'
    | 'no-votes'
    | 'no-notifications'
    | 'no-results'
    | 'search-empty'
    | 'network-error'
    | 'generic';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

**Usage Examples:**

```tsx
// No circles state
<EmptyState
  variant="no-circles"
  actionLabel="Create Circle"
  onAction={navigateToCreate}
/>

// Custom empty state
<EmptyState
  variant="generic"
  title="No Items Found"
  message="Try adjusting your filters"
/>

// Compact version
<CompactEmptyState
  variant="no-polls"
  message="No active polls"
/>
```

**Variants:**
- `no-circles`: "서클이 없어요" with circle icon
- `no-polls`: "진행 중인 투표가 없어요" with poll icon
- `no-votes`: "아직 투표가 없어요" with ballot icon
- `no-notifications`: "알림이 없어요" with bell icon
- `no-results`: "결과가 없어요" with chart icon
- `search-empty`: "검색 결과가 없어요" with magnifier icon
- `network-error`: "연결 실패" with wifi-off icon
- `generic`: Custom title/message

---

### LoadingSpinner

Loading indicator with multiple variants.

**Import:**
```tsx
import {
  LoadingSpinner,
  DotsLoading,
  PulseLoading
} from '@/components/states/LoadingSpinner';
```

**Props:**

```tsx
// LoadingSpinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

// DotsLoading
interface DotsLoadingProps {
  size?: number;
  color?: string;
}

// PulseLoading
interface PulseLoadingProps {
  size?: number;
  color?: string;
}
```

**Usage Examples:**

```tsx
// Basic spinner
<LoadingSpinner size="md" />

// Full screen loading overlay
<LoadingSpinner fullScreen overlay />

// Dots animation
<DotsLoading size={8} color={colors.primary} />

// Pulse animation
<PulseLoading size={40} color={colors.primary} />
```

**Size Scale:**
- `sm`: 16px
- `md`: 24px (default)
- `lg`: 32px
- `xl`: 48px

---

### Skeleton

Content placeholder with loading animation.

**Import:**
```tsx
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonList,
  SkeletonVoteCard,
  SkeletonResultBar
} from '@/components/states/Skeleton';
```

**Props:**

```tsx
// Base Skeleton
interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  variant?: 'rect' | 'circle' | 'rounded';
}

// Variants have specific layouts
```

**Usage Examples:**

```tsx
// Custom skeleton
<Skeleton width="100%" height={120} borderRadius={12} />

// Text skeleton
<SkeletonText lines={3} />

// Avatar skeleton
<SkeletonAvatar size={48} />

// Card skeleton
<SkeletonCard />

// List of skeletons
<SkeletonList count={5} />

// Vote card skeleton
<SkeletonVoteCard />

// Result bar skeleton
<SkeletonResultBar count={4} />
```

**Features:**
- ✅ Shimmer/pulse animation
- ✅ Pre-built variants for common patterns
- ✅ Customizable dimensions
- ✅ Stacked layout support

---

## Animation Hooks

All components use custom animation hooks from `src/hooks/`:

### useAnimation.ts

```tsx
import {
  useFadeIn,
  useFadeOut,
  useSlideIn,
  useScaleIn,
  usePulse,
  useButtonPress,
  useStaggeredFadeIn,
  useShake,
} from '@/hooks/useAnimation';
```

**Available Hooks:**
- `useFadeIn()` - Fade in from 0 to 1 opacity
- `useFadeOut()` - Fade out from 1 to 0 opacity
- `useSlideIn(direction)` - Slide in from direction ('up', 'down', 'left', 'right')
- `useScaleIn()` - Scale in from 0 to 1
- `usePulse()` - Continuous pulse animation
- `useButtonPress()` - Press animation for buttons
- `useStaggeredFadeIn(index, count)` - Staggered fade in for lists
- `useShake()` - Shake animation for errors

### useHaptics.ts

```tsx
import {
  useVoteHaptics,
  useCircleHaptics,
  useNavigationHaptics,
  useFormHaptics,
} from '@/hooks/useHaptics';
```

**Usage:**
```tsx
const voteHaptics = useVoteHaptics();

// Trigger haptics
voteHaptics.select(); // Light impact
voteHaptics.submit(); // Medium impact
voteHaptics.result(); // Success notification
```

---

## Best Practices

### 1. Component Composition

✅ **Good - Compose from primitives:**
```tsx
<Card>
  <Text variant="lg" weight="bold">Title</Text>
  <Text variant="sm" color="textSecondary">Description</Text>
  <Button variant="primary">Action</Button>
</Card>
```

❌ **Bad - Monolithic component:**
```tsx
<CustomCard title="Title" description="Description" actionLabel="Action" />
```

### 2. Animation Performance

✅ **Good - Use Reanimated for transforms:**
```tsx
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

return <Animated.View style={animatedStyle}>...</Animated.View>;
```

❌ **Bad - Animated API for transforms:**
```tsx
// Slower, runs on JS thread
Animated.timing(scale, { ... }).start();
```

### 3. Haptic Feedback

✅ **Good - Context-appropriate haptics:**
```tsx
const voteHaptics = useVoteHaptics();

<Button onPress={() => {
  voteHaptics.select();
  handleVote();
}}>
```

❌ **Bad - Generic haptics everywhere:**
```tsx
// Overuse causes haptic fatigue
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

### 4. Accessibility

✅ **Good - Proper labels and hints:**
```tsx
<Button
  accessibilityLabel="Submit vote for Alice"
  accessibilityHint="Double tap to confirm your vote"
>
  Vote
</Button>
```

❌ **Bad - Missing accessibility:**
```tsx
<TouchableOpacity onPress={handleVote}>
  <Text>Vote</Text>
</TouchableOpacity>
```

### 5. Styling

✅ **Good - Use design tokens:**
```tsx
import { colors, spacing, typography } from '@/theme/tokens';

const styles = StyleSheet.create({
  container: {
    padding: spacing[16],
    backgroundColor: colors.background,
  },
  title: {
    ...typography.lg,
    fontWeight: typography.weights.bold,
  },
});
```

❌ **Bad - Magic numbers and hardcoded values:**
```tsx
const styles = StyleSheet.create({
  container: {
    padding: 15, // Not on 8pt grid
    backgroundColor: '#FFFFFF', // Not from design tokens
  },
});
```

---

## Testing Guidelines

### Component Testing

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/primitives/Button';

describe('Button', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress}>Press Me</Button>
    );

    fireEvent.press(getByText('Press Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when loading', () => {
    const { getByTestId } = render(
      <Button loading>Submit</Button>
    );

    expect(getByTestId('loading-spinner')).toBeTruthy();
  });
});
```

### Snapshot Testing

```tsx
it('matches snapshot for primary variant', () => {
  const tree = render(
    <Button variant="primary">Primary Button</Button>
  ).toJSON();

  expect(tree).toMatchSnapshot();
});
```

---

## Migration Guide

### From v1 (Native RN components)

**Before:**
```tsx
import { View, Text, TouchableOpacity } from 'react-native';

<TouchableOpacity onPress={handlePress}>
  <View style={styles.card}>
    <Text style={styles.title}>Title</Text>
  </View>
</TouchableOpacity>
```

**After:**
```tsx
import { Card, Text, Button } from '@/components';

<Card onPress={handlePress}>
  <Text variant="lg" weight="bold">Title</Text>
</Card>
```

### Benefits

1. **Consistency** - All components follow design system
2. **Accessibility** - Built-in accessibility props
3. **Animation** - Smooth 60fps animations out of the box
4. **Haptics** - Context-appropriate haptic feedback
5. **Type Safety** - Full TypeScript support
6. **Maintainability** - Single source of truth for styles

---

## Resources

- **Design System**: `prd/design/02-ui-design-system.md`
- **Animation Guide**: `prd/design/03-animations.md`
- **Complete UI Spec**: `prd/design/05-complete-ui-specification.md`
- **Design Tokens**: `src/theme/tokens.ts`
- **Animation Tokens**: `src/theme/animations.ts`

---

## Support

For questions or issues, contact the frontend team or create an issue in the repository.

**Version**: 1.0.0
**Last Updated**: 2025-12-21
