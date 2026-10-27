import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateMeApi } from '../../../services/apiAuth';

export function useUpdateUser() {
  const queryClient = useQueryClient();

  const { mutate: updateUser, isPending: isUpdating } = useMutation({
    mutationFn: updateMeApi,
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user);
      toast.success('Your profile has been successfully updated!');
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.message || 'Failed to update profile information.';
      toast.error(errorMessage);
    },
  });

  return { updateUser, isUpdating };
}
