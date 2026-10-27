import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import { useResetPassword } from '../hooks/useResetPassword';
import Button from '../../../ui/Button';
import FormRow from '../../../ui/FormRow';
import Input from '../../../ui/Input';

/**
 * Amazon-styled Reset Password Card Component
 */
export default function ResetPasswordForm() {
  const { token } = useParams();
  const { resetPassword, isResetting } = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: '',
      passwordConfirm: '',
    },
  });

  const passwordValue = watch('password', '');

  // Calculate dynamic password strength score (0-4)
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(passwordValue);

  const getStrengthLabel = () => {
    if (!passwordValue) return '';
    if (strength <= 1) return 'Weak';
    if (strength === 2 || strength === 3) return 'Moderate';
    return 'Strong';
  };

  const cleanToken = token ? token.trim() : '';

  const onSubmit = ({ password, passwordConfirm }) => {
    if (!cleanToken || cleanToken === ':token') {
      return;
    }
    resetPassword({ token: cleanToken, password, passwordConfirm });
  };

  if (!cleanToken || cleanToken === ':token') {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-white dark:bg-[#1a1f29] p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-brand-darkborder text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 text-xl font-bold">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-display">
            Invalid Recovery Link
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            The reset token is missing or malformed in the URL. Please request a new password recovery link.
          </p>
          <Link
            to="/forgot-password"
            className="block w-full py-2.5 px-4 bg-brand-amber hover:bg-amber-500 text-slate-950 font-bold rounded shadow-sm text-xs transition text-center"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white dark:bg-[#1a1f29] p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-brand-darkborder">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 font-display tracking-tight">
          Create new password
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
          We'll ask for this new password whenever you sign in to ApexMart.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* New Password */}
          <FormRow
            label="New password"
            id="password"
            error={errors.password?.message}
          >
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                disabled={isResetting}
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
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <HiOutlineEyeSlash className="w-4 h-4" />
                ) : (
                  <HiOutlineEye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {passwordValue && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500">Security strength:</span>
                  <span
                    className={
                      strength <= 1
                        ? 'text-red-500 font-semibold'
                        : strength <= 3
                        ? 'text-amber-500 font-semibold'
                        : 'text-emerald-500 font-semibold'
                    }
                  >
                    {getStrengthLabel()}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength <= 1
                        ? 'w-1/4 bg-red-500'
                        : strength <= 3
                        ? 'w-3/4 bg-amber-500'
                        : 'w-full bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </FormRow>

          {/* Confirm Password */}
          <FormRow
            label="Re-enter password"
            id="passwordConfirm"
            error={errors.passwordConfirm?.message}
          >
            <Input
              id="passwordConfirm"
              type="password"
              autoComplete="new-password"
              disabled={isResetting}
              hasError={Boolean(errors.passwordConfirm)}
              placeholder="Confirm new password"
              {...register('passwordConfirm', {
                required: 'Please confirm your new password',
                validate: (value) =>
                  value === passwordValue || 'Passwords do not match',
              })}
            />
          </FormRow>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isResetting}
            disabled={isResetting}
            className="w-full mt-2"
          >
            {isResetting ? 'Saving changes...' : 'Save changes and sign in'}
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Cancel and return to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
