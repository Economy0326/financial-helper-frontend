import Link from "next/link";

// Home 전용 Navigation Card => 선택지가 아니라 Navigation Action
// 따라서 Button이 아닌 Link를 사용
type HomeActionCardProps = {
  href: string;
  title: string;
  description: string;
  ctaLabel: string;
  tone: "primary" | "danger";
  icon: "consultation" | "emergency";
};

function ConsultationIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="h-12 w-12"
      fill="none"
    >
      <path
        d="M10 12.5C10 9.46 12.46 7 15.5 7h17C35.54 7 38 9.46 38 12.5v14c0 3.04-2.46 5.5-5.5 5.5H22l-8.5 7v-7.7A5.5 5.5 0 0 1 10 26.5v-14Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="20" r="2" fill="currentColor" />
      <circle cx="24" cy="20" r="2" fill="currentColor" />
      <circle cx="30" cy="20" r="2" fill="currentColor" />
    </svg>
  );
}

function EmergencyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="h-12 w-12"
      fill="none"
    >
      <path
        d="M24 5 39 11v10c0 10.4-6.2 17.1-15 22-8.8-4.9-15-11.6-15-22V11L24 5Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M24 15v11"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="24" cy="32" r="2" fill="currentColor" />
    </svg>
  );
}

export default function HomeActionCard({
  href,
  title,
  description,
  ctaLabel,
  tone,
  icon,
}: HomeActionCardProps) {
  const isDanger = tone === "danger";

  return (
    <Link
      href={href}
      className={[
        "group flex h-full flex-col rounded-card border bg-surface p-5 shadow-card",
        "transition hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
        "sm:p-6",
        isDanger ? "border-danger" : "border-primary",
      ].join(" ")}
    >
      <div className="flex flex-1 items-start gap-4">
        <div
          className={[
            "flex h-16 w-16 shrink-0 items-center justify-center rounded-full",
            "bg-surface-subtle",
            isDanger ? "text-danger" : "text-primary",
          ].join(" ")}
        >
          {icon === "consultation" ? (
            <ConsultationIcon />
          ) : (
            <EmergencyIcon />
          )}
        </div>

        <div className="min-w-0">
          <h2
            className={[
              "text-xl font-bold sm:text-2xl",
              isDanger ? "text-danger" : "text-primary",
            ].join(" ")}
          >
            {title}
          </h2>

          <p className="mt-2 leading-7 text-foreground-muted">
            {description}
          </p>
        </div>
      </div>

      <div
        className={[
          "mt-6 flex min-h-14 items-center justify-center gap-2 rounded-control border px-5",
          "font-semibold",
          isDanger
            ? "border-danger text-danger"
            : "border-primary bg-primary text-primary-foreground",
        ].join(" ")}
      >
        <span>{ctaLabel}</span>
        <span aria-hidden="true">→</span>
      </div>
    </Link>
  );
}