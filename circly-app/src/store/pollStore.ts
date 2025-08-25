import { create } from 'zustand';
import { 
  PollState, 
  PollResponse, 
  PollCreate, 
  VoteCreate 
} from '../types';
import { pollApi } from '../services/api';

interface PollStore extends PollState {
  // Actions
  createPoll: (pollData: PollCreate) => Promise<PollResponse | null>;
  getCirclePolls: (circleId: number) => Promise<void>;
  getMyActivePolls: () => Promise<void>;
  getPoll: (pollId: number) => Promise<void>;
  votePoll: (pollId: number, voteData: VoteCreate) => Promise<void>;
  refreshPoll: (pollId: number) => Promise<void>;
  setCurrentPoll: (poll: PollResponse | null) => void;
  addPoll: (poll: PollResponse) => void;
  updatePoll: (pollId: number, updates: Partial<PollResponse>) => void;
  removePoll: (pollId: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearPolls: () => void;
}

export const usePollStore = create<PollStore>((set, get) => ({
  // Initial state
  polls: [],
  currentPoll: null,
  loading: false,
  error: null,

  // Actions
  createPoll: async (pollData: PollCreate) => {
    try {
      set({ loading: true, error: null });
      
      const newPoll = await pollApi.createPoll(pollData);
      
      if (newPoll) {
        const { polls } = get();
        set({
          polls: [newPoll, ...polls],
          loading: false,
        });
        return newPoll;
      }
      
      set({ loading: false });
      return null;
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to create poll',
      });
      throw error;
    }
  },

  getCirclePolls: async (circleId: number) => {
    try {
      set({ loading: true, error: null });
      
      const polls = await pollApi.getCirclePolls(circleId);
      
      set({
        polls,
        loading: false,
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to load polls',
      });
    }
  },

  getMyActivePolls: async () => {
    try {
      set({ loading: true, error: null });
      
      const polls = await pollApi.getMyActivePolls();
      
      set({
        polls,
        loading: false,
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to load active polls',
      });
    }
  },

  getPoll: async (pollId: number) => {
    try {
      set({ loading: true, error: null });
      
      const poll = await pollApi.getPoll(pollId);
      
      if (poll) {
        set({
          currentPoll: poll,
          loading: false,
        });
      } else {
        set({
          loading: false,
          error: 'Poll not found',
        });
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to load poll',
      });
    }
  },

  votePoll: async (pollId: number, voteData: VoteCreate) => {
    try {
      set({ loading: true, error: null });
      
      await pollApi.votePoll(pollId, voteData);
      
      // Refresh the poll to get updated results
      const updatedPoll = await pollApi.getPoll(pollId);
      
      if (updatedPoll) {
        const { polls, currentPoll } = get();
        
        // Update polls list
        const updatedPolls = polls.map(poll =>
          poll.id === pollId ? updatedPoll : poll
        );
        
        // Update current poll if it's the same
        const updatedCurrentPoll = currentPoll?.id === pollId ? updatedPoll : currentPoll;
        
        set({
          polls: updatedPolls,
          currentPoll: updatedCurrentPoll,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to vote',
      });
      throw error;
    }
  },

  refreshPoll: async (pollId: number) => {
    try {
      const poll = await pollApi.getPoll(pollId);
      
      if (poll) {
        const { polls, currentPoll } = get();
        
        // Update polls list
        const updatedPolls = polls.map(p =>
          p.id === pollId ? poll : p
        );
        
        // Update current poll if it's the same
        const updatedCurrentPoll = currentPoll?.id === pollId ? poll : currentPoll;
        
        set({
          polls: updatedPolls,
          currentPoll: updatedCurrentPoll,
        });
      }
    } catch (error: any) {
      console.warn('Failed to refresh poll:', error);
    }
  },

  setCurrentPoll: (poll: PollResponse | null) => {
    set({ currentPoll: poll });
  },

  addPoll: (poll: PollResponse) => {
    const { polls } = get();
    set({ polls: [poll, ...polls] });
  },

  updatePoll: (pollId: number, updates: Partial<PollResponse>) => {
    const { polls, currentPoll } = get();
    
    const updatedPolls = polls.map(poll =>
      poll.id === pollId ? { ...poll, ...updates } : poll
    );
    
    const updatedCurrentPoll = currentPoll?.id === pollId
      ? { ...currentPoll, ...updates }
      : currentPoll;
    
    set({
      polls: updatedPolls,
      currentPoll: updatedCurrentPoll,
    });
  },

  removePoll: (pollId: number) => {
    const { polls, currentPoll } = get();
    
    const updatedPolls = polls.filter(poll => poll.id !== pollId);
    const updatedCurrentPoll = currentPoll?.id === pollId ? null : currentPoll;
    
    set({
      polls: updatedPolls,
      currentPoll: updatedCurrentPoll,
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

  clearPolls: () => {
    set({ polls: [], currentPoll: null });
  },
}));