import React from 'react';
import { 
  PlusCircle, 
  Bookmark, 
  Settings, 
  ArrowRight, 
  Truck, 
  BatteryCharging,
  Zap,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/currency';

export const HomeScreen: React.FC = () => {
  const { 
    startNewOrder, 
    savedOrders, 
    loadSavedOrder, 
    setActiveView 
  } = useApp();

  return (
    <div className="max-w-xl mx-auto space-y-6 sm:space-y-7 py-2 sm:py-6 animate-fade-in">
      
      {/* Brand Hero Card with Glass Styling */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 text-center space-y-6 relative overflow-hidden">
        
        {/* Subtle Decorative Background Aura */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo Presentation */}
        <div className="flex flex-col items-center justify-center pt-1">
          <div className="p-3 bg-white/95 rounded-2xl shadow-xs border border-gray-100 mb-3 inline-block">
            <img 
              src="/assets/xidaa-logo-dark.png" 
              alt="Xidaa Moto" 
              className="h-11 sm:h-13 w-auto object-contain"
            />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200/80 text-[10px] font-extrabold text-[#E53935] uppercase tracking-wider mb-2">
            <Zap className="w-3 h-3 text-[#E53935]" />
            <span>Commercial Calculation Engine</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#191A1D]">
            Xidaa Discount Calculator
          </h1>
          
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#E53935] mt-1">
            Ride The Electric Thunder
          </p>
          
          <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Enterprise B2B commercial settlement, multi-model discount allowances, and 5-step transport freight engine.
          </p>
        </div>

        {/* PROMINENT MAIN ACTION: Create New Order */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => startNewOrder(true)}
            className="w-full py-4 px-6 bg-[#E53935] hover:bg-[#D32F2F] active:scale-[0.98] text-white font-black text-base rounded-xl shadow-lg shadow-red-600/25 flex items-center justify-center space-x-2.5 transition-all cursor-pointer group"
          >
            <PlusCircle className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
            <span className="tracking-wide">Create New Order</span>
            <ArrowRight className="w-4 h-4 ml-1 opacity-80 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* 3 Core Architecture Pillars (Clean, uncluttered) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
        <div className="glass-card p-3 sm:p-3.5 rounded-xl text-center">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E53935] flex items-center justify-center mx-auto mb-1.5 border border-red-100">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-gray-900">Multi-Model</div>
          <div className="text-[10px] text-gray-500 mt-0.5">DL & Other Quota</div>
        </div>

        <div className="glass-card p-3 sm:p-3.5 rounded-xl text-center">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5 border border-emerald-100">
            <BatteryCharging className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-gray-900">Separate Quota</div>
          <div className="text-[10px] text-gray-500 mt-0.5">₹500 / Battery Unit</div>
        </div>

        <div className="glass-card p-3 sm:p-3.5 rounded-xl text-center">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1.5 border border-blue-100">
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-gray-900">5-Step Logistics</div>
          <div className="text-[10px] text-gray-500 mt-0.5">10% Surcharge + GST</div>
        </div>
      </div>

      {/* Recent Calculations Section (Only shown if history exists) */}
      {savedOrders.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <Bookmark className="w-4 h-4 text-[#E53935]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Recent Calculations
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('history')}
              className="text-xs font-bold text-[#E53935] hover:underline flex items-center space-x-1 transition-colors"
            >
              <span>View All ({savedOrders.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {savedOrders.slice(0, 3).map((order) => {
              const res = order.calculationResult;
              const inp = order.orderInput;
              return (
                <div
                  key={order.id}
                  onClick={() => loadSavedOrder(order.id)}
                  className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 rounded-xl px-2.5 -mx-2.5 transition-all group active:scale-[0.99]"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-gray-900 group-hover:text-[#E53935] transition-colors flex items-center space-x-1.5">
                      <span>{inp.customerName || 'Direct B2B Dealer'}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded">
                        {inp.orderRef}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center space-x-2">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{inp.orderDate}</span>
                      </span>
                      <span>•</span>
                      <span>{res.totalScooters} scooters ({res.totalDlScooters} DL)</span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="text-xs font-mono font-black text-gray-900">
                      {res.finalPayableAmount !== null ? formatINR(res.finalPayableAmount) : 'Pending Prices'}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold">
                      Benefit: {formatINR(res.totalCustomerDiscountBenefit)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Utility Footer Links */}
      <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 pt-1">
        <button
          type="button"
          onClick={() => setActiveView('admin-settings')}
          className="hover:text-gray-900 flex items-center space-x-1.5 transition-colors font-medium"
        >
          <Settings className="w-3.5 h-3.5 text-gray-400" />
          <span>Config & Rates</span>
        </button>
        <span className="text-gray-300">•</span>
        <button
          type="button"
          onClick={() => setActiveView('history')}
          className="hover:text-gray-900 flex items-center space-x-1.5 transition-colors font-medium"
        >
          <Bookmark className="w-3.5 h-3.5 text-gray-400" />
          <span>Saved Orders ({savedOrders.length})</span>
        </button>
      </div>

    </div>
  );
};
