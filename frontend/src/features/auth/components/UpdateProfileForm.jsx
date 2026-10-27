import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useUser } from '../hooks/useUser';
import { useUpdateUser } from '../hooks/useUpdateUser';
import Button from '../../../ui/Button';
import FormRow from '../../../ui/FormRow';
import Input from '../../../ui/Input';

/**
 * Account Profile Details Editor Component
 */
export default function UpdateProfileForm() {
  const { user } = useUser();
  const { updateUser, isUpdating } = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user, reset]);

  const onSubmit = ({ name, email }) => {
    updateUser(
      { name, email },
      {
        onSuccess: () => {
          reset({ name, email });
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
          Personal Information
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Update your public name and primary login email address.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormRow label="Full Name" id="profile-name" error={errors.name?.message}>
          <Input
            id="profile-name"
            type="text"
            disabled={isUpdating}
            hasError={Boolean(errors.name)}
            placeholder="Your name"
            {...register('name', {
              required: 'Please provide your name',
              minLength: {
                value: 2,
                message: 'Name must have at least 2 characters',
              },
            })}
          />
        </FormRow>

        <FormRow label="Email Address" id="profile-email" error={errors.email?.message}>
          <Input
            id="profile-email"
            type="email"
            disabled={isUpdating}
            hasError={Boolean(errors.email)}
            placeholder="Your email address"
            {...register('email', {
              required: 'Please provide your email address',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Please provide a valid email address',
              },
            })}
          />
        </FormRow>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!isDirty || isUpdating}
          onClick={() =>
            reset({
              name: user?.name || '',
              email: user?.email || '',
            })
          }
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isUpdating}
          disabled={!isDirty || isUpdating}
        >
          Save Profile
        </Button>
      </div>
    </form>
  );
}
