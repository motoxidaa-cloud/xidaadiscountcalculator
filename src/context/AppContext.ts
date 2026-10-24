import { createContext, useContext } from 'react';
import type { 
  AppConfig, 
  BatteryOrderItem, 
  CalculationResult, 
  OrderInput, 
  SavedOrder, 
  ScooterOrderItem 
} from '../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

export type AppView = 
  | 'home' 
  | 'order-form' 
  | 'results' 
  | 'history' 
  | 'print-summary' 
  | 'admin-settings';

export interface AppContextType {
  orderInput: OrderInput;
  calculationResult: CalculationResult;
  appConfig: AppConfig;
  savedOrders: SavedOrder[];
  activeView: AppView;
  toasts: ToastMessage[];
  isCalculating: boolean;
  calculationError: string | null;
  isSaving: boolean;
  saveError: string | null;
  clearSaveError: () => void;
  isSyncingWithCloud: boolean;
  cloudSyncStatus: 'synced' | 'local_only' | 'error' | 'syncing';
  syncLocalOrdersToCloud: () => Promise<{ migrated: number; failed: number }>;
  setActiveView: (view: AppView) => void;
  updateOrderInput: (patch: Partial<OrderInput>) => void;
  startNewOrder: (skipConfirm?: boolean) => void;
  editCurrentOrder: () => void;
  calculateAndShowResults: () => void;
  clearCalculationError: () => void;
  // Scooter Item Actions
  addScooterItem: () => void;
  updateScooterItem: (id: string, patch: Partial<ScooterOrderItem>) => void;
  removeScooterItem: (id: string) => void;
  // Battery Item Actions
  addBatteryItem: () => void;
  updateBatteryItem: (id: string, patch: Partial<BatteryOrderItem>) => void;
  removeBatteryItem: (id: string) => void;
  // Truck Actions
  setSingleTruck: (truckId: string) => void;
  updateTruckCount: (truckId: string, count: number) => void;
  autoOptimizeFleet: () => void;
  // Order Persistence
  saveCurrentOrder: () => Promise<SavedOrder | null>;
  deleteSavedOrder: (id: string) => Promise<void>;
  loadSavedOrder: (id: string) => void;
  duplicateSavedOrder: (id: string) => void;
  // Settings & JSON
  updateConfig: (patch: Partial<AppConfig>) => void;
  resetConfigToDefault: () => void;
  exportOrdersToJSON: () => void;
  importOrdersFromJSON: (jsonStr: string) => boolean;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string) => void;
  removeToast: (id: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
