import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

const baseInput =
  "w-full rounded-md border border-(--color-border) bg-white px-3 py-2 text-sm text-(--color-text) placeholder:text-(--color-faint) focus:border-(--color-accent) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/15 disabled:bg-(--color-border-soft) disabled:text-(--color-muted)";

function FieldWrapper({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-(--color-text)">
        {label}
        {required && <span className="text-(--color-danger)"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-(--color-muted)">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-(--color-danger)">{error}</span>}
    </label>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, required, className, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      <input ref={ref} className={clsx(baseInput, error && "border-(--color-danger)", className)} {...props} />
    </FieldWrapper>
  )
);
TextField.displayName = "TextField";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, required, className, children, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      <select ref={ref} className={clsx(baseInput, "pr-8", error && "border-(--color-danger)", className)} {...props}>
        {children}
      </select>
    </FieldWrapper>
  )
);
SelectField.displayName = "SelectField";

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, required, className, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      <textarea ref={ref} className={clsx(baseInput, "min-h-[88px] resize-y", error && "border-(--color-danger)", className)} {...props} />
    </FieldWrapper>
  )
);
TextareaField.displayName = "TextareaField";
