import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateUserRole } from '../../../services/apiAdmin';

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  const { mutate: updateRole, isLoading: isUpdating } = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole({ userId, role }),
    onSuccess: (updatedUser, variables) => {
      toast.success(
        `Role for ${updatedUser?.email || 'user'} successfully changed to ${variables.role.toUpperCase()}`
      );
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditLogs'] });
      queryClient.invalidateQueries({ queryKey: ['adminAuditStats'] });
    },
    onError: (err) => {
      const message =
        err.response?.data?.message || err.message || 'Failed to update user role';
      toast.error(message);
    },
  });

  return {
    updateRole,
    isUpdating,
  };
}
