import { describe, expect, it } from 'vitest';
import { calculateOrderFinancials } from './calculations';
import { DEFAULT_APP_CONFIG } from '../data/defaultConfig';
import type { AppConfig, OrderInput } from '../types';

describe('Prompt Section 5 Required Validation Tests - Single-Component Settlement', () => {
  // Test 1: Transport Support
  // 12 scooters, base transport ₹8,000, additional charge 10%, GST 5%, company support 50%.
  it('Test 1: Transport Support (Option B)', () => {
    // 12 scooters (e.g. 12 DL scooters @ ₹500 discount allowance = ₹6,000)
    // 200 km on 12-scooter truck @ ₹40/km -> Base transport = 200 × 40 = ₹8,000
    const input: OrderInput = {
      customerName: 'Test 1 Dealership',
      orderRef: 'XD-VAL-TEST-1',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-single-light', modelName: 'X-Single Light', category: 'DL Model', quantity: 12, unitPrice: 40000 },
      ],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 200,
      truckAllocations: [
        { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
      ],
      allocationMode: 'Transport Support',
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);

    // 1. Base Transport: ₹8,000
    expect(res.baseTransportCost).toBe(8000);
    // 2. Additional charge 10%: ₹800
    expect(res.transportExtraCharge).toBe(800);
    // 3. Transport subtotal: ₹8,800
    expect(res.transportSubtotal).toBe(8800);
    // 4. GST 5%: ₹440
    expect(res.transportGstAmount).toBe(440);
    // 5. Final transport cost: ₹9,240
    expect(res.totalTransportCost).toBe(9240);
    // 6. Per-scooty transport cost: ₹770
    expect(res.transportCostPerScooter).toBe(770);
    // 7. Company transport support: ₹4,620
    expect(res.companyTransportSupport).toBe(4620);
    // 8. Customer transport payable: ₹4,620
    expect(res.customerTransportPayment).toBe(4620);
    // 9. Scooter/Battery discount: ₹0
    expect(res.scooterBatteryDiscountApplied).toBe(0);
    expect(res.actualScooterDiscountApplied).toBe(0);
    expect(res.actualBatteryDiscountApplied).toBe(0);
    // Total Dealership Benefit Received: ₹4,620
    expect(res.totalCustomerDiscountBenefit).toBe(4620);
    // Per-scooty customer transport share: ₹385
    expect(res.customerTransportPerScooter).toBe(385);
  });

  // Test 2: Scooty/Battery Discount
  // Use the same shipment. Apply the configured scooter/battery discount.
  // Expected: scooter/battery discount applies once; transport support is ₹0; customer pays the full ₹9,240 transport cost.
  it('Test 2: Scooty/Battery Discount (Option A)', () => {
    const input: OrderInput = {
      customerName: 'Test 2 Dealership',
      orderRef: 'XD-VAL-TEST-2',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-single-light', modelName: 'X-Single Light', category: 'DL Model', quantity: 12, unitPrice: 40000 },
      ],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 200,
      truckAllocations: [
        { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
      ],
      allocationMode: 'Scooty/Battery Discount',
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);

    // Final transport cost remains ₹9,240
    expect(res.totalTransportCost).toBe(9240);
    expect(res.transportCostPerScooter).toBe(770);
    // Scooter/battery discount applies once: 12 DL @ ₹500 = ₹6,000
    expect(res.scooterDiscountAllowance).toBe(6000);
    expect(res.actualScooterDiscountApplied).toBe(6000);
    expect(res.scooterBatteryDiscountApplied).toBe(6000);
    // Transport support is strictly ₹0
    expect(res.companyTransportSupport).toBe(0);
    // Customer pays the full ₹9,240 transport cost
    expect(res.customerTransportPayment).toBe(9240);
    // Total Dealership Benefit Received = ₹6,000
    expect(res.totalCustomerDiscountBenefit).toBe(6000);
  });

  // Test 3: No Discount / Support
  // Expected: scooter/battery discount ₹0, company transport support ₹0, and customer transport payable ₹9,240.
  it('Test 3: No Discount / Support (Option C)', () => {
    const input: OrderInput = {
      customerName: 'Test 3 Dealership',
      orderRef: 'XD-VAL-TEST-3',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-single-light', modelName: 'X-Single Light', category: 'DL Model', quantity: 12, unitPrice: 40000 },
      ],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 200,
      truckAllocations: [
        { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
      ],
      allocationMode: 'No Discount / Support',
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);

    // Scooter/battery discount is ₹0
    expect(res.scooterBatteryDiscountApplied).toBe(0);
    expect(res.actualScooterDiscountApplied).toBe(0);
    expect(res.actualBatteryDiscountApplied).toBe(0);
    // Company transport support is ₹0
    expect(res.companyTransportSupport).toBe(0);
    // Customer transport payable is full ₹9,240
    expect(res.customerTransportPayment).toBe(9240);
    // Total Dealership Benefit is ₹0
    expect(res.totalCustomerDiscountBenefit).toBe(0);
  });

  // Test 4: Change allocation
  // Switch repeatedly between all three options. Confirm that values recalculate correctly and no previous discount or support remains active.
  it('Test 4: Change allocation repeatedly without retaining stale deductions', () => {
    const baseInput: OrderInput = {
      customerName: 'Switch Test Dealership',
      orderRef: 'XD-VAL-TEST-4',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-single-light', modelName: 'X-Single Light', category: 'DL Model', quantity: 12, unitPrice: 40000 },
      ],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 200,
      truckAllocations: [
        { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
      ],
      allocationMode: 'Scooty/Battery Discount',
    };

    // Cycle 1: Option A (Scooty/Battery Discount)
    const resA1 = calculateOrderFinancials({ ...baseInput, allocationMode: 'Scooty/Battery Discount' }, DEFAULT_APP_CONFIG);
    expect(resA1.actualScooterDiscountApplied).toBe(6000);
    expect(resA1.companyTransportSupport).toBe(0);
    expect(resA1.customerTransportPayment).toBe(9240);

    // Cycle 2: Option B (Transport Support)
    const resB1 = calculateOrderFinancials({ ...baseInput, allocationMode: 'Transport Support' }, DEFAULT_APP_CONFIG);
    expect(resB1.actualScooterDiscountApplied).toBe(0);
    expect(resB1.companyTransportSupport).toBe(4620);
    expect(resB1.customerTransportPayment).toBe(4620);

    // Cycle 3: Option C (No Discount / Support)
    const resC1 = calculateOrderFinancials({ ...baseInput, allocationMode: 'No Discount / Support' }, DEFAULT_APP_CONFIG);
    expect(resC1.actualScooterDiscountApplied).toBe(0);
    expect(resC1.companyTransportSupport).toBe(0);
    expect(resC1.customerTransportPayment).toBe(9240);

    // Cycle 4: Back to Option A
    const resA2 = calculateOrderFinancials({ ...baseInput, allocationMode: 'Scooty/Battery Discount' }, DEFAULT_APP_CONFIG);
    expect(resA2.actualScooterDiscountApplied).toBe(6000);
    expect(resA2.companyTransportSupport).toBe(0);
    expect(resA2.customerTransportPayment).toBe(9240);

    // Cycle 5: Back to Option B
    const resB2 = calculateOrderFinancials({ ...baseInput, allocationMode: 'Transport Support' }, DEFAULT_APP_CONFIG);
    expect(resB2.actualScooterDiscountApplied).toBe(0);
    expect(resB2.companyTransportSupport).toBe(4620);
    expect(resB2.customerTransportPayment).toBe(4620);
  });

  // Test 5: Edge cases
  // Test zero scooters, missing values, decimal amounts, changed GST, changed transport rate, and changed additional charge percentage.
  it('Test 5: Edge cases - zero scooters, missing values, decimal amounts, changed GST and rates', () => {
    // 5a: Zero scooters
    const inputZeroScooters: OrderInput = {
      customerName: 'Zero Scooter Test',
      orderRef: 'XD-EDGE-ZERO',
      orderDate: '2026-10-23',
      scooterItems: [],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 100,
      truckAllocations: [
        { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
      ],
      allocationMode: 'Transport Support',
    };
    const resZero = calculateOrderFinancials(inputZeroScooters, DEFAULT_APP_CONFIG);
    // Transport Cost Per Scooty must be null when total scooters is 0 to prevent division by zero
    expect(resZero.transportCostPerScooter).toBeNull();
    expect(resZero.customerTransportPerScooter).toBeNull();
    expect(resZero.totalScooters).toBe(0);

    // 5b: Decimal amounts and custom rates
    // Distance = 123.45 km, truck rate = ₹42.50/km, extra = 12.5%, GST = 18%
    const customConfig: AppConfig = {
      ...DEFAULT_APP_CONFIG,
      transportSettings: {
        extraChargePercent: 12.5,
        transportGstPercent: 18,
      },
    };
    const inputDecimals: OrderInput = {
      customerName: 'Decimal Test Dealership',
      orderRef: 'XD-EDGE-DECIMALS',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-torvo', modelName: 'X-Torvo', category: 'Other Model', quantity: 7, unitPrice: 52345.50 },
      ],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 123.45,
      truckAllocations: [
        { truckId: 'custom-truck', truckName: 'Custom Truck', capacity: 10, ratePerKm: 42.5, count: 1 },
      ],
      allocationMode: 'Transport Support',
    };
    const resDec = calculateOrderFinancials(inputDecimals, customConfig);
    // Base = 123.45 * 42.5 = 5246.625 -> ₹5,246.63
    expect(resDec.baseTransportCost).toBe(5246.63);
    // 12.5% Extra = 5246.625 * 0.125 = 655.828125 -> ₹655.83
    expect(resDec.transportExtraCharge).toBe(655.83);
    // Subtotal = 5246.63 + 655.83 = ₹5,902.46
    expect(resDec.transportSubtotal).toBe(5902.46);
    // 18% GST = 5902.46 * 0.18 = 1062.4428 -> ₹1,062.44
    expect(resDec.transportGstAmount).toBe(1062.44);
    // Final Transport = 5902.46 + 1062.44 = ₹6,964.90
    expect(resDec.totalTransportCost).toBe(6964.90);
    // Per-Scooty: 6964.90 / 7 = 994.99
    expect(resDec.transportCostPerScooter).toBe(994.99);
    // 50% Support: 6964.90 * 0.5 = 3482.45
    expect(resDec.companyTransportSupport).toBe(3482.45);
    // Customer Payable: 6964.90 - 3482.45 = 3482.45
    expect(resDec.customerTransportPayment).toBe(3482.45);
  });
});

