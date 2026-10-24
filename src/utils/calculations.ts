import type { 
  AppConfig, 
  CalculationResult, 
  DiscountAllocationOption,
  OrderInput, 
  ProfitabilityStatus,
  ProfitProtectionResult, 
  ProfitScenario, 
  ProfitScenarioId, 
  TransportAllocationMode, 
  TruckConfig 
} from '../types';
import { formatINR, toPaise, toRupees } from './currency';

/**
 * Pure calculation engine for Xidaa Discount Calculator.
 * Operates with strict integer-paise arithmetic to eliminate floating-point currency discrepancies.
 */
export function calculateOrderFinancials(
  input: OrderInput,
  config: AppConfig
): CalculationResult {
  const auditTrail: CalculationResult['auditTrail'] = [];

  // 1. Scooter Item Calculations
  let totalDlScooters = 0;
  let totalOtherScooters = 0;
  let totalScooters = 0;
  let hasMissingScooterPrice = false;
  let grossScooterPaise = 0;
  const missingPriceItems: string[] = [];

  (input.scooterItems || []).forEach((item) => {
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (qty > 0) {
      totalScooters += qty;
      if (item.category === 'DL Model') {
        totalDlScooters += qty;
      } else {
        totalOtherScooters += qty;
      }

      const effectivePrice = (item.unitPrice !== undefined && item.unitPrice !== null && item.unitPrice > 0)
        ? item.unitPrice 
        : input.profitabilityInput?.defaultScooterSellingPrice;

      if (effectivePrice !== undefined && effectivePrice !== null && effectivePrice > 0) {
        grossScooterPaise += toPaise(qty * effectivePrice);
      } else {
        hasMissingScooterPrice = true;
        missingPriceItems.push(item.modelName || 'Scooter');
      }
    }
  });

  const dlLimit = config.discountRates.dlModelMaxDiscount;
  const otherLimit = config.discountRates.otherModelMaxDiscount;

  const dlAllowancePaise = toPaise(totalDlScooters * dlLimit);
  const otherAllowancePaise = toPaise(totalOtherScooters * otherLimit);
  const scooterDiscountAllowancePaise = dlAllowancePaise + otherAllowancePaise;
  const scooterDiscountAllowance = toRupees(scooterDiscountAllowancePaise);

  auditTrail.push({
    step: '1. Scooter Discount Allowance (S)',
    description: `DL: ${totalDlScooters} × ${formatINR(dlLimit)} (${formatINR(toRupees(dlAllowancePaise))}) + Other: ${totalOtherScooters} × ${formatINR(otherLimit)} (${formatINR(toRupees(otherAllowancePaise))})`,
    formula: `(${totalDlScooters} × ${formatINR(dlLimit)}) + (${totalOtherScooters} × ${formatINR(otherLimit)})`,
    amount: scooterDiscountAllowance,
  });

  // 2. Battery Item Calculations
  let totalBatteries = 0;
  let totalEligibleBatteries = 0;
  let grossBatteryPaise = 0;
  let hasMissingBatteryPrice = false;
  const batteryBreakdown: CalculationResult['batteryBreakdown'] = [];

  if (input.batteryIncluded && input.batteryItems && input.batteryItems.length > 0) {
    input.batteryItems.forEach((b) => {
      const bQty = Math.max(0, Math.floor(Number(b.quantity) || 0));
      if (bQty > 0) {
        totalBatteries += bQty;
        const eligible = Math.min(bQty, Math.max(0, Math.floor(Number(b.eligibleDiscountQuantity) || 0)));
        totalEligibleBatteries += eligible;
        batteryBreakdown.push({ variant: b.variant, quantity: bQty });

        const effectiveBattPrice = (b.unitPrice !== undefined && b.unitPrice !== null && b.unitPrice > 0)
          ? b.unitPrice
          : input.profitabilityInput?.defaultBatterySellingPrice;

        if (effectiveBattPrice !== undefined && effectiveBattPrice !== null && effectiveBattPrice > 0) {
          grossBatteryPaise += toPaise(bQty * effectiveBattPrice);
        } else {
          hasMissingBatteryPrice = true;
          missingPriceItems.push(b.variant || 'Battery');
        }
      }
    });
  }

  const batteryAllowancePaise = toPaise(totalEligibleBatteries * config.discountRates.batteryMaxDiscount);
  const batteryDiscountAllowance = toRupees(batteryAllowancePaise);

  auditTrail.push({
    step: '2. Battery Discount Allowance (B)',
    description: input.batteryIncluded && totalEligibleBatteries > 0
      ? `${totalEligibleBatteries} eligible batteries @ ${formatINR(config.discountRates.batteryMaxDiscount)} each`
      : 'No eligible battery discount (batteries not included or 0 eligible)',
    formula: `${totalEligibleBatteries} × ${formatINR(config.discountRates.batteryMaxDiscount)}`,
    amount: batteryDiscountAllowance,
  });

  const totalDiscountAllowance = scooterDiscountAllowance + batteryDiscountAllowance;

  // 3. Transport Logistics Calculations
  // Step 1: Base Transport = Distance in KM × Truck Rate (sum of truck allocations)
  // Step 2: Extra Charge % (default 10%) = Base Transport × Extra%
  // Step 3: Transport Subtotal = Base Transport + Extra Charge
  // Step 4: Transport GST % (default 5%) = Transport Subtotal × GST%
  // Step 5: Final Transport Cost = Transport Subtotal + Transport GST
  const distanceKm = Math.max(0, Number(input.transportDistanceKm) || 0);
  let baseTransportPaise = 0;
  let totalCapacity = 0;
  const truckDescriptions: string[] = [];

  if (input.truckAllocations && input.truckAllocations.length > 0) {
    input.truckAllocations.forEach((alloc) => {
      const count = Math.max(0, Math.floor(Number(alloc.count) || 0));
      if (count > 0) {
        totalCapacity += count * alloc.capacity;
        const lineBasePaise = toPaise(count * distanceKm * alloc.ratePerKm);
        baseTransportPaise += lineBasePaise;
        truckDescriptions.push(
          `${count}x ${alloc.capacity}-scooter truck (${distanceKm} km @ ${formatINR(alloc.ratePerKm)}/km = ${formatINR(toRupees(lineBasePaise))})`
        );
      }
    });
  }

  const baseTransportCost = toRupees(baseTransportPaise);

  // Additional % extra charge (configurable, default 10%)
  const transportExtraPercent = config.transportSettings?.extraChargePercent ?? 10;
  const transportExtraPaise = Math.round(baseTransportPaise * (transportExtraPercent / 100));
  const transportExtraCharge = toRupees(transportExtraPaise);

  // Transport subtotal after extra charge
  const transportSubtotalPaise = baseTransportPaise + transportExtraPaise;
  const transportSubtotal = toRupees(transportSubtotalPaise);

  // Transport GST % (configurable, default 5%) calculated on Transport Subtotal
  const transportGstPercent = config.transportSettings?.transportGstPercent ?? 5;
  const transportGstPaise = Math.round(transportSubtotalPaise * (transportGstPercent / 100));
  const transportGstAmount = toRupees(transportGstPaise);

  // Final Transport Cost = Subtotal + Transport GST
  const finalTransportPaise = transportSubtotalPaise + transportGstPaise;
  const totalTransportCost = toRupees(finalTransportPaise);

  // Half-transport sharing quota (50% of final transport cost)
  const halfTransportPaise = Math.round(finalTransportPaise * (config.transportSharing.companySharePercent / 100));
  const halfTransportCost = toRupees(halfTransportPaise);
  const truckSummary = truckDescriptions.join(' + ') || 'No trucks allocated';
  const isSharingEligible = totalTransportCost > 0 && scooterDiscountAllowancePaise >= halfTransportPaise;

  auditTrail.push({
    step: '3. Transport Logistics Charges (5-Step Formula)',
    description: `Base: ${formatINR(baseTransportCost)} + ${transportExtraPercent}% Extra: ${formatINR(transportExtraCharge)} = Subtotal: ${formatINR(transportSubtotal)} + ${transportGstPercent}% GST: ${formatINR(transportGstAmount)} = Final Transport: ${formatINR(totalTransportCost)} (${truckSummary})`,
    formula: `[Base (${formatINR(baseTransportCost)}) × (1 + ${transportExtraPercent}%)] × (1 + ${transportGstPercent}%)`,
    amount: totalTransportCost,
  });

  // 4. Per-Scooty Transport Cost Calculation
  // Transport Cost Per Scooty = Final Total Transport Cost ÷ Total Number of Scooters
  const transportCostPerScooter = totalScooters > 0
    ? Number((totalTransportCost / totalScooters).toFixed(2))
    : null;

  // 5. Strict Single-Component Discount / Transport Support Allocation
  // The 50% company support or discount must apply to ONE component only, never both Scooter/Battery and Transport simultaneously.
  let allocationOption: DiscountAllocationOption = 'Scooty/Battery Discount';

  if (input.allocationMode === 'Transport Support' || input.allocationMode === 'Share Transport') {
    allocationOption = 'Transport Support';
  } else if (input.allocationMode === 'No Discount / Support') {
    allocationOption = 'No Discount / Support';
  } else if (input.allocationMode === 'Scooty/Battery Discount' || input.allocationMode === 'Full Scooter Discount') {
    allocationOption = 'Scooty/Battery Discount';
  } else if (input.allocationMode === 'Automatic') {
    if (input.selectedScenarioId === 'scenario-b') {
      allocationOption = 'Transport Support';
    } else if (input.selectedScenarioId === 'scenario-c' || input.selectedScenarioId === 'scenario-d') {
      allocationOption = 'No Discount / Support';
    } else if (input.selectedScenarioId === 'scenario-a') {
      allocationOption = 'Scooty/Battery Discount';
    } else {
      allocationOption = isSharingEligible ? 'Transport Support' : 'Scooty/Battery Discount';
    }
  }

  const supportPercent = config.transportSharing?.companySharePercent ?? 50;

  let actualScooterDiscountApplied = 0;
  let actualBatteryDiscountApplied = 0;
  let companyTransportSupport = 0;
  let customerTransportPayment = totalTransportCost;
  let transportSharingApplied = false;
  let remainingScooterDiscount = 0;
  let totalCustomerDiscountBenefit = 0;
  let eligibilityMessage = '';

  if (allocationOption === 'Scooty/Battery Discount') {
    // Option A: Apply approved discount ONLY to scooter/battery invoice amount.
    // Transport charges must remain at 100% payable by the customer. Company Transport Support = ₹0.
    actualScooterDiscountApplied = scooterDiscountAllowance;
    actualBatteryDiscountApplied = batteryDiscountAllowance;
    companyTransportSupport = 0;
    customerTransportPayment = totalTransportCost;
    transportSharingApplied = false;
    remainingScooterDiscount = 0; // Fully applied to vehicle invoice
    totalCustomerDiscountBenefit = scooterDiscountAllowance + batteryDiscountAllowance;
    eligibilityMessage = `Scooty/Battery Discount active: ${formatINR(totalCustomerDiscountBenefit)} applied to invoice. Transport charges remain at 100% customer payable (${formatINR(totalTransportCost)}). Company transport support is ₹0.`;
  } else if (allocationOption === 'Transport Support') {
    // Option B: Apply configured company support percentage to final transport cost.
    // Scooter/Battery Discount = ₹0 for this allocation!
    actualScooterDiscountApplied = 0;
    actualBatteryDiscountApplied = 0;
    companyTransportSupport = isSharingEligible ? halfTransportCost : 0;
    customerTransportPayment = Math.round((totalTransportCost - companyTransportSupport) * 100) / 100;
    transportSharingApplied = companyTransportSupport > 0;
    // Unused scooter discount allowance (e.g. Test B: ₹12,000 - ₹10,000 = ₹2,000)
    remainingScooterDiscount = Math.max(0, scooterDiscountAllowance - companyTransportSupport);
    totalCustomerDiscountBenefit = companyTransportSupport;
    eligibilityMessage = isSharingEligible
      ? `Transport Support active: Company absorbs ${supportPercent}% transport freight (${formatINR(companyTransportSupport)}). Scooter and battery invoice discounts are ₹0. Customer pays remaining transport (${formatINR(customerTransportPayment)}). Remaining unused scooter allowance: ${formatINR(remainingScooterDiscount)}.`
      : `Transport Support ineligible: Required 50% support (${formatINR(halfTransportCost)}) exceeds scooter discount allowance (${formatINR(scooterDiscountAllowance)}).`;
  } else {
    // Option C: No Discount / Support
    // No scooter/battery discount, no company transport support.
    actualScooterDiscountApplied = 0;
    actualBatteryDiscountApplied = 0;
    companyTransportSupport = 0;
    customerTransportPayment = totalTransportCost;
    transportSharingApplied = false;
    remainingScooterDiscount = scooterDiscountAllowance;
    totalCustomerDiscountBenefit = 0;
    eligibilityMessage = `No Discount / Support active: Customer pays full vehicle invoice and full 100% transport cost (${formatINR(totalTransportCost)}).`;
  }

  const scooterBatteryDiscountApplied = actualScooterDiscountApplied + actualBatteryDiscountApplied;

  // Customer transport share per scooty after company support
  const customerTransportPerScooter = totalScooters > 0
    ? Number((customerTransportPayment / totalScooters).toFixed(2))
    : null;

  auditTrail.push({
    step: '4. Per-Scooty Transport & Settlement Rule',
    description: `Final Transport Cost: ${formatINR(totalTransportCost)} ÷ ${totalScooters} Scooters = ${transportCostPerScooter !== null ? formatINR(transportCostPerScooter) : '—'}/scooty. Selected Allocation: ${allocationOption}. Customer Transport Payable: ${formatINR(customerTransportPayment)} (${customerTransportPerScooter !== null ? formatINR(customerTransportPerScooter) : '—'}/scooty).`,
    formula: `Final Transport (${formatINR(totalTransportCost)}) ÷ Total Scooters (${totalScooters})`,
    amount: transportCostPerScooter,
  });

  // 6. Smart Profit Protection Engine & Scenario Analysis
  const profitProtection = evaluateProfitProtectionEngine(input, config, {
    totalScooters,
    totalBatteries,
    scooterDiscountAllowance,
    batteryDiscountAllowance,
    totalTransportCost,
    halfTransportCost,
    baseTransportCost,
    transportSubtotal,
    transportGstAmount,
    isSharingEligible,
    grossScooterPaise,
    grossBatteryPaise,
    hasMissingScooterPrice,
    hasMissingBatteryPrice,
  });

  const warningMessage: string | undefined = profitProtection.activeScenario.status === 'Below Target'
    ? `Profit Protection Alert: ${profitProtection.activeScenario.statusMessage}`
    : undefined;
  const suggestedMode: TransportAllocationMode | undefined = undefined;

  // 7. Check Price Completeness & Financials
  const hasItemsToPrice = totalScooters > 0 || totalBatteries > 0;
  const hasAllPrices = hasItemsToPrice && !hasMissingScooterPrice && (!input.batteryIncluded || !hasMissingBatteryPrice);

  let grossScooterAmount: number | null = null;
  let grossBatteryAmount: number | null = null;
  let totalProductInvoiceAmount: number | null = null;
  let grossTotalAmount: number | null = null;
  let subtotalBeforeTax: number | null = null;
  let gstAmount: number | null = null;
  let finalPayableAmount: number | null = null;
  let missingPriceReason: string | undefined;

  if (!hasItemsToPrice) {
    missingPriceReason = 'Add at least one scooter or battery item to calculate order.';
  } else if (!hasAllPrices) {
    missingPriceReason = missingPriceItems.length > 0
      ? `Enter approved unit prices for: ${missingPriceItems.join(', ')} to calculate final customer payable.`
      : 'Enter unit prices to calculate final customer payable.';
  } else {
    // All prices provided!
    grossScooterAmount = toRupees(grossScooterPaise);
    grossBatteryAmount = toRupees(grossBatteryPaise);
    const grossTotalPaise = grossScooterPaise + grossBatteryPaise;
    totalProductInvoiceAmount = toRupees(grossTotalPaise);
    grossTotalAmount = totalProductInvoiceAmount;

    // Net products after applying single selected discount (if Scooty/Battery Discount active)
    const netProductsPaise = Math.max(0, grossTotalPaise - toPaise(scooterBatteryDiscountApplied));
    const customerTransportPaymentPaise = toPaise(customerTransportPayment);

    // Note: Customer transport payment already includes transport GST (Step 3/4).
    // Do NOT add GST again elsewhere to the same transport amount.
    const { gstTreatment, gstRatePercent } = config.taxSettings;
    let productGstPaise = 0;

    if (gstTreatment === 'Exclusive' && gstRatePercent > 0) {
      productGstPaise = Math.round(netProductsPaise * (gstRatePercent / 100));
      subtotalBeforeTax = toRupees(netProductsPaise + customerTransportPaymentPaise);
      gstAmount = toRupees(productGstPaise);
      finalPayableAmount = toRupees(netProductsPaise + productGstPaise + customerTransportPaymentPaise);
    } else if (gstTreatment === 'Inclusive' && gstRatePercent > 0) {
      productGstPaise = Math.round(netProductsPaise - (netProductsPaise / (1 + gstRatePercent / 100)));
      subtotalBeforeTax = toRupees(netProductsPaise + customerTransportPaymentPaise);
      gstAmount = toRupees(productGstPaise);
      finalPayableAmount = toRupees(netProductsPaise + customerTransportPaymentPaise);
    } else {
      // 'None'
      subtotalBeforeTax = toRupees(netProductsPaise + customerTransportPaymentPaise);
      gstAmount = null;
      finalPayableAmount = toRupees(netProductsPaise + customerTransportPaymentPaise);
    }
  }

  auditTrail.push({
    step: '5. Smart Profit Protection Engine',
    description: profitProtection.hasCostData
      ? `Status: ${profitProtection.status} (${profitProtection.minProfitRequirementText}). Active Strategy: ${profitProtection.activeScenario.name} -> Profit: ${profitProtection.activeScenario.companyProfit !== null ? formatINR(profitProtection.activeScenario.companyProfit) : 'N/A'} (${profitProtection.activeScenario.profitMarginPercent ?? 0}% margin). ${profitProtection.recommendationReason}`
      : `Status: Profitability Not Verified (Missing: ${profitProtection.missingDataReasons.join(', ')}). ${profitProtection.recommendationReason}`,
    formula: `Scooter Rev + Battery Rev + Customer Transport (ex GST) - Scooter Costs - Battery Costs - Transporter Costs - Other Costs`,
    amount: profitProtection.activeScenario.companyProfit,
  });

  return {
    totalDlScooters,
    totalOtherScooters,
    totalScooters,
    totalBatteries,
    batteryBreakdown,
    scooterDiscountAllowance,
    batteryDiscountAllowance,
    totalDiscountAllowance,
    baseTransportCost,
    transportExtraPercent,
    transportExtraCharge,
    transportSubtotal,
    transportGstPercent,
    transportGstAmount,
    totalTransportCost,
    halfTransportCost,
    transportCostPerScooter,
    customerTransportPerScooter,
    totalCapacity,
    truckSummary,
    allocationOption,
    transportSharingEligible: isSharingEligible,
    transportSharingApplied,
    companyTransportSupport,
    customerTransportPayment,
    actualScooterDiscountApplied,
    actualBatteryDiscountApplied,
    scooterBatteryDiscountApplied,
    remainingScooterDiscount,
    totalCustomerDiscountBenefit,
    hasAllPrices,
    missingPriceReason,
    missingPriceItems,
    grossScooterAmount,
    grossBatteryAmount,
    totalProductInvoiceAmount,
    grossTotalAmount,
    subtotalBeforeTax,
    gstAmount,
    finalPayableAmount,
    gstTreatment: config.taxSettings.gstTreatment,
    gstRatePercent: config.taxSettings.gstRatePercent,
    effectiveAllocationMode: allocationOption,
    eligibilityMessage,
    warningMessage,
    suggestedMode,
    auditTrail,
    profitProtection,
  };
}

