import { create } from 'zustand';

/**
 * 투표 생성 상태 관리 스토어
 *
 * 투표 생성 플로우 전체에서 사용되는 상태를 관리합니다:
 * 1. 카테고리 선택
 * 2. 질문 선택 (template)
 * 3. 투표 설정 (duration, target, notification)
 */

export type PollDuration = '1H' | '3H' | '6H' | '24H';
export type PollTarget = 'all' | 'selected';
export type NotificationTiming = 'immediate' | 'scheduled';

interface SelectedTemplate {
  id: string;
  emoji: string;
  text: string;
}

interface PollSettings {
  duration: PollDuration;
  target: PollTarget;
  notificationTiming: NotificationTiming;
  scheduledTime?: Date;
}

interface PollCreateState {
  // State
  selectedCategory: string | null;
  selectedTemplate: SelectedTemplate | null;
  settings: PollSettings;
  circleId: string | null;

  // Actions
  setCategory: (category: string) => void;
  setTemplate: (template: SelectedTemplate) => void;
  setSettings: (settings: Partial<PollSettings>) => void;
  setCircleId: (circleId: string) => void;
  reset: () => void;

  // Computed
  isComplete: () => boolean;
}

const defaultSettings: PollSettings = {
  duration: '6H',
  target: 'all',
  notificationTiming: 'immediate',
};

export const usePollCreateStore = create<PollCreateState>((set, get) => ({
  // Initial state
  selectedCategory: null,
  selectedTemplate: null,
  settings: defaultSettings,
  circleId: null,

  // Actions
  setCategory: (category) => set({ selectedCategory: category }),

  setTemplate: (template) => set({ selectedTemplate: template }),

  setSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setCircleId: (circleId) => set({ circleId }),

  reset: () =>
    set({
      selectedCategory: null,
      selectedTemplate: null,
      settings: defaultSettings,
      circleId: null,
    }),

  // Computed
  isComplete: () => {
    const state = get();
    return (
      state.selectedTemplate !== null &&
      state.circleId !== null &&
      state.settings.duration !== null
    );
  },
}));
