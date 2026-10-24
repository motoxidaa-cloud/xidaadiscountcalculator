import React from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { OrderForm } from './components/OrderForm';
import { ResultsScreen } from './components/ResultsScreen';
import { OrderHistory } from './components/OrderHistory';
import { PrintOrderSummary } from './components/PrintOrderSummary';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { ToastContainer } from './components/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginScreen } from './components/LoginScreen';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';

export const MainContent: React.FC = () => {
  const { activeView } = useApp();

  return (
    <main className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 flex-1 w-full">
      <ErrorBoundary>
        {activeView === 'home' && <HomeScreen />}
        {activeView === 'order-form' && <OrderForm />}
        {activeView === 'results' && <ResultsScreen />}
        {activeView === 'history' && <OrderHistory />}
        {activeView === 'print-summary' && <PrintOrderSummary />}
        {activeView === 'admin-settings' && <AdminSettingsModal />}
      </ErrorBoundary>
    </main>
  );
};

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#E53935] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-gray-500">Loading Xidaa Commercial Portal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginScreen />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#191A1D] flex flex-col font-sans selection:bg-[#E53935] selection:text-white">
      <Header />
      <MainContent />
      
      {/* Clean Automotive Footer */}
      <footer className="no-print border-t border-gray-200/80 bg-white/70 backdrop-blur-md py-4 text-xs text-gray-500 mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#E53935]"></span>
            <span className="font-extrabold text-gray-900">Xidaa Moto Private Limited</span>
            <span className="text-gray-300">•</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E53935]">
              Ride the Electric Thunder
            </span>
          </div>

          <div className="text-[11px] text-gray-400 font-medium">
            Internal B2B Commercial Engine • Official Dealership Portal
          </div>
        </div>
      </footer>

      <ChangePasswordModal />
      <MobileBottomNav />
      <ToastContainer />
    </div>
  );
};

export default App;