/**
 * Smart Profit Protection Engine
 * Evaluates Scenario A (Scooter Discount), B (Transport Sharing), C (Combined Allocation), and D (No Discount).
 * Validates against configurable profit target and prevents double-counting or loss-making discounts.
 */
export function evaluateProfitProtectionEngine(
  input: OrderInput,
  config: AppConfig,
  context: {
    totalScooters: number;
    totalBatteries: number;
    scooterDiscountAllowance: number;
    batteryDiscountAllowance: number;
    totalTransportCost: number;
    halfTransportCost: number;
    baseTransportCost: number;
    transportSubtotal: number;
    transportGstAmount: number;
    isSharingEligible: boolean;
    grossScooterPaise: number;
    grossBatteryPaise: number;
    hasMissingScooterPrice: boolean;
    hasMissingBatteryPrice: boolean;
  }
): ProfitProtectionResult {
  const pInput = input.profitabilityInput || {};
  const pConfig = config.profitProtectionConfig || {
    enabled: true,
    defaultMinProfitType: 'margin_percent',
    defaultMinProfitAmount: 30000,
    defaultMinProfitMarginPercent: 10,
    gstRecoverable: true,
  };

  const minProfitType = pInput.minProfitType || pConfig.defaultMinProfitType || 'margin_percent';
  const targetProfitAmount = (pInput.minProfitAmount !== undefined && pInput.minProfitAmount !== null && Number(pInput.minProfitAmount) > 0)
    ? Number(pInput.minProfitAmount)
    : pConfig.defaultMinProfitAmount;
  const targetProfitMarginPercent = (pInput.minProfitMarginPercent !== undefined && pInput.minProfitMarginPercent !== null && Number(pInput.minProfitMarginPercent) > 0)
    ? Number(pInput.minProfitMarginPercent)
    : pConfig.defaultMinProfitMarginPercent;

  const minProfitRequirementText = minProfitType === 'margin_percent'
    ? `Minimum ${targetProfitMarginPercent}% Profit Margin`
    : `Minimum ${formatINR(targetProfitAmount)} Profit Amount`;

  // Costs
  let totalScooterCost: number | null = null;
  if (pInput.totalScooterCost !== undefined && pInput.totalScooterCost !== null && Number(pInput.totalScooterCost) > 0) {
    totalScooterCost = Number(pInput.totalScooterCost);
  } else if (pInput.scooterUnitCost !== undefined && pInput.scooterUnitCost !== null && Number(pInput.scooterUnitCost) > 0) {
    totalScooterCost = context.totalScooters * Number(pInput.scooterUnitCost);
  }

  let totalBatteryCost: number | null = null;
  if (context.totalBatteries === 0) {
    totalBatteryCost = 0;
  } else if (pInput.totalBatteryCost !== undefined && pInput.totalBatteryCost !== null && Number(pInput.totalBatteryCost) > 0) {
    totalBatteryCost = Number(pInput.totalBatteryCost);
  } else if (pInput.batteryUnitCost !== undefined && pInput.batteryUnitCost !== null && Number(pInput.batteryUnitCost) > 0) {
    totalBatteryCost = context.totalBatteries * Number(pInput.batteryUnitCost);
  }

  const otherCompanyCosts = Math.max(0, Number(pInput.otherCompanyCosts) || 0);

  // Revenue Check
  const grossScooterRevenue = context.grossScooterPaise > 0 ? toRupees(context.grossScooterPaise) : null;
  const grossBatteryRevenue = context.totalBatteries > 0 ? (context.grossBatteryPaise > 0 ? toRupees(context.grossBatteryPaise) : null) : 0;

  // Identify Missing Data (Strictly do not invent manufacturing data)
  const missingDataReasons: string[] = [];
  if (context.totalScooters > 0 && totalScooterCost === null) {
    missingDataReasons.push('Scooter company cost (unit cost or total manufacturing cost)');
  }
  if (context.totalScooters > 0 && (context.hasMissingScooterPrice || grossScooterRevenue === null)) {
    missingDataReasons.push('Approved scooter selling price');
  }
  if (context.totalBatteries > 0 && totalBatteryCost === null) {
    missingDataReasons.push('Battery company cost (unit cost or total manufacturing cost)');
  }
  if (context.totalBatteries > 0 && (context.hasMissingBatteryPrice || grossBatteryRevenue === null)) {
    missingDataReasons.push('Approved battery selling price');
  }

  const hasCostData = missingDataReasons.length === 0;
  const gstTransportTreatment: 'recoverable' | 'cost' = pConfig.gstRecoverable ? 'recoverable' : 'cost';

  // Helper for single scenario calculation
  const calculateScenario = (
    id: ProfitScenarioId,
    name: string,
    tagline: string,
    description: string,
    scooterDiscount: number,
    batteryDiscount: number,
    compTransportSupport: number,
    custTransportPay: number,
    isValid: boolean,
    invalidReason?: string
  ): ProfitScenario => {
    const totalBenefit = scooterDiscount + batteryDiscount + compTransportSupport;

    if (!hasCostData || grossScooterRevenue === null || totalScooterCost === null || (context.totalBatteries > 0 && (grossBatteryRevenue === null || totalBatteryCost === null))) {
      return {
        id,
        name,
        tagline,
        description,
        scooterDiscountApplied: scooterDiscount,
        batteryDiscountApplied: batteryDiscount,
        companyTransportSupport: compTransportSupport,
        customerTransportPayment: custTransportPay,
        totalDiscountBenefit: totalBenefit,
        remainingScooterDiscount: id === 'scenario-b' ? Math.max(0, context.scooterDiscountAllowance - compTransportSupport) : (id === 'scenario-a' ? 0 : context.scooterDiscountAllowance),
        companyProfit: null,
        profitMarginPercent: null,
        isValid,
        meetsProfitTarget: null,
        status: 'Not Verified',
        statusMessage: invalidReason || 'Profitability cannot be verified — enter approved costs to compare both options.',
      };
    }

    // Revenue after discounts
    const scooterRev = Math.max(0, grossScooterRevenue - scooterDiscount);
    const battRev = Math.max(0, (grossBatteryRevenue || 0) - batteryDiscount);

    // Transport excluding GST
    const transportTotalExGst = context.transportSubtotal;
    const finalTrans = Math.max(1, context.totalTransportCost);
    const custTransportExGst = Math.round(custTransportPay * (transportTotalExGst / finalTrans));

    // Company-borne transport cost excluding recoverable GST where applicable
    const compTransportExpense = gstTransportTreatment === 'recoverable'
      ? Math.round(compTransportSupport * (transportTotalExGst / finalTrans))
      : compTransportSupport;

    // Company Profit =
    // Scooter revenue after discounts + Battery revenue after discounts + Customer transport collected (excl GST)
    // - Scooter costs - Battery costs - Transporter charges (excl GST) - Other costs
    // = Scooter revenue after discounts + Battery revenue after discounts - Scooter costs - Battery costs - Company transport cost - Other costs
    // (Never double-counting company transport support)
    const companyProfit = Math.round(
      scooterRev + battRev - totalScooterCost - (totalBatteryCost || 0) - compTransportExpense - otherCompanyCosts
    );

    // Revenue base for margin
    const totalRevExGst = scooterRev + battRev + custTransportExGst;
    const profitMarginPercent = totalRevExGst > 0 ? Number(((companyProfit / totalRevExGst) * 100).toFixed(2)) : 0;

    let meetsTarget = false;
    let shortfall = 0;

    if (minProfitType === 'margin_percent') {
      meetsTarget = profitMarginPercent >= targetProfitMarginPercent;
      if (!meetsTarget && totalRevExGst > 0) {
        const requiredProfit = (targetProfitMarginPercent / 100) * totalRevExGst;
        shortfall = Math.max(0, Math.round(requiredProfit - companyProfit));
      }
    } else {
      meetsTarget = companyProfit >= targetProfitAmount;
      if (!meetsTarget) {
        shortfall = Math.max(0, Math.round(targetProfitAmount - companyProfit));
      }
    }

    const scenarioStatus: ProfitabilityStatus = !isValid
      ? 'Below Target'
      : meetsTarget
      ? 'Verified'
      : 'Below Target';

    let statusMsg = '';
    if (!isValid) {
      statusMsg = invalidReason || 'Ineligible configuration.';
    } else if (meetsTarget) {
      statusMsg = `Meets target with ${formatINR(companyProfit)} profit (${profitMarginPercent}% margin).`;
    } else {
      statusMsg = `Falls ${formatINR(shortfall)} short of ${minProfitRequirementText} (Profit: ${formatINR(companyProfit)}, Margin: ${profitMarginPercent}%).`;
    }

    return {
      id,
      name,
      tagline,
      description,
      scooterDiscountApplied: scooterDiscount,
      batteryDiscountApplied: batteryDiscount,
      companyTransportSupport: compTransportSupport,
      customerTransportPayment: custTransportPay,
      totalDiscountBenefit: totalBenefit,
      remainingScooterDiscount: id === 'scenario-b' ? Math.max(0, context.scooterDiscountAllowance - compTransportSupport) : (id === 'scenario-a' ? 0 : context.scooterDiscountAllowance),
      companyProfit,
      profitMarginPercent,
      isValid,
      meetsProfitTarget: meetsTarget,
      profitShortfall: shortfall > 0 ? shortfall : undefined,
      status: scenarioStatus,
      statusMessage: statusMsg,
    };
  };

  const S = context.scooterDiscountAllowance;
  const B = context.batteryDiscountAllowance;
  const T = context.totalTransportCost;
  const H = context.halfTransportCost;

  // Scenario A: Scooty/Battery Discount
  // Apply approved discount only to scooter/battery invoice amount; customer pays 100% transport charges.
  const scenarioA = calculateScenario(
    'scenario-a',
    'Scenario A: Scooty/Battery Discount',
    'Scooty/Battery Discount',
    'Apply approved discount only to scooter/battery invoice amount. Customer pays 100% transport charges.',
    S,
    B,
    0,
    T,
    true
  );

  // Scenario B: Transport Support
  // Company absorbs configured support % (50%) of transport. Scooter/battery discount is strictly ₹0!
  const scenarioB = calculateScenario(
    'scenario-b',
    'Scenario B: Transport Support',
    'Transport Support',
    'Apply 50% company support to final transport cost. Scooter/battery invoice discount is strictly ₹0.',
    0,
    0,
    H,
    T - H,
    context.isSharingEligible,
    !context.isSharingEligible ? `Transport support requires ${formatINR(H)}, which exceeds the ${formatINR(S)} scooter discount allowance.` : undefined
  );

  // Scenario C: No Discount / Support
  // Zero discount, zero company transport support
  const scenarioC = calculateScenario(
    'scenario-c',
    'Scenario C: No Discount / Support',
    'No Discount / Support',
    'No scooter/battery discount and no company transport support. Customer pays full vehicle invoice and full transport.',
    0,
    0,
    0,
    T,
    true
  );

  // Scenario D: Alias of Scenario C for backward compatibility
  const scenarioD = {
    ...scenarioC,
    id: 'scenario-d' as ProfitScenarioId,
    name: 'Scenario D: No Discount',
    tagline: 'Zero Discount Baseline',
  };

  const scenarios = [scenarioA, scenarioB, scenarioC, scenarioD];

  // Recommendation Engine: Compare Option A (Scooter Discount) vs Option B (50% Transport Support)
  let recommendedScenarioId: ProfitScenarioId = 'scenario-a';
  let recommendationReason = '';
  let bestOptionTitle = 'Best Option for Xidaa: Scooter Discount';
  let profitDifference: number | null = null;

  if (!hasCostData) {
    bestOptionTitle = 'Profitability Not Verified';
    profitDifference = null;
    recommendationReason = 'Profitability cannot be verified — enter approved costs to compare both options. (Provisional recommendation: Profitability not verified).';
    recommendedScenarioId = input.allocationMode === 'Transport Support' && context.isSharingEligible ? 'scenario-b' : 'scenario-a';
  } else {
    // Both options evaluated using approved cost data
    const discountPool = [scenarioA, scenarioB];
    const validDiscountOptions = discountPool.filter(s => s.isValid && s.meetsProfitTarget === true);

    if (!scenarioB.isValid) {
      if (scenarioA.meetsProfitTarget) {
        recommendedScenarioId = 'scenario-a';
        bestOptionTitle = 'Best Option for Xidaa: Scooter Discount';
        profitDifference = null;
        recommendationReason = `Recommended: Scooty/Battery Discount (Scenario A) — 50% Transport Support is ineligible (requires ${formatINR(H)}, which exceeds the ${formatINR(S)} scooter discount allowance).`;
      } else {
        recommendedScenarioId = 'scenario-d';
        bestOptionTitle = 'Discount Not Recommended: Below Profit Target';
        recommendationReason = `Discount not recommended: This order does not meet the configured profit requirement with discounts applied. Baseline no-discount option preserves ${formatINR(scenarioD.companyProfit ?? 0)} profit (${scenarioD.profitMarginPercent}% margin).`;
      }
    } else if (validDiscountOptions.length > 0) {
      const profitA = scenarioA.companyProfit ?? 0;
      const profitB = scenarioB.companyProfit ?? 0;
      const diff = Math.abs(profitB - profitA);
      profitDifference = diff;

      if (profitB > profitA && scenarioB.meetsProfitTarget) {
        recommendedScenarioId = 'scenario-b';
        bestOptionTitle = 'Best Option for Xidaa: 50% Transport Support';
        recommendationReason = `Recommended: Transport Support (Scenario B) — this option gives Xidaa ${formatINR(diff)} more estimated profit than the alternative.`;
      } else if (scenarioA.meetsProfitTarget) {
        recommendedScenarioId = 'scenario-a';
        bestOptionTitle = 'Best Option for Xidaa: Scooter Discount';
        recommendationReason = `Recommended: Scooty/Battery Discount (Scenario A) — this option gives Xidaa ${formatINR(diff)} more estimated profit than the alternative.`;
      } else {
        recommendedScenarioId = 'scenario-d';
        bestOptionTitle = 'Discount Not Recommended: Below Profit Target';
        recommendationReason = `Discount not recommended: This order does not meet the configured profit requirement with discounts applied. Baseline no-discount option preserves ${formatINR(scenarioD.companyProfit ?? 0)} profit (${scenarioD.profitMarginPercent}% margin).`;
      }
    } else {
      // Neither discount option meets the minimum required profit target
      recommendedScenarioId = 'scenario-d';
      bestOptionTitle = 'Discount Not Recommended: Below Profit Target';
      if (scenarioD.meetsProfitTarget) {
        recommendationReason = `Discount not recommended: This order does not meet the configured profit requirement with discounts applied. Baseline no-discount option preserves ${formatINR(scenarioD.companyProfit ?? 0)} profit (${scenarioD.profitMarginPercent}% margin).`;
      } else {
        recommendationReason = `Discount not recommended: This order does not meet the configured profit requirement even with zero discounts (Target: ${minProfitRequirementText}, Max possible profit: ${formatINR(scenarioD.companyProfit ?? 0)}).`;
      }
    }
  }

  // Active / Selected Scenario
  const selectedScenarioId = input.selectedScenarioId || recommendedScenarioId;
  const activeScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarioA;

  let overallStatus: ProfitabilityStatus = 'Not Verified';
  if (!hasCostData) {
    overallStatus = 'Not Verified';
  } else if ((input.selectedScenarioId === 'scenario-c' || input.selectedScenarioId === 'scenario-d') && activeScenario.meetsProfitTarget) {
    overallStatus = 'Verified';
  } else if (recommendedScenarioId === 'scenario-d') {
    overallStatus = 'Below Target';
  } else if (activeScenario.meetsProfitTarget) {
    overallStatus = 'Verified';
  } else {
    overallStatus = 'Below Target';
  }

  const totalCompanyCost = totalScooterCost !== null ? totalScooterCost + (totalBatteryCost || 0) + otherCompanyCosts : null;

  return {
    status: overallStatus,
    hasCostData,
    missingDataReasons,
    scenarios,
    recommendedScenarioId,
    recommendationReason,
    bestOptionTitle,
    profitDifference,
    selectedScenarioId,
    activeScenario,
    minProfitRequirementText,
    targetProfitAmount: minProfitType === 'amount' ? targetProfitAmount : null,
    targetProfitMarginPercent: minProfitType === 'margin_percent' ? targetProfitMarginPercent : null,
    grossScooterRevenue,
    grossBatteryRevenue,
    totalScooterCost,
    totalBatteryCost,
    totalCompanyCost,
    otherCompanyCosts,
    gstTransportTreatment,
  };
}

