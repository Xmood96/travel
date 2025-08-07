import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid = ({
  children,
  columns = { base: 1, md: 2, lg: 3 },
  gap = 6,
  className = "",
}: ResponsiveGridProps) => {
  const getGridCols = () => {
    const { base = 1, sm, md, lg, xl } = columns;
    let classes = `grid-cols-${base}`;

    if (sm) classes += ` sm:grid-cols-${sm}`;
    if (md) classes += ` md:grid-cols-${md}`;
    if (lg) classes += ` lg:grid-cols-${lg}`;
    if (xl) classes += ` xl:grid-cols-${xl}`;

    return classes;
  };

  return (
    <div className={`grid ${getGridCols()} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  gradient: string;
  textColor: string;
  delay?: number;
  onClick?: () => void;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  gradient,
  textColor,
  delay = 0,
  onClick,
}: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className={`text-3xl font-bold ${textColor} mb-1`}>
            {typeof value === "number" ? value.toLocaleString("en-US") : value}
          </p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div
          className={`w-12 h-12 ${gradient} rounded-xl flex items-center justify-center flex-shrink-0 ml-4`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

interface SectionHeaderProps {
  title: string;
  icon: ReactNode;
  children?: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const SectionHeader = ({
  title,
  icon,
  children,
  isExpanded,
  onToggle,
}: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        {children}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                className="w-4 h-4"
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
            </motion.div>
          </button>
        )}
      </div>
    </div>
  );
};
