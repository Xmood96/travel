import type { ReactNode, ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  className?: string;
}

export const ModernButton = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg focus:ring-blue-500",
    secondary:
      "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-md hover:shadow-lg focus:ring-gray-500",
    outline:
      "border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 focus:ring-gray-500",
    ghost:
      "text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500",
    danger:
      "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg focus:ring-red-500",
    success:
      "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg focus:ring-green-500",
  };

  const sizeClasses = {
    xs: "px-2 py-1 text-xs rounded-md gap-1",
    sm: "px-3 py-2 text-sm rounded-lg gap-1.5",
    md: "px-4 py-2.5 text-sm rounded-xl gap-2",
    lg: "px-6 py-3 text-base rounded-xl gap-2.5",
    xl: "px-8 py-4 text-lg rounded-2xl gap-3",
  };

  const widthClasses = fullWidth ? "w-full" : "";

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${widthClasses}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  const renderIcon = () => {
    if (loading) {
      return (
        <Loader2
          className="animate-spin"
          size={size === "xs" ? 12 : size === "sm" ? 14 : 16}
        />
      );
    }
    if (icon) {
      return icon;
    }
    return null;
  };

  const {
    onAnimationStart,
    onAnimationEnd,
    onAnimationIteration,
    onDragStart,
    onDragEnd,
    onDrag,
    ...buttonProps
  } = props;

  return (
    <motion.button
      className={classes}
      disabled={disabled || loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...buttonProps}
    >
      {iconPosition === "left" && renderIcon()}
      <span className="leading-none">{children}</span>
      {iconPosition === "right" && renderIcon()}
    </motion.button>
  );
};

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  tooltip?: string;
}

export const IconButton = ({
  icon,
  variant = "ghost",
  size = "md",
  className = "",
  tooltip,
  ...props
}: IconButtonProps) => {
  const baseClasses =
    "inline-flex items-center justify-center transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
    outline:
      "border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 focus:ring-gray-500",
    ghost:
      "text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500",
    danger:
      "text-red-600 hover:text-red-700 hover:bg-red-50 focus:ring-red-500",
    success:
      "text-green-600 hover:text-green-700 hover:bg-green-50 focus:ring-green-500",
  };

  const sizeClasses = {
    xs: "w-6 h-6 rounded-md",
    sm: "w-8 h-8 rounded-lg",
    md: "w-10 h-10 rounded-xl",
    lg: "w-12 h-12 rounded-xl",
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  const {
    onAnimationStart,
    onAnimationEnd,
    onAnimationIteration,
    onDragStart,
    onDragEnd,
    onDrag,
    ...buttonProps
  } = props;

  return (
    <motion.button
      className={classes}
      title={tooltip}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...buttonProps}
    >
      {icon}
    </motion.button>
  );
};
