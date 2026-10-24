import React from 'react';
import { Sparkles, ShieldCheck, AlertCircle, ArrowRight, Check, HelpCircle } from 'lucide-react';
import type { CalculationResult, DiscountAllocationOption, ProfitScenarioId } from '../types';
import { formatINR } from '../utils/currency';

interface DiscountRecommendationCardProps {
  calculationResult: CalculationResult;
  onApplyRecommendation?: (mode: DiscountAllocationOption, scenarioId: ProfitScenarioId) => void;
  className?: string;
  compact?: boolean;
}

export const DiscountRecommendationCard: React.FC<DiscountRecommendationCardProps> = ({
  calculationResult,
  onApplyRecommendation,
  className = '',
  compact = false,
}) => {
  const { profitProtection, allocationOption } = calculationResult;
  const recommendedScenarioId = profitProtection.recommendedScenarioId;
  const scenarios = profitProtection.scenarios || [];
  const recScenario = scenarios.find((s) => s.id === recommendedScenarioId) || scenarios[0];

  if (!recScenario) return null;

  // Determine equivalent DiscountAllocationOption
  const getMappedAllocationOption = (id: ProfitScenarioId): DiscountAllocationOption => {
    if (id === 'scenario-b') return 'Transport Support';
    if (id === 'scenario-c' || id === 'scenario-d') return 'No Discount / Support';
    return 'Scooty/Battery Discount';
  };

  const targetAllocation = getMappedAllocationOption(recommendedScenarioId);
  const isAlreadyActive = allocationOption === targetAllocation;

  const totalRecommendedDiscount = recScenario.scooterDiscountApplied + recScenario.batteryDiscountApplied;
  const isProfitVerified = profitProtection.status === 'Verified';
  const isBelowTarget = profitProtection.status === 'Below Target';
  const isNotVerified = profitProtection.status === 'Not Verified';

  return (
    <div className={`rounded-2xl p-4 sm:p-5 transition-all relative overflow-hidden ${
      isProfitVerified
        ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-300 shadow-sm'
        : isBelowTarget
        ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 shadow-sm'
        : 'bg-gradient-to-br from-blue-500/10 via-gray-500/5 to-transparent border border-blue-200 shadow-sm'
    } ${className}`}>

      {/* Ambient Red/Green Glow Accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
        isProfitVerified ? 'bg-emerald-400/15' : 'bg-[#E53935]/10'
      }`} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/80 pb-3 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-white shadow-2xs border border-gray-200 flex items-center justify-center text-[#E53935]">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E53935]">
                Smart Commercial Engine
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-[10px] font-bold text-gray-500">
                Automatic Recommendation
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#191A1D]">
              {profitProtection.bestOptionTitle || recScenario.name}
            </h3>
          </div>
        </div>

        {/* Verification Status Pill */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center space-x-1 ${
            isProfitVerified
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : isBelowTarget
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-gray-100 text-gray-800 border-gray-300'
          }`}>
            {isProfitVerified ? (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                <span>Profitability Verified</span>
              </>
            ) : isBelowTarget ? (
              <>
                <AlertCircle className="w-3 h-3 text-amber-700" />
                <span>Target Shortfall</span>
              </>
            ) : (
              <>
                <HelpCircle className="w-3 h-3 text-gray-500" />
                <span>Profitability Not Verified</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* 4-Stat Comparison Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3.5">
        
        {/* Recommended Discount */}
        <div className="p-2.5 bg-white/90 rounded-xl border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">
            Vehicle Discount
          </span>
          <strong className="text-sm font-mono font-black text-gray-900 block mt-0.5">
            {formatINR(totalRecommendedDiscount)}
          </strong>
          <span className="text-[9px] text-gray-400">
            DL + Other + Battery
          </span>
        </div>

        {/* Company Transport Support */}
        <div className="p-2.5 bg-white/90 rounded-xl border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">
            Company Freight Support
          </span>
          <strong className="text-sm font-mono font-black text-emerald-800 block mt-0.5">
            {formatINR(recScenario.companyTransportSupport)}
          </strong>
          <span className="text-[9px] text-gray-400">
            Borne by Xidaa Moto
          </span>
        </div>

        {/* Customer Transport Payment */}
        <div className="p-2.5 bg-white/90 rounded-xl border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">
            Customer Freight
          </span>
          <strong className="text-sm font-mono font-black text-blue-900 block mt-0.5">
            {formatINR(recScenario.customerTransportPayment)}
          </strong>
          <span className="text-[9px] text-gray-400">
            Payable by Dealer
          </span>
        </div>

        {/* Estimated Company Profit / Status */}
        <div className="p-2.5 bg-white/90 rounded-xl border border-gray-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">
            Company Profit
          </span>
          {recScenario.companyProfit !== null ? (
            <div>
              <strong className={`text-sm font-mono font-black block mt-0.5 ${
                recScenario.companyProfit >= 0 ? 'text-gray-900' : 'text-red-600'
              }`}>
                {formatINR(recScenario.companyProfit)}
              </strong>
              <span className="text-[9px] font-bold text-emerald-700">
                {recScenario.profitMarginPercent}% Margin
              </span>
            </div>
          ) : (
            <div>
              <strong className="text-xs font-bold text-gray-400 block mt-0.5">
                Provisional
              </strong>
              <span className="text-[9px] text-amber-700 font-medium">
                Cost Data Missing
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Recommendation Reason */}
      <div className="pt-3 text-xs text-gray-700 space-y-1">
        <p className="leading-relaxed bg-white/70 p-2.5 rounded-xl border border-gray-200/70 text-[11px] text-gray-800">
          <strong>Strategic Financial Rationale:</strong> {profitProtection.recommendationReason || recScenario.description}
        </p>

        {isNotVerified && (
          <p className="text-[10px] text-amber-800 italic px-1">
            * Note: This is a provisional recommendation based on discount ceilings. Enter actual manufacturing costs and approved selling prices in Profit Protection to verify corporate margin target compliance.
          </p>
        )}
      </div>

      {/* Action: One-Click Apply */}
      {onApplyRecommendation && !compact && (
        <div className="pt-3 flex items-center justify-between border-t border-gray-200/70 mt-3">
          <div className="text-[11px] text-gray-600">
            Current Active Settlement: <strong>{allocationOption}</strong>
          </div>

          {isAlreadyActive ? (
            <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>Recommended Strategy Active</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onApplyRecommendation(targetAllocation, recommendedScenarioId)}
              className="py-1.5 px-3.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95"
            >
              <span>Apply Recommended Strategy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

    </div>
  );
};
