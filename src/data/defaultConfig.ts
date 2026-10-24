import type { AppConfig, TruckConfig } from '../types';

export const DEFAULT_TRUCK_CONFIGS: TruckConfig[] = [
  {
    id: 'truck-12',
    name: '12-Scooter Truck (Small Fleet)',
    capacity: 12,
    ratePerKm: 40,
  },
  {
    id: 'truck-32',
    name: '32-Scooter Truck (Medium Fleet)',
    capacity: 32,
    ratePerKm: 55,
  },
  {
    id: 'truck-55',
    name: '55-Scooter Truck (Large Fleet / Trailer)',
    capacity: 55,
    ratePerKm: 65,
  },
];

export const DEFAULT_APP_CONFIG: AppConfig = {
  discountRates: {
    dlModelMaxDiscount: 500,
    otherModelMaxDiscount: 1000,
    batteryMaxDiscount: 500,
  },
  transportRates: DEFAULT_TRUCK_CONFIGS,
  modelCategoryOverrides: {},
  customModelPrices: {},
  transportSharing: {
    enabled: true,
    companySharePercent: 50,
    strictEligibilityCheck: true,
  },
  transportSettings: {
    extraChargePercent: 10,
    transportGstPercent: 5,
  },
  taxSettings: {
    gstTreatment: 'None',
    gstRatePercent: 5,
  },
  profitProtectionConfig: {
    enabled: true,
    defaultMinProfitType: 'margin_percent',
    defaultMinProfitAmount: 30000,
    defaultMinProfitMarginPercent: 10,
    gstRecoverable: true,
  },
};
