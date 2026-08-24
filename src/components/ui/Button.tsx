import type {
  ButtonHTMLAttributes,
} from "react";

export type ButtonVariant =
  | "primary"
  | "secondary";

export type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
  };

const variantClasses: Record<
  ButtonVariant,
  string
> = {
  primary: [
    "border border-primary",
    "bg-primary text-primary-foreground",
    "hover:bg-primary-hover",
  ].join(" "),

  secondary: [
    "border border-border-strong",
    "bg-surface text-foreground",
    "hover:bg-surface-subtle",
  ].join(" "),
};

export default function Button({
  variant = "primary",
  type = "button",
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "inline-flex min-h-14 items-center justify-center",
        "rounded-control px-5",
        "font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}