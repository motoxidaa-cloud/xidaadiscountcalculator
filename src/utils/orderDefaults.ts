import { CATALOGUE_SCOOTER_MODELS } from '../data/catalogueModels';
import type { AppConfig, OrderInput } from '../types';

export function generateOrderRef(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `XD-${dateStr}-${randomSuffix}`;
}

export function createDefaultOrderInput(config: AppConfig): OrderInput {
  const initialModel = CATALOGUE_SCOOTER_MODELS[0];
  const initialCategory = config.modelCategoryOverrides[initialModel.id] || initialModel.defaultCategory;

  return {
    customerName: '',
    orderRef: generateOrderRef(),
    orderDate: new Date().toISOString().slice(0, 10),
    scooterItems: [
      {
        id: `scoot-${Date.now()}-1`,
        modelId: initialModel.id,
        modelName: initialModel.name,
        category: initialCategory,
        quantity: 10,
        unitPrice: undefined,
      },
    ],
    batteryIncluded: false,
    batteryItems: [
      {
        id: `batt-${Date.now()}-1`,
        variant: '60V 30Ah LFP',
        quantity: 10,
        unitPrice: undefined,
        eligibleDiscountQuantity: 10,
      },
    ],
    transportDistanceKm: 250,
    truckAllocations: [
      {
        truckId: 'truck-12',
        truckName: '12-Scooter Truck',
        capacity: 12,
        ratePerKm: 40,
        count: 1,
      },
    ],
    allocationMode: 'Scooty/Battery Discount',
    notes: '',
    profitabilityInput: {
      minProfitType: config.profitProtectionConfig?.defaultMinProfitType ?? 'margin_percent',
      minProfitAmount: config.profitProtectionConfig?.defaultMinProfitAmount ?? 30000,
      minProfitMarginPercent: config.profitProtectionConfig?.defaultMinProfitMarginPercent ?? 10,
    },
    selectedScenarioId: 'scenario-a',
  };
}
