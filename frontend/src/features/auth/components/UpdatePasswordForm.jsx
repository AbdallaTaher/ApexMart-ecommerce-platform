import { useForm } from 'react-hook-form';
import { useUpdatePassword } from '../hooks/useUpdatePassword';
import Button from '../../../ui/Button';
import FormRow from '../../../ui/FormRow';
import Input from '../../../ui/Input';

/**
 * Account Security & Password Updater Component
 */
export default function UpdatePasswordForm() {
  const { updatePassword, isUpdating } = useUpdatePassword();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      passwordCurrent: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const newPasswordValue = watch('password', '');

  const onSubmit = ({ passwordCurrent, password, passwordConfirm }) => {
    updatePassword(
      { passwordCurrent, password, passwordConfirm },
      {
        onSuccess: () => {
          reset();
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white dark:bg-[#1a1f29] p-6 rounded-xl border border-gray-200 dark:border-brand-darkborder shadow-sm space-y-4"
      noValidate
    >
      <div className="border-b border-gray-100 dark:border-brand-darkborder pb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Change Password
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Ensure your account is using a long, random password to stay secure.
        </p>
      </div>

      <div className="space-y-4 max-w-lg">
        <FormRow
          label="Current Password"
          id="current-password"
          error={errors.passwordCurrent?.message}
        >
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            disabled={isUpdating}
            hasError={Boolean(errors.passwordCurrent)}
            placeholder="Enter current password"
            {...register('passwordCurrent', {
              required: 'Please provide your current password',
            })}
          />
        </FormRow>

        <FormRow
          label="New Password"
          id="new-password"
          error={errors.password?.message}
        >
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            disabled={isUpdating}
            hasError={Boolean(errors.password)}
            placeholder="At least 8 characters"
            {...register('password', {
              required: 'Please enter your new password',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            })}
          />
        </FormRow>

        <FormRow
          label="Confirm New Password"
          id="new-password-confirm"
          error={errors.passwordConfirm?.message}
        >
          <Input
            id="new-password-confirm"
            type="password"
            autoComplete="new-password"
            disabled={isUpdating}
            hasError={Boolean(errors.passwordConfirm)}
            placeholder="Confirm new password"
            {...register('passwordConfirm', {
              required: 'Please confirm your new password',
              validate: (value) =>
                value === newPasswordValue || 'Passwords do not match',
            })}
          />
        </FormRow>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isUpdating}
          onClick={() => reset()}
        >
          Clear
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isUpdating}
          disabled={isUpdating}
        >
          Update Password
        </Button>
      </div>
    </form>
  );
}
