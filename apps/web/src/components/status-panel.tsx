"use client";

type StatusPanelProps = {
  children: React.ReactNode;
  compact?: boolean;
  tone?: "default" | "error";
};

export function StatusPanel({
  children,
  compact = false,
  tone = "default"
}: StatusPanelProps) {
  const className = [
    "notice-panel",
    compact ? "compact" : "",
    tone === "error" ? "error" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={className} role={tone === "error" ? "alert" : undefined}>
      {children}
    </section>
  );
}
