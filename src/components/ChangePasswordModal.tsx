import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ChangePasswordModal: React.FC = () => {
  const { changePassword, mustChangePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    const res = await changePassword(newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.error || 'Failed to update password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-red-100 space-y-5">
        
        {/* Header */}
        <div className="flex items-start space-x-3.5 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E53935] flex items-center justify-center border border-red-100 flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#191A1D]">
              Security Notice: Change Initial Password
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Company policy requires setting a personal secure password upon initial administrator activation.
            </p>
          </div>
        </div>

        {success ? (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900">Password Updated Successfully</h3>
            <p className="text-xs text-emerald-700">
              Your new password is now active for all future logins.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span>New Secure Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 pr-10 focus:outline-none focus:border-[#E53935]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                <span>Confirm New Password</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E53935]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#E53935] hover:bg-[#D32F2F] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Updating Security Profile...' : 'Save New Password & Continue'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
