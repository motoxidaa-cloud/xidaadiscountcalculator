import React, { useEffect, useState } from 'react';
import { DEFAULT_APP_CONFIG } from '../data/defaultConfig';
import { CATALOGUE_SCOOTER_MODELS } from '../data/catalogueModels';
import { createDefaultOrderInput, generateOrderRef } from '../utils/orderDefaults';
import type { 
  AppConfig, 
  BatteryOrderItem, 
  OrderInput, 
  SavedOrder, 
  ScooterOrderItem, 
  TruckAllocationItem 
} from '../types';
import { calculateOrderFinancials, recommendTruckAllocation } from '../utils/calculations';
import { AppContext, type AppView, type ToastMessage } from './AppContext';
import { supabaseService } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

const LOCAL_STORAGE_ORDERS_KEY = 'xidaa_discount_calculator_orders_v2';
const LOCAL_STORAGE_CONFIG_KEY = 'xidaa_discount_calculator_config_v2';
const LOCAL_STORAGE_DRAFT_ORDER_KEY = 'xidaa_discount_calculator_draft_order_v2';
const LOCAL_STORAGE_ACTIVE_VIEW_KEY = 'xidaa_discount_calculator_active_view_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appConfig, setAppConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_APP_CONFIG,
          ...parsed,
          transportSettings: {
            ...DEFAULT_APP_CONFIG.transportSettings,
            ...(parsed.transportSettings || {}),
          },
          discountRates: {
            ...DEFAULT_APP_CONFIG.discountRates,
            ...(parsed.discountRates || {}),
          },
          transportSharing: {
            ...DEFAULT_APP_CONFIG.transportSharing,
            ...(parsed.transportSharing || {}),
          },
          taxSettings: {
            ...DEFAULT_APP_CONFIG.taxSettings,
            ...(parsed.taxSettings || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Failed to parse config from localStorage', e);
    }
    return DEFAULT_APP_CONFIG;
  });

  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse orders from localStorage', e);
    }
    return [];
  });

  const [orderInput, setOrderInput] = useState<OrderInput>(() => {
    try {
      const savedDraft = localStorage.getItem(LOCAL_STORAGE_DRAFT_ORDER_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && Array.isArray(parsed.scooterItems)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse draft order', e);
    }
    return createDefaultOrderInput(appConfig);
  });

  const [activeView, setActiveView] = useState<AppView>(() => {
    try {
      const savedView = localStorage.getItem(LOCAL_STORAGE_ACTIVE_VIEW_KEY) as AppView;
      if (
        savedView &&
        ['home', 'order-form', 'results', 'history', 'print-summary', 'admin-settings'].includes(savedView)
      ) {
        return savedView;
      }
    } catch (e) {
      console.warn('Failed to parse active view', e);
    }
    return 'home';
  });

  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSyncingWithCloud, setIsSyncingWithCloud] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'local_only' | 'error' | 'syncing'>(() => 
    isSupabaseConfigured() ? 'syncing' : 'local_only'
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'info' | 'warning' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearCalculationError = () => {
    setCalculationError(null);
  };

  const clearSaveError = () => {
    setSaveError(null);
  };

  // Hydrate orders from Supabase on mount if configured
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let isMounted = true;
    async function loadCloudOrders() {
      setCloudSyncStatus('syncing');
      const res = await supabaseService.fetchOrders();
      if (!isMounted) return;

      if (res.data) {
        if (res.data.length > 0) {
          setSavedOrders(res.data);
        }
        setCloudSyncStatus('synced');
      } else {
        setCloudSyncStatus('error');
        console.warn('Supabase fetchOrders failed:', res.error);
      }
    }

    loadCloudOrders();
    return () => { isMounted = false; };
  }, []);

  // Persist config
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(appConfig));
    } catch (e) {
      console.warn('Failed to save config', e);
    }
  }, [appConfig]);

  // Persist orders
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(savedOrders));
    } catch (e) {
      console.warn('Failed to save orders', e);
    }
  }, [savedOrders]);

  // Persist draft order
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DRAFT_ORDER_KEY, JSON.stringify(orderInput));
    } catch (e) {
      console.warn('Failed to save draft order', e);
    }
  }, [orderInput]);

  // Persist active view
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_VIEW_KEY, activeView);
    } catch (e) {
      console.warn('Failed to save active view', e);
    }
  }, [activeView]);

  // Live calculation result
  const calculationResult = calculateOrderFinancials(orderInput, appConfig);

  const updateOrderInput = (patch: Partial<OrderInput>) => {
    setOrderInput((prev) => ({ ...prev, ...patch }));
  };

  const startNewOrder = (skipConfirm = false) => {
    const hasData =
      (orderInput.customerName && orderInput.customerName.trim() !== '') ||
      orderInput.scooterItems.some((s) => (Number(s.quantity) || 0) > 0) ||
      (orderInput.batteryIncluded && orderInput.batteryItems.length > 0);

    if (!skipConfirm && hasData && (activeView === 'results' || activeView === 'order-form')) {
      const confirmed = window.confirm(
        'Start a new order? This will reset the current order inputs.'
      );
      if (!confirmed) {
        return;
      }
    }

    const fresh = createDefaultOrderInput(appConfig);
    setOrderInput(fresh);
    setCalculationError(null);
    setActiveView('order-form');
    addToast('info', 'Started new order calculation');
  };

  const editCurrentOrder = () => {
    setCalculationError(null);
    setActiveView('order-form');
  };

  const calculateAndShowResults = () => {
    try {
      setCalculationError(null);
      setIsCalculating(true);

      // Validation: At least one scooter or battery item with quantity > 0
      const totalScooterQty = (orderInput.scooterItems || []).reduce(
        (acc, item) => acc + Math.max(0, Math.floor(Number(item.quantity) || 0)),
        0
      );
      const totalBatteryQty = orderInput.batteryIncluded
        ? (orderInput.batteryItems || []).reduce(
            (acc, b) => acc + Math.max(0, Math.floor(Number(b.quantity) || 0)),
            0
          )
        : 0;

      if (totalScooterQty === 0 && totalBatteryQty === 0) {
        setIsCalculating(false);
        addToast('warning', 'Please enter at least 1 scooter or battery quantity before calculating.');
        return;
      }

      // Safe test calculation
      const res = calculateOrderFinancials(orderInput, appConfig);
      if (!res) {
        throw new Error('Calculation returned empty result.');
      }

      // Smooth loading transition
      setTimeout(() => {
        setIsCalculating(false);
        setActiveView('results');
        addToast('success', 'Order calculated successfully');
      }, 150);
    } catch (err: any) {
      console.error('Calculation error caught:', err);
      setIsCalculating(false);
      const message = err?.message || 'An unexpected error occurred during calculation.';
      setCalculationError(message);
      addToast('error', `Calculation failed: ${message}`);
      // Do NOT navigate to home. Stay on order-form to preserve entered data.
    }
  };

  // Scooter Item Actions
  const addScooterItem = () => {
    const defaultModel = CATALOGUE_SCOOTER_MODELS[0];
    const defaultCategory = appConfig.modelCategoryOverrides[defaultModel.id] || defaultModel.defaultCategory;
    const newItem: ScooterOrderItem = {
      id: `scoot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      modelId: defaultModel.id,
      modelName: defaultModel.name,
      category: defaultCategory,
      quantity: 5,
      unitPrice: undefined,
    };
    setOrderInput((prev) => ({
      ...prev,
      scooterItems: [...prev.scooterItems, newItem],
    }));
  };

  const updateScooterItem = (id: string, patch: Partial<ScooterOrderItem>) => {
    setOrderInput((prev) => ({
      ...prev,
      scooterItems: prev.scooterItems.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...patch };
        if (patch.modelId && patch.modelId !== item.modelId) {
          const m = CATALOGUE_SCOOTER_MODELS.find((mod) => mod.id === patch.modelId);
          if (m) {
            updated.modelName = m.name;
            updated.category = appConfig.modelCategoryOverrides[m.id] || m.defaultCategory;
          }
        }
        return updated;
      }),
    }));
  };

  const removeScooterItem = (id: string) => {
    if (orderInput.scooterItems.length <= 1) {
      addToast('warning', 'Orders require at least one scooter item or battery item');
      return;
    }
    setOrderInput((prev) => ({
      ...prev,
      scooterItems: prev.scooterItems.filter((item) => item.id !== id),
    }));
  };

  // Battery Item Actions
  const addBatteryItem = () => {
    const newItem: BatteryOrderItem = {
      id: `batt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      variant: '60V 30Ah LFP',
      quantity: 5,
      unitPrice: undefined,
      eligibleDiscountQuantity: 5,
    };
    setOrderInput((prev) => ({
      ...prev,
      batteryIncluded: true,
      batteryItems: [...prev.batteryItems, newItem],
    }));
  };

  const updateBatteryItem = (id: string, patch: Partial<BatteryOrderItem>) => {
    setOrderInput((prev) => ({
      ...prev,
      batteryItems: prev.batteryItems.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...patch };
        if (patch.quantity !== undefined) {
          updated.eligibleDiscountQuantity = Math.min(
            updated.quantity,
            updated.eligibleDiscountQuantity !== undefined ? updated.eligibleDiscountQuantity : updated.quantity
          );
        }
        return updated;
      }),
    }));
  };

  const removeBatteryItem = (id: string) => {
    setOrderInput((prev) => {
      const remaining = prev.batteryItems.filter((item) => item.id !== id);
      return {
        ...prev,
        batteryItems: remaining,
        batteryIncluded: remaining.length > 0,
      };
    });
  };

  // Truck Actions
  const setSingleTruck = (truckId: string) => {
    const truck = appConfig.transportRates.find((t) => t.id === truckId);
    if (!truck) return;
    setOrderInput((prev) => ({
      ...prev,
      truckAllocations: [
        {
          truckId: truck.id,
          truckName: truck.name,
          capacity: truck.capacity,
          ratePerKm: truck.ratePerKm,
          count: 1,
        },
      ],
    }));
  };

  const updateTruckCount = (truckId: string, count: number) => {
    setOrderInput((prev) => {
      const existing = prev.truckAllocations.find((t) => t.truckId === truckId);
      if (existing) {
        if (count <= 0) {
          return {
            ...prev,
            truckAllocations: prev.truckAllocations.filter((t) => t.truckId !== truckId),
          };
        }
        return {
          ...prev,
          truckAllocations: prev.truckAllocations.map((t) =>
            t.truckId === truckId ? { ...t, count: Math.max(1, count) } : t
          ),
        };
      }
      const truck = appConfig.transportRates.find((t) => t.id === truckId);
      if (!truck) return prev;
      return {
        ...prev,
        truckAllocations: [
          ...prev.truckAllocations,
          {
            truckId: truck.id,
            truckName: truck.name,
            capacity: truck.capacity,
            ratePerKm: truck.ratePerKm,
            count: Math.max(1, count),
          },
        ],
      };
    });
  };

  const autoOptimizeFleet = () => {
    const totalScooters = calculationResult.totalScooters;
    const rec = recommendTruckAllocation(totalScooters, appConfig.transportRates);
    const newAllocs: TruckAllocationItem[] = rec.trucks.map((t) => ({
      truckId: t.truck.id,
      truckName: t.truck.name,
      capacity: t.truck.capacity,
      ratePerKm: t.truck.ratePerKm,
      count: t.count,
    }));
    setOrderInput((prev) => ({
      ...prev,
      truckAllocations: newAllocs,
    }));
    addToast('success', `Optimized fleet allocated: ${rec.totalCapacity} capacity for ${totalScooters} scooters`);
  };

  // Order Persistence (with Supabase Cloud Store integration)
  const saveCurrentOrder = async (): Promise<SavedOrder | null> => {
    setIsSaving(true);
    setSaveError(null);

    const existingIndex = savedOrders.findIndex((o) => o.orderInput.orderRef === orderInput.orderRef);
    const now = new Date().toISOString();

    // If Supabase is configured, persist to database
    if (isSupabaseConfigured()) {
      const res = await supabaseService.saveOrder(orderInput, calculationResult);
      setIsSaving(false);

      if (res.error || !res.data) {
        const errorMsg = res.error || 'Failed to persist order to Supabase database.';
        setSaveError(errorMsg);
        addToast('error', errorMsg);
        return null;
      }

      const saved = res.data;
      if (existingIndex >= 0) {
        setSavedOrders((prev) => {
          const copy = [...prev];
          copy[existingIndex] = saved;
          return copy;
        });
        addToast('success', `Order ${orderInput.orderRef} updated in Supabase cloud`);
      } else {
        setSavedOrders((prev) => [saved, ...prev]);
        addToast('success', `Order ${orderInput.orderRef} saved permanently to Supabase`);
      }
      return saved;
    }

    // Local Sandbox Mode (when Supabase .env keys are not yet provided)
    setIsSaving(false);
    const newSavedOrder: SavedOrder = {
      id: existingIndex >= 0 ? savedOrders[existingIndex].id : `ord-${Date.now()}`,
      createdAt: existingIndex >= 0 ? savedOrders[existingIndex].createdAt : now,
      updatedAt: now,
      orderInput: { ...orderInput },
      calculationResult: { ...calculationResult },
    };

    if (existingIndex >= 0) {
      setSavedOrders((prev) => {
        const copy = [...prev];
        copy[existingIndex] = newSavedOrder;
        return copy;
      });
      addToast('success', `Order ${orderInput.orderRef} updated (Local Sandbox)`);
    } else {
      setSavedOrders((prev) => [newSavedOrder, ...prev]);
      addToast('success', `Order ${orderInput.orderRef} saved (Local Sandbox)`);
    }

    return newSavedOrder;
  };

  const deleteSavedOrder = async (id: string) => {
    if (isSupabaseConfigured()) {
      const res = await supabaseService.deleteOrder(id);
      if (res.error) {
        addToast('error', `Failed to delete order from Supabase: ${res.error}`);
        return;
      }
    }
    setSavedOrders((prev) => prev.filter((o) => o.id !== id));
    addToast('info', 'Order deleted');
  };

  const syncLocalOrdersToCloud = async (): Promise<{ migrated: number; failed: number }> => {
    if (!isSupabaseConfigured()) {
      addToast('warning', 'Supabase credentials not configured in environment.');
      return { migrated: 0, failed: 0 };
    }
    setIsSyncingWithCloud(true);
    const res = await supabaseService.migrateLocalOrders(savedOrders);
    setIsSyncingWithCloud(false);
    if (res.migrated > 0) {
      addToast('success', `Successfully migrated ${res.migrated} order(s) to Supabase cloud!`);
      const fresh = await supabaseService.fetchOrders();
      if (fresh.data) setSavedOrders(fresh.data);
    } else if (res.failed > 0) {
      addToast('error', `Failed to migrate ${res.failed} order(s). Check connection.`);
    } else {
      addToast('info', 'All orders are already in sync.');
    }
    return res;
  };

  const loadSavedOrder = (id: string) => {
    const found = savedOrders.find((o) => o.id === id);
    if (found) {
      setOrderInput({ ...found.orderInput });
      setActiveView('results');
      addToast('success', `Loaded order ${found.orderInput.orderRef}`);
    }
  };

  const duplicateSavedOrder = (id: string) => {
    const found = savedOrders.find((o) => o.id === id);
    if (found) {
      const duplicated: OrderInput = {
        ...found.orderInput,
        orderRef: generateOrderRef(),
        orderDate: new Date().toISOString().slice(0, 10),
      };
      setOrderInput(duplicated);
      setActiveView('order-form');
      addToast('info', `Duplicated as new order ${duplicated.orderRef}`);
    }
  };

  const updateConfig = (patch: Partial<AppConfig>) => {
    setAppConfig((prev) => ({
      ...prev,
      ...patch,
      discountRates: { ...prev.discountRates, ...(patch.discountRates || {}) },
      transportRates: patch.transportRates || prev.transportRates,
      transportSharing: { ...prev.transportSharing, ...(patch.transportSharing || {}) },
      transportSettings: { ...prev.transportSettings, ...(patch.transportSettings || {}) },
      taxSettings: { ...prev.taxSettings, ...(patch.taxSettings || {}) },
      modelCategoryOverrides: { ...prev.modelCategoryOverrides, ...(patch.modelCategoryOverrides || {}) },
      customModelPrices: { ...prev.customModelPrices, ...(patch.customModelPrices || {}) },
    }));
    addToast('success', 'Admin settings updated');
  };

  const resetConfigToDefault = () => {
    setAppConfig(DEFAULT_APP_CONFIG);
    addToast('info', 'Admin settings reset to defaults');
  };

  const exportOrdersToJSON = () => {
    try {
      const exportData = {
        app: 'Xidaa Discount Calculator',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        orders: savedOrders,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Xidaa_Orders_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('success', 'Orders exported to JSON');
    } catch {
      addToast('error', 'Failed to export orders');
    }
  };

  const importOrdersFromJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.orders)) {
        setSavedOrders(parsed.orders);
        addToast('success', `Imported ${parsed.orders.length} orders successfully`);
        return true;
      }
      throw new Error('Missing orders array');
    } catch (e: any) {
      addToast('error', `Import failed: ${e.message}`);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        orderInput,
        calculationResult,
        appConfig,
        savedOrders,
        activeView,
        toasts,
        isCalculating,
        calculationError,
        clearCalculationError,
        isSaving,
        saveError,
        clearSaveError,
        isSyncingWithCloud,
        cloudSyncStatus,
        syncLocalOrdersToCloud,
        setActiveView,
        updateOrderInput,
        startNewOrder,
        editCurrentOrder,
        calculateAndShowResults,
        addScooterItem,
        updateScooterItem,
        removeScooterItem,
        addBatteryItem,
        updateBatteryItem,
        removeBatteryItem,
        setSingleTruck,
        updateTruckCount,
        autoOptimizeFleet,
        saveCurrentOrder,
        deleteSavedOrder,
        loadSavedOrder,
        duplicateSavedOrder,
        updateConfig,
        resetConfigToDefault,
        exportOrdersToJSON,
        importOrdersFromJSON,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
