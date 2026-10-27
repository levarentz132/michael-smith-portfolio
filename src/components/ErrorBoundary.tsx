import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

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

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Highlanderstay UI Error Caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full bg-[#0e1422] border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/80 flex flex-col items-center">
            <div className="size-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-5 shadow-lg">
              <AlertCircle size={32} />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Halaman Mengalami Kendala
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Terjadi kendala saat memuat konten. Klik tombol di bawah untuk menyegarkan halaman atau kembali ke beranda.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-all active:scale-95 shadow-md"
              >
                <RefreshCw size={16} />
                Muat Ulang
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all active:scale-95 border border-slate-700"
              >
                <Home size={16} />
                Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
