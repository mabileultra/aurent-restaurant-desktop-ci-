import { Component } from 'react';
import { AlertOctagon, Home, RotateCcw } from 'lucide-react';
import { isChunkLoadError, shouldAutoReloadChunk } from '../router/chunkLoadError';
import { Sentry } from './initSentry';
import i18n from 'i18next';
import { buildErrorReferenceCode } from '../utils/apiErrorParser';

export default class ObservabilityErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      chunk: isChunkLoadError(error),
      reloadSkipped: false,
    };
  }

  componentDidCatch(error, info) {
    if (import.meta.env?.VITE_SENTRY_DSN) {
      Sentry.captureException(error, { extra: { componentStack: info?.componentStack } });
    }
    console.error('UI error:', error, info);
    if (!isChunkLoadError(error)) return;
    if (shouldAutoReloadChunk()) {
      window.location.reload();
      return;
    }
    this.setState({ reloadSkipped: true });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError && this.state.chunk && !this.state.reloadSkipped) {
      return null;
    }

    if (this.state.hasError) {
      const lang = i18n?.language || 'uz';
      const isUz = lang.startsWith('uz');
      const errCode = buildErrorReferenceCode('UI', this.state.error);

      const title = isUz
        ? 'Tizimda kutilmagan xatolik yuz berdi'
        : 'Что-то пошло не так';

      const description = isUz
        ? 'Ilova interfeysida texnik nosozlik aniqlandi. Sahifani yangilang yoki asosiy menyuga qayting.'
        : 'Произошла непредвиденная ошибка в интерфейсе. Обновите страницу или вернитесь на главную.';

      const reloadText = isUz ? 'Sahifani yangilash' : 'Обновить страницу';
      const homeText = isUz ? 'Bosh sahifa' : 'На главную';

      return (
        <main
          role="alert"
          aria-live="assertive"
          className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-950 font-sans"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {/* Top Icon Badge */}
            <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 shadow-sm">
              <AlertOctagon size={32} aria-hidden="true" />
            </div>

            {/* Title & Desc */}
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
              {title}
            </h1>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 mb-4">
              {description}
            </p>

            {/* Error Code */}
            <div className="mb-6 inline-block rounded-lg bg-slate-100 px-3 py-1 font-mono text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 select-all">
              {errCode}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-700 transition-all cursor-pointer"
              >
                <RotateCcw size={15} aria-hidden="true" />
                <span>{reloadText}</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                <Home size={15} aria-hidden="true" />
                <span>{homeText}</span>
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
