import React from "react";
import { cn } from "./utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = ({ label, className, ...props }: InputProps) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm mb-1">{label}</label>}
      <input
        {...props}
        className={cn(
          "w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring focus:ring-blue-300",
          className
        )}
      />
    </div>
  );
};
