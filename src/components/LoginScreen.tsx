import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Cloud, 
  CloudOff,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login, isConfigured } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRecoveryInfo, setShowRecoveryInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      setErrorMessage('Please enter both your Login ID and password.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const res = await login(loginId.trim(), password, rememberMe);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleDemoAdmin = () => {
    setLoginId('admin@xidaamoto.com');
    setPassword('Xidaa#Admin2026');
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col justify-center items-center px-4 py-8 selection:bg-[#E53935] selection:text-white">
      
      {/* Container */}
      <div className="max-w-md w-full space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 inline-block">
              <img 
                src="/assets/xidaa-logo-dark.png" 
                alt="Xidaa Moto" 
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>

          <div>
            <div className="h-1 w-24 mx-auto bg-gradient-to-r from-[#FF9933] via-white to-[#128807] rounded-full my-2" />
            <h1 className="text-xl sm:text-2xl font-black text-[#191A1D] tracking-tight">
              Xidaa Commercial Portal
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Internal Dealership Quotation & Discount Calculator
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-card bg-white/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200/90 space-y-5">
          
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-[#191A1D] uppercase tracking-wider">
                Authorized Access
              </h2>
              <p className="text-[11px] text-gray-400">
                Sign in to manage commercial orders
              </p>
            </div>
            
            {/* Cloud Status Pill */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              isConfigured 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {isConfigured ? (
                <>
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  <span>Supabase Live</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3 h-3 text-amber-600" />
                  <span>Local Sandbox</span>
                </>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium animate-fade-in flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Login ID / Username */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Login ID or Username</span>
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="e.g. admin or sales@xidaamoto.com"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowRecoveryInfo(!showRecoveryInfo)}
                  className="text-[11px] font-semibold text-[#E53935] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 pr-10 focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#E53935] focus:ring-[#E53935] cursor-pointer"
                />
                <span>Remember this session</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#E53935] hover:bg-[#D32F2F] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Commercial Engine</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Helper */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-gray-400">Quick Test Credentials:</span>
            <button
              type="button"
              onClick={handleDemoAdmin}
              className="text-[11px] font-bold text-gray-700 hover:text-[#E53935] bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 transition-colors cursor-pointer flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Fill Demo Admin</span>
            </button>
          </div>

          {/* Password Recovery Info Box */}
          {showRecoveryInfo && (
            <div className="p-3.5 bg-blue-50/90 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1.5 animate-fade-in">
              <div className="flex items-center space-x-1.5 font-bold">
                <Info className="w-3.5 h-3.5 text-blue-700 flex-shrink-0" />
                <span>Password Recovery Assistance</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                For security reasons, commercial passwords are managed by system administrators. 
                Contact your IT Administrator or run <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">scripts/setup-admin.mjs</code> on your deployment server to reset your administrator password.
              </p>
            </div>
          )}

        </div>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-gray-400 space-y-1">
          <div className="flex items-center justify-center space-x-1 text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit Encrypted Session with Supabase RLS</span>
          </div>
          <p>© 2026 Xidaa Moto Private Limited. All rights reserved.</p>
        </div>

      </div>

    </div>
  );
};
