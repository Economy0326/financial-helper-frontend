import type {
  HTMLAttributes,
  ReactNode,
} from "react";

type SurfaceCardProps =
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
  };

// 정보를 담는 기본 Surface Container
export function SurfaceCard({
  children,
  className = "",
  ...props
}: SurfaceCardProps) {
  return (
    <div
      className={[
        "rounded-card border border-border",
        "bg-surface p-5 shadow-card",
        "sm:p-6",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}