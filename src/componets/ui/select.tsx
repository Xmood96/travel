import React from "react";
import { cn } from "./utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string }[];
}

export const Select = ({
  label,
  options,
  className,
  ...props
}: SelectProps) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm mb-1">{label}</label>}
      <select
        {...props}
        className={cn(
          "w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring focus:ring-blue-300",
          className
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
