// Re-export all types
export * from './api';
export * from './user';
export * from './circle';
export * from './poll';

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  CircleDetail: { circleId: number };
  CreateCircle: undefined;
  JoinCircle: undefined;
  CreatePoll: { circleId: number };
  PollDetail: { pollId: number };
  Profile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Create: undefined;
  Profile: undefined;
};

// Common utility types
export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface BaseState {
  loading: boolean;
  error: string | null;
}

// App configuration
export interface AppConfig {
  apiUrl: string;
  appName: string;
  version: string;
}