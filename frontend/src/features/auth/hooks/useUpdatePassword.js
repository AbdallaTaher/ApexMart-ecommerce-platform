import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updatePasswordApi } from '../../../services/apiAuth';

export function useUpdatePassword() {
  const queryClient = useQueryClient();

  const { mutate: updatePassword, isPending: isUpdating } = useMutation({
    mutationFn: updatePasswordApi,
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user);
      toast.success('Your password has been successfully updated!');
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || 'Failed to update password. Please verify current password.';
      toast.error(errorMessage);
    },
  });

  return { updatePassword, isUpdating };
}
