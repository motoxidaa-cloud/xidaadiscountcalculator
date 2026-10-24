export type ModelCategory = 'DL Model' | 'Other Model';

export type BatteryVariant = 
  | '60V 30Ah LFP'
  | '60V 45Ah LFP'
  | '60V 55Ah pouch cell';

export type DiscountAllocationOption = 
  | 'Scooty/Battery Discount' 
  | 'Transport Support' 
  | 'No Discount / Support';

export type TransportAllocationMode = 
  | DiscountAllocationOption
  | 'Automatic' 
  | 'Full Scooter Discount' 
  | 'Share Transport';

export type GstTreatment = 'None' | 'Exclusive' | 'Inclusive';

export type ProfitScenarioId = 'scenario-a' | 'scenario-b' | 'scenario-c' | 'scenario-d';

export type ProfitabilityStatus = 'Verified' | 'Below Target' | 'Not Verified';

export interface ProfitabilityInput {
  scooterUnitCost?: number; // Company cost per scooter
  totalScooterCost?: number; // Total scooter manufacturing/procurement cost override
  defaultScooterSellingPrice?: number; // Default selling price per scooter (if not set on item rows)
  batteryUnitCost?: number; // Company cost per battery
  totalBatteryCost?: number; // Total battery manufacturing/procurement cost override
  defaultBatterySellingPrice?: number; // Default selling price per battery
  otherCompanyCosts?: number; // Any additional company-borne order costs
  minProfitType?: 'amount' | 'margin_percent'; // Target metric
  minProfitAmount?: number; // in ₹ (e.g. 50000)
  minProfitMarginPercent?: number; // in % (e.g. 10%)
}

export interface ProfitScenario {
  id: ProfitScenarioId;
  name: string;
  tagline: string;
  description: string;
  scooterDiscountApplied: number;
  batteryDiscountApplied: number;
  companyTransportSupport: number;
  customerTransportPayment: number;
  totalDiscountBenefit: number;
  remainingScooterDiscount: number;
  companyProfit: number | null;
  profitMarginPercent: number | null;
  isValid: boolean;
  meetsProfitTarget: boolean | null;
  profitShortfall?: number;
  status: ProfitabilityStatus;
  statusMessage: string;
}

export interface ProfitProtectionResult {
  status: ProfitabilityStatus;
  hasCostData: boolean;
  missingDataReasons: string[];
  scenarios: ProfitScenario[];
  recommendedScenarioId: ProfitScenarioId;
  recommendationReason: string;
  bestOptionTitle?: string; // e.g. 'Best Option for Xidaa: Scooter Discount' | 'Best Option for Xidaa: 50% Transport Support'
  profitDifference?: number | null; // Estimated company profit difference between Option A and Option B
  selectedScenarioId: ProfitScenarioId;
  activeScenario: ProfitScenario;
  minProfitRequirementText: string;
  targetProfitAmount: number | null;
  targetProfitMarginPercent: number | null;
  grossScooterRevenue: number | null;
  grossBatteryRevenue: number | null;
  totalScooterCost: number | null;
  totalBatteryCost: number | null;
  totalCompanyCost: number | null;
  otherCompanyCosts: number;
  gstTransportTreatment: 'recoverable' | 'cost';
}

export interface ScooterModel {
  id: string;
  name: string;
  defaultCategory: ModelCategory;
  defaultPriceWithoutBattery: number;
  pricesWithBattery: Record<BatteryVariant, number>;
  description?: string;
  tag?: string;
}

export interface TruckConfig {
  id: string;
  name: string;
  capacity: number; // e.g. 12, 32, 55
  ratePerKm: number; // e.g. 40, 55, 65
}

export interface ScooterOrderItem {
  id: string;
  modelId: string;
  modelName: string;
  category: ModelCategory;
  quantity: number;
  unitPrice?: number; // Optional until calculating final payable amount
}

export interface BatteryOrderItem {
  id: string;
  variant: BatteryVariant;
  quantity: number;
  unitPrice?: number; // Optional
  eligibleDiscountQuantity: number; // Default = quantity, editable
}

export interface TruckAllocationItem {
  truckId: string;
  truckName: string;
  capacity: number;
  ratePerKm: number;
  count: number;
}

