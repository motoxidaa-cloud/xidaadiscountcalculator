import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AppConfig, OrderInput, SavedOrder, CalculationResult } from '../types';

export interface OrderServiceResponse<T> {
  data: T | null;
  error: string | null;
}

export const supabaseService = {
  /**
   * Check connection status
   */
  isConfigured: () => isSupabaseConfigured(),

  /**
   * Fetch all orders from Supabase (or return local if unconfigured)
   */
  async fetchOrders(): Promise<OrderServiceResponse<SavedOrder[]>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase credentials not configured in environment.' };
    }

    try {
      // Fetch orders with snapshots and related items
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_ref,
          customer_name,
          order_date,
          battery_included,
          transport_distance_km,
          allocation_mode,
          notes,
          created_at,
          updated_at,
          order_scooter_items (
            id, model_id, model_name, category, quantity, unit_price
          ),
          order_battery_items (
            id, variant, quantity, unit_price, eligible_discount_quantity
          ),
          transport_allocations (
            truck_id, truck_name, capacity, rate_per_km, count
          ),
          calculation_snapshots (
            snapshot_data
          ),
          discount_recommendations (
            recommended_scenario_id,
            recommended_strategy_name,
            recommended_discount_amount,
            company_transport_support,
            customer_transport_payment,
            recommendation_reason,
            profitability_status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: `Supabase query error: ${error.message}` };
      }

      if (!orders) return { data: [], error: null };

      // Map Supabase rows to client SavedOrder structure
      const mappedOrders: SavedOrder[] = orders.map((o) => {
        const snapshot = Array.isArray(o.calculation_snapshots) && o.calculation_snapshots[0]
          ? o.calculation_snapshots[0].snapshot_data
          : null;

        const scooterItems = (o.order_scooter_items || []).map((s: { id: string; model_id: string; model_name: string; category: string; quantity: number; unit_price?: number }) => ({
          id: s.id,
          modelId: s.model_id,
          modelName: s.model_name,
          category: s.category as 'DL Model' | 'Other Model',
          quantity: s.quantity,
          unitPrice: s.unit_price ? Number(s.unit_price) : undefined,
        }));

        const batteryItems = (o.order_battery_items || []).map((b: { id: string; variant: string; quantity: number; unit_price?: number; eligible_discount_quantity: number }) => ({
          id: b.id,
          variant: b.variant as any,
          quantity: b.quantity,
          unitPrice: b.unit_price ? Number(b.unit_price) : undefined,
          eligibleDiscountQuantity: b.eligible_discount_quantity,
        }));

        const truckAllocations = (o.transport_allocations || []).map((t: { truck_id: string; truck_name: string; capacity: number; rate_per_km: number; count: number }) => ({
          truckId: t.truck_id,
          truckName: t.truck_name,
          capacity: t.capacity,
          ratePerKm: Number(t.rate_per_km),
          count: t.count,
        }));

        const orderInput: OrderInput = {
          customerName: o.customer_name,
          orderRef: o.order_ref,
          orderDate: o.order_date,
          scooterItems,
          batteryIncluded: o.battery_included,
          batteryItems,
          transportDistanceKm: Number(o.transport_distance_km),
          truckAllocations,
          allocationMode: o.allocation_mode as any,
          notes: o.notes || undefined,
        };

        return {
          id: o.id,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
          orderInput,
          calculationResult: snapshot as CalculationResult,
        };
      });

      return { data: mappedOrders, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Unexpected network error fetching from Supabase.' };
    }
  },

  /**
   * Save a complete order to Supabase
   */
  async saveOrder(
    orderInput: OrderInput,
    calcResult: CalculationResult,
    userId?: string
  ): Promise<OrderServiceResponse<SavedOrder>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Database unconfigured. Orders cannot be persisted to Supabase.' };
    }

    try {
      // 1. Insert into public.orders
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_ref: orderInput.orderRef,
          customer_name: orderInput.customerName || 'Direct B2B Order',
          order_date: orderInput.orderDate,
          created_by: userId || null,
          battery_included: orderInput.batteryIncluded,
          transport_distance_km: orderInput.transportDistanceKm,
          allocation_mode: orderInput.allocationMode,
          notes: orderInput.notes || null,
        })
        .select()
        .single();

      if (orderErr) {
        return { data: null, error: `Failed to insert order header: ${orderErr.message}` };
      }

      const orderId = orderData.id;

      // 2. Insert Scooter Items
      if (orderInput.scooterItems && orderInput.scooterItems.length > 0) {
        const sItems = orderInput.scooterItems.map((s) => ({
          order_id: orderId,
          model_id: s.modelId,
          model_name: s.modelName,
          category: s.category,
          quantity: s.quantity,
          unit_price: s.unitPrice || null,
        }));
        const { error: sErr } = await supabase.from('order_scooter_items').insert(sItems);
        if (sErr) console.warn('Warning inserting scooter items:', sErr.message);
      }

      // 3. Insert Battery Items
      if (orderInput.batteryIncluded && orderInput.batteryItems && orderInput.batteryItems.length > 0) {
        const bItems = orderInput.batteryItems.map((b) => ({
          order_id: orderId,
          variant: b.variant,
          quantity: b.quantity,
          unit_price: b.unitPrice || null,
          eligible_discount_quantity: b.eligibleDiscountQuantity,
        }));
        const { error: bErr } = await supabase.from('order_battery_items').insert(bItems);
        if (bErr) console.warn('Warning inserting battery items:', bErr.message);
      }

      // 4. Insert Transport Allocations
      if (orderInput.truckAllocations && orderInput.truckAllocations.length > 0) {
        const tAllocs = orderInput.truckAllocations.map((t) => ({
          order_id: orderId,
          truck_id: t.truckId,
          truck_name: t.truckName,
          capacity: t.capacity,
          rate_per_km: t.ratePerKm,
          count: t.count,
        }));
        const { error: tErr } = await supabase.from('transport_allocations').insert(tAllocs);
        if (tErr) console.warn('Warning inserting transport allocations:', tErr.message);
      }

      // 5. Insert Immutable Calculation Snapshot
      const { error: snapErr } = await supabase.from('calculation_snapshots').insert({
        order_id: orderId,
        total_scooters: calcResult.totalScooters,
        total_dl_scooters: calcResult.totalDlScooters,
        total_other_scooters: calcResult.totalOtherScooters,
        total_batteries: calcResult.totalBatteries,
        scooter_discount_allowance: calcResult.scooterDiscountAllowance,
        battery_discount_allowance: calcResult.batteryDiscountAllowance,
        total_discount_allowance: calcResult.totalDiscountAllowance,
        base_transport_cost: calcResult.baseTransportCost,
        transport_extra_percent: calcResult.transportExtraPercent,
        transport_extra_charge: calcResult.transportExtraCharge,
        transport_subtotal: calcResult.transportSubtotal,
        transport_gst_percent: calcResult.transportGstPercent,
        transport_gst_amount: calcResult.transportGstAmount,
        total_transport_cost: calcResult.totalTransportCost,
        half_transport_cost: calcResult.halfTransportCost,
        transport_cost_per_scooter: calcResult.transportCostPerScooter,
        customer_transport_per_scooter: calcResult.customerTransportPerScooter,
        allocation_option: calcResult.allocationOption,
        company_transport_support: calcResult.companyTransportSupport,
        customer_transport_payment: calcResult.customerTransportPayment,
        actual_scooter_discount_applied: calcResult.actualScooterDiscountApplied,
        actual_battery_discount_applied: calcResult.actualBatteryDiscountApplied,
        scooter_battery_discount_applied: calcResult.scooterBatteryDiscountApplied,
        remaining_scooter_discount: calcResult.remainingScooterDiscount,
        total_customer_discount_benefit: calcResult.totalCustomerDiscountBenefit,
        has_all_prices: calcResult.hasAllPrices,
        gross_scooter_amount: calcResult.grossScooterAmount,
        gross_battery_amount: calcResult.grossBatteryAmount,
        total_product_invoice_amount: calcResult.totalProductInvoiceAmount,
        final_payable_amount: calcResult.finalPayableAmount,
        snapshot_data: calcResult,
      });
      if (snapErr) console.warn('Warning inserting snapshot:', snapErr.message);

      // 6. Insert Discount Recommendation
      const recScenario = calcResult.profitProtection?.scenarios?.find(
        (s) => s.id === calcResult.profitProtection?.recommendedScenarioId
      );
      if (recScenario) {
        try {
          await supabase.from('discount_recommendations').insert({
            order_id: orderId,
            recommended_scenario_id: recScenario.id,
            recommended_strategy_name: recScenario.name,
            recommended_discount_amount: recScenario.scooterDiscountApplied + recScenario.batteryDiscountApplied,
            company_transport_support: recScenario.companyTransportSupport,
            customer_transport_payment: recScenario.customerTransportPayment,
            estimated_company_profit: recScenario.companyProfit,
            profit_margin_percent: recScenario.profitMarginPercent,
            target_profit_comparison: recScenario.statusMessage,
            recommendation_reason: calcResult.profitProtection.recommendationReason,
            profitability_status: calcResult.profitProtection.status,
            scenarios_json: calcResult.profitProtection.scenarios,
          });
        } catch {
          // Non-blocking
        }
      }

      // 7. Audit log
      try {
        await supabase.from('audit_history').insert({
          entity_type: 'ORDER',
          entity_id: orderId,
          action: 'ORDER_CREATED',
          performed_by: userId || null,
          new_values: { order_ref: orderInput.orderRef, customer: orderInput.customerName },
        });
      } catch {
        // Non-blocking
      }

      const newSavedOrder: SavedOrder = {
        id: orderId,
        createdAt: orderData.created_at,
        updatedAt: orderData.updated_at,
        orderInput: { ...orderInput },
        calculationResult: { ...calcResult },
      };

      return { data: newSavedOrder, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Database error occurred while saving order.' };
    }
  },

  /**
   * Delete an order by ID
   */
  async deleteOrder(id: string, userId?: string): Promise<OrderServiceResponse<boolean>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Database unconfigured.' };
    }

    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) {
        return { data: false, error: `Failed to delete order from Supabase: ${error.message}` };
      }

      // Audit log
      try {
        await supabase.from('audit_history').insert({
          entity_type: 'ORDER',
          entity_id: id,
          action: 'ORDER_DELETED',
          performed_by: userId || null,
        });
      } catch {
        // Non-blocking
      }

      return { data: true, error: null };
    } catch (err: any) {
      return { data: false, error: err.message || 'Network error deleting order.' };
    }
  },

  /**
   * Migrate existing local orders to Supabase
   */
  async migrateLocalOrders(localOrders: SavedOrder[], userId?: string): Promise<{ migrated: number; failed: number }> {
    if (!isSupabaseConfigured() || !localOrders || localOrders.length === 0) {
      return { migrated: 0, failed: 0 };
    }

    let migrated = 0;
    let failed = 0;

    for (const order of localOrders) {
      const res = await this.saveOrder(order.orderInput, order.calculationResult, userId);
      if (res.data) {
        migrated++;
      } else {
        failed++;
      }
    }

    return { migrated, failed };
  },

  /**
   * Fetch app settings from Supabase
   */
  async fetchConfig(): Promise<OrderServiceResponse<AppConfig>> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase unconfigured' };
    }
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('config_data')
        .eq('id', 'global_config')
        .single();

      if (error || !data) {
        return { data: null, error: error?.message || 'No remote config found' };
      }
      return { data: data.config_data as AppConfig, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Save app settings to Supabase
   */
  async saveConfig(config: AppConfig, userId?: string): Promise<OrderServiceResponse<boolean>> {
    if (!isSupabaseConfigured()) {
      return { data: false, error: 'Supabase unconfigured' };
    }
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 'global_config',
          config_data: config,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        });

      if (error) return { data: false, error: error.message };
      return { data: true, error: null };
    } catch (err: any) {
      return { data: false, error: err.message };
    }
  },
};
