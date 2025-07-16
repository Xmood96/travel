import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface ContainerProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

export const Container = ({
  children,
  size = "lg",
  className = "",
}: ContainerProps) => {
  const sizeClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-none",
  };

  return (
    <div
      className={`
      mx-auto px-4 sm:px-6 lg:px-8
      ${sizeClasses[size]}
      ${className}
    `}
    >
      {children}
    </div>
  );
};

interface GridProps {
  children: ReactNode;
  cols?: {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export const Grid = ({
  children,
  cols = { base: 1, md: 2, lg: 3 },
  gap = 6,
  className = "",
}: GridProps) => {
  const { base = 1, sm, md, lg, xl } = cols;

  let gridClasses = `grid grid-cols-${base}`;
  if (sm) gridClasses += ` sm:grid-cols-${sm}`;
  if (md) gridClasses += ` md:grid-cols-${md}`;
  if (lg) gridClasses += ` lg:grid-cols-${lg}`;
  if (xl) gridClasses += ` xl:grid-cols-${xl}`;

  return (
    <div className={`${gridClasses} gap-${gap} ${className}`}>{children}</div>
  );
};

interface SectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "gradient";
}

export const Section = ({
  children,
  title,
  subtitle,
  action,
  className = "",
  variant = "default",
}: SectionProps) => {
  const variantClasses = {
    default: "bg-white",
    glass: "bg-white/70 backdrop-blur-lg",
    gradient: "bg-gradient-to-br from-white to-gray-50",
  };

  return (
    <motion.section
      className={`
        ${variantClasses[variant]}
        rounded-2xl border border-gray-100 shadow-sm
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              {title && (
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              )}
              {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
            </div>
            {action && <div className="flex-shrink-0 ml-4">{action}</div>}
          </div>
        </div>
      )}

      <div className="p-6">{children}</div>
    </motion.section>
  );
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs,
  action,
  className = "",
}: PageHeaderProps) => {
  return (
    <div className={`border-b border-gray-200 bg-white ${className}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {breadcrumbs && (
            <nav className="mb-4" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                {breadcrumbs.map((item, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && (
                      <svg
                        className="mx-2 h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span className="text-gray-900 font-medium">
                        {item.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
            </div>
            {action && <div className="flex-shrink-0 ml-6">{action}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StackProps {
  children: ReactNode;
  direction?: "vertical" | "horizontal";
  spacing?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  className?: string;
}

export const Stack = ({
  children,
  direction = "vertical",
  spacing = 4,
  align = "stretch",
  justify = "start",
  className = "",
}: StackProps) => {
  const directionClasses = direction === "vertical" ? "flex-col" : "flex-row";
  const spacingClasses =
    direction === "vertical" ? `space-y-${spacing}` : `space-x-${spacing}`;

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };

  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };

  return (
    <div
      className={`
      flex ${directionClasses} ${spacingClasses}
      ${alignClasses[align]} ${justifyClasses[justify]}
      ${className}
    `}
    >
      {children}
    </div>
  );
};
