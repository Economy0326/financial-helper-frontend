import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type SecondaryButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
  };

export function SecondaryButton({
  children,
  className = "",
  type = "button",
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex min-h-14 items-center justify-center",
        "rounded-control border border-border-strong px-6 py-3",
        "text-base font-semibold text-foreground",
        "bg-surface",
        "transition-colors",
        "hover:bg-surface-subtle",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}