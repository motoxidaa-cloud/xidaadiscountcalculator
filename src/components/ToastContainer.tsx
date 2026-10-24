import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const icon = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          error: <AlertCircle className="w-4 h-4 text-red-600" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          info: <Info className="w-4 h-4 text-blue-600" />,
        }[toast.type];

        const bg = {
          success: 'bg-white border-emerald-300 text-gray-900 shadow-lg',
          error: 'bg-white border-red-300 text-gray-900 shadow-lg',
          warning: 'bg-white border-amber-300 text-gray-900 shadow-lg',
          info: 'bg-white border-blue-300 text-gray-900 shadow-lg',
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border text-xs ${bg} transition-all`}
          >
            <div className="flex items-center space-x-2.5 pr-2">
              {icon}
              <span className="font-semibold">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
