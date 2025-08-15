import { create } from 'zustand';
import { 
  CircleState, 
  CircleResponse, 
  CircleCreate, 
  CircleJoinRequest, 
  CircleMember 
} from '../types';
import { circleApi } from '../services/api';

interface CircleStore extends CircleState {
  // Actions
  getMyCircles: () => Promise<void>;
  createCircle: (circleData: CircleCreate) => Promise<CircleResponse | null>;
  getCircle: (circleId: number) => Promise<void>;
  joinCircle: (joinData: CircleJoinRequest) => Promise<CircleResponse | null>;
  getCircleMembers: (circleId: number) => Promise<void>;
  setCurrentCircle: (circle: CircleResponse | null) => void;
  addCircle: (circle: CircleResponse) => void;
  updateCircle: (circleId: number, updates: Partial<CircleResponse>) => void;
  removeCircle: (circleId: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useCircleStore = create<CircleStore>((set, get) => ({
  // Initial state
  circles: [],
  currentCircle: null,
  members: [],
  loading: false,
  error: null,

  // Actions
  getMyCircles: async () => {
    try {
      set({ loading: true, error: null });
      
      const circles = await circleApi.getMyCircles();
      
      set({
        circles,
        loading: false,
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to load circles',
      });
    }
  },

  createCircle: async (circleData: CircleCreate) => {
    try {
      set({ loading: true, error: null });
      
      const newCircle = await circleApi.createCircle(circleData);
      
      if (newCircle) {
        const { circles } = get();
        set({
          circles: [newCircle, ...circles],
          loading: false,
        });
        return newCircle;
      }
      
      set({ loading: false });
      return null;
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to create circle',
      });
      throw error;
    }
  },

  getCircle: async (circleId: number) => {
    try {
      set({ loading: true, error: null });
      
      const circle = await circleApi.getCircle(circleId);
      
      if (circle) {
        set({
          currentCircle: circle,
          loading: false,
        });
      } else {
        set({
          loading: false,
          error: 'Circle not found',
        });
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to load circle',
      });
    }
  },

  joinCircle: async (joinData: CircleJoinRequest) => {
    try {
      set({ loading: true, error: null });
      
      const joinedCircle = await circleApi.joinCircle(joinData);
      
      if (joinedCircle) {
        const { circles } = get();
        const existingIndex = circles.findIndex(c => c.id === joinedCircle.id);
        
        let updatedCircles;
        if (existingIndex >= 0) {
          // Update existing circle
          updatedCircles = [...circles];
          updatedCircles[existingIndex] = joinedCircle;
        } else {
          // Add new circle
          updatedCircles = [joinedCircle, ...circles];
        }
        
        set({
          circles: updatedCircles,
          loading: false,
        });
        
        return joinedCircle;
      }
      
      set({ loading: false });
      return null;
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to join circle',
      });
      throw error;
    }
  },

  getCircleMembers: async (circleId: number) => {
    try {
      set({ loading: true, error: null });
      
      const members = await circleApi.getCircleMembers(circleId);
      
      set({
        members,
        loading: false,
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to load members',
      });
    }
  },

  setCurrentCircle: (circle: CircleResponse | null) => {
    set({ currentCircle: circle });
  },

  addCircle: (circle: CircleResponse) => {
    const { circles } = get();
    set({ circles: [circle, ...circles] });
  },

  updateCircle: (circleId: number, updates: Partial<CircleResponse>) => {
    const { circles, currentCircle } = get();
    
    const updatedCircles = circles.map(circle =>
      circle.id === circleId ? { ...circle, ...updates } : circle
    );
    
    const updatedCurrentCircle = currentCircle?.id === circleId
      ? { ...currentCircle, ...updates }
      : currentCircle;
    
    set({
      circles: updatedCircles,
      currentCircle: updatedCurrentCircle,
    });
  },

  removeCircle: (circleId: number) => {
    const { circles, currentCircle } = get();
    
    const updatedCircles = circles.filter(circle => circle.id !== circleId);
    const updatedCurrentCircle = currentCircle?.id === circleId ? null : currentCircle;
    
    set({
      circles: updatedCircles,
      currentCircle: updatedCurrentCircle,
    });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));