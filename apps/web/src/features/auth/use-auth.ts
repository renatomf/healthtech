import type { LoginRequest, Role, UserResponse } from '@healthtech/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ApiError, api } from '../../lib/api.ts';

export const ME_KEY = ['me'];

export const homeOf = (role: Role) => (role === 'CLINIC' ? '/clinica' : '/paciente');

export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await api<UserResponse>('/auth/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (body: LoginRequest) => api<UserResponse>('/auth/login', { method: 'POST', body }),
    onSuccess: (user) => {
      queryClient.setQueryData(ME_KEY, user);
      navigate(homeOf(user.role), { replace: true });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(ME_KEY, null);
      navigate('/login', { replace: true });
    },
  });
}
