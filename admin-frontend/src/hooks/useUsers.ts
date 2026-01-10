import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import type { UserFilters, UpdateUserStatusRequest, UpdateUserRoleRequest } from '@/types/users';

export const usersKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...usersKeys.all, 'list', filters] as const,
  detail: (id: string) => [...usersKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch users list with filters
 */
export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: usersKeys.list(filters),
    queryFn: () => usersApi.getAll(filters),
  });
}

/**
 * Hook to fetch single user
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => usersApi.getById(userId),
    enabled: !!userId,
  });
}

/**
 * Hook to update user status
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserStatusRequest }) =>
      usersApi.updateStatus(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

/**
 * Hook to update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserRoleRequest }) =>
      usersApi.updateRole(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}
