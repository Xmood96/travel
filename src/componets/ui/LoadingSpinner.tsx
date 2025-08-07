import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner = ({
  size = "md",
  text = "جاري التحميل...",
  fullScreen = false,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  };

  const container = fullScreen
    ? "fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50"
    : "flex items-center justify-center py-10";

  return (
    <div className={container}>
      <div className="text-center">
        <motion.div
          className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          className={`text-gray-600 ${textSizeClasses[size]} font-medium`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      </div>
    </div>
  );
};

export const ErrorDisplay = ({
  title = "حدث خطأ",
  message = "يرجى إعادة تحميل الصفحة",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-200 max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </motion.div>
        <h3 className="text-xl font-semibold text-red-600 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            إعادة المحاولة
          </button>
        )}
      </motion.div>
    </div>
  );
};
