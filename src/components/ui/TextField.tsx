type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function TextField({ label, error, id, className = "", ...props }: TextFieldProps) {
  const fieldId = id ?? props.name;
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-navy">{label}</span>
      <input
        id={fieldId}
        className={`min-h-12 w-full rounded-2xl border bg-white px-4 text-base text-navy outline-none transition focus:ring-4 focus:ring-navy/10 ${
          error ? "border-red" : "border-navy/15 focus:border-navy"
        } ${className}`}
        {...props}
      />
      {error ? <span className="mt-1 block text-sm text-red">{error}</span> : null}
    </label>
  );
}
