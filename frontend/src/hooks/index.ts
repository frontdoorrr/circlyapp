/**
 * Hooks Barrel Export
 *
 * 모든 커스텀 훅의 중앙 export 파일
 */

// Animation Hooks
export {
  useFadeIn,
  useFadeOut,
  useSlideIn,
  useScaleIn,
  usePulse,
  useButtonPress,
  useStaggeredFadeIn,
  useShake,
  type SlideDirection,
} from './useAnimation';

// Haptic Feedback Hooks
export {
  useHaptics,
  useVoteHaptics,
  useCircleHaptics,
  useNavigationHaptics,
  useFormHaptics,
  type HapticAction,
} from './useHaptics';
