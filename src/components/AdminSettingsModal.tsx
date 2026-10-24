import React, { useState } from 'react';
import { 
  RotateCcw, 
  Save, 
  Plus, 
  Trash2, 
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATALOGUE_SCOOTER_MODELS } from '../data/catalogueModels';
import type { GstTreatment, ModelCategory, TruckConfig } from '../types';

export const AdminSettingsModal: React.FC = () => {
  const { 
    appConfig, 
    updateConfig, 
    resetConfigToDefault, 
    setActiveView, 
    addToast 
  } = useApp();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [tempConfig, setTempConfig] = useState(() => JSON.parse(JSON.stringify(appConfig)));
  const [activeTab, setActiveTab] = useState<'discounts' | 'models' | 'trucks' | 'taxes' | 'profit'>('discounts');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '9999' || adminPin === 'admin' || adminPin === 'xidaa') {
      setIsUnlocked(true);
      addToast('success', 'Admin settings unlocked');
    } else {
      addToast('error', 'Invalid PIN. (Default: 9999)');
    }
  };

  const handleSaveAll = () => {
    if (!window.confirm('Save changes to financial discount rules?')) return;
    updateConfig(tempConfig);
    addToast('success', 'Configuration updated successfully');
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Reset all rules and rates to factory defaults?')) return;
    resetConfigToDefault();
    setTempConfig(JSON.parse(JSON.stringify(appConfig)));
  };

  const handleAddTruckConfig = () => {
    const newId = `truck-${Date.now()}`;
    const newTruck: TruckConfig = {
      id: newId,
      name: 'Custom Carrier',
      capacity: 40,
      ratePerKm: 60,
    };
    setTempConfig((prev: any) => ({
      ...prev,
      transportRates: [...prev.transportRates, newTruck],
    }));
  };

  const handleRemoveTruck = (id: string) => {
    if (tempConfig.transportRates.length <= 1) {
      addToast('error', 'At least one truck configuration is required');
      return;
    }
    setTempConfig((prev: any) => ({
      ...prev,
      transportRates: prev.transportRates.filter((t: any) => t.id !== id),
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <button
          onClick={() => setActiveView('home')}
          className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 hover:text-[#E53935] transition-colors py-1 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Home</span>
        </button>

        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Admin Rules & Settings
        </span>
      </div>

      {!isUnlocked ? (
        <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-xs text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-[#E53935] rounded-full flex items-center justify-center mx-auto border border-red-200">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Admin Authorization Required</h3>
            <p className="text-xs text-gray-500 mt-1">
              Enter the manager PIN to configure discount limits, truck rates, and category mappings.
            </p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-3 max-w-xs mx-auto">
            <input
              type="password"
              placeholder="Enter PIN (e.g. 9999)"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest text-gray-900 focus:outline-none focus:border-[#E53935]"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Unlock Settings
            </button>
            <p className="text-[10px] text-gray-400">PIN: 9999 or admin</p>
          </form>
        </div>
      ) : (
        <div className="glass-card rounded-2xl shadow-xs overflow-hidden space-y-5 p-5 sm:p-6">
          
          {/* Sub Navigation */}
          <div className="flex items-center border-b border-gray-200 overflow-x-auto text-xs font-bold pb-2 space-x-2">
            <button
              onClick={() => setActiveTab('discounts')}
              className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'discounts' ? 'bg-[#E53935] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Discount Ceilings
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'models' ? 'bg-[#E53935] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              DL Category Mapping
            </button>
            <button
              onClick={() => setActiveTab('trucks')}
              className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'trucks' ? 'bg-[#E53935] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Transport Rates
            </button>
            <button
              onClick={() => setActiveTab('taxes')}
              className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'taxes' ? 'bg-[#E53935] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tax & GST
            </button>
            <button
              onClick={() => setActiveTab('profit')}
              className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'profit' ? 'bg-[#E53935] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Profit Rules
            </button>
          </div>

          {/* Tab 1: Discount Ceilings */}
          {activeTab === 'discounts' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Discount Allowances Ceilings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <label className="block text-[11px] font-bold text-blue-700 mb-1">
                    DL Model Max Discount
                  </label>
                  <div className="flex items-center space-x-1 font-mono font-bold text-gray-900">
                    <span>₹</span>
                    <input
                      type="number"
                      value={tempConfig.discountRates.dlModelMaxDiscount}
                      onChange={(e) => setTempConfig((prev: any) => ({
                        ...prev,
                        discountRates: { ...prev.discountRates, dlModelMaxDiscount: Number(e.target.value) || 0 }
                      }))}
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm font-mono text-gray-900"
                    />
                  </div>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <label className="block text-[11px] font-bold text-amber-700 mb-1">
                    Other Model Max Discount
                  </label>
                  <div className="flex items-center space-x-1 font-mono font-bold text-gray-900">
                    <span>₹</span>
                    <input
                      type="number"
                      value={tempConfig.discountRates.otherModelMaxDiscount}
                      onChange={(e) => setTempConfig((prev: any) => ({
                        ...prev,
                        discountRates: { ...prev.discountRates, otherModelMaxDiscount: Number(e.target.value) || 0 }
                      }))}
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm font-mono text-gray-900"
                    />
                  </div>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <label className="block text-[11px] font-bold text-emerald-700 mb-1">
                    Battery Max Discount
                  </label>
                  <div className="flex items-center space-x-1 font-mono font-bold text-gray-900">
                    <span>₹</span>
                    <input
                      type="number"
                      value={tempConfig.discountRates.batteryMaxDiscount}
                      onChange={(e) => setTempConfig((prev: any) => ({
                        ...prev,
                        discountRates: { ...prev.discountRates, batteryMaxDiscount: Number(e.target.value) || 0 }
                      }))}
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm font-mono text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Model Category Mapping */}
          {activeTab === 'models' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Model Classification (DL Model vs Other Model)
              </h4>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
                {CATALOGUE_SCOOTER_MODELS.map((m) => {
                  const current = tempConfig.modelCategoryOverrides[m.id] || m.defaultCategory;
                  return (
                    <div key={m.id} className="p-2.5 flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-900">{m.name}</span>
                      <select
                        value={current}
                        onChange={(e) => {
                          const val = e.target.value as ModelCategory;
                          setTempConfig((prev: any) => ({
                            ...prev,
                            modelCategoryOverrides: { ...prev.modelCategoryOverrides, [m.id]: val },
                          }));
                        }}
                        className={`text-xs font-bold px-2 py-1 rounded-md border ${
                          current === 'DL Model' ? 'border-blue-300 text-blue-700 bg-blue-50' : 'border-amber-300 text-amber-700 bg-amber-50'
                        }`}
                      >
                        <option value="DL Model">DL Model (₹{tempConfig.discountRates.dlModelMaxDiscount})</option>
                        <option value="Other Model">Other Model (₹{tempConfig.discountRates.otherModelMaxDiscount})</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Transport Rates */}
          {activeTab === 'trucks' && (
            <div className="space-y-4">
              {/* Surcharges & Transport GST */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Transport Surcharges & GST Rules
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Additional Extra Charge (%)
                    </label>
                    <div className="flex items-center space-x-1 font-mono font-bold text-gray-900">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={tempConfig.transportSettings?.extraChargePercent ?? 10}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setTempConfig((prev: any) => ({
                            ...prev,
                            transportSettings: {
                              ...(prev.transportSettings || {}),
                              extraChargePercent: val,
                            },
                          }));
                        }}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm font-mono text-gray-900"
                      />
                      <span>%</span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Applied to Base Transport (Default: 10%)</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Transport GST (%)
                    </label>
                    <div className="flex items-center space-x-1 font-mono font-bold text-gray-900">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={tempConfig.transportSettings?.transportGstPercent ?? 5}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setTempConfig((prev: any) => ({
                            ...prev,
                            transportSettings: {
                              ...(prev.transportSettings || {}),
                              transportGstPercent: val,
                            },
                          }));
                        }}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm font-mono text-gray-900"
                      />
                      <span>%</span>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Applied to Subtotal after extra charge (Default: 5%)</span>
                  </div>
                </div>

                <div className="text-[11px] text-blue-800 bg-white/70 p-2 rounded-lg border border-blue-100">
                  <strong>Formula:</strong> Final Transport = Base Transport × (1 + Extra%) × (1 + GST%)
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Truck Capacities & Per-KM Rates
                </h4>
                <button
                  type="button"
                  onClick={handleAddTruckConfig}
                  className="text-xs font-bold text-red-600 flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Truck</span>
                </button>
              </div>

              <div className="space-y-2">
                {tempConfig.transportRates.map((t: TruckConfig, idx: number) => (
                  <div key={t.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTempConfig((prev: any) => {
                          const list = [...prev.transportRates];
                          list[idx].name = val;
                          return { ...prev, transportRates: list };
                        });
                      }}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 font-semibold w-full"
                    />

                    <div className="flex items-center space-x-1 whitespace-nowrap">
                      <span className="text-gray-500 text-[11px]">Cap:</span>
                      <input
                        type="number"
                        value={t.capacity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setTempConfig((prev: any) => {
                            const list = [...prev.transportRates];
                            list[idx].capacity = val;
                            return { ...prev, transportRates: list };
                          });
                        }}
                        className="w-14 bg-white border border-gray-300 rounded px-1 py-1 text-center font-mono text-gray-900"
                      />
                    </div>

                    <div className="flex items-center space-x-1 whitespace-nowrap">
                      <span className="text-gray-500 text-[11px]">₹/km:</span>
                      <input
                        type="number"
                        value={t.ratePerKm}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setTempConfig((prev: any) => {
                            const list = [...prev.transportRates];
                            list[idx].ratePerKm = val;
                            return { ...prev, transportRates: list };
                          });
                        }}
                        className="w-14 bg-white border border-gray-300 rounded px-1 py-1 text-center font-mono text-gray-900"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTruck(t.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Taxes */}
          {activeTab === 'taxes' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                GST Settings
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    GST Treatment
                  </label>
                  <select
                    value={tempConfig.taxSettings.gstTreatment}
                    onChange={(e) => setTempConfig((prev: any) => ({
                      ...prev,
                      taxSettings: { ...prev.taxSettings, gstTreatment: e.target.value as GstTreatment },
                    }))}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900"
                  >
                    <option value="None">None (Net Internal Estimate)</option>
                    <option value="Exclusive">GST Exclusive (Add GST on top)</option>
                    <option value="Inclusive">GST Inclusive (Prices include embedded GST)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Profit Protection */}
          {activeTab === 'profit' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Profit Protection Defaults
              </h4>
              <p className="text-xs text-gray-500">
                Configure baseline thresholds used by the Smart Profit Protection Engine to safeguard deal profitability.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">
                    Default Metric Type
                  </label>
                  <select
                    value={tempConfig.profitProtectionConfig?.defaultMinProfitType ?? 'margin_percent'}
                    onChange={(e) => setTempConfig((prev: any) => ({
                      ...prev,
                      profitProtectionConfig: {
                        ...(prev.profitProtectionConfig || {}),
                        defaultMinProfitType: e.target.value,
                      }
                    }))}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs text-gray-900"
                  >
                    <option value="margin_percent">Minimum Profit Margin (%)</option>
                    <option value="amount">Minimum Profit Amount (₹)</option>
                  </select>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">
                    Default Margin Target (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={tempConfig.profitProtectionConfig?.defaultMinProfitMarginPercent ?? 10}
                    onChange={(e) => setTempConfig((prev: any) => ({
                      ...prev,
                      profitProtectionConfig: {
                        ...(prev.profitProtectionConfig || {}),
                        defaultMinProfitMarginPercent: Number(e.target.value) || 0,
                      }
                    }))}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-mono font-bold text-gray-900"
                  />
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">
                    Default Profit Floor Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={tempConfig.profitProtectionConfig?.defaultMinProfitAmount ?? 30000}
                    onChange={(e) => setTempConfig((prev: any) => ({
                      ...prev,
                      profitProtectionConfig: {
                        ...(prev.profitProtectionConfig || {}),
                        defaultMinProfitAmount: Number(e.target.value) || 0,
                      }
                    }))}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-mono font-bold text-gray-900"
                  />
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">
                    Transport Freight GST Treatment
                  </label>
                  <select
                    value={tempConfig.profitProtectionConfig?.gstRecoverable ? 'recoverable' : 'cost'}
                    onChange={(e) => setTempConfig((prev: any) => ({
                      ...prev,
                      profitProtectionConfig: {
                        ...(prev.profitProtectionConfig || {}),
                        gstRecoverable: e.target.value === 'recoverable',
                      }
                    }))}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs text-gray-900"
                  >
                    <option value="recoverable">Input Tax Credit (Recoverable - standard B2B)</option>
                    <option value="cost">Company Expense (Non-recoverable)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-gray-500 hover:text-red-600 flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
