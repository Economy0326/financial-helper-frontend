import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

// 직접 button의 props를 선언할 필요가 없음
type PrimaryButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
  };

export function PrimaryButton({
  children,
  className = "",
  // 안전하게 type은 button으로 지정
  type = "button",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex min-h-14 items-center justify-center",
        "rounded-control px-6 py-3",
        "text-base font-semibold",
        "bg-primary text-primary-foreground",
        "transition-colors",
        "hover:bg-primary-hover",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}