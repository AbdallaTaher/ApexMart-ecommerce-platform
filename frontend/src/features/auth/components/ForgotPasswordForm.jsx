import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '../hooks/useForgotPassword';
import Button from '../../../ui/Button';
import FormRow from '../../../ui/FormRow';
import Input from '../../../ui/Input';

/**
 * Amazon-styled Password Assistance / Recovery Request Card
 */
export default function ForgotPasswordForm() {
  const { forgotPassword, isSending } = useForgotPassword();
  const [submittedEmail, setSubmittedEmail] = useState(null);
  const [resetToken, setResetToken] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = ({ email }) => {
    forgotPassword(
      { email },
      {
        onSuccess: (data) => {
          setSubmittedEmail(email);
          setResetToken(data?.resetToken || null);
        },
      }
    );
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white dark:bg-[#1a1f29] p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-brand-darkborder">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 font-display tracking-tight">
          Password assistance
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
          Enter the email address associated with your ApexMart account and we'll send you a secure password reset link.
        </p>

        {submittedEmail ? (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              We've sent recovery instructions to <strong>{submittedEmail}</strong>.
            </div>

            {resetToken && (
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-950 dark:text-blue-200 space-y-2.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                  <span>🚀</span>
                  <span>Development Quick Reset:</span>
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  Click below to open your reset link directly without copying from the terminal:
                </p>
                <Link
                  to={`/reset-password/${resetToken}`}
                  className="inline-block w-full text-center py-2 px-3 bg-brand-amber hover:bg-amber-500 text-slate-950 font-bold rounded shadow-sm text-xs transition"
                >
                  Open Password Reset Page →
                </Link>
              </div>
            )}

            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => {
                setSubmittedEmail(null);
                setResetToken(null);
              }}
            >
              Resend with different email
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Return to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormRow
              label="Email address"
              id="email"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isSending}
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

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSending}
              disabled={isSending}
              className="w-full mt-2"
            >
              {isSending ? 'Sending instructions...' : 'Continue'}
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Remember your password? Sign in
              </Link>
            </div>
          </form>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        Has your email address changed?{' '}
        <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
          Customer Service
        </span>
      </div>
    </div>
  );
}