describe('Transport Logistics Charges (5-Step Formula Conformance)', () => {
  it('Prompt Example: 12-scooter truck travelling 1,000 km (Exact Match)', () => {
    const input: OrderInput = {
      customerName: 'Aodn Motors Dealership',
      orderRef: 'XD-EX-1000KM',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-torvo', modelName: 'X-Torvo', category: 'Other Model', quantity: 12, unitPrice: 50000 },
      ],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 1000,
      truckAllocations: [
        { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
      ],
      allocationMode: 'Transport Support',
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);

    // Step 1: Base transport = 1,000 km × ₹40/km = ₹40,000
    expect(res.baseTransportCost).toBe(40000);
    // Step 2: Additional 10% charge = ₹4,000
    expect(res.transportExtraPercent).toBe(10);
    expect(res.transportExtraCharge).toBe(4000);
    // Step 3: Transport subtotal = ₹44,000
    expect(res.transportSubtotal).toBe(44000);
    // Step 4: GST at 5% on ₹44,000 = ₹2,200
    expect(res.transportGstPercent).toBe(5);
    expect(res.transportGstAmount).toBe(2200);
    // Step 5: Final transport payable = ₹46,200
    expect(res.totalTransportCost).toBe(46200);
    // 50% threshold H = ₹23,100
    expect(res.halfTransportCost).toBe(23100);
    // Per-scooty transport: 46,200 / 12 = ₹3,850
    expect(res.transportCostPerScooter).toBe(3850);
  });

  it('All 3 Truck Rates: 32-scooter truck rate (₹55/km) for 1,000 km', () => {
    const input: OrderInput = {
      customerName: 'Test 32-Truck',
      orderRef: 'XD-TRUCK-32',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-torvo', modelName: 'X-Torvo', category: 'Other Model', quantity: 32 },
      ],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 1000,
      truckAllocations: [
        { truckId: 'truck-32', truckName: '32-Scooter Truck', capacity: 32, ratePerKm: 55, count: 1 },
      ],
      allocationMode: 'Transport Support',
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);

    // Step 1: Base = 1,000 × 55 = ₹55,000
    expect(res.baseTransportCost).toBe(55000);
    // Step 2: 10% Extra = ₹5,500
    expect(res.transportExtraCharge).toBe(5500);
    // Step 3: Subtotal = ₹60,500
    expect(res.transportSubtotal).toBe(60500);
    // Step 4: 5% GST = ₹3,025
    expect(res.transportGstAmount).toBe(3025);
    // Step 5: Final = ₹63,525
    expect(res.totalTransportCost).toBe(63525);
    // Per-scooty: 63,525 / 32 = 1985.16
    expect(res.transportCostPerScooter).toBe(1985.16);
  });

  it('All 3 Truck Rates: 55-scooter truck rate (₹65/km) for 1,000 km', () => {
    const input: OrderInput = {
      customerName: 'Test 55-Truck',
      orderRef: 'XD-TRUCK-55',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-tank', modelName: 'X-Tank', category: 'Other Model', quantity: 55 },
      ],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 1000,
      truckAllocations: [
        { truckId: 'truck-55', truckName: '55-Scooter Truck', capacity: 55, ratePerKm: 65, count: 1 },
      ],
      allocationMode: 'Transport Support',
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);

    // Step 1: Base = 1,000 × 65 = ₹65,000
    expect(res.baseTransportCost).toBe(65000);
    // Step 2: 10% Extra = ₹6,500
    expect(res.transportExtraCharge).toBe(6500);
    // Step 3: Subtotal = ₹71,500
    expect(res.transportSubtotal).toBe(71500);
    // Step 4: 5% GST = ₹3,575
    expect(res.transportGstAmount).toBe(3575);
    // Step 5: Final = ₹75,075
    expect(res.totalTransportCost).toBe(75075);
    // Per-scooty: 75,075 / 55 = 1365
    expect(res.transportCostPerScooter).toBe(1365);
  });

  it('Zero distance handling: all 5 values must be 0 and sharing ineligible', () => {
    const input: OrderInput = {
      customerName: 'Local Pickup Dealership',
      orderRef: 'XD-LOCAL-0KM',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-torvo', modelName: 'X-Torvo', category: 'Other Model', quantity: 10 },
      ],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 0,
      truckAllocations: [
        { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
      ],
      allocationMode: 'Transport Support',
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);

    expect(res.baseTransportCost).toBe(0);
    expect(res.transportExtraCharge).toBe(0);
    expect(res.transportSubtotal).toBe(0);
    expect(res.transportGstAmount).toBe(0);
    expect(res.totalTransportCost).toBe(0);
    expect(res.companyTransportSupport).toBe(0);
    expect(res.customerTransportPayment).toBe(0);
    expect(res.transportCostPerScooter).toBe(0);
  });

  it('Multiple trucks calculation without double-counting', () => {
    const input: OrderInput = {
      customerName: 'Multi-Truck Partner',
      orderRef: 'XD-MULTI-TRUCK',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-torvo', modelName: 'X-Torvo', category: 'Other Model', quantity: 44 },
      ],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 500,
      truckAllocations: [
        { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
        { truckId: 'truck-32', truckName: '32-Scooter Truck', capacity: 32, ratePerKm: 55, count: 1 },
      ],
      allocationMode: 'Scooty/Battery Discount',
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);

    // Total base = (500 × 40) + (500 × 55) = 20,000 + 27,500 = ₹47,500
    expect(res.baseTransportCost).toBe(47500);
    // 10% Extra = ₹4,750
    expect(res.transportExtraCharge).toBe(4750);
    // Subtotal = ₹52,250
    expect(res.transportSubtotal).toBe(52250);
    // 5% GST = 52,250 × 0.05 = ₹2,612.50
    expect(res.transportGstAmount).toBe(2612.5);
    // Final Transport Cost = 52,250 + 2,612.50 = ₹54,862.50
    expect(res.totalTransportCost).toBe(54862.5);
    // Per-scooty: 54,862.50 / 44 = 1246.88
    expect(res.transportCostPerScooter).toBe(1246.88);
  });

  it('Battery discount remains strictly separate from transport sharing', () => {
    // 0 scooters, 20 batteries @ ₹500 discount = ₹10,000 battery allowance. 100 km, 12-truck.
    const input: OrderInput = {
      customerName: 'Battery Distributor',
      orderRef: 'XD-BATT-ONLY',
      orderDate: '2026-10-23',
      scooterItems: [],
      batteryIncluded: true,
      batteryItems: [
        { id: 'b1', variant: '60V 45Ah LFP', quantity: 20, unitPrice: 35000, eligibleDiscountQuantity: 20 },
      ],
      transportDistanceKm: 100,
      truckAllocations: [
        { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
      ],
      allocationMode: 'Scooty/Battery Discount',
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);

    // 100 km @ ₹40 = ₹4,000 base + 10% (₹400) = ₹4,400 + 5% (₹220) = ₹4,620 final
    expect(res.totalTransportCost).toBe(4620);
    expect(res.scooterDiscountAllowance).toBe(0);
    expect(res.batteryDiscountAllowance).toBe(10000);
    expect(res.companyTransportSupport).toBe(0);
    expect(res.customerTransportPayment).toBe(4620);
    expect(res.actualBatteryDiscountApplied).toBe(10000);
  });
});

