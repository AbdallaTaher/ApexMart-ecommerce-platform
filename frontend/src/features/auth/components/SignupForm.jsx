import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useSignup } from '../hooks/useSignup';
import Button from '../../../ui/Button';
import FormRow from '../../../ui/FormRow';
import Input from '../../../ui/Input';

/**
 * Amazon-style User Registration Form Component
 */
export default function SignupForm() {
  const { signup, isPending } = useSignup();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
      password: '',
      passwordConfirm: '',
    },
  });

  const onSubmit = (formData) => {
    signup(formData);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Registration Card */}
      <div className="bg-white dark:bg-[#1a1f29] p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-brand-darkborder">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5 font-display tracking-tight">
          Create account
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormRow
            label="Your name"
            id="name"
            error={errors.name?.message}
          >
            <Input
              id="name"
              type="text"
              autoComplete="name"
              disabled={isPending}
              hasError={Boolean(errors.name)}
              placeholder="First and last name"
              {...register('name', {
                required: 'Please enter your name',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
            />
          </FormRow>

          <FormRow
            label="Email"
            id="email"
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isPending}
              hasError={Boolean(errors.email)}
              placeholder="e.g. alex@example.com"
              {...register('email', {
                required: 'Please enter your email',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Please provide a valid email address',
                },
              })}
            />
          </FormRow>

          {/* Account Role / Tier Selection */}
          <div className="flex flex-col gap-1.5 w-full">
            <label
              htmlFor="role"
              className="text-xs font-bold text-gray-800 dark:text-gray-200 tracking-tight"
            >
              Account Type
            </label>
            <select
              id="role"
              disabled={isPending}
              {...register('role')}
              className="w-full px-3 py-2 text-sm rounded-md transition-colors duration-150 bg-white dark:bg-[#1a1f29] text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-brand-darkborder focus:outline-none focus:ring-2 focus:ring-brand-amber focus:border-brand-amber cursor-pointer"
            >
              <option value="user">Customer / Personal Buyer</option>
              <option value="seller">Merchant Seller (Seller Central Access)</option>
            </select>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Choose "Merchant Seller" if you plan to list and sell products.
            </p>
          </div>

          <FormRow
            label="Password"
            id="password"
            error={errors.password?.message}
            helperText="Passwords must be at least 8 characters."
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              disabled={isPending}
              hasError={Boolean(errors.password)}
              placeholder="At least 8 characters"
              {...register('password', {
                required: 'Please enter a password',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
            />
          </FormRow>

          <FormRow
            label="Re-enter password"
            id="passwordConfirm"
            error={errors.passwordConfirm?.message}
          >
            <Input
              id="passwordConfirm"
              type="password"
              autoComplete="new-password"
              disabled={isPending}
              hasError={Boolean(errors.passwordConfirm)}
              placeholder="Re-enter password"
              {...register('passwordConfirm', {
                required: 'Please confirm your password',
                validate: (val) =>
                  val === getValues('password') || 'Passwords do not match',
              })}
            />
          </FormRow>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isPending}
            disabled={isPending}
            className="w-full mt-2"
          >
            {isPending ? 'Creating account...' : 'Create your ApexMart account'}
          </Button>

          <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-4 leading-relaxed">
            By creating an account, you agree to ApexMart's{' '}
            <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">
              Conditions of Use
            </span>{' '}
            and{' '}
            <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">
              Privacy Notice
            </span>.
          </div>
        </form>

        <div className="border-t border-gray-200 dark:border-brand-darkborder mt-6 pt-4 text-xs text-gray-700 dark:text-gray-300">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
