import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold" | "outline";
  size?: "md" | "lg" | "xl";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-red text-white hover:bg-red-dark shadow-lg shadow-red/25",
  secondary: "bg-white text-navy border border-navy/10 hover:border-navy/35",
  outline: "bg-white/95 text-navy hover:bg-white",
  ghost: "bg-transparent text-white hover:bg-white/10",
  danger: "bg-red-dark text-white hover:bg-red",
  gold: "bg-gold text-navy-deep hover:brightness-105",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-base",
  xl: "min-h-14 px-8 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "lg",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold tracking-wide uppercase transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
