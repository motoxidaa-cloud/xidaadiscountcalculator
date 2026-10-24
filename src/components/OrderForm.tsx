import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Plus, 
  Trash2, 
  Truck, 
  BatteryCharging, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  RotateCw, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateOrderRef } from '../utils/orderDefaults';
import { CATALOGUE_SCOOTER_MODELS } from '../data/catalogueModels';
import type { BatteryVariant } from '../types';
import { formatINR } from '../utils/currency';
import { AnimatedNumber } from './AnimatedNumber';
import { TouchQuantitySelector } from './TouchQuantitySelector';
import { DiscountRecommendationCard } from './DiscountRecommendationCard';

export const OrderForm: React.FC = () => {
  const { 
    orderInput, 
    updateOrderInput, 
    calculationResult, 
    appConfig,
    updateConfig,
    addScooterItem,
    updateScooterItem,
    removeScooterItem,
    addBatteryItem,
    updateBatteryItem,
    removeBatteryItem,
    setSingleTruck,
    autoOptimizeFleet,
    calculateAndShowResults,
    isCalculating,
    calculationError,
    clearCalculationError
  } = useApp();

  // Active step in 3-step workflow (1: Scooters, 2: Batteries & Transport, 3: Review & Calculate)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [showAllSteps, setShowAllSteps] = useState(false);

  // Collapsible state for advanced details
  const [isAdvancedTransportOpen, setIsAdvancedTransportOpen] = useState(false);
  const [isProfitProtectionOpen, setIsProfitProtectionOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const batteryVariants: BatteryVariant[] = [
    '60V 30Ah LFP',
    '60V 45Ah LFP',
    '60V 55Ah pouch cell',
  ];

  const handleRegenerateRef = () => {
    updateOrderInput({ orderRef: generateOrderRef() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    calculateAndShowResults();
  };

  const selectedPrimaryTruck = orderInput.truckAllocations[0] || {
    truckId: 'truck-12',
    truckName: '12-Scooter Truck',
    capacity: 12,
    ratePerKm: 40,
    count: 1,
  };

  const hasItems = calculationResult.totalScooters > 0 || calculationResult.totalBatteries > 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto space-y-5 pb-32 sm:pb-24 animate-fade-in">
      
      {/* Calculation Error Alert if any */}
      {calculationError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start justify-between text-xs text-red-800 shadow-xs animate-scale-in">
          <div className="flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Calculation Check:</strong>
              <span>{calculationError}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={clearCalculationError}
            className="text-red-500 hover:text-red-800 font-bold ml-2 text-base leading-none cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* 3-STEP INTERACTIVE WORKFLOW HEADER */}
      <div className="glass-card rounded-2xl p-2.5 sm:p-3 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
            Order Entry Workflow
          </span>
          <button
            type="button"
            onClick={() => setShowAllSteps(!showAllSteps)}
            className="text-[11px] font-semibold text-[#E53935] hover:underline cursor-pointer"
          >
            {showAllSteps ? 'Switch to Step-by-Step' : 'View All Steps on One Page'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-2 px-2 sm:px-3 rounded-xl text-left transition-all cursor-pointer ${
              currentStep === 1 || showAllSteps
                ? 'bg-white border border-[#E53935]/40 text-[#191A1D] shadow-xs'
                : 'bg-gray-50/70 border border-transparent text-gray-500 hover:bg-gray-100/70'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                currentStep === 1 || showAllSteps ? 'text-[#E53935]' : 'text-gray-400'
              }`}>
                Step 1
              </span>
              <span className="text-[10px] font-mono font-bold text-gray-800">
                {calculationResult.totalScooters} units
              </span>
            </div>
            <div className="text-[11px] sm:text-xs font-bold truncate">
              Customer & Scooters
            </div>
          </button>

          {/* Step 2 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`py-2 px-2 sm:px-3 rounded-xl text-left transition-all cursor-pointer ${
              currentStep === 2 && !showAllSteps
                ? 'bg-white border border-[#E53935]/40 text-[#191A1D] shadow-xs'
                : 'bg-gray-50/70 border border-transparent text-gray-500 hover:bg-gray-100/70'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                currentStep === 2 && !showAllSteps ? 'text-[#E53935]' : 'text-gray-400'
              }`}>
                Step 2
              </span>
              <span className="text-[10px] font-mono font-bold text-gray-800">
                {orderInput.transportDistanceKm} km
              </span>
            </div>
            <div className="text-[11px] sm:text-xs font-bold truncate">
              Battery & Transport
            </div>
          </button>

          {/* Step 3 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`py-2 px-2 sm:px-3 rounded-xl text-left transition-all cursor-pointer ${
              currentStep === 3 && !showAllSteps
                ? 'bg-white border border-[#E53935]/40 text-[#191A1D] shadow-xs'
                : 'bg-gray-50/70 border border-transparent text-gray-500 hover:bg-gray-100/70'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                currentStep === 3 && !showAllSteps ? 'text-[#E53935]' : 'text-gray-400'
              }`}>
                Step 3
              </span>
              <span className="text-[10px] font-bold text-emerald-700">
                Ready
              </span>
            </div>
            <div className="text-[11px] sm:text-xs font-bold truncate">
              Review & Calculate
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: CUSTOMER & SCOOTER ORDER ITEMS                                    */}
      {/* ========================================================================= */}
      {(showAllSteps || currentStep === 1) && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Customer & Order Details Card */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#191A1D]">
                  Step 1: Customer & Order Details
                </h2>
                <p className="text-[11px] text-gray-500">
                  Dealer identity and commercial quotation reference
                </p>
              </div>
              <div className="flex items-center space-x-1.5 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200">
                <span className="text-[10px] font-mono font-bold text-gray-700">
                  {orderInput.orderRef}
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateRef}
                  title="Generate New Reference"
                  className="p-1 text-gray-400 hover:text-[#E53935] rounded transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Customer / Dealer Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#E53935]" />
                  <span>Customer / Dealership Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aodn Motors Dealership"
                  value={orderInput.customerName}
                  onChange={(e) => updateOrderInput({ customerName: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all"
                />
              </div>

              {/* Order Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span>Order Date</span>
                  </label>
                  <input
                    type="date"
                    value={orderInput.orderDate}
                    onChange={(e) => updateOrderInput({ orderDate: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Commercial Reference
                  </label>
                  <input
                    type="text"
                    value={orderInput.orderRef}
                    onChange={(e) => updateOrderInput({ orderRef: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-gray-800 focus:outline-none focus:border-[#E53935] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scooter Order Items Card */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#191A1D]">
                  Scooter Model Order Items
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Add multiple catalogue models with DL / Other limits
                </p>
              </div>

              {/* Live Scooter Counter Badge */}
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Scooters</span>
                <span className="text-sm font-black font-mono text-[#191A1D]">
                  <AnimatedNumber value={calculationResult.totalScooters} formatFn={(n) => `${n}`} /> units
                </span>
              </div>
            </div>

            {/* List of Scooter Items */}
            <div className="space-y-3.5">
              {orderInput.scooterItems.map((item, index) => {
                const rowTotal = item.quantity && item.unitPrice ? item.quantity * item.unitPrice : null;
                const isDl = item.category === 'DL Model';

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white rounded-xl border border-gray-200/90 shadow-2xs space-y-3 transition-all hover:border-gray-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                        Item #{index + 1}
                      </span>
                      {orderInput.scooterItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScooterItem(item.id)}
                          title="Remove item"
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Model Dropdown */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Scooter Model *
                      </label>
                      <select
                        value={item.modelId}
                        onChange={(e) => updateScooterItem(item.id, { modelId: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#E53935]"
                      >
                        {CATALOGUE_SCOOTER_MODELS.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name} — ({appConfig.modelCategoryOverrides[model.id] || model.defaultCategory})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category Toggle: DL Model vs Other Model */}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Model Category (Discount Limit)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => updateScooterItem(item.id, { category: 'DL Model' })}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isDl
                              ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs ring-1 ring-blue-500/20'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className="block font-black">DL Model</span>
                          <span className="block text-[10px] font-medium text-blue-700">₹500 / scooter discount</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateScooterItem(item.id, { category: 'Other Model' })}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            !isDl
                              ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-2xs ring-1 ring-amber-500/20'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className="block font-black">Other Model</span>
                          <span className="block text-[10px] font-medium text-amber-700">₹1,000 / scooter discount</span>
                        </button>
                      </div>
                    </div>

                    {/* Quantity & Unit Price */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Fast Touch Quantity Selector (No Keyboard Required) */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Quantity (Units) *
                        </label>
                        <TouchQuantitySelector
                          value={item.quantity}
                          min={0}
                          onChange={(newQty) => updateScooterItem(item.id, { quantity: newQty })}
                          unitLabel="scooters"
                        />
                      </div>

                      {/* Unit Price (Optional) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-gray-700">
                            Unit Price (₹)
                          </label>
                          <span className="text-[10px] text-gray-400">Optional</span>
                        </div>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          placeholder="e.g. 48500"
                          value={item.unitPrice ?? ''}
                          onChange={(e) => updateScooterItem(item.id, {
                            unitPrice: e.target.value === '' ? undefined : Number(e.target.value)
                          })}
                          className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-1.5 text-sm font-mono font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E53935]"
                        />
                      </div>
                    </div>

                    {/* Row subtotal preview if price provided */}
                    {rowTotal !== null && (
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                        <span>Row Subtotal ({item.quantity} × {formatINR(item.unitPrice ?? 0)}):</span>
                        <strong className="font-mono text-gray-900">{formatINR(rowTotal)}</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* + Add Another Model Button */}
            <button
              type="button"
              onClick={addScooterItem}
              className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-[#E53935] hover:text-[#E53935] hover:bg-red-50/20 text-gray-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Model</span>
            </button>

            {/* Step 1 Scooter Live Summary Card */}
            <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-200/80 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 block">DL Models</span>
                <span className="text-base font-black font-mono text-blue-950 mt-0.5 block">
                  <AnimatedNumber value={calculationResult.totalDlScooters} formatFn={(n) => `${n}`} />
                </span>
                <span className="text-[10px] text-blue-600 font-medium">₹500 limit</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Other Models</span>
                <span className="text-base font-black font-mono text-amber-950 mt-0.5 block">
                  <AnimatedNumber value={calculationResult.totalOtherScooters} formatFn={(n) => `${n}`} />
                </span>
                <span className="text-[10px] text-amber-600 font-medium">₹1,000 limit</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Scooter Allowance</span>
                <span className="text-base font-black font-mono text-emerald-950 mt-0.5 block">
                  <AnimatedNumber value={calculationResult.scooterDiscountAllowance} />
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">Total budget</span>
              </div>
            </div>

            {!showAllSteps && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-2.5 px-5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <span>Continue to Step 2: Batteries & Transport</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: BATTERY ORDERS & TRANSPORT LOGISTICS                               */}
      {/* ========================================================================= */}
      {(showAllSteps || currentStep === 2) && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Battery Order Section */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <BatteryCharging className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#191A1D]">
                    Battery Order (Separate Quota)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Separate ₹500 discount allowance per eligible battery
                  </p>
                </div>
              </div>

              {/* Toggle Batteries Included */}
              <button
                type="button"
                onClick={() => updateOrderInput({ batteryIncluded: !orderInput.batteryIncluded })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  orderInput.batteryIncluded
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {orderInput.batteryIncluded ? '✓ Batteries Included' : 'No Batteries'}
              </button>
            </div>

            {orderInput.batteryIncluded ? (
              <div className="space-y-3.5">
                {orderInput.batteryItems.map((bItem, idx) => (
                  <div
                    key={bItem.id}
                    className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">
                        Battery #{idx + 1}
                      </span>
                      {orderInput.batteryItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBatteryItem(bItem.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Variant */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Battery Variant *
                        </label>
                        <select
                          value={bItem.variant}
                          onChange={(e) => updateBatteryItem(bItem.id, { variant: e.target.value as BatteryVariant })}
                          className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#E53935]"
                        >
                          {batteryVariants.map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>

                      {/* Fast Touch Quantity Selector (No Keyboard Required) */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Quantity (Units) *
                        </label>
                        <TouchQuantitySelector
                          value={bItem.quantity}
                          min={0}
                          onChange={(newQty) => updateBatteryItem(bItem.id, {
                            quantity: newQty,
                            eligibleDiscountQuantity: newQty,
                          })}
                          unitLabel="batteries"
                        />
                      </div>

                      {/* Unit Price (Optional) */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Unit Price (₹)
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          placeholder="e.g. 24000"
                          value={bItem.unitPrice ?? ''}
                          onChange={(e) => updateBatteryItem(bItem.id, {
                            unitPrice: e.target.value === '' ? undefined : Number(e.target.value)
                          })}
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#E53935]"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addBatteryItem}
                  className="w-full py-2.5 border-2 border-dashed border-gray-300 hover:border-emerald-600 hover:text-emerald-700 text-gray-600 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Battery Variant</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-200/80 text-xs text-gray-500 text-center">
                No separate battery units ordered. Tap "No Batteries" above if adding batteries.
              </div>
            )}
          </div>

          {/* Transport & Truck Allocation Section */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#191A1D]">
                    Transport Logistics & Trucks
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    5-step formula: Base × 1.10 (10% extra) × 1.05 (5% GST)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={autoOptimizeFleet}
                title="Optimize fleet for current scooters"
                className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Optimize</span>
              </button>
            </div>

            {/* Distance Input with Quick Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Delivery Distance (km) *
                </label>
                <div className="flex items-center space-x-1">
                  {[100, 200, 350, 500, 1000].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => updateOrderInput({ transportDistanceKm: d })}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        orderInput.transportDistanceKm === d
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {d}km
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={orderInput.transportDistanceKm || ''}
                onChange={(e) => updateOrderInput({ transportDistanceKm: Math.max(0, Number(e.target.value) || 0) })}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-gray-900 focus:outline-none focus:border-[#E53935]"
              />
            </div>

            {/* Truck Capacity Notice for Larger Orders */}
            {calculationResult.totalScooters > calculationResult.totalCapacity && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>
                    Order contains <strong>{calculationResult.totalScooters} scooters</strong>, but current truck capacity is <strong>{calculationResult.totalCapacity}</strong>. Multiple trucks needed.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={autoOptimizeFleet}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  Optimize Fleet
                </button>
              </div>
            )}

            {/* Truck Selector Cards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Primary Truck Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {appConfig.transportRates.map((truck) => {
                  const isSelected = selectedPrimaryTruck.truckId === truck.id;
                  return (
                    <button
                      key={truck.id}
                      type="button"
                      onClick={() => setSingleTruck(truck.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-2xs ring-1 ring-blue-500/20'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-black">{truck.name}</span>
                        {isSelected && (
                          <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Cap: <strong>{truck.capacity}</strong> • <strong>₹{truck.ratePerKm}/km</strong>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Transport Collapsible */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsAdvancedTransportOpen(!isAdvancedTransportOpen)}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center space-x-1 cursor-pointer"
              >
                <span>{isAdvancedTransportOpen ? '− Hide Advanced Surcharges' : '+ Configure Transport Extra & GST'}</span>
              </button>

              {isAdvancedTransportOpen && (
                <div className="mt-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Additional Surcharge (%)
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={appConfig.transportSettings.extraChargePercent}
                        onChange={(e) => updateConfig({
                          transportSettings: {
                            ...appConfig.transportSettings,
                            extraChargePercent: Number(e.target.value) || 0,
                          }
                        })}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-mono font-bold text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Transport GST (%)
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={appConfig.transportSettings.transportGstPercent}
                        onChange={(e) => updateConfig({
                          transportSettings: {
                            ...appConfig.transportSettings,
                            transportGstPercent: Number(e.target.value) || 0,
                          }
                        })}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-mono font-bold text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Transport 5-Step Breakdown Summary Card */}
            <div className="bg-gray-50/90 rounded-xl p-3.5 border border-gray-200/90 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-gray-700">
                <span>1. Base Transport:</span>
                <span className="font-mono font-medium">{formatINR(calculationResult.baseTransportCost)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-700">
                <span>2. Additional {calculationResult.transportExtraPercent}% Charge:</span>
                <span className="font-mono font-medium text-amber-700">+ {formatINR(calculationResult.transportExtraCharge)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
                <span>3. Transport Subtotal:</span>
                <span className="font-mono">{formatINR(calculationResult.transportSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-700">
                <span>4. GST ({calculationResult.transportGstPercent}%):</span>
                <span className="font-mono font-medium text-blue-700">+ {formatINR(calculationResult.transportGstAmount)}</span>
              </div>
              <div className="flex items-center justify-between font-black text-gray-950 pt-1.5 border-t border-gray-300 text-xs">
                <span>5. Final Transport Cost:</span>
                <span className="font-mono text-red-600 font-bold">{formatINR(calculationResult.totalTransportCost)}</span>
              </div>

              {/* Per-Scooty Freight Highlight */}
              <div className="flex items-center justify-between bg-blue-50/90 px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-950 font-bold mt-1">
                <span>Transport Cost Per Scooty:</span>
                <span className="font-mono font-black">
                  {calculationResult.transportCostPerScooter !== null
                    ? `${formatINR(calculationResult.transportCostPerScooter)} / scooty`
                    : '—'}
                </span>
              </div>
            </div>

            {!showAllSteps && (
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Step 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="py-2.5 px-5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <span>Continue to Step 3: Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: REVIEW, ALLOCATION & CALCULATE                                    */}
      {/* ========================================================================= */}
      {(showAllSteps || currentStep === 3) && (
        <div className="space-y-5 animate-fade-in">
          
          {/* AUTOMATIC DISCOUNT STRATEGY RECOMMENDATION CARD */}
          <DiscountRecommendationCard
            calculationResult={calculationResult}
            onApplyRecommendation={(mode, scenarioId) => {
              updateOrderInput({ allocationMode: mode, selectedScenarioId: scenarioId });
            }}
          />

          {/* SECTION: STRICT SINGLE-COMPONENT DISCOUNT ALLOCATION */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-[#191A1D]">
                  Discount & Freight Allocation Mode
                </h3>
                <span className="text-[10px] uppercase font-bold text-[#E53935] bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                  Strict Rule
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Company support applies to <strong>one component only</strong>, never both vehicle invoice and transport simultaneously.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option A: Scooty/Battery Discount */}
              <button
                type="button"
                onClick={() => updateOrderInput({ allocationMode: 'Scooty/Battery Discount', selectedScenarioId: 'scenario-a' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  calculationResult.allocationOption === 'Scooty/Battery Discount'
                    ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-2xs ring-1 ring-blue-500/30'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold">Scooty/Battery Discount</span>
                  <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded">Option A</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Apply approved discount to vehicle invoice only. Customer pays 100% transport freight.
                </p>
              </button>

              {/* Option B: Transport Support */}
              <button
                type="button"
                onClick={() => updateOrderInput({ allocationMode: 'Transport Support', selectedScenarioId: 'scenario-b' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  calculationResult.allocationOption === 'Transport Support'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-2xs ring-1 ring-emerald-500/30'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold">Transport Support (50%)</span>
                  <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">Option B</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Company absorbs 50% of final transport cost. Vehicle & battery invoice discounts are strictly ₹0.
                </p>
              </button>

              {/* Option C: No Discount / Support */}
              <button
                type="button"
                onClick={() => updateOrderInput({ allocationMode: 'No Discount / Support', selectedScenarioId: 'scenario-c' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  calculationResult.allocationOption === 'No Discount / Support'
                    ? 'bg-gray-100 border-gray-500 text-gray-950 shadow-2xs ring-1 ring-gray-400'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold">No Discount / Support</span>
                  <span className="text-[9px] bg-gray-600 text-white font-bold px-1.5 py-0.2 rounded">Option C</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Customer pays full vehicle invoice and 100% transport cost. No company support applied.
                </p>
              </button>
            </div>

            {/* Active Allocation Bar */}
            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 text-xs text-gray-700 flex items-center justify-between">
              <span className="font-medium text-gray-600">Active Allocation:</span>
              <span className="font-bold text-gray-900 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">
                {calculationResult.allocationOption}
              </span>
            </div>
          </div>

          {/* SECTION: PROFIT PROTECTION ENGINE (Optional) */}
          <div className="glass-card rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setIsProfitProtectionOpen(!isProfitProtectionOpen)}
              className="w-full p-4 sm:p-5 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-gray-900">Profit Protection Engine</h4>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      Optional Safeguard
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Verify company procurement costs & minimum margin compliance
                  </p>
                </div>
              </div>

              {isProfitProtectionOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {isProfitProtectionOpen && (
              <div className="p-4 sm:p-5 pt-0 border-t border-gray-100 space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Company Cost per Scooter (₹)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      placeholder="e.g. 35000"
                      value={orderInput.profitabilityInput?.scooterUnitCost ?? ''}
                      onChange={(e) => updateOrderInput({
                        profitabilityInput: {
                          ...orderInput.profitabilityInput,
                          scooterUnitCost: e.target.value === '' ? undefined : Number(e.target.value),
                        }
                      })}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Approved Scooter Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      placeholder="e.g. 50000"
                      value={orderInput.profitabilityInput?.defaultScooterSellingPrice ?? ''}
                      onChange={(e) => updateOrderInput({
                        profitabilityInput: {
                          ...orderInput.profitabilityInput,
                          defaultScooterSellingPrice: e.target.value === '' ? undefined : Number(e.target.value),
                        }
                      })}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#E53935]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Notes (Optional) */}
          <div className="text-xs text-gray-500">
            <button
              type="button"
              onClick={() => setIsNotesOpen(!isNotesOpen)}
              className="text-gray-600 hover:text-gray-900 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isNotesOpen ? 'Hide Delivery Remarks' : '+ Add Optional Delivery Remarks'}</span>
            </button>

            {isNotesOpen && (
              <textarea
                rows={2}
                value={orderInput.notes || ''}
                onChange={(e) => updateOrderInput({ notes: e.target.value })}
                placeholder="Special dealership remarks, delivery instructions, billing notes..."
                className="w-full mt-2 bg-white border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#E53935]"
              />
            )}
          </div>

          {/* Pre-Calculation Review Summary */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Live Order Pre-Check
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                hasItems
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {hasItems ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Ready for Settlement</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    <span>Enter Scooter Units</span>
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-[10px] text-gray-500 block">Total Scooters</span>
                <strong className="font-mono text-gray-900 text-sm block mt-0.5">
                  {calculationResult.totalScooters}
                </strong>
              </div>

              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-[10px] text-gray-500 block">Batteries</span>
                <strong className="font-mono text-gray-900 text-sm block mt-0.5">
                  {calculationResult.totalBatteries}
                </strong>
              </div>

              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-[10px] text-gray-500 block">Final Freight</span>
                <strong className="font-mono text-gray-900 text-sm block mt-0.5">
                  {formatINR(calculationResult.totalTransportCost)}
                </strong>
              </div>

              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-[10px] text-gray-500 block">Freight / Scooty</span>
                <strong className="font-mono text-blue-900 text-sm block mt-0.5">
                  {calculationResult.transportCostPerScooter !== null ? formatINR(calculationResult.transportCostPerScooter) : '—'}
                </strong>
              </div>
            </div>
          </div>

          {!showAllSteps && (
            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Step 2</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STICKY BOTTOM ACTION BAR (Mobile-First, Always Accessible)               */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 glass-floating z-30 safe-bottom">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              {calculationResult.totalScooters} Scooters • {orderInput.transportDistanceKm} km
            </span>
            <span className="text-xs font-bold text-gray-900">
              Eligible Discount: <strong className="text-emerald-700 font-mono"><AnimatedNumber value={calculationResult.totalDiscountAllowance} /></strong>
            </span>
          </div>

          <button
            type="submit"
            disabled={isCalculating}
            className={`py-3.5 px-6 sm:px-9 bg-[#E53935] hover:bg-[#D32F2F] active:scale-[0.98] text-white font-black text-sm rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-2 transition-all cursor-pointer ${
              isCalculating ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <span>Calculate Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

    </form>
  );
};
