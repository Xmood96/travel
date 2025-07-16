import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface CardProps {
  children: ReactNode;
  variant?: "default" | "glass" | "elevated" | "neumorphism";
  size?: "sm" | "md" | "lg" | "xl";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const ModernCard = ({
  children,
  variant = "default",
  size = "md",
  padding = "md",
  className = "",
  onClick,
  hover = true,
}: CardProps) => {
  const baseClasses =
    "relative overflow-hidden transition-all duration-300 ease-out";

  const variantClasses = {
    default: "bg-white border border-gray-100 shadow-sm hover:shadow-md",
    glass:
      "bg-white/70 backdrop-blur-lg border border-white/20 shadow-lg hover:shadow-xl",
    elevated: "bg-white shadow-lg hover:shadow-xl border-0",
    neumorphism:
      "bg-gray-50 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff]",
  };

  const sizeClasses = {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
  };

  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  const hoverClasses = hover ? "hover:scale-[1.02] active:scale-[0.98]" : "";
  const cursorClasses = onClick ? "cursor-pointer" : "";

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${paddingClasses[padding]}
    ${hoverClasses}
    ${cursorClasses}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <motion.div
      className={classes}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
    >
      {children}
    </motion.div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export const CardHeader = ({
  title,
  subtitle,
  action,
  icon,
}: CardHeaderProps) => (
  <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
    <div className="flex items-center gap-3">
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
          {title}
        </h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent = ({ children, className = "" }: CardContentProps) => (
  <div className={`text-gray-700 leading-relaxed ${className}`}>{children}</div>
);

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className = "" }: CardFooterProps) => (
  <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
    {children}
  </div>
);