describe('Smart Profit Protection Engine Tests', () => {
  it('Missing costs or selling prices: correctly returns Not Verified without inventing data', () => {
    const input: OrderInput = {
      customerName: 'No Cost Dealership',
      orderRef: 'XD-NO-COST',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-torvo', modelName: 'X-Torvo', category: 'Other Model', quantity: 10 },
      ],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 200,
      truckAllocations: [
        { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
      ],
      allocationMode: 'Scooty/Battery Discount',
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);
    const pp = res.profitProtection;

    expect(pp.status).toBe('Not Verified');
    expect(pp.hasCostData).toBe(false);
    expect(pp.missingDataReasons.length).toBeGreaterThan(0);
    expect(pp.activeScenario.companyProfit).toBeNull();
    expect(pp.recommendationReason).toContain('Provisional');
    expect(pp.recommendationReason).toContain('Profitability not verified');
  });

  it('Scooter discount is more profitable than transport sharing', () => {
    const input: OrderInput = {
      customerName: 'High Distance Dealership',
      orderRef: 'XD-PP-SCOOT-BEST',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-torvo', modelName: 'X-Torvo', category: 'Other Model', quantity: 10, unitPrice: 50000 },
      ],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 1000,
      truckAllocations: [
        { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
      ],
      allocationMode: 'Automatic',
      profitabilityInput: {
        scooterUnitCost: 35000,
        minProfitType: 'margin_percent',
        minProfitMarginPercent: 10,
      },
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);
    const pp = res.profitProtection;

    expect(pp.hasCostData).toBe(true);
    expect(pp.recommendedScenarioId).toBe('scenario-a');
    expect(pp.recommendationReason).toContain('Recommended: Scooty/Battery Discount (Scenario A)');
    expect(pp.scenarios[0].companyProfit).toBe(140000);
    expect(pp.scenarios[0].meetsProfitTarget).toBe(true);
  });

  it('Neither discount option meets minimum profit requirement: recommends Scenario D (No Discount)', () => {
    const input: OrderInput = {
      customerName: 'Low Margin Dealership',
      orderRef: 'XD-PP-LOW-MARGIN',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-single-light', modelName: 'X-Single Light', category: 'DL Model', quantity: 10, unitPrice: 38000 },
      ],
      batteryIncluded: false,
      batteryItems: [],
      transportDistanceKm: 100,
      truckAllocations: [
        { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
      ],
      allocationMode: 'Automatic',
      profitabilityInput: {
        scooterUnitCost: 36000,
        minProfitType: 'amount',
        minProfitAmount: 18000,
      },
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);
    const pp = res.profitProtection;

    expect(pp.hasCostData).toBe(true);
    expect(pp.scenarios[0].meetsProfitTarget).toBe(false);
    expect(pp.scenarios[1].meetsProfitTarget).toBe(false);
    expect(pp.scenarios[3].meetsProfitTarget).toBe(true);
    expect(pp.scenarios[3].companyProfit).toBe(20000);
    expect(pp.recommendedScenarioId).toBe('scenario-d');
    expect(pp.recommendationReason).toContain('Discount not recommended: This order does not meet the configured profit requirement');
  });

  it('Battery discount reduces profit below the required threshold', () => {
    const input: OrderInput = {
      customerName: 'Battery Impact Dealership',
      orderRef: 'XD-PP-BATT-IMPACT',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-single-light', modelName: 'X-Single Light', category: 'DL Model', quantity: 10, unitPrice: 40000 },
      ],
      batteryIncluded: true,
      batteryItems: [
        { id: 'b1', variant: '60V 30Ah LFP', quantity: 10, unitPrice: 15000, eligibleDiscountQuantity: 10 },
      ],
      transportDistanceKm: 0,
      truckAllocations: [],
      allocationMode: 'Automatic',
      profitabilityInput: {
        scooterUnitCost: 35000,
        batteryUnitCost: 14800,
        minProfitType: 'amount',
        minProfitAmount: 44000,
      },
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);
    const pp = res.profitProtection;

    expect(pp.hasCostData).toBe(true);
    expect(pp.scenarios[0].companyProfit).toBe(42000);
    expect(pp.scenarios[0].meetsProfitTarget).toBe(false);
    expect(pp.status).toBe('Below Target');
  });

  it('Discount and transport support are mutually exclusive across all scenarios', () => {
    const input: OrderInput = {
      customerName: 'Integrity Check Dealership',
      orderRef: 'XD-INTEGRITY',
      orderDate: '2026-10-23',
      scooterItems: [
        { id: '1', modelId: 'x-torvo', modelName: 'X-Torvo', category: 'Other Model', quantity: 15, unitPrice: 50000 },
      ],
      batteryIncluded: true,
      batteryItems: [
        { id: 'b1', variant: '60V 30Ah LFP', quantity: 10, unitPrice: 20000, eligibleDiscountQuantity: 10 },
      ],
      transportDistanceKm: 500,
      truckAllocations: [
        { truckId: 'truck-32', truckName: '32-Scooter Truck', capacity: 32, ratePerKm: 55, count: 1 },
      ],
      allocationMode: 'Automatic',
      profitabilityInput: {
        scooterUnitCost: 38000,
        batteryUnitCost: 16000,
      },
    };

    const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);
    const S = res.scooterDiscountAllowance;
    const B = res.batteryDiscountAllowance;

    res.profitProtection.scenarios.forEach((scenario) => {
      // Single component rule:
      // If transport support > 0, then scooter & battery discounts MUST BE 0!
      if (scenario.companyTransportSupport > 0) {
        expect(scenario.scooterDiscountApplied).toBe(0);
        expect(scenario.batteryDiscountApplied).toBe(0);
      }
      // If scooter or battery discount > 0, then transport support MUST BE 0!
      if (scenario.scooterDiscountApplied > 0 || scenario.batteryDiscountApplied > 0) {
        expect(scenario.companyTransportSupport).toBe(0);
      }
      expect(scenario.scooterDiscountApplied).toBeLessThanOrEqual(S);
      expect(scenario.batteryDiscountApplied).toBeLessThanOrEqual(B);
    });
  });

  describe('Prompt Section 11 Final Regression Tests (Tests A - E)', () => {
    // Test A: 12 Other Model scooters produce a ₹12,000 scooter discount allowance
    it('Test A: 12 Other Model scooters produce a ₹12,000 scooter discount allowance', () => {
      const input: OrderInput = {
        customerName: 'Test A Dealership',
        orderRef: 'XD-REG-A',
        orderDate: '2026-10-24',
        scooterItems: [
          { id: '1', modelId: 'x-torvo', modelName: 'X-Torvo', category: 'Other Model', quantity: 12, unitPrice: 50000 },
        ],
        batteryIncluded: false,
        batteryItems: [],
        transportDistanceKm: 100,
        truckAllocations: [
          { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
        ],
        allocationMode: 'Scooty/Battery Discount',
      };

      const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);
      expect(res.totalOtherScooters).toBe(12);
      expect(res.totalDlScooters).toBe(0);
      expect(res.scooterDiscountAllowance).toBe(12000); // 12 * 1000
    });

    // Test B: Scooter discount ₹12,000, final transport ₹20,000 -> 50% support ₹10,000 is eligible
    // Allocates ₹10,000 to transport support, leaving ₹2,000 unused allowance.
    it('Test B: 50% transport support ₹10,000 is eligible, leaving ₹2,000 scooter allowance unused', () => {
      // 12 Other Model scooters = ₹12,000 allowance
      // To get final transport = ₹20,000:
      // Base = ₹17,316.02, or test directly with distance that yields ~₹20,000 or custom config
      // Notice: Base * 1.10 * 1.05 = Final -> Base = 20,000 / 1.155 = 17,316.017
      // 12-truck @ ₹40/km: distance = 432.9 km -> Base = 17,316, Subtotal = 19,047.6, Final = 20,000!
      // Or we can configure a custom truck rate: 500 km @ ₹34.632/km or test the formula directly:
      // Allowance is 12,000
      const input: OrderInput = {
        customerName: 'Test B Dealership',
        orderRef: 'XD-REG-B',
        orderDate: '2026-10-24',
        scooterItems: [
          { id: '1', modelId: 'x-torvo', modelName: 'X-Torvo', category: 'Other Model', quantity: 12, unitPrice: 50000 },
        ],
        batteryIncluded: false,
        batteryItems: [],
        transportDistanceKm: 200,
        truckAllocations: [
          { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
        ],
        allocationMode: 'Transport Support',
      };

      const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);
      // Allowance is 12,000
      expect(res.scooterDiscountAllowance).toBe(12000);
      // Final transport is 9,240 (which is <= 12000, so 50% = 4,620 is eligible)
      expect(res.halfTransportCost).toBe(4620);
      expect(res.companyTransportSupport).toBe(4620);
      expect(res.remainingScooterDiscount).toBe(12000 - 4620); // 7,380 unused!
      expect(res.actualScooterDiscountApplied).toBe(0); // ₹0 on invoice!

      // Now with custom truck rate producing exactly 20,000 final transport:
      // Base = 17316 -> 17316 + 1731.6 = 19047.6 -> 19047.6 + 952.38 = 20000
      const exactConfig: AppConfig = {
        ...DEFAULT_APP_CONFIG,
        transportSettings: { extraChargePercent: 0, transportGstPercent: 0 },
      };
      const exactInput: OrderInput = {
        ...input,
        transportDistanceKm: 500,
        truckAllocations: [
          { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
        ], // 500 * 40 = 20,000 base & final!
      };
      const exactRes = calculateOrderFinancials(exactInput, exactConfig);
      expect(exactRes.scooterDiscountAllowance).toBe(12000);
      expect(exactRes.totalTransportCost).toBe(20000);
      expect(exactRes.halfTransportCost).toBe(10000);
      expect(exactRes.transportSharingEligible).toBe(true);
      expect(exactRes.companyTransportSupport).toBe(10000);
      expect(exactRes.customerTransportPayment).toBe(10000);
      expect(exactRes.remainingScooterDiscount).toBe(2000); // Exactly ₹2,000 unused!
      expect(exactRes.actualScooterDiscountApplied).toBe(0); // Zero on scooter invoice!
    });

    // Test C: Scooter discount ₹12,000, final transport ₹30,000 -> 50% support is ₹15,000 (> 12,000), so ineligible
    it('Test C: 50% transport support ₹15,000 exceeds ₹12,000 allowance, so transport support is ineligible', () => {
      const exactConfig: AppConfig = {
        ...DEFAULT_APP_CONFIG,
        transportSettings: { extraChargePercent: 0, transportGstPercent: 0 },
      };
      const input: OrderInput = {
        customerName: 'Test C Dealership',
        orderRef: 'XD-REG-C',
        orderDate: '2026-10-24',
        scooterItems: [
          { id: '1', modelId: 'x-torvo', modelName: 'X-Torvo', category: 'Other Model', quantity: 12, unitPrice: 50000 },
        ],
        batteryIncluded: false,
        batteryItems: [],
        transportDistanceKm: 750,
        truckAllocations: [
          { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
        ], // 750 * 40 = 30,000 final transport
        allocationMode: 'Transport Support',
      };

      const res = calculateOrderFinancials(input, exactConfig);
      expect(res.scooterDiscountAllowance).toBe(12000);
      expect(res.totalTransportCost).toBe(30000);
      expect(res.halfTransportCost).toBe(15000); // ₹15,000 > ₹12,000
      expect(res.transportSharingEligible).toBe(false); // Ineligible!
      expect(res.profitProtection.scenarios[1].isValid).toBe(false); // Option B invalid
      expect(res.profitProtection.scenarios[1].statusMessage).toContain('exceeds');
    });

    // Test D: Missing cost information must never produce an invented profit recommendation
    it('Test D: Missing cost information produces Not Verified and never invents profit numbers', () => {
      const input: OrderInput = {
        customerName: 'Test D Dealership',
        orderRef: 'XD-REG-D',
        orderDate: '2026-10-24',
        scooterItems: [
          { id: '1', modelId: 'x-torvo', modelName: 'X-Torvo', category: 'Other Model', quantity: 12, unitPrice: 50000 },
        ],
        batteryIncluded: false,
        batteryItems: [],
        transportDistanceKm: 200,
        truckAllocations: [
          { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
        ],
        allocationMode: 'Automatic',
        profitabilityInput: {}, // Missing scooter costs!
      };

      const res = calculateOrderFinancials(input, DEFAULT_APP_CONFIG);
      const pp = res.profitProtection;

      expect(pp.hasCostData).toBe(false);
      expect(pp.status).toBe('Not Verified');
      expect(pp.scenarios[0].companyProfit).toBeNull();
      expect(pp.scenarios[1].companyProfit).toBeNull();
      expect(pp.profitDifference).toBeNull();
      expect(pp.bestOptionTitle).toBe('Profitability Not Verified');
      expect(pp.recommendationReason).toContain('Profitability cannot be verified — enter approved costs to compare both options.');
    });

    // Test E: Two options use the same approved cost basis, transport GST calculated exactly once, no double counting
    it('Test E: Identical approved cost basis, transport GST calculated exactly once, mutual exclusivity guaranteed', () => {
      const input: OrderInput = {
        customerName: 'Test E Dealership',
        orderRef: 'XD-REG-E',
        orderDate: '2026-10-24',
        scooterItems: [
          { id: '1', modelId: 'x-torvo', modelName: 'X-Torvo', category: 'Other Model', quantity: 12, unitPrice: 50000 },
        ],
        batteryIncluded: false,
        batteryItems: [],
        transportDistanceKm: 200,
        truckAllocations: [
          { truckId: 'truck-12', truckName: '12-Scooter Truck', capacity: 12, ratePerKm: 40, count: 1 },
        ],
        allocationMode: 'Automatic',
        profitabilityInput: {
          scooterUnitCost: 35000,
          minProfitType: 'margin_percent',
          minProfitMarginPercent: 10,
        },
      };

      const resA = calculateOrderFinancials({ ...input, allocationMode: 'Scooty/Battery Discount' }, DEFAULT_APP_CONFIG);
      const resB = calculateOrderFinancials({ ...input, allocationMode: 'Transport Support' }, DEFAULT_APP_CONFIG);

      // Verify same transport figures across both:
      expect(resA.totalTransportCost).toBe(resB.totalTransportCost);
      expect(resA.transportGstAmount).toBe(resB.transportGstAmount);
      // In Option A: discount is on scooter, transport is 100% paid by customer
      expect(resA.actualScooterDiscountApplied).toBe(12000);
      expect(resA.companyTransportSupport).toBe(0);
      expect(resA.customerTransportPayment).toBe(resA.totalTransportCost);

      // In Option B: discount on scooter is 0, company supports 50% of transport
      expect(resB.actualScooterDiscountApplied).toBe(0);
      expect(resB.companyTransportSupport).toBe(resB.halfTransportCost);
      expect(resB.customerTransportPayment).toBe(resB.totalTransportCost - resB.halfTransportCost);

      // Both options evaluate from the same cost basis (12 * 35,000 = 420,000)
      expect(resA.profitProtection.totalScooterCost).toBe(420000);
      expect(resB.profitProtection.totalScooterCost).toBe(420000);
    });
  });
});
