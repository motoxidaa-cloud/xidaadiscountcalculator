import React from 'react';
import { Home, PlusCircle, Bookmark, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { activeView, setActiveView, startNewOrder, savedOrders } = useApp();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-3 pt-1.5 pb-safe select-none no-print transition-all"
    >
      <div className="flex items-center justify-around max-w-md mx-auto h-13">
        
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => setActiveView('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeView === 'home'
              ? 'text-[#E53935] font-extrabold'
              : 'text-gray-500 hover:text-gray-900 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${activeView === 'home' ? 'scale-110 stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
        </button>

        {/* 2. New Order */}
        <button
          type="button"
          onClick={() => {
            if (activeView === 'order-form') {
              // already on order form
            } else {
              startNewOrder(false);
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeView === 'order-form'
              ? 'text-[#E53935] font-extrabold'
              : 'text-gray-500 hover:text-gray-900 font-medium'
          }`}
        >
          <PlusCircle className={`w-5 h-5 transition-transform ${activeView === 'order-form' ? 'scale-110 stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">New Order</span>
        </button>

        {/* 3. Saved Orders */}
        <button
          type="button"
          onClick={() => setActiveView('history')}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all active:scale-95 cursor-pointer ${
            activeView === 'history'
              ? 'text-[#E53935] font-extrabold'
              : 'text-gray-500 hover:text-gray-900 font-medium'
          }`}
        >
          <div className="relative">
            <Bookmark className={`w-5 h-5 transition-transform ${activeView === 'history' ? 'scale-110 stroke-[2.5]' : ''}`} />
            {savedOrders.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#E53935] text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-2xs">
                {savedOrders.length > 99 ? '99+' : savedOrders.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Saved Orders</span>
        </button>

        {/* 4. Settings */}
        <button
          type="button"
          onClick={() => setActiveView('admin-settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 cursor-pointer ${
            activeView === 'admin-settings'
              ? 'text-[#E53935] font-extrabold'
              : 'text-gray-500 hover:text-gray-900 font-medium'
          }`}
        >
          <Settings className={`w-5 h-5 transition-transform ${activeView === 'admin-settings' ? 'scale-110 stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Settings</span>
        </button>

      </div>
    </nav>
  );
};
