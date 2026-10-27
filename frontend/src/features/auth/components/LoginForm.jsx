import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import Button from '../../../ui/Button';
import FormRow from '../../../ui/FormRow';
import Input from '../../../ui/Input';

/**
 * Amazon-style Authentication Card Component
 */
export default function LoginForm() {
  const { login, isPending } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = ({ email, password }) => {
    login({ email, password });
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Login Card */}
      <div className="bg-white dark:bg-[#1a1f29] p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-brand-darkborder">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5 font-display tracking-tight">
          Sign in
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormRow
            label="Email or mobile phone number"
            id="email"
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isPending}
              hasError={Boolean(errors.email)}
              placeholder="e.g. buyer@example.com"
              {...register('email', {
                required: 'Please enter your email',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Please provide a valid email address',
                },
              })}
            />
          </FormRow>

          <FormRow
            label={
              <span className="flex items-center justify-between w-full">
                <span>Password</span>
                <Link
                  to="/forgot-password"
                  className="font-normal text-blue-600 dark:text-blue-400 hover:underline text-xs"
                >
                  Forgot your password?
                </Link>
              </span>
            }
            id="password"
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isPending}
              hasError={Boolean(errors.password)}
              placeholder="At least 8 characters"
              {...register('password', {
                required: 'Please enter your password',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
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
            {isPending ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-4 leading-relaxed">
            By continuing, you agree to ApexMart's{' '}
            <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">
              Conditions of Use
            </span>{' '}
            and{' '}
            <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">
              Privacy Notice
            </span>.
          </div>
        </form>
      </div>

      {/* Divider */}
      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-brand-darkborder"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-100 dark:bg-brand-slate px-2 text-gray-500 dark:text-gray-400 font-medium">
            New to ApexMart?
          </span>
        </div>
      </div>

      {/* Create Account Action */}
      <Link
        to="/signup"
        className="w-full block text-center py-2 px-4 text-xs font-semibold rounded-md border border-gray-300 dark:border-brand-darkborder bg-white dark:bg-[#1a1f29] text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition active:scale-[0.99]"
      >
        Create your ApexMart account
      </Link>
    </div>
  );
}