/**
 * Helper to auto-allocate trucks based on order total scooters
 */
export function recommendTruckAllocation(
  totalScooters: number,
  truckConfigs: TruckConfig[]
): {
  trucks: { truck: TruckConfig; count: number }[];
  totalCapacity: number;
} {
  if (totalScooters <= 0) {
    return {
      trucks: [{ truck: truckConfigs[0], count: 1 }],
      totalCapacity: truckConfigs[0]?.capacity || 12,
    };
  }

  // Sort descending: 55, 32, 12
  const sorted = [...truckConfigs].sort((a, b) => b.capacity - a.capacity);
  let remaining = totalScooters;
  const result: { truck: TruckConfig; count: number }[] = [];
  let totalCapacity = 0;

  for (const truck of sorted) {
    if (remaining >= truck.capacity) {
      const count = Math.floor(remaining / truck.capacity);
      result.push({ truck, count });
      remaining -= count * truck.capacity;
      totalCapacity += count * truck.capacity;
    }
  }

  if (remaining > 0) {
    const ascending = [...truckConfigs].sort((a, b) => a.capacity - b.capacity);
    const chosen = ascending.find((t) => t.capacity >= remaining) || sorted[0];
    const existing = result.find((r) => r.truck.id === chosen.id);
    if (existing) {
      existing.count += 1;
    } else {
      result.push({ truck: chosen, count: 1 });
    }
    totalCapacity += chosen.capacity;
  }

  return {
    trucks: result,
    totalCapacity,
  };
}
