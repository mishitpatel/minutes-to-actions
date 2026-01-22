import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, type User } from '../services/auth.service';

export const AUTH_QUERY_KEY = ['auth', 'me'];

export function useAuth() {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authService.getMe,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });

  const login = () => {
    window.location.href = authService.getGoogleAuthUrl();
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user as User | undefined,
    isLoading,
    isAuthenticated: !!user && !isError,
    isError,
    error,
    login,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}
