import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  error?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load contents',
  error = 'A network error or Drive connection issue occurred.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-rose-200/80 dark:border-rose-900/40 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20">
      <div className="p-3.5 bg-rose-100 dark:bg-rose-900/50 rounded-full mb-3 text-rose-600 dark:text-rose-400">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-rose-900 dark:text-rose-200">{title}</h3>
      <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 max-w-md mt-1 mb-5">
        {error}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs sm:text-sm rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
