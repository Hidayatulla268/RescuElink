import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RescuELINK Uncaught Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    localStorage.removeItem('rescuenlink_gov_token');
    localStorage.removeItem('rescuenlink_gov_user');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080C14] text-slate-100 flex items-center justify-center p-4 tactical-grid">
          <div className="max-w-lg w-full rounded-3xl glass-card-ultra p-6 sm:p-8 border border-rose-500/30 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                SYSTEM RECOVERY SHIELD ACTIVE
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
                RescuE<span className="text-rose-400">LINK</span> Session Interrupted
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                An unexpected interface exception occurred. The command system has isolated the runtime state to safeguard data integrity.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-black/40 p-3 rounded-xl border border-white/10 font-mono text-xs text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Command System</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 font-mono text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Home className="w-4 h-4" />
                <span>Reset Local Session</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
