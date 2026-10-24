import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl border border-red-200 shadow-md space-y-4 my-8 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Something went wrong</h2>
          <p className="text-xs text-gray-600">
            An unexpected error occurred in the calculation view. Your entered order data has been safely preserved in local storage.
          </p>
          <div className="bg-red-50 p-3 rounded-lg text-left text-xs font-mono text-red-800 break-words">
            {this.state.error?.message || 'Unknown error'}
          </div>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
