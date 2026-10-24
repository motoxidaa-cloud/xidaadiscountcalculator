import React from 'react';
import { Printer, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR, formatINRWords } from '../utils/currency';

export const PrintOrderSummary: React.FC = () => {
  const { orderInput, calculationResult, setActiveView } = useApp();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Action Controls (Hidden when printing) */}
      <div className="no-print flex items-center justify-between pb-3 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveView('results')}
          className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 hover:text-[#E53935] px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Results Screen</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#E53935] hover:bg-[#D32F2F] text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Printable Sheet Card (A4 Portrait Layout) */}
      <div className="print-page bg-white text-[#191A1D] rounded-2xl p-8 sm:p-11 shadow-sm border border-gray-200 space-y-6 font-sans">
        
        {/* Tricolour Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#128807] rounded-full" />

        {/* Document Header & Official Xidaa Branding */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-gray-200 gap-4">
          <div className="flex items-center space-x-4">
            <img 
              src="/assets/xidaa-logo-dark.png" 
              alt="Xidaa Moto" 
              className="h-11 sm:h-12 w-auto object-contain"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#191A1D]">
                XIDAA MOTO PRIVATE LIMITED
              </h1>
              <p className="text-[11px] uppercase font-black tracking-widest text-[#E53935]">
                ORDER CALCULATION SUMMARY
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                B2B Commercial Quotation & Transport Freight Settlement
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="inline-block bg-gray-100 text-gray-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border border-gray-200">
              Internal Commercial Record
            </div>
            <div className="text-xs font-mono font-bold text-gray-900">
              Ref: {orderInput.orderRef}
            </div>
            <div className="text-[11px] text-gray-600">
              Date: {orderInput.orderDate}
            </div>
          </div>
        </div>

        {/* Notice Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[10px] sm:text-[11px] text-gray-700 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-[#E53935] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>OFFICIAL COMMERCIAL NOTICE:</strong> This calculation summary represents an internal commercial discount authorization and freight settlement assessment for Xidaa Moto Pvt. Ltd. authorized dealerships. <strong>Subject to administrative approval — Not a tax invoice.</strong>
          </p>
        </div>

        {/* Customer & Shipment Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/90 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
              Dealership / Customer
            </span>
            <div className="text-sm font-black text-gray-900">
              {orderInput.customerName || 'Direct Dealership Order'}
            </div>
            <div className="text-[11px] text-gray-500">
              Authorized Network Partner • Ref: {orderInput.orderRef}
            </div>
          </div>

          <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/90 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
              Shipment Logistics Overview
            </span>
            <div className="text-sm font-black text-gray-900">
              {calculationResult.totalScooters} Scooters ({calculationResult.totalDlScooters} DL + {calculationResult.totalOtherScooters} Other)
            </div>
            <div className="text-[11px] text-gray-500">
              {orderInput.transportDistanceKm} km • {calculationResult.truckSummary}
            </div>
          </div>
        </div>

        {/* 1. Scooter Order Line Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase font-extrabold text-gray-800 tracking-wider">
              1. Scooter Model Order Items
            </h2>
            <span className="text-[10px] font-bold text-gray-500">
              Total Scooter Allowance: {formatINR(calculationResult.scooterDiscountAllowance)}
            </span>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-gray-200">
            <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
              <tr>
                <th className="py-2 px-3 border-r border-gray-200">Model Name</th>
                <th className="py-2 px-3 border-r border-gray-200">Category</th>
                <th className="py-2 px-3 text-center border-r border-gray-200">Quantity</th>
                <th className="py-2 px-3 text-right border-r border-gray-200">Unit Price</th>
                <th className="py-2 px-3 text-right border-r border-gray-200">Line Total</th>
                <th className="py-2 px-3 text-right">Discount Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {orderInput.scooterItems.map((item, idx) => {
                const limit = item.category === 'DL Model' ? 500 : 1000;
                const lineTotal = item.unitPrice ? item.quantity * item.unitPrice : null;
                return (
                  <tr key={idx}>
                    <td className="py-2 px-3 border-r border-gray-200 font-bold text-gray-900">{item.modelName}</td>
                    <td className="py-2 px-3 border-r border-gray-200">{item.category}</td>
                    <td className="py-2 px-3 text-center font-mono font-bold border-r border-gray-200">{item.quantity}</td>
                    <td className="py-2 px-3 text-right font-mono border-r border-gray-200">
                      {item.unitPrice ? formatINR(item.unitPrice) : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold border-r border-gray-200">
                      {lineTotal !== null ? formatINR(lineTotal) : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                      {formatINR(item.quantity * limit)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50/80 font-bold text-gray-900">
                <td colSpan={2} className="py-2 px-3 border-r border-gray-200">Total Scooters Quota</td>
                <td className="py-2 px-3 text-center font-mono border-r border-gray-200">{calculationResult.totalScooters}</td>
                <td className="py-2 px-3 text-right border-r border-gray-200 text-gray-400">—</td>
                <td className="py-2 px-3 text-right font-mono border-r border-gray-200">
                  {calculationResult.grossScooterAmount ? formatINR(calculationResult.grossScooterAmount) : '—'}
                </td>
                <td className="py-2 px-3 text-right font-mono text-emerald-800">
                  {formatINR(calculationResult.scooterDiscountAllowance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Battery Order Line Items (if any) */}
        {orderInput.batteryIncluded && calculationResult.totalBatteries > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase font-extrabold text-gray-800 tracking-wider">
                2. Battery Order Line Items
              </h2>
              <span className="text-[10px] font-bold text-gray-500">
                Total Battery Allowance: {formatINR(calculationResult.batteryDiscountAllowance)}
              </span>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-gray-200">
              <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-2 px-3 border-r border-gray-200">Battery Variant</th>
                  <th className="py-2 px-3 text-center border-r border-gray-200">Quantity</th>
                  <th className="py-2 px-3 text-right border-r border-gray-200">Unit Price</th>
                  <th className="py-2 px-3 text-right border-r border-gray-200">Line Total</th>
                  <th className="py-2 px-3 text-right">Battery Allowance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {orderInput.batteryItems.map((b, bIdx) => {
                  const bTotal = b.unitPrice ? b.quantity * b.unitPrice : null;
                  return (
                    <tr key={bIdx}>
                      <td className="py-2 px-3 border-r border-gray-200 font-bold">{b.variant}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold border-r border-gray-200">{b.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono border-r border-gray-200">
                        {b.unitPrice ? formatINR(b.unitPrice) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold border-r border-gray-200">
                        {bTotal !== null ? formatINR(bTotal) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                        {formatINR(b.eligibleDiscountQuantity * 500)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Transport & Settlement Breakdown Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase font-extrabold text-gray-800 tracking-wider">
              3. Freight & Settlement Summary
            </h2>
            <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded border border-gray-300">
              Active Option: {calculationResult.allocationOption}
            </span>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-gray-200">
            <tbody className="divide-y divide-gray-200 text-gray-800">
              <tr>
                <td className="py-2 px-3 font-medium text-gray-700">Gross Vehicle & Battery Invoice Amount</td>
                <td className="py-2 px-3 text-right font-mono font-bold">
                  {calculationResult.totalProductInvoiceAmount !== null
                    ? formatINR(calculationResult.totalProductInvoiceAmount)
                    : 'Prices Pending'}
                </td>
              </tr>
              <tr className={calculationResult.allocationOption === 'Scooty/Battery Discount' ? 'bg-emerald-50/60 font-semibold text-emerald-950' : 'text-gray-500'}>
                <td className="py-2 px-3">
                  Scooter Price Discount {calculationResult.allocationOption !== 'Scooty/Battery Discount' && '(₹0 — Transport Support selected)'}
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold">
                  {calculationResult.scooterBatteryDiscountApplied > 0
                    ? `− ${formatINR(calculationResult.scooterBatteryDiscountApplied)}`
                    : '₹0'}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-gray-700">Base Transport Charge ({orderInput.transportDistanceKm} km • {calculationResult.truckSummary})</td>
                <td className="py-2 px-3 text-right font-mono">{formatINR(calculationResult.baseTransportCost)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-gray-700">Additional {calculationResult.transportExtraPercent}% Charge</td>
                <td className="py-2 px-3 text-right font-mono">+ {formatINR(calculationResult.transportExtraCharge)}</td>
              </tr>
              <tr className="bg-gray-50 font-semibold">
                <td className="py-2 px-3">Transport Subtotal</td>
                <td className="py-2 px-3 text-right font-mono">{formatINR(calculationResult.transportSubtotal)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-gray-700">Transport GST ({calculationResult.transportGstPercent}%)</td>
                <td className="py-2 px-3 text-right font-mono">+ {formatINR(calculationResult.transportGstAmount)}</td>
              </tr>
              <tr className="bg-gray-100 font-bold text-gray-950">
                <td className="py-2 px-3">Final Transport Cost ({calculationResult.transportCostPerScooter !== null ? `${formatINR(calculationResult.transportCostPerScooter)}/scooty` : ''})</td>
                <td className="py-2 px-3 text-right font-mono text-red-600 font-bold">{formatINR(calculationResult.totalTransportCost)}</td>
              </tr>
              <tr className={calculationResult.allocationOption === 'Transport Support' ? 'bg-blue-50/60 font-semibold text-blue-950' : 'text-gray-500'}>
                <td className="py-2 px-3">
                  Company Transport Support (50%) {calculationResult.allocationOption !== 'Transport Support' && '(₹0 — Scooter Discount selected)'}
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold">
                  {calculationResult.companyTransportSupport > 0
                    ? `− ${formatINR(calculationResult.companyTransportSupport)}`
                    : '₹0'}
                </td>
              </tr>
              <tr className="font-bold">
                <td className="py-2 px-3">
                  Dealer Transport Payment ({calculationResult.allocationOption === 'Transport Support' ? '50% freight' : '100% full freight'})
                </td>
                <td className="py-2 px-3 text-right font-mono font-black">+ {formatINR(calculationResult.customerTransportPayment)}</td>
              </tr>
              <tr className="bg-gray-900 text-white font-black text-sm">
                <td className="py-3 px-3 uppercase tracking-wider">Final Customer Payable Amount</td>
                <td className="py-3 px-3 text-right font-mono text-base text-red-400">
                  {calculationResult.finalPayableAmount !== null
                    ? formatINR(calculationResult.finalPayableAmount)
                    : 'Prices Pending'}
                </td>
              </tr>
            </tbody>
          </table>

          {calculationResult.finalPayableAmount !== null && (
            <div className="text-right text-xs text-gray-600 font-medium pt-1">
              Amount in Words: <strong className="text-gray-900">{formatINRWords(calculationResult.finalPayableAmount)}</strong>
            </div>
          )}
        </div>

        {/* Commercial Discount Strategy Recommendation & Profit Audit Line */}
        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-700 space-y-1.5 print-avoid-break">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900">Commercial Recommendation Strategy:</span>
            <span className="font-mono font-bold text-[#E53935]">
              {calculationResult.profitProtection.scenarios.find(s => s.id === calculationResult.profitProtection.recommendedScenarioId)?.name || 'Standard Baseline'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-600">
            <span>Profitability Audit Status: <strong className="text-gray-900">{calculationResult.profitProtection.status}</strong></span>
            <span>Applied Allocation: <strong className="text-gray-900">{calculationResult.allocationOption}</strong></span>
          </div>
          <p className="text-[10px] text-gray-500 italic pt-0.5 border-t border-gray-200">
            {calculationResult.profitProtection.recommendationReason}
          </p>
        </div>

        {/* Triple Signature Block for Official Dealership Acceptance */}
        <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-gray-700 print-avoid-break">
          <div className="space-y-7">
            <div className="h-8 border-b border-gray-400"></div>
            <div>
              <div className="font-bold text-gray-900">Commercial Sales Desk</div>
              <div className="text-[10px] text-gray-500">Prepared By</div>
            </div>
          </div>

          <div className="space-y-7">
            <div className="h-8 border-b border-gray-400"></div>
            <div>
              <div className="font-bold text-gray-900">Accounts & Logistics</div>
              <div className="text-[10px] text-gray-500">Audited & Verified</div>
            </div>
          </div>

          <div className="space-y-7">
            <div className="h-8 border-b border-gray-400"></div>
            <div>
              <div className="font-bold text-gray-900">Authorized Dealership Signatory</div>
              <div className="text-[10px] text-gray-500">Confirmed & Accepted</div>
            </div>
          </div>
        </div>

        {/* Official Document Footer */}
        <div className="pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400">
          Internal Calculation / Subject to Approval — Not a Tax Invoice • Xidaa Moto Pvt. Ltd.
        </div>

      </div>

    </div>
  );
};
