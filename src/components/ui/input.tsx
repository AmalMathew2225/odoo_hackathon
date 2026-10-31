import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-wide text-neutral-700 dark:text-neutral-300 uppercase"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? "border-neutral-900 dark:border-neutral-100 ring-1 ring-neutral-900"
              : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 mt-1">
            &bull; {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

