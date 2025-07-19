import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import { motion } from "framer-motion";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  variant?: "default" | "glass" | "minimal";
}

export const ModernInput = ({
  label,
  error,
  success,
  icon,
  iconPosition = "left",
  fullWidth = true,
  variant = "default",
  className = "",
  ...props
}: InputProps) => {
  const baseClasses =
    "transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1";

  const variantClasses = {
    default:
      "border border-gray-300 focus:border-transparent focus:ring-blue-500 bg-white rounded-xl",
    glass:
      "border border-white/20 focus:border-white/40 focus:ring-blue-500/50 bg-white/70 backdrop-blur-lg rounded-xl",
    minimal:
      "border-0 border-b-2 border-gray-300 focus:border-blue-500 bg-transparent rounded-none focus:ring-0",
  };

  const statusClasses = error
    ? "border-red-500 focus:ring-red-500"
    : success
      ? "border-green-500 focus:ring-green-500"
      : "";

  const sizeClasses = "px-4 py-3 text-sm";
  const widthClasses = fullWidth ? "w-full" : "";

  const inputClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${statusClasses}
    ${sizeClasses}
    ${widthClasses}
    ${icon ? (iconPosition === "left" ? "pl-12" : "pr-12") : ""}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div
            className={`absolute inset-y-0 ${iconPosition === "left" ? "left-0 pl-4" : "right-0 pr-4"} flex items-center pointer-events-none text-gray-400`}
          >
            {icon}
          </div>
        )}
        <motion.input
          className={inputClasses}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          {...(props as any)}
        />
      </div>
      {error && (
        <motion.p
          className="mt-2 text-sm text-red-600"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
      {success && (
        <motion.p
          className="mt-2 text-sm text-green-600"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
        >
          {success}
        </motion.p>
      )}
    </div>
  );
};

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  success?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  fullWidth?: boolean;
  variant?: "default" | "glass" | "minimal";
}

export const ModernSelect = ({
  label,
  error,
  success,
  options,
  placeholder,
  fullWidth = true,
  variant = "default",
  className = "",
  ...props
}: SelectProps) => {
  const {
    onAnimationStart,
    onAnimationEnd,
    onAnimationIteration,
    onDragStart,
    onDragEnd,
    onDrag,
    ...selectProps
  } = props;
  const baseClasses =
    "transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 appearance-none cursor-pointer";

  const variantClasses = {
    default:
      "border border-gray-300 focus:border-transparent focus:ring-blue-500 bg-white rounded-xl",
    glass:
      "border border-white/20 focus:border-white/40 focus:ring-blue-500/50 bg-white/70 backdrop-blur-lg rounded-xl",
    minimal:
      "border-0 border-b-2 border-gray-300 focus:border-blue-500 bg-transparent rounded-none focus:ring-0",
  };

  const statusClasses = error
    ? "border-red-500 focus:ring-red-500"
    : success
      ? "border-green-500 focus:ring-green-500"
      : "";

  const sizeClasses = "px-4 py-3 pr-10 text-sm";
  const widthClasses = fullWidth ? "w-full" : "";

  const selectClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${statusClasses}
    ${sizeClasses}
    ${widthClasses}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <motion.select
          className={selectClasses}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          {...selectProps}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </motion.select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {error && (
        <motion.p
          className="mt-2 text-sm text-red-600"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
      {success && (
        <motion.p
          className="mt-2 text-sm text-green-600"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
        >
          {success}
        </motion.p>
      )}
    </div>
  );
};

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  fullWidth?: boolean;
  variant?: "default" | "glass" | "minimal";
}

export const ModernTextarea = ({
  label,
  error,
  success,
  fullWidth = true,
  variant = "default",
  className = "",
  ...props
}: TextareaProps) => {
  const {
    onAnimationStart,
    onAnimationEnd,
    onAnimationIteration,
    onDragStart,
    onDragEnd,
    onDrag,
    ...textareaProps
  } = props;
  const baseClasses =
    "transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 resize-none";

  const variantClasses = {
    default:
      "border border-gray-300 focus:border-transparent focus:ring-blue-500 bg-white rounded-xl",
    glass:
      "border border-white/20 focus:border-white/40 focus:ring-blue-500/50 bg-white/70 backdrop-blur-lg rounded-xl",
    minimal:
      "border-0 border-b-2 border-gray-300 focus:border-blue-500 bg-transparent rounded-none focus:ring-0",
  };

  const statusClasses = error
    ? "border-red-500 focus:ring-red-500"
    : success
      ? "border-green-500 focus:ring-green-500"
      : "";

  const sizeClasses = "px-4 py-3 text-sm";
  const widthClasses = fullWidth ? "w-full" : "";

  const textareaClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${statusClasses}
    ${sizeClasses}
    ${widthClasses}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <motion.textarea
        className={textareaClasses}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        rows={4}
        {...textareaProps}
      />
      {error && (
        <motion.p
          className="mt-2 text-sm text-red-600"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
      {success && (
        <motion.p
          className="mt-2 text-sm text-green-600"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
        >
          {success}
        </motion.p>
      )}
    </div>
  );
};
