import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Đã xảy ra lỗi không mong muốn.' };
  }

  componentDidCatch(error: Error) {
    console.error('ONECRM ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f4f7fc] dark:bg-[#0b1730] p-6">
          <div className="max-w-lg w-full glass-card rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Không thể tải phân hệ này
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 break-words">
              {this.state.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1951fc] text-white text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại ứng dụng
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