export interface AppConfig {
  discountRates: {
    dlModelMaxDiscount: number; // default: 500
    otherModelMaxDiscount: number; // default: 1000
    batteryMaxDiscount: number; // default: 500
  };
  transportRates: TruckConfig[];
  modelCategoryOverrides: Record<string, ModelCategory>;
  customModelPrices: Record<string, number>;
  transportSharing: {
    enabled: boolean;
    companySharePercent: number; // default 50
    strictEligibilityCheck: boolean; // default true
  };
  transportSettings: {
    extraChargePercent: number; // default: 10
    transportGstPercent: number; // default: 5
  };
  taxSettings: {
    gstTreatment: GstTreatment;
    gstRatePercent: number; // default 5 for EV
  };
  profitProtectionConfig?: {
    enabled: boolean;
    defaultMinProfitType: 'amount' | 'margin_percent';
    defaultMinProfitAmount: number; // default e.g. 50000
    defaultMinProfitMarginPercent: number; // default e.g. 10
    gstRecoverable: boolean; // default true
  };
}

export interface OrderInput {
  customerName: string;
  orderRef: string;
  orderDate: string;
  scooterItems: ScooterOrderItem[];
  batteryIncluded: boolean;
  batteryItems: BatteryOrderItem[];
  transportDistanceKm: number;
  truckAllocations: TruckAllocationItem[];
  allocationMode: TransportAllocationMode;
  notes?: string;
  profitabilityInput?: ProfitabilityInput;
  selectedScenarioId?: ProfitScenarioId;
}

export interface CalculationResult {
  // Quantities & Counts
  totalDlScooters: number;
  totalOtherScooters: number;
  totalScooters: number;
  totalBatteries: number;
  batteryBreakdown: { variant: BatteryVariant; quantity: number }[];

  // Discount Allowances
  scooterDiscountAllowance: number;
  batteryDiscountAllowance: number;
  totalDiscountAllowance: number;

  // Transport Details
  baseTransportCost: number;
  transportExtraPercent: number;
  transportExtraCharge: number;
  transportSubtotal: number;
  transportGstPercent: number;
  transportGstAmount: number;
  totalTransportCost: number; // Final Transport Cost = Subtotal + GST
  halfTransportCost: number;
  transportCostPerScooter: number | null; // Final Transport Cost ÷ Total Scooters
  customerTransportPerScooter: number | null; // Customer Transport Payment ÷ Total Scooters
  totalCapacity: number;
  truckSummary: string;

  // Single-Component Discount / Transport Support Settlement
  allocationOption: DiscountAllocationOption;
  transportSharingEligible: boolean;
  transportSharingApplied: boolean;
  companyTransportSupport: number;
  customerTransportPayment: number;
  actualScooterDiscountApplied: number;
  actualBatteryDiscountApplied: number;
  scooterBatteryDiscountApplied: number; // Total Scooter + Battery Discount Applied
  remainingScooterDiscount: number;
  totalCustomerDiscountBenefit: number;

  // Pricing & Final Payable
  hasAllPrices: boolean;
  missingPriceReason?: string;
  missingPriceItems?: string[]; // Specific model/battery names needing unit prices
  grossScooterAmount: number | null;
  grossBatteryAmount: number | null;
  totalProductInvoiceAmount: number | null; // Gross Scooter + Gross Battery Amount
  grossTotalAmount: number | null;
  subtotalBeforeTax: number | null;
  gstAmount: number | null;
  finalPayableAmount: number | null;
  gstTreatment: GstTreatment;
  gstRatePercent: number;

  // Status & Guidance
  effectiveAllocationMode: TransportAllocationMode;
  eligibilityMessage: string;
  warningMessage?: string;
  suggestedMode?: TransportAllocationMode;

  // Step by step breakdown for audit
  auditTrail: {
    step: string;
    description: string;
    formula: string;
    amount?: number | null;
  }[];

  // Smart Profit Protection Engine Result
  profitProtection: ProfitProtectionResult;
}

export interface SavedOrder {
  id: string;
  createdAt: string;
  updatedAt: string;
  orderInput: OrderInput;
  calculationResult: CalculationResult;
}
