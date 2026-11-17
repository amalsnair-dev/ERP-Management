import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import CrashMonitoringService from "../../services/CrashMonitoringService";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
    CrashMonitoringService.captureException(error, {
      componentStack: errorInfo?.componentStack,
      type: "React.ErrorBoundary",
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/aurixapp/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 text-center">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Something went wrong
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              An unexpected error occurred in this view. Your session and data are safe.
            </p>

            {this.state.error?.message && (
              <div className="mb-6 p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-left font-mono text-xs text-rose-600 dark:text-rose-400 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-xl transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
