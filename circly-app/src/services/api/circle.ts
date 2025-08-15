import { apiClient } from './client';
import { 
  CircleResponse, 
  CircleCreate, 
  CircleJoinRequest, 
  CircleMember 
} from '../../types';

export const circleApi = {
  /**
   * Create a new circle
   */
  async createCircle(circleData: CircleCreate): Promise<CircleResponse | null> {
    const response = await apiClient.post<CircleResponse>('/v1/circles', circleData);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || null;
  },

  /**
   * Get all circles for current user
   */
  async getMyCircles(): Promise<CircleResponse[]> {
    const response = await apiClient.get<CircleResponse[]>('/v1/circles');
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || [];
  },

  /**
   * Get circle details by ID
   */
  async getCircle(circleId: number): Promise<CircleResponse | null> {
    const response = await apiClient.get<CircleResponse>(`/v1/circles/${circleId}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || null;
  },

  /**
   * Join circle with invite code
   */
  async joinCircle(joinData: CircleJoinRequest): Promise<CircleResponse | null> {
    const response = await apiClient.post<CircleResponse>('/v1/circles/join', joinData);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || null;
  },

  /**
   * Get circle members
   */
  async getCircleMembers(circleId: number): Promise<CircleMember[]> {
    const response = await apiClient.get<CircleMember[]>(`/v1/circles/${circleId}/members`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || [];
  },

  /**
   * Leave circle (if implemented in backend)
   */
  async leaveCircle(circleId: number): Promise<void> {
    const response = await apiClient.delete(`/v1/circles/${circleId}/leave`);
    
    if (response.error) {
      throw new Error(response.error);
    }
  },
};