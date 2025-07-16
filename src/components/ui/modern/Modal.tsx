import type { ReactNode } from "react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { IconButton } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  variant?: "default" | "glass" | "minimal";
}

export const ModernModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  variant = "default",
}: ModalProps) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] max-h-[95vh]",
  };

  const variantClasses = {
    default: "bg-white border border-gray-200 shadow-2xl",
    glass: "bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl",
    minimal: "bg-white shadow-2xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                className={`
                  relative w-full ${sizeClasses[size]} 
                  ${variantClasses[variant]}
                  rounded-2xl overflow-hidden
                  ${size === "full" ? "h-full overflow-y-auto" : ""}
                `}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                    <div className="flex-1">
                      {title && (
                        <h2 className="text-xl font-semibold text-gray-900">
                          {title}
                        </h2>
                      )}
                    </div>
                    {showCloseButton && (
                      <IconButton
                        icon={<X size={16} />}
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        tooltip="إغلاق"
                      />
                    )}
                  </div>
                )}

                {/* Content */}
                <div
                  className={`
                  ${title || showCloseButton ? "p-6 pt-4" : "p-6"}
                  ${size === "full" ? "flex-1 overflow-y-auto" : ""}
                `}
                >
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "تأكيد الإجراء",
  message = "هل أنت متأكد من هذا الإجراء؟",
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  variant = "warning",
  loading = false,
}: ConfirmModalProps) => {
  const variantConfig = {
    danger: {
      icon: "🗑️",
      confirmVariant: "danger" as const,
      iconBg: "bg-red-100",
      iconText: "text-red-600",
    },
    warning: {
      icon: "⚠️",
      confirmVariant: "primary" as const,
      iconBg: "bg-yellow-100",
      iconText: "text-yellow-600",
    },
    info: {
      icon: "ℹ️",
      confirmVariant: "primary" as const,
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
    },
  };

  const config = variantConfig[variant];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center">
        <div
          className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}
        >
          <span className="text-2xl">{config.icon}</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

        <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <motion.button
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            onClick={onClose}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {cancelText}
          </motion.button>

          <motion.button
            className={`
              flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors
              ${
                config.confirmVariant === "danger"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                جاري المعالجة...
              </div>
            ) : (
              confirmText
            )}
          </motion.button>
        </div>
      </div>
    </ModernModal>
  );
};
