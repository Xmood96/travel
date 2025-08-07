import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

interface ErrorRecoveryStatusProps {
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  error?: string;
  onRetry?: () => void;
}

export const ErrorRecoveryStatus = ({
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  error,
  onRetry,
}: ErrorRecoveryStatusProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error || isRetrying) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, isRetrying]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm"
      >
        <div className="flex items-start gap-3">
          {isRetrying ? (
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
          ) : error ? (
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            {isRetrying ? (
              <div>
                <p className="text-sm font-medium text-gray-900">
                  جاري إعادة المحاولة...
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  المحاولة {retryCount} من {maxRetries}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(retryCount / maxRetries) * 100}%` }}
                  />
                </div>
              </div>
            ) : error ? (
              <div>
                <p className="text-sm font-medium text-gray-900">
                  خطأ في الاتصال
                </p>
                <p className="text-xs text-gray-500 mt-1 break-words">
                  {error}
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2 text-xs bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    إعادة المحاول��
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-900">
                  تم الاتصال بنجاح
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  تم استعادة البيانات
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook for managing retry state
export const useRetryState = () => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startRetry = () => {
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);
    setError(null);
  };

  const stopRetry = (success: boolean = true, errorMessage?: string) => {
    setIsRetrying(false);
    if (!success && errorMessage) {
      setError(errorMessage);
    } else {
      setError(null);
      setRetryCount(0);
    }
  };

  const reset = () => {
    setIsRetrying(false);
    setRetryCount(0);
    setError(null);
  };

  return {
    isRetrying,
    retryCount,
    error,
    startRetry,
    stopRetry,
    reset,
  };
};
