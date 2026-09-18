import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  size?: "md" | "lg" | "xl";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-red text-white hover:bg-red-dark shadow-lg shadow-red/20",
  secondary:
    "bg-white text-navy border border-navy/15 hover:border-navy/40",
  ghost: "bg-transparent text-white hover:bg-white/10",
  danger: "bg-red-dark text-white hover:bg-red",
  gold: "bg-gold text-navy-deep hover:brightness-105",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
  xl: "min-h-14 px-6 text-base",
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
        "inline-flex items-center justify-center gap-2 rounded-2xl font-bold tracking-wide transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
