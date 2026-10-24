import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Printer, 
  RotateCcw, 
  CheckCircle2, 
  Truck, 
  Edit3, 
  AlertCircle,
  Loader2,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { formatINR, formatINRWords } from '../utils/currency';
import { AnimatedNumber } from './AnimatedNumber';

export const ResultsScreen: React.FC = () => {
  const { 
    orderInput, 
    updateOrderInput,
    calculationResult, 
    editCurrentOrder, 
    startNewOrder, 
    saveCurrentOrder, 
    isSaving,
    saveError,
    clearSaveError,
    setActiveView 
  } = useApp();

  const [justSaved, setJustSaved] = useState(false);
  const [isTransportExpanded, setIsTransportExpanded] = useState(false);

  const handleSaveOrder = async () => {
    clearSaveError();
    const result = await saveCurrentOrder();
    if (result) {
      setJustSaved(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E53935', '#16a34a', '#2563eb', '#ffffff'],
      });
      setTimeout(() => setJustSaved(false), 2500);
    }
  };

  const isOptionASelected = calculationResult.allocationOption === 'Scooty/Battery Discount';
  const isOptionBSelected = calculationResult.allocationOption === 'Transport Support';

  const isOptionBEligible = calculationResult.transportSharingEligible;
  const recommendedScenarioId = calculationResult.profitProtection.recommendedScenarioId;
  const isOptionARecommended = recommendedScenarioId === 'scenario-a';
  const isOptionBRecommended = recommendedScenarioId === 'scenario-b';

  const scenarios = calculationResult.profitProtection.scenarios || [];
  const scenarioA = scenarios.find(s => s.id === 'scenario-a');
  const scenarioB = scenarios.find(s => s.id === 'scenario-b');

  const scenarioAProfit = scenarioA?.companyProfit ?? null;
  const scenarioBProfit = scenarioB?.companyProfit ?? null;
  const scenarioBRemaining = scenarioB?.remainingScooterDiscount ?? Math.max(0, calculationResult.scooterDiscountAllowance - calculationResult.halfTransportCost);

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-28 animate-fade-in">
      
      {/* Top Header Bar with Back / Edit & Ref */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <button
          type="button"
          onClick={editCurrentOrder}
          className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 hover:text-[#E53935] transition-colors py-1 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Edit Order</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono font-bold bg-white border border-gray-200 text-gray-800 px-2.5 py-1 rounded-xl shadow-2xs">
            {orderInput.orderRef}
          </span>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            isOptionASelected
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : isOptionBSelected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-gray-100 text-gray-800 border-gray-300'
          }`}>
            ● Active: {calculationResult.allocationOption}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: ORDER SUMMARY                                                  */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
              Order Summary
            </span>
            <h1 className="text-base sm:text-lg font-black text-[#191A1D]">
              {orderInput.customerName || 'Direct B2B Dealership'}
            </h1>
            <span className="text-xs font-mono font-medium text-gray-500">
              Ref: {orderInput.orderRef} • Quotation Date: {orderInput.orderDate}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
              Total Fleet
            </span>
            <span className="text-sm font-black font-mono text-gray-900 block mt-0.5">
              {calculationResult.totalScooters} Scooters
            </span>
          </div>
        </div>

        {/* Quantities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">DL Scooters</span>
            <span className="text-xl font-black font-mono text-blue-950 mt-1 block">
              <AnimatedNumber value={calculationResult.totalDlScooters} formatFn={(n) => `${n}`} />
            </span>
            <span className="text-[10px] text-blue-600 font-medium">₹500 allowance</span>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Other Scooters</span>
            <span className="text-xl font-black font-mono text-amber-950 mt-1 block">
              <AnimatedNumber value={calculationResult.totalOtherScooters} formatFn={(n) => `${n}`} />
            </span>
            <span className="text-[10px] text-amber-600 font-medium">₹1,000 allowance</span>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-gray-600 block">Total Scooters</span>
            <span className="text-xl font-black font-mono text-gray-900 mt-1 block">
              <AnimatedNumber value={calculationResult.totalScooters} formatFn={(n) => `${n}`} />
            </span>
            <span className="text-[10px] text-gray-500 font-medium">All Models</span>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Batteries</span>
            <span className="text-xl font-black font-mono text-emerald-950 mt-1 block">
              <AnimatedNumber value={calculationResult.totalBatteries} formatFn={(n) => `${n}`} />
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">
              {calculationResult.totalBatteries > 0 ? 'Separate Allowance' : 'None'}
            </span>
          </div>
        </div>

        {/* Batteries by Variant */}
        {calculationResult.batteryBreakdown.length > 0 && (
          <div className="pt-2 text-xs text-gray-600 flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="font-bold text-gray-700 text-[11px]">Batteries by Variant:</span>
            {calculationResult.batteryBreakdown.map((b, idx) => (
              <span key={idx} className="bg-white border border-gray-200 text-gray-800 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold shadow-2xs">
                {b.quantity}x {b.variant}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION B: TRANSPORT                                                      */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-[#E53935]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Transport
            </h2>
            <button
              type="button"
              onClick={() => setIsTransportExpanded(!isTransportExpanded)}
              className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 cursor-pointer ml-1 flex items-center space-x-0.5"
            >
              <span>{isTransportExpanded ? '(Hide Details)' : '(Show Details)'}</span>
              {isTransportExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          <span className="text-sm font-mono font-black text-gray-900">
            Final Transport: <AnimatedNumber value={calculationResult.totalTransportCost} />
          </span>
        </div>

        {/* Concise route & truck summary */}
        <div className="text-[11px] text-gray-500 flex items-center space-x-2 flex-wrap">
          <span>Distance: <strong>{orderInput.transportDistanceKm} km</strong></span>
          <span>•</span>
          <span>Fleet: <strong>{calculationResult.truckSummary}</strong></span>
          {calculationResult.transportCostPerScooter !== null && (
            <>
              <span>•</span>
              <span>Freight Rate: <strong>{formatINR(calculationResult.transportCostPerScooter)} / scooty</strong></span>
            </>
          )}
        </div>

        {/* Expandable 4-Value Transport Breakdown */}
        {isTransportExpanded && (
          <div className="bg-gray-50/90 rounded-xl p-3.5 border border-gray-200/90 space-y-2 text-xs animate-fade-in">
            <div className="flex items-center justify-between text-gray-700">
              <span>Base transport:</span>
              <span className="font-mono font-semibold">{formatINR(calculationResult.baseTransportCost)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-700">
              <span>Additional 10% charge:</span>
              <span className="font-mono font-semibold text-amber-700">+ {formatINR(calculationResult.transportExtraCharge)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-800 font-semibold pt-1 border-t border-gray-200">
              <span>Transport Subtotal:</span>
              <span className="font-mono">{formatINR(calculationResult.transportSubtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-700">
              <span>GST at 5%:</span>
              <span className="font-mono font-semibold text-blue-700">+ {formatINR(calculationResult.transportGstAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-950 font-black pt-1.5 border-t border-gray-300">
              <span>Final transport cost:</span>
              <span className="font-mono text-sm text-[#E53935]">{formatINR(calculationResult.totalTransportCost)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION C: DISCOUNT OPTIONS (TWO SIMPLE COMPARISON CARDS)                 */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        
        {/* Recommendation Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Discount Options
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Strict Single-Component Rule: Discount applies to ONE component only (Scooter Price or Transport Support).
              </p>
            </div>

            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
              Allowance: {formatINR(calculationResult.scooterDiscountAllowance)}
            </span>
          </div>

          {/* Clean Recommendation Alert */}
          <div className={`p-3.5 rounded-xl border flex items-start space-x-2.5 ${
            isOptionARecommended || isOptionBRecommended
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-gray-50 border-gray-200 text-gray-800'
          }`}>
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5 flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-black text-[11px] text-emerald-900">
                  {calculationResult.profitProtection.bestOptionTitle || 'Commercial Recommendation'}
                </span>
                {(isOptionARecommended || isOptionBRecommended) && (
                  <span className="bg-emerald-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded shadow-2xs">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                {calculationResult.profitProtection.recommendationReason}
              </p>
            </div>
          </div>
        </div>

        {/* 2 Simple Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          
          {/* Card 1: Discount on Scooter Price (Option A) */}
          <div 
            onClick={() => updateOrderInput({ allocationMode: 'Scooty/Battery Discount', selectedScenarioId: 'scenario-a' })}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
              isOptionASelected
                ? 'bg-blue-50/50 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
            }`}
          >
            {/* Recommended Pill */}
            {isOptionARecommended && (
              <span className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs">
                Recommended
              </span>
            )}

            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-gray-900">
                  Discount on Scooter Price
                </h3>
                <span className="text-[10px] text-gray-400 block">Option A</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateOrderInput({ allocationMode: 'Scooty/Battery Discount', selectedScenarioId: 'scenario-a' });
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                  isOptionASelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>1. Scooty/Battery Discount</span>
                {isOptionASelected && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            </div>

            <div className="pt-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Discount Allocation:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatINR(calculationResult.scooterDiscountAllowance)} on scooter
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Dealer Transport Payment:</span>
                <span className="font-mono font-medium text-gray-800">
                  {formatINR(calculationResult.totalTransportCost)} (Full)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Company Transport Support:</span>
                <span className="font-mono font-medium text-gray-400">₹0</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                <span className="text-gray-600 font-semibold">Estimated Company Profit:</span>
                <span className="font-mono font-black text-gray-900">
                  {scenarioAProfit !== null ? formatINR(scenarioAProfit) : 'Costs not verified'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: 50% Transport Support (Option B) */}
          <div 
            onClick={() => {
              if (isOptionBEligible) {
                updateOrderInput({ allocationMode: 'Transport Support', selectedScenarioId: 'scenario-b' });
              }
            }}
            className={`p-4 rounded-xl border transition-all relative ${
              !isOptionBEligible
                ? 'bg-gray-50/70 border-gray-200 opacity-60 cursor-not-allowed'
                : isOptionBSelected
                ? 'bg-emerald-50/50 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30 cursor-pointer'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 cursor-pointer'
            }`}
          >
            {/* Recommended Pill */}
            {isOptionBRecommended && isOptionBEligible && (
              <span className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs">
                Recommended
              </span>
            )}

            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-gray-900">
                  50% Transport Support
                </h3>
                <span className="text-[10px] text-gray-400 block">Option B</span>
              </div>
              <button
                type="button"
                disabled={!isOptionBEligible}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOptionBEligible) {
                    updateOrderInput({ allocationMode: 'Transport Support', selectedScenarioId: 'scenario-b' });
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-colors ${
                  !isOptionBEligible
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : isOptionBSelected
                    ? 'bg-emerald-600 text-white shadow-2xs cursor-pointer'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                }`}
              >
                <span>2. Transport Support (50%)</span>
                {isOptionBSelected && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            </div>

            <div className="pt-2.5 space-y-2 text-xs">
              {!isOptionBEligible ? (
                <div className="p-2.5 bg-red-50 text-red-800 rounded-lg text-[11px] space-y-1">
                  <strong>Ineligible for Transport Support:</strong>
                  <p className="leading-tight">
                    Requires {formatINR(calculationResult.halfTransportCost)}, which exceeds the {formatINR(calculationResult.scooterDiscountAllowance)} scooter discount allowance.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Discount Allocation:</span>
                    <span className="font-mono font-medium text-gray-500">
                      ₹0 on scooter
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Company Transport Support:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatINR(calculationResult.halfTransportCost)} (50%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Dealer Transport Payment:</span>
                    <span className="font-mono font-medium text-gray-800">
                      {formatINR(calculationResult.totalTransportCost - calculationResult.halfTransportCost)} (50%)
                    </span>
                  </div>
                  {scenarioBRemaining > 0 && (
                    <div className="flex items-center justify-between text-blue-800 bg-blue-50/60 px-2 py-0.5 rounded">
                      <span className="font-semibold text-[11px]">Unused Allowance:</span>
                      <span className="font-mono font-bold text-[11px]">{formatINR(scenarioBRemaining)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                    <span className="text-gray-600 font-semibold">Estimated Company Profit:</span>
                    <span className="font-mono font-black text-gray-900">
                      {scenarioBProfit !== null ? formatINR(scenarioBProfit) : 'Costs not verified'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION D: FINAL ORDER AMOUNT                                             */}
      {/* ========================================================================= */}
      {calculationResult.hasAllPrices && calculationResult.finalPayableAmount !== null ? (
        <div className="glass-card rounded-2xl p-6 sm:p-7 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Final Total Payable Amount
            </span>
            <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
              Net Vehicles + Dealer Transport
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-[#191A1D] tracking-tight font-mono">
            <AnimatedNumber value={calculationResult.finalPayableAmount} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-1 pt-1.5 border-t border-gray-100">
            <span className="font-medium text-gray-700">
              {formatINRWords(calculationResult.finalPayableAmount)}
            </span>
            <div className="flex items-center space-x-2 text-[11px]">
              <span>Net Vehicles: <strong>{formatINR(calculationResult.totalProductInvoiceAmount ? calculationResult.totalProductInvoiceAmount - calculationResult.actualScooterDiscountApplied : 0)}</strong></span>
              <span>+</span>
              <span>Dealer Transport: <strong>{formatINR(calculationResult.customerTransportPayment)}</strong></span>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-amber-200/90 bg-amber-50/40 space-y-3 shadow-xs">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h2 className="text-sm font-bold text-amber-950">
                Prices Pending for Final Customer Payable
              </h2>
              <p className="text-xs text-amber-900 leading-relaxed">
                {calculationResult.missingPriceReason || 'Enter approved unit selling prices to calculate the final invoice amount.'}
              </p>
              <p className="text-[11px] text-amber-800">
                Commercial discount allowance of <strong>{formatINR(calculationResult.scooterDiscountAllowance)}</strong> is calculated and ready.
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
            <span className="text-xs text-amber-900 font-medium">Add prices in order form to view total</span>
            <button
              type="button"
              onClick={editCurrentOrder}
              className="px-3.5 py-1.5 bg-[#E53935] hover:bg-[#D32F2F] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              Enter Missing Prices
            </button>
          </div>
        </div>
      )}

      {/* Save Error Alert */}
      {saveError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start justify-between gap-2 animate-fade-in">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Failed to Save to Database</strong>
              <p className="mt-0.5">{saveError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearSaveError}
            className="text-[11px] font-bold text-red-700 hover:text-red-900 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Edit Order */}
        <button
          type="button"
          onClick={editCurrentOrder}
          className="py-3 px-3 bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer active:scale-95 shadow-2xs"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Order</span>
        </button>

        {/* Save Calculation */}
        <button
          type="button"
          onClick={handleSaveOrder}
          disabled={isSaving}
          className={`py-3 px-3 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
            justSaved
              ? 'bg-emerald-600 text-white'
              : 'bg-[#E53935] hover:bg-[#D32F2F] text-white shadow-xs'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : justSaved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Order</span>
            </>
          )}
        </button>

        {/* Start New Order */}
        <button
          type="button"
          onClick={() => startNewOrder(false)}
          className="py-3 px-3 bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer active:scale-95 shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Start New</span>
        </button>

        {/* Generate PDF (Print / PDF) */}
        <button
          type="button"
          onClick={() => setActiveView('print-summary')}
          className="py-3 px-3 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer active:scale-95 shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Generate PDF</span>
        </button>
      </div>

    </div>
  );
};
