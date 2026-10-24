import React, { useState } from 'react';
import { 
  Bookmark, 
  Search, 
  Trash2, 
  Copy, 
  ArrowLeft, 
  Download, 
  Upload, 
  PlusCircle,
  Calendar,
  ChevronRight,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/currency';

export const OrderHistory: React.FC = () => {
  const { 
    savedOrders, 
    loadSavedOrder, 
    duplicateSavedOrder, 
    deleteSavedOrder, 
    startNewOrder,
    exportOrdersToJSON, 
    importOrdersFromJSON,
    cloudSyncStatus,
    isSyncingWithCloud,
    syncLocalOrdersToCloud,
    setActiveView 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; ref: string } | null>(null);

  const filteredOrders = savedOrders.filter(order => {
    const s = searchTerm.toLowerCase();
    const cust = order.orderInput.customerName.toLowerCase();
    const ref = order.orderInput.orderRef.toLowerCase();
    const models = order.orderInput.scooterItems.map(i => i.modelName.toLowerCase()).join(' ');
    return cust.includes(s) || ref.includes(s) || models.includes(s);
  });

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      importOrdersFromJSON(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteSavedOrder(orderToDelete.id);
      setOrderToDelete(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24 animate-fade-in">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveView('home')}
          className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 hover:text-[#E53935] transition-colors py-1 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Home</span>
        </button>

        <button
          type="button"
          onClick={() => startNewOrder(false)}
          className="flex items-center space-x-1 text-xs font-bold text-[#E53935] hover:underline cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Order</span>
        </button>
      </div>

      {/* Title & Import/Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-black text-[#191A1D] flex items-center space-x-2">
              <Bookmark className="w-5 h-5 text-[#E53935]" />
              <span>Saved Order Calculations</span>
            </h1>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border ${
              cloudSyncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {cloudSyncStatus === 'synced' ? (
                <>
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  <span>Supabase Persistent</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3 h-3 text-amber-600" />
                  <span>Local Sandbox</span>
                </>
              )}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-0.5">
            {savedOrders.length} quotation records in database.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {cloudSyncStatus !== 'synced' && savedOrders.length > 0 && (
            <button
              type="button"
              onClick={syncLocalOrdersToCloud}
              disabled={isSyncingWithCloud}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl flex items-center space-x-1 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Sync local orders to Supabase cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWithCloud ? 'animate-spin' : ''}`} />
              <span>Sync to Cloud</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportOrdersToJSON}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl flex items-center space-x-1 shadow-2xs cursor-pointer active:scale-95"
            title="Export to JSON file"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export</span>
          </button>

          <label className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl flex items-center space-x-1 shadow-2xs cursor-pointer active:scale-95">
            <Upload className="w-3.5 h-3.5 text-gray-500" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by customer, quotation reference, or model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E53935] shadow-2xs"
        />
      </div>

      {/* Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl text-center space-y-3">
          <div className="w-11 h-11 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <Bookmark className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-gray-800">No Saved Calculations Found</h2>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {savedOrders.length === 0
              ? 'Calculate an order and tap "Save Order" on the results screen to keep it in history.'
              : 'No orders match your search keyword.'}
          </p>
          {savedOrders.length === 0 && (
            <button
              type="button"
              onClick={() => startNewOrder(true)}
              className="mt-2 py-2 px-4 bg-[#E53935] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#D32F2F] cursor-pointer"
            >
              Create First Order
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const res = order.calculationResult;
            const inp = order.orderInput;
            return (
              <div
                key={order.id}
                className="glass-card p-4 sm:p-5 rounded-2xl space-y-3 hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-gray-900">
                      {inp.customerName || 'Direct B2B Dealer'}
                    </div>
                    <div className="text-[11px] font-mono text-gray-500 flex items-center space-x-2">
                      <span className="bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded font-semibold">
                        {inp.orderRef}
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{inp.orderDate}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-mono font-black text-gray-900">
                      {res.finalPayableAmount !== null ? formatINR(res.finalPayableAmount) : 'Pending Prices'}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold">
                      Benefit: {formatINR(res.totalCustomerDiscountBenefit)}
                    </div>
                  </div>
                </div>

                {/* Scooter & Battery breakdown */}
                <div className="p-3 bg-gray-50/80 rounded-xl text-xs text-gray-700 space-y-1">
                  <div className="font-semibold flex items-center justify-between text-[11px]">
                    <span className="text-gray-900 font-bold">{res.totalScooters} Scooters ({res.totalDlScooters} DL) • {inp.transportDistanceKm} km</span>
                    <span className="font-mono text-emerald-800 font-bold">Disc Quota: {formatINR(res.scooterDiscountAllowance)}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {inp.scooterItems.map((s) => `${s.quantity}x ${s.modelName} (${s.category})`).join(', ')}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={() => duplicateSavedOrder(order.id)}
                      className="font-semibold text-gray-600 hover:text-gray-900 flex items-center space-x-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      <span>Duplicate</span>
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={() => setOrderToDelete({ id: order.id, ref: inp.orderRef })}
                      className="font-semibold text-gray-400 hover:text-red-600 flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadSavedOrder(order.id)}
                    className="py-1.5 px-3.5 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <span>Open Order</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-gray-200 animate-scale-in">
            <h3 className="text-base font-bold text-gray-900">Confirm Deletion</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete order calculation <strong>{orderToDelete.ref}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="py-2 px-4 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 cursor-pointer shadow-xs"
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
