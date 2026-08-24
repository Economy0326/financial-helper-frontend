import type {
  HTMLAttributes,
} from "react";

type SurfaceCardProps =
  HTMLAttributes<HTMLDivElement>;

export default function SurfaceCard({
  className,
  ...props
}: SurfaceCardProps) {
  return (
    <div
      className={[
        "rounded-card border border-border",
        "bg-surface shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}