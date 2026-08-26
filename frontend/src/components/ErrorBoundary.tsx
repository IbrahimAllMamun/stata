// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Without this, a render-time throw anywhere in the tree unmounts the whole app
 * and leaves a blank white page with no way back.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-[#1F2A44]">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-500">
            This page hit an unexpected error. Reloading usually clears it.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-gray-50 p-3 text-left text-[11px] text-red-600">
              {error.message}
            </pre>
          )}
          <div className="mt-6 flex gap-3">
            <button onClick={() => window.location.reload()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2F5BEA] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a3fc7]">
              <RotateCw className="h-4 w-4" /> Reload
            </button>
            <a href="/"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50">
              <Home className="h-4 w-4" /> Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
