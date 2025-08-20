import { apiClient } from './client';
import { 
  PollResponse, 
  PollCreate, 
  VoteCreate,
  PollParticipation,
  VoteResult
} from '../../types';

export const pollApi = {
  /**
   * Create a new poll
   */
  async createPoll(pollData: PollCreate): Promise<PollResponse | null> {
    const response = await apiClient.post<PollResponse>('/v1/polls', pollData);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || null;
  },

  /**
   * Get polls for a specific circle
   */
  async getCirclePolls(circleId: number): Promise<PollResponse[]> {
    const response = await apiClient.get<PollResponse[]>(`/v1/circles/${circleId}/polls`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || [];
  },

  /**
   * Get poll details by ID
   */
  async getPoll(pollId: number): Promise<PollResponse | null> {
    const response = await apiClient.get<PollResponse>(`/v1/polls/${pollId}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || null;
  },

  /**
   * Vote on a poll
   */
  async votePoll(pollId: number, voteData: VoteCreate): Promise<void> {
    const response = await apiClient.post(`/v1/polls/${pollId}/vote`, voteData);
    
    if (response.error) {
      throw new Error(response.error);
    }
  },

  /**
   * Get poll results (same as getPoll but emphasizes results)
   */
  async getPollResults(pollId: number): Promise<PollResponse | null> {
    return this.getPoll(pollId);
  },

  /**
   * Update poll (if implemented in backend)
   */
  async updatePoll(pollId: number, updateData: any): Promise<PollResponse | null> {
    const response = await apiClient.put<PollResponse>(`/v1/polls/${pollId}`, updateData);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || null;
  },

  /**
   * Delete poll (if implemented in backend)
   */
  async deletePoll(pollId: number): Promise<void> {
    const response = await apiClient.delete(`/v1/polls/${pollId}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
  },

  /**
   * Get active polls for a circle (for participation)
   */
  async getActivePolls(circleId: number): Promise<PollResponse[]> {
    const response = await apiClient.get<PollResponse[]>(`/v1/circles/${circleId}/polls?status=active`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || [];
  },

  /**
   * Check user's participation status for a poll
   */
  async getPollParticipation(pollId: number): Promise<PollParticipation | null> {
    const response = await apiClient.get<PollParticipation>(`/v1/polls/${pollId}/participation`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || null;
  },

  /**
   * Get detailed vote results for a poll
   */
  async getVoteResults(pollId: number): Promise<VoteResult[]> {
    const response = await apiClient.get<VoteResult[]>(`/v1/polls/${pollId}/results`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || [];
  },

  /**
   * Remove vote from a poll (if allowed)
   */
  async removeVote(pollId: number): Promise<void> {
    const response = await apiClient.delete(`/v1/polls/${pollId}/vote`);
    
    if (response.error) {
      throw new Error(response.error);
    }
  },
};